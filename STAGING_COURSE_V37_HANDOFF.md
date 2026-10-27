# Short-course V37 + six-question diagnosis — staging handoff

Status: **informational-publication approved 27 October 2026**. Checkout and sales must remain disabled; this does not approve an LMS commercial launch.

## Verified product scope (27 Oct 2026)
- Audience: people with existing small/medium businesses, not idea-only founders.
- Course: 3 sessions over one week, 2 hours each; 6 total training hours.
- Delivery method, start date, final price, booking conditions: **not yet commercially approved**.
- Free diagnostic: six preliminary questions, on-device report generation, and PDF download; not a final professional diagnosis.
- Checkout URL empty; price unapproved; analytics consent and Meta Pixel off in the bundled tool.
- No promise of individual advice, bespoke project results or follow-up.

## Changes staged
- Align diagnostic offer text with V37: remove unsupported live Zoom/delivery claims.
- Keep unapproved price hidden and avoid a fabricated checkout amount.
- Add `qa_short_course_offer.py` as a standard-library regression guard.

## Run local checks
```powershell
python qa_short_course_offer.py
```
Expected static guard status: 34/34 pass (current run).
For interactive browser and PDF checks, refer to the existing isolated E-drive project:
`E:\\PROJECTS\\LO3BET_BUSINESS\\PREVIEWS\\QA_V37_OFFLINE.py` and
`E:\\PROJECTS\\LO3BET_BUSINESS\\PREVIEWS\\QA_DIAGNOSIS_PDF_OFFLINE.py`.

## Publication blockers
1. Approve price, delivery mode, dates, booking/refund conditions and student access period.
2. Record and review the actual 3-session content; complete real-user beginner pilot.
3. Replace localhost LMS prototype with secured production Auth/RLS, private licensed video hosting and entitlement tests.
4. Complete validated provider payment integration, safe rollback and published-domain QA.
5. Explicitly approve production merge/deploy. **Do not infer permission from branch push.**

The automated checks are functional regression evidence, not an external security audit or commercial readiness certificate.
