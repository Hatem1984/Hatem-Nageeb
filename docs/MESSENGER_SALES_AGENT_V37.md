# V37 — Messenger Sales Agent

Status: backend core deployed to Supabase, Facebook Page channel not connected yet.

## Verified Page identity
Current Rescue campaign creatives use Facebook Page ID: 891183134080763.

## Behavior
Messenger shares the same sales-state model used by the WhatsApp agent:
- new / qualifying / qualified / payment_ready / payment_sent / handoff / won / closed
- idea-stage vs existing-business qualification
- price, schedule, refund, fit, price objection and time objection handling
- explicit human handoff
- XPay checkout only after explicit reserve/full choice
- payment attribution tagged messenger_sales_agent
- verified XPay purchases sync the lead to paid/won

## Safety
- POST webhook requests require X-Hub-Signature-256 validation with META_APP_SECRET.
- webhook verification uses MESSENGER_VERIFY_TOKEN.
- private sales tables/RPCs are not available to anon/authenticated users.
- no automatic refunds, discounts, cold outbound messages, campaign changes or payment deletion.
- bot stops responding after human_handoff.
- provider message IDs are deduplicated.
- function is intentionally unconfigured until Page credentials are added.

## One-time channel secrets
- MESSENGER_VERIFY_TOKEN
- MESSENGER_PAGE_ACCESS_TOKEN
- MESSENGER_PAGE_ID
- META_APP_SECRET (shared with the WhatsApp/Meta app if the same app is used)

XPAY_API_KEY already exists and remains server-side.
