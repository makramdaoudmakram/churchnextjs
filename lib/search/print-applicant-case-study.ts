import type { ApplicantDetails } from "@/lib/applicants-api";

type FamilyRow = {
  fullName?: string;
  relationshipName?: string;
  age?: number | null;
  educationLevelName?: string;
  salary?: number | null;
};

type IncomeRow = {
  incomeTypeName?: string;
  amount?: number;
  notes?: string | null;
};

export type ApplicantPrintPayload = ApplicantDetails & {
  familyMembers?: FamilyRow[];
  incomeSources?: IncomeRow[];
  church?: { churchName?: string } | null;
  governorate?: { governorateName?: string } | null;
  city?: { cityName?: string } | null;
  area?: { areaName?: string } | null;
  street?: { streetName?: string } | null;
  address?: {
    buildingNo?: string | null;
    floorNo?: string | null;
    apartmentNo?: string | null;
    landmark?: string | null;
  } | null;
};

function esc(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG");
  } catch {
    return iso;
  }
}

/** Call synchronously inside a click handler (before any await) to avoid pop-up blockers. */
export function openCaseStudyPrintTarget(): Window | null {
  const w = window.open("about:blank", "_blank");
  if (w) {
    try {
      w.document.open();
      w.document.write(
        `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Loading…</title></head><body style="font-family:system-ui;padding:2rem;text-align:center">جاري تحميل دراسة الحالة…</body></html>`
      );
      w.document.close();
    } catch {
      /* ignore */
    }
  }
  return w;
}

