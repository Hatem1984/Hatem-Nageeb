import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

// Usage: node build-guarded-adapter.mjs <original-shared-webhook.ts> [output.ts]
// Refuse ALL code drift from the pinned KENZ-only production v23 fixture.
const sourceFile = process.argv[2];
assert(sourceFile, 'Provide source file; QA tool never fetches production automatically');
const source = fs.readFileSync(sourceFile, 'utf8');
const fixture = fs.readFileSync(new URL('../g426-qa/factory-handler-live-v23.fixture.ts', import.meta.url), 'utf8');
const adapter = fs.readFileSync(new URL('./factory-handler-adapter.ts', import.meta.url), 'utf8').trimEnd();
const startMarker='async function handleFactoryEvent(';
const endMarker='\nDeno.serve(';
function section(text) {
  const begin=text.indexOf(startMarker); const end=text.indexOf(endMarker,begin);
  assert(begin>=0 && end>begin,'Unexpected function/entrypoint layout; refusing change');
  assert(text.indexOf(startMarker,begin+1)===-1,'Ambiguous multiple factory handlers');
  assert(text.indexOf(endMarker,end+1)===-1,'Ambiguous multiple Deno serve boundaries');
  return {begin,end,part:text.slice(begin,end)};
}
const s=section(source),f=section(fixture);
assert.equal(s.part,f.part,'Actual production factory handler differs from pinned v23 fixture; REFUSE');
assert(adapter.includes("s.rpc('kenz_g427_atomic_xpay_v1'"),'Expected atomic RPC missing');
assert(!adapter.includes(".from('factory_payment_events')") && !adapter.includes('queuePaidDeliveries('), 'Unsafe split settlement remains');
const result=source.slice(0,s.begin)+adapter+source.slice(s.end);
const check=section(result);
assert.equal(result.slice(0,s.begin),source.slice(0,s.begin),'Non-KENZ preamble changed');
assert.equal(result.slice(check.end),source.slice(s.end),'Shared legacy handler changed');
assert.equal((result.match(/async function handleFactoryEvent\(/g)||[]).length,1);
const dest=process.argv[3] || path.join(path.dirname(sourceFile),'kenz-xpay-g428-candidate.ts');
fs.writeFileSync(dest,result);
console.log(JSON.stringify({result:'ISOLATED_QA_ONLY',source_bytes:source.length,candidate_bytes:result.length,strict_factory_fixture:true,unrelated_shared_route_preserved:true,needs_atomic_rpc_migration:true,never_publish_automatically:true}));
