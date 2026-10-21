import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./portal-fixed.v129.js',import.meta.url),'utf8');
function mount({saved='{"access_token":"stale-token","order_ref":"DF-OLD"}',search='',reply={ok:true},rejectFetch=false}={}){
 const calls=[],ctx={};
 const form={getData:{order_ref:'DF-SYNTH-NEW',phone:'01011111111',email:''}};
 const FormDataStub=class {constructor(f){this.f=f}get(key){return this.f.getData[key]||''}};
 const button={disabled:false,textContent:'إنشاء رابط تحميل',isConnected:true,replaceWith(link){this.isConnected=false;this.replacement=link}};
 const doc={
  addEventListener(){},
  createElement(tag){if(tag!=='a')throw Error('unexpected createElement '+tag);return {tagName:'A',href:'',textContent:''}}
 };
 const sandbox={
  document:doc,location:{search},URLSearchParams,FormData:FormDataStub,Intl,
  localStorage:{getItem:()=>saved},
  fetch:async (...args)=>{calls.push(args);if(rejectFetch)throw Error('synthetic offline failure');return {ok:reply.ok!==false,json:async()=>reply}},
  window:{__portalAuth:{action:'lookup',access_token:'synthetic-valid'}},
  console,setTimeout(){throw Error('unexpected timer')}
 };
 vm.runInNewContext(source+'\n;globalThis.__qa={portalAccessToken,lookupOrder,createDownload}',sandbox,{timeout:1000});
 return {qa:sandbox.__qa,calls,form,button};
}
test('manual order+contact recovery overrides obsolete local bearer token',async()=>{
 const h=mount();
 await h.qa.lookupOrder(h.form,true);
 const body=JSON.parse(h.calls[0][1].body);
 assert.equal(body.access_token,undefined);
 assert.equal(body.order_ref,'DF-SYNTH-NEW');
 assert.equal(body.phone,'01011111111');
});
test('automatic lookup still uses saved valid bearer token for instant library opening',async()=>{
 const h=mount({saved:'{"access_token":"synthetic-valid","order_ref":"DF-OLD"}'});
 await h.qa.lookupOrder(h.form,false);
 const body=JSON.parse(h.calls[0][1].body);
 assert.equal(body.access_token,'synthetic-valid');
 assert.equal(body.order_ref,undefined);
});
test('manual recovery overrides a token from stale URL if customer supplied verified contact',async()=>{
 const h=mount({search:'?token=obsolete-token'});
 await h.qa.lookupOrder(h.form,true);
 const body=JSON.parse(h.calls[0][1].body);
 assert.equal(body.access_token,undefined);
 assert.equal(body.order_ref,'DF-SYNTH-NEW');
});
test('saved token remains available when an explicit contact recovery is not possible',async()=>{
 const h=mount();
 h.form.getData.phone='';
 await h.qa.lookupOrder(h.form,true);
 const body=JSON.parse(h.calls[0][1].body);
 assert.equal(body.access_token,'stale-token');
});
test('HTTP error creating link restores button for retry without an external download',async()=>{
 const h=mount({reply:{ok:false,error:'download_token_failed'}});
 await h.qa.createDownload('synthetic-book',h.button);
 assert.equal(h.calls.length,1);
 assert.equal(h.button.disabled,false);
 assert.equal(h.button.isConnected,true);
 assert.match(h.button.textContent,/تعذر/);
});
test('unexpected network failure also restores create-download button',async()=>{
 const h=mount({rejectFetch:true});
 await h.qa.createDownload('synthetic-book',h.button);
 assert.equal(h.calls.length,1);
 assert.equal(h.button.disabled,false);
 assert.equal(h.button.isConnected,true);
});
test('successful synthetic signed-link creation replaces button with a link',async()=>{
 const h=mount({reply:{ok:true,download_url:'https://example.invalid/synthetic.pdf'}});
 await h.qa.createDownload('synthetic-book',h.button);
 assert.equal(h.button.isConnected,false);
 assert.equal(h.button.replacement.href,'https://example.invalid/synthetic.pdf');
 assert.equal(h.button.replacement.rel,'noopener');
});
// G4.35 release HTML snapshots: stage only, never deploy on CI.
for(const route of ['downloads','order']){
 test(`G4.35 release HTML ${route} points to v130 portal asset and preserves portal form`,()=>{
  const html=readFileSync(new URL(`./release/${route}/index.html`,import.meta.url),'utf8');
  assert.match(html,/portal\.js\?v=130/);
  assert.doesNotMatch(html,/portal\.js\?v=129/);
  assert.match(html,/id="portalForm"/);
  assert.match(html,/id="portalResult"/);
 });
}
// The staged HTML changes must be ONLY a cache-busting script reference.
// This prevents accidental divergence from live page content when publishing.
for(const route of ['downloads','order']){
 test(`G4.35 ${route} rollback baseline exactly matches staged HTML except JS query revision`,()=>{
  const release=readFileSync(new URL(`./release/${route}/index.html`,import.meta.url),'utf8');
  const rollback=readFileSync(new URL(`./rollback/${route}/index.html`,import.meta.url),'utf8');
  assert.equal(rollback.replace('"/portal.js?v=129"','"/portal.js?v=130"'),release);
 });
}
test('rollback JS is a v129 snapshot, not the patched candidate',()=>{
 const rollback=readFileSync(new URL('./rollback/portal.js',import.meta.url),'utf8');
 assert.match(rollback,/function portalAccessToken\(\)/);
 assert.doesNotMatch(rollback,/function portalAccessToken\(forceContact=false\)/);
 assert.notEqual(rollback,source);
});
test('G4.35 release JS exactly matches the tested QA candidate',()=>{
 const release=readFileSync(new URL('./release/portal.js',import.meta.url),'utf8');
 assert.equal(release,source,'Release JS diverged from tested candidate');
});
test('candidate preserves payment status and does not write customer or payment records',()=>{
 assert.equal(source.includes('xpay-webhook'),false);
 assert.equal(source.includes('service_role'),false);
 assert.match(source,/fetch\(PORTAL_API/);
});