export function buildCaseStudyHtml(applicant: ApplicantPrintPayload, filtersSummary?: string): string {
  const title = "دراسة حالة لقاء حنة النبية";
  const printedAt = new Date().toLocaleString("ar-EG");
  const addressParts = [
    applicant.governorate?.governorateName,
    applicant.city?.cityName,
    applicant.area?.areaName,
    applicant.street?.streetName,
    applicant.address?.buildingNo ? `عمارة ${applicant.address.buildingNo}` : null,
    applicant.address?.floorNo ? `دور ${applicant.address.floorNo}` : null,
    applicant.address?.apartmentNo ? `شقة ${applicant.address.apartmentNo}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const familyRows =
    applicant.familyMembers?.length ?
      applicant.familyMembers
        .map(
          (m) => `
      <tr>
        <td>${esc(m.fullName)}</td>
        <td>${esc(m.relationshipName)}</td>
        <td>${m.age ?? "—"}</td>
        <td>${esc(m.educationLevelName)}</td>
        <td>${m.salary != null ? esc(m.salary) : "—"}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="muted">—</td></tr>`;

  const incomeRows =
    applicant.incomeSources?.length ?
      applicant.incomeSources
        .map(
          (i) => `
      <tr>
        <td>${esc(i.incomeTypeName)}</td>
        <td>${i.amount != null ? esc(i.amount) : "—"}</td>
        <td>${esc(i.notes)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="3" class="muted">—</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 11pt; color: #111; line-height: 1.45; margin: 0; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 14px; }
    .logo { width: 72px; height: 72px; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 9pt; color: #666; }
    .org { text-align: center; flex: 1; padding: 0 12px; }
    .org h1 { margin: 0; font-size: 16pt; }
    .org h2 { margin: 6px 0 0; font-size: 13pt; font-weight: 600; }
    .meta { font-size: 9pt; color: #444; text-align: left; }
    h3 { font-size: 12pt; margin: 16px 0 8px; border-right: 4px solid #333; padding-right: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; vertical-align: top; }
    th { background: #f0f0f0; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 8px; }
    .field label { display: block; font-size: 9pt; color: #555; margin-bottom: 2px; }
    .field div { min-height: 1.2em; border-bottom: 1px dotted #bbb; padding-bottom: 2px; }
    .block { margin-bottom: 10px; }
    .block label { font-size: 9pt; color: #555; }
    .block p { margin: 4px 0 0; white-space: pre-wrap; border: 1px solid #ddd; padding: 8px; min-height: 48px; }
    .filters { font-size: 9pt; background: #fafafa; border: 1px solid #ddd; padding: 8px; margin-bottom: 12px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 28px; text-align: center; }
    .signatures .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; font-size: 10pt; }
    .muted { color: #888; text-align: center; }
    @media print {
      thead { display: table-header-group; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">شعار</div>
    <div class="org">
      <h1>نظام حنة — Hena System</h1>
      <h2>${esc(title)}</h2>
    </div>
    <div class="meta">
      <div>تاريخ الطباعة: ${esc(printedAt)}</div>
      <div>رقم الملف: ${esc(applicant.applicantId)}</div>
    </div>
  </div>
  ${filtersSummary ? `<div class="filters"><strong>معايير البحث:</strong> ${esc(filtersSummary)}</div>` : ""}

  <h3>البيانات الشخصية</h3>
  <div class="grid">
    <div class="field"><label>الاسم</label><div>${esc(applicant.fullName)}</div></div>
    <div class="field"><label>الرقم القومي</label><div>${esc(applicant.nationalId)}</div></div>
    <div class="field"><label>تاريخ الميلاد</label><div>${fmtDate(applicant.birthDate)}</div></div>
    <div class="field"><label>الجوال</label><div>${esc(applicant.mobile)}</div></div>
    <div class="field"><label>المؤهل</label><div>${esc(applicant.educationLevel?.name)}</div></div>
    <div class="field"><label>الوظيفة</label><div>${esc(applicant.jobTitle?.name)}</div></div>
    <div class="field"><label>الحالة الاجتماعية</label><div>${esc(applicant.maritalStatus?.name)}</div></div>
    <div class="field"><label>الراتب</label><div>${esc(applicant.salary)}</div></div>
    <div class="field"><label>أب الاعتراف</label><div>${esc(applicant.fatherOfConfession?.fatherName)}</div></div>
    <div class="field"><label>المشرف</label><div>${esc(applicant.supervisor?.name)}</div></div>
    <div class="field"><label>الكنيسة</label><div>${esc(applicant.church?.churchName)}</div></div>
    <div class="field"><label>العنوان</label><div>${esc(addressParts || "—")}</div></div>
  </div>

  <div class="block">
    <label>الحالة الصحية</label>
    <p>${esc(applicant.healthStatus || "—")}</p>
  </div>

  <h3>أفراد الأسرة</h3>
  <table>
    <thead><tr><th>الاسم</th><th>القرابة</th><th>السن</th><th>التعليم</th><th>الدخل</th></tr></thead>
    <tbody>${familyRows}</tbody>
  </table>

  <h3>مصادر الدخل</h3>
  <table>
    <thead><tr><th>النوع</th><th>القيمة</th><th>ملاحظات</th></tr></thead>
    <tbody>${incomeRows}</tbody>
  </table>

  <div class="block">
    <label>مصادر دخل أخرى</label>
    <p>${esc(applicant.anotherSourceInc || "—")}</p>
  </div>
  <div class="block">
    <label>وصف السكن</label>
    <p>${esc(applicant.houseDescrip || "—")}</p>
  </div>
  <div class="block">
    <label>أشخاص آخرون في السكن</label>
    <p>${esc(applicant.otherPersonHou || "—")}</p>
  </div>
  <div class="block">
    <label>تقرير الأخصائي / الباحث</label>
    <p>${esc(applicant.serReport || "—")}</p>
  </div>

  <div class="signatures">
    <div><div class="line">باحث الحالة</div></div>
    <div><div class="line">المشرف</div></div>
    <div><div class="line">أب الاعتراف</div></div>
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  return html;
}

function printHtmlViaHiddenIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument ?? win?.document;
  if (!doc || !win) {
    iframe.remove();
    throw new Error("Could not open print view. Try allowing pop-ups for this site.");
  }
  doc.open();
  doc.write(html);
  doc.close();
  win.focus();
  win.print();
  window.setTimeout(() => iframe.remove(), 2000);
}

/** @param printTarget Window from openCaseStudyPrintTarget() — pass when printing after async fetch */
export function printApplicantCaseStudy(
  applicant: ApplicantPrintPayload,
  filtersSummary?: string,
  printTarget?: Window | null
) {
  const html = buildCaseStudyHtml(applicant, filtersSummary);

  if (printTarget && !printTarget.closed) {
    try {
      printTarget.document.open();
      printTarget.document.write(html);
      printTarget.document.close();
      printTarget.focus();
      return;
    } catch {
      try {
        printTarget.close();
      } catch {
        /* ignore */
      }
    }
  }

  const w = window.open("about:blank", "_blank");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    return;
  }

  printHtmlViaHiddenIframe(html);
}
