"""Release guard for retired 24-session purchase entry points.
No payment APIs are called. It does not disable server-side settlement for prior customers.
"""
from pathlib import Path
from html.parser import HTMLParser
import json,sys
root=Path(__file__).resolve().parent
tests=[]
def ck(name,ok,detail=""):
    tests.append({"test":name,"passed":bool(ok),"detail":str(detail)})
def read(path):return (root/path).read_text(encoding="utf-8")
manual=read("manual-payment/index.html")
balance=read("complete-payment/index.html")
old=read("diagnosis/index.html")
old_js=read("diagnosis/app.js")
terms=read("booking-terms.html")
refund=read("refund-policy.html")
quick=read("diagnosis/quick/index.html")
for name,html in (("manual payment",manual),("balance payment",balance)):
    ck(name+" explanatory pause", "الحجز والدفع مغلقان حاليًا" in html)
    ck(name+" prior customer support", "متابعة حجز سابق" in html)
    ck(name+" no active submit", "<form" not in html.lower() and 'type="submit"' not in html.lower())
    ck(name+" no price or wallet promotion", all(x not in html for x in ("4,500", "2,000","990","InstaPay","Vodafone Cash")))
    ck(name+" no old backend call", all(x not in html for x in ("supabase.co","startCheckout","checkout-session","manual-payment-submit")))
    ck(name+" no analytics", not any(x in html for x in ("fbq(", "gtag(", "google-analytics.com","googletagmanager.com")))
    ck(name+" index blocked", "noindex" in html)
ck("historical diagnostic no old prices", all(x not in old for x in ("4,500", "2,000","990")))
ck("historical diagnostic no old deadline", all(x not in old for x in ("1 أكتوبر", "4 أكتوبر", "7 أكتوبر")))
ck("historical diagnostic CTA describes current program", "تفاصيل البرنامج الحالي" in old)
ck("historical diagnostic no checkout API call", ".startCheckout(" not in old_js)
ck("historical diagnostic checkout fallback replaced", "location.href='../#program-package'" in old_js)
ck("historical diagnostic noindex", "noindex,follow" in old)
ck("new diagnostic publicly indexable", 'name="robots" content="index,follow"' in quick)
ck("older booking terms clearly historical", "هذه شروط تاريخية تخص دفعة سابقة" in terms)
ck("older booking terms noindex", "noindex,follow" in terms)
ck("older refund terms clearly historical", "السياسة التالية تخص الدفعة السابقة" in refund)
ck("older refund policy noindex", "noindex,follow" in refund)
ck("previous callback preserved", (root/"payment-success.html").is_file())
ck("internal admin preserved", (root/"payment-admin"/"index.html").is_file())
failed=[x for x in tests if not x["passed"]]
print(json.dumps({"passed":len(tests)-len(failed),"total":len(tests),"failed":failed},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
