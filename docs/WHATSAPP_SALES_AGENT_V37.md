# V37 — WhatsApp Sales Agent

Status: backend core deployed to Supabase, WhatsApp channel not connected yet.

## Goals
- Respond automatically to inbound WhatsApp leads in Egyptian Arabic.
- Qualify idea-stage vs existing-business prospects.
- Answer price, schedule, fit and refund questions.
- Handle price/time objections without fake urgency or invented discounts.
- Escalate explicit human/consulting requests to a human handoff state.
- Generate XPay checkout only after the customer explicitly chooses reserve (EGP 2,000) or full (EGP 4,500).
- Persist conversation, lead state, outbound delivery state and incidents.
- Mark sales lead as paid automatically when a matching verified XPay purchase is written.

## Safety controls
- WhatsApp webhook is public only because Meta requires it; POST requests require X-Hub-Signature-256 HMAC verification with META_APP_SECRET.
- Webhook verification requires WHATSAPP_VERIFY_TOKEN.
- Server-side data RPCs are denied to anon/authenticated and granted only to service_role.
- Payment link generation reuses the existing v36 capacity/rate-limit preparation flow and XPAY_API_KEY.
- No automatic refunds, campaign changes, discounting, outbound cold messages or payment-record deletion.
- Human handoff stops automated replies for the conversation after escalation.
- Duplicate provider message IDs are deduplicated.

## Required one-time channel secrets
- WHATSAPP_VERIFY_TOKEN
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- META_APP_SECRET

XPAY_API_KEY already exists in the project and is reused server-side.

## Meta API
Graph API v26.0.

## Current launch state
The function is deployed but intentionally returns whatsapp_not_configured for inbound POSTs until the four WhatsApp/Meta secrets are configured and the Meta webhook subscription is connected.
