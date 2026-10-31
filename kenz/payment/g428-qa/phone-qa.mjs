import assert from 'node:assert/strict';

// QA-only function text transformation. Never edits production or calls a payment endpoint.
export const ORIGINAL = 'function normPhone(v:any){return clean(v,40).replace(/\\D/g,"")}';
export const PROPOSED = `function normPhone(v:any){
  const digits = clean(v,40).replace(/\\D/g,"");
  if(/^00201[0125]\\d{8}$/.test(digits)) return digits.slice(2);
  if(/^01[0125]\\d{8}$/.test(digits)) return "20" + digits.slice(1);
  return digits;
}`;

export function buildPortalPhoneCandidate(readOnlyFixture) {
  assert.equal(typeof readOnlyFixture,'string');
  assert.equal(readOnlyFixture.split(ORIGINAL).length-1,1,'Source changed: reject unknown portal normalizer');
  assert(readOnlyFixture.includes('async function verifyAccess('),'Pinned portal token access contract missing');
  assert(readOnlyFixture.includes('async function verifyOrder('),'Pinned portal order/contact contract missing');
  const patched=readOnlyFixture.replace(ORIGINAL,PROPOSED);
  assert.equal(patched.split(PROPOSED).length-1,1);
  assert.equal(patched.split('async function verifyAccess(')[1],readOnlyFixture.split('async function verifyAccess(')[1], 'Other portal identity logic modified');
  return patched;
}
