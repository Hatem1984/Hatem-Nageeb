"""Pre-publish regression checks for the short-course landing + free diagnosis.

Runs with Python stdlib, read-only. Does not publish, connect to payments,
read student data, or modify the live site.
"""
from pathlib import Path
from html.parser import HTMLParser
import json
import re
import sys

ROOT = Path(__file__).resolve().parent
landing_file = ROOT / "_includes" / "landing-base.html"
diagnosis_file = ROOT / "diagnosis" / "quick" / "index.html"
config_file = ROOT / "diagnosis" / "quick" / "config.js"
app_file = ROOT / "diagnosis" / "quick" / "app.js"
checks = []

def check(name, good, detail=""):
    checks.append({"name": name, "pass": bool(good), "detail": detail})

class PageStructure(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.hrefs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and "href" in attrs:
            self.hrefs.append(attrs["href"])

landing = landing_file.read_text(encoding="utf-8")
diagnosis = diagnosis_file.read_text(encoding="utf-8")
config = config_file.read_text(encoding="utf-8")
app = app_file.read_text(encoding="utf-8")
structure = PageStructure()
structure.feed(landing)

check("Landing uses 3 sessions and 6 hours", "3 جلسات" in landing and "6 ساعات" in landing)
check("Landing does not advertise old 24-session course", "24 جلسة" not in landing)
for phrase in ("990", "9000", "9,000", "4,500", "12 أسبوع", "3 أشهر"):
    check(f"No stale offer on landing: {phrase}", phrase not in landing)
check("Course delivery and date not falsely committed", "مواعيد الجلسات المحددة وطريقة تقديمها تُعلن عند فتح التسجيل" in landing)
check("Course price explicitly not announced", "لم يُعلن سعر نهائي" in landing)
check("Landing has a diagnosis CTA", structure.hrefs.count("/diagnosis/quick/") >= 3)
for anchor in ("tracks", "program-package", "offer", "schedule", "faq", "testimonial"):
    check(f"Landing has #{anchor}", anchor in structure.ids)
broken = sorted({u for u in structure.hrefs if u.startswith("#") and len(u) > 1 and u[1:] not in structure.ids})
check("Landing internal anchor destinations exist", not broken, ", ".join(broken))

check("Diagnostic targets only existing businesses", "لأصحاب المشروعات القائمة فقط" in diagnosis)
check("Diagnostic uses 3-session model", "3 جلسات تدريبية خلال أسبوع واحد" in diagnosis)
check("Diagnostic states 6 training hours", "6 ساعات تدريبية" in diagnosis)
check("Diagnostic doesn't promise Zoom or live delivery", not re.search(r"Zoom|6 ساعات Live", diagnosis, flags=re.I))
check("Diagnostic doesn't expose 990 EGP", "990" not in diagnosis)
check("Diagnostic doesn't promise personalized follow-up", "لا يشمل استشارة فردية أو متابعة شخصية" in diagnosis)
check("Diagnostic defers commercial terms", "السعر يُعلن عند فتح التسجيل" in diagnosis)
check("No checkout link until approved", bool(re.search(r'checkoutUrl:\s*["\']\s*["\']', config)))
check("No unapproved price", bool(re.search(r'coursePriceEGP:\s*null', config)))
check("Analytics consent off by default", "analyticsConsent: false" in config)
check("Meta pixel disabled by default", "metaPixelEnabled: false" in config)
check("Old 990 checkout fallback removed", "CFG.coursePriceEGP||990" not in app)
check("Checkout amount is validated before attaching", "Number.isFinite(amount) && amount>0" in app)
check("PDF save control exists", 'id="saveReportBtn"' in diagnosis)
check("PDF library exists locally", (ROOT / "diagnosis" / "quick" / "vendor" / "jspdf.umd.min.js").is_file())
check("Quiz can start", 'id="startBtn"' in diagnosis)

failed = [c for c in checks if not c["pass"]]
print(json.dumps({"passed": len(checks)-len(failed), "total": len(checks), "failed": failed}, ensure_ascii=False, indent=2))
sys.exit(1 if failed else 0)
