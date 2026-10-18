#!/usr/bin/env bash
set -euo pipefail
: "${PGPASSWORD:=test}"
export PGPASSWORD
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "${PGHOST:-localhost}" -U "${PGUSER:-postgres}" -d "${PGDATABASE:-kenz_qa}")
"${PSQL[@]}" -f kenz/payment/g427-qa/01_schema_fixture.sql
"${PSQL[@]}" -f kenz/payment/g427-qa/kenz_g427_atomic_xpay_candidate.sql
"${PSQL[@]}" -f kenz/payment/g427-qa/02_assertions.sql
# Race test: same order, TWO distinct signed-provider-style events concurrently.
"${PSQL[@]}" -c "INSERT INTO public.factory_orders(id,order_ref,payment_method,status,payment_status,total_minor,currency,delivery_channel,delivery_email,delivery_consent_at) VALUES ('00000000-0000-0000-0000-000000000106','KENZ-SYN-106','xpay','pending','unpaid',5900,'EGP','email','synthetic@example.invalid',now())" >/dev/null
"${PSQL[@]}" -c "SELECT public.kenz_g427_atomic_xpay_v1('evt-race-106-A','checkout.session.completed','paid','00000000-0000-0000-0000-000000000106','KENZ-SYN-106','cs_live_synthetic106',5900,'EGP','{\"id\":\"synthetic\"}')" >/tmp/kenz-race-a.out &
pid1=$!
"${PSQL[@]}" -c "SELECT public.kenz_g427_atomic_xpay_v1('evt-race-106-B','checkout.session.async_payment_succeeded','paid','00000000-0000-0000-0000-000000000106','KENZ-SYN-106','cs_live_synthetic106',5900,'EGP','{\"id\":\"synthetic\"}')" >/tmp/kenz-race-b.out &
pid2=$!
wait "$pid1"
wait "$pid2"
"${PSQL[@]}" -At -c "SELECT CASE WHEN (SELECT count(*) FROM factory_payment_events WHERE order_id='00000000-0000-0000-0000-000000000106')=2 AND (SELECT count(*) FROM factory_cash_ledger WHERE order_id='00000000-0000-0000-0000-000000000106')=1 AND (SELECT count(*) FROM factory_deliveries WHERE order_id='00000000-0000-0000-0000-000000000106')=2 AND (SELECT count(*) FROM factory_order_access_tokens WHERE order_id='00000000-0000-0000-0000-000000000106')=1 AND (SELECT status FROM factory_orders WHERE id='00000000-0000-0000-0000-000000000106')='paid' THEN 'PASS: concurrent distinct provider events settle once' ELSE 'FAIL: concurrent race' END" | tee /tmp/kenz-race-assert.txt
grep -q '^PASS:' /tmp/kenz-race-assert.txt
