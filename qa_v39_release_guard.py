"""V39 static release guard. Offline/read-only with respect to payment and Meta."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import json,sys,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent
checks=[]
def check(label,value):
 checks.append({"check":label,"pass":bool(value)})
def txt(rel):return (root/rel).read_text(encoding="utf-8")
home=txt("_includes/landing-base.html")
services=txt("services/index.html")
privacy=txt("privacy-policy.html")
quick=txt("diagnosis/quick/index.html")
js=txt("diagnosis/quick/report-actions.js")
payment=txt("payment-success.html")
robots=txt("robots.txt")
xml=txt("sitemap.xml")
check("brand nav preserves course and adds consulting",'<a href="/services/">الاستشارات</a><a href="#program-package">البرنامج</a>' in home)
check("new service section appears",'<section class="v39-services"' in home)
check("new style loaded",'v39-additions.css?v=39' in home)
check("course keeps 3x2","3 جلسات" in home and "ساعتان" in home)
check("no previous cohort displayed on home",all(x not in home for x in ("24 جلسة","4,500 جنيه","2,000 جنيه")))
check("course payment stays closed","الحجز والدفع غير مفتوحين" in home)
check("consulting excludes included 1to1 promise","الاستشارات الفردية ليست ضمن" in home)
check("services separate path exists", (root/"services/index.html").is_file())
check("services is discoverable", 'name="robots" content="index,follow"' in services)
check("services avoids sale/checkout", "<form" not in services.lower() and "لا نطلب أي دفع" in services)
check("services original brand asset", 'src="/assets/شعار_لعبة_البزنس_خفيف.webp"' in services)
check("privacy updated to reflect local processing","إجابات الأسئلة الستة" in privacy)
check("privacy includes deletion route",'href="/data-deletion/"' in privacy)
check("privacy does not claim Meta currently auto enabled","لا تشغّلان Meta Pixel" in privacy)
check("historic payment lookup preserved","checkout-session" in payment and "fetch(api+'?session_id='" in payment)
check("historic payment never submits",not any(x in payment for x in ("method:'POST'","method:\"POST\"","method:'PUT'")))
check("historic payment no old price",not any(x in payment for x in ("4,500","2,000","990 جنيه")))
check("historic payment no old dates",not any(x in payment for x in ("4 أكتوبر","1 أكتوبر","7:30")))
check("historic payment no old balance/calendar links",not any(x in payment for x in ('id="balance"',"calendar.google.com")))
check("historic callback has no Meta/Google initialization",not any(x in payment for x in ("connect.facebook.net","googletagmanager.com","fbq(","gtag(")))
check("historic callback still distinguishes paid/refund", "refunded:'تم الاسترداد'" in payment and "paymentStatus" in payment)
check("historic callback no unqualified new sale", "ليست لشراء البرنامج الجديد" in payment)
check("quick has canonical",'href="https://lo3betbusiness.com/diagnosis/quick/"' in quick)
check("quick TXT download available",'id="downloadTextBtn"' in quick)
check("TXT export has UTF-8 BOM", 'new Blob(["\\uFEFF",readableReport(r)]' in js)
check("TXT export follows client-side computation","readableReport(r)" in js and "URL.createObjectURL(blob)" in js)
check("PDF download preserved","saveReportBtn" in quick and "new window.jspdf.jsPDF" in js)
check("checkout disabled by config", 'id="checkoutBtn"' in quick and '"checkoutUrl":' not in quick)
check("robots permits quick diagnosis","Allow: /diagnosis/quick/" in robots)
check("robots blocks old diagnostic","Disallow: /diagnosis/" in robots)
check("robots blocks admin route","Disallow: /payment-admin/" in robots)
try:
 sitemap=ET.fromstring(xml)
 urls=[e.text for e in sitemap.iter() if e.tag.endswith("loc")]
 check("sitemap XML valid",True)
 check("sitemap canonical includes 5 current routes",len(urls)==5 and "https://lo3betbusiness.com/services/" in urls and "https://lo3betbusiness.com/diagnosis/quick/" in urls)
 check("sitemap excludes payment pages",not any("payment" in x for x in urls))
except Exception:
 check("sitemap XML valid",False)
check("original old payment admin remains",(root/"payment-admin/index.html").is_file())
check("new service pages don't include old project names",all(x not in services for x in ("كنز اليوم","MONTEJ","Hatem Commander")))
fail=[x for x in checks if not x["pass"]]
print(json.dumps({"passed":len(checks)-len(fail),"total":len(checks),"failures":fail},ensure_ascii=False,indent=2))
sys.exit(1 if fail else 0)
