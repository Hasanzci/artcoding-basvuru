/**
 * ArtCoding Online — Başvuru Backend
 * ----------------------------------
 * Google Apps Script (script.google.com) içinde çalışır.
 *
 * Görevleri:
 *   1) Web formundan gelen başvuruları Google Sheets'e yazar
 *      (sütunlar otomatik oluşturulur).
 *   2) Yöneticiye e-posta bildirimi gönderir.
 *   3) Admin paneli için JSON listesi sunar (API key korumalı).
 *
 * Kurulum adımları için repo kökündeki KURULUM.md dosyasına bakın.
 */

// =====================================================================
//                    A Y A R L A R
// =====================================================================

const CONFIG = {
  // Başvuruların yazılacağı sayfa adı (yoksa otomatik oluşturulur)
  SHEET_NAME: "Başvurular",

  // Bildirim e-postasının gideceği adres
  NOTIFY_EMAIL: "izcihasan695@gmail.com",

  // Konu satırına eklenecek dönem etiketi
  SEASON_LABEL: "Haziran 2026",

  // Admin panelinin başvuru listesini çekmesi için gerekli anahtar.
  // Tahmini zor, uzun bir dize seçin (en az 24 karakter).
  // assets/config.js içindeki ADMIN_API_KEY ile birebir aynı olmalı.
  ADMIN_API_KEY: "DEGISTIR-buraya-uzun-rastgele-bir-anahtar-yapistir-2026"
};

// Sayfa sütun başlıkları (sıra korunur).
const COLUMNS = [
  ["tarih",        "Tarih"],
  ["ogrenciAd",    "Öğrenci Adı"],
  ["ogrenciYas",   "Yaş"],
  ["veliAd",       "Veli Adı"],
  ["yakinlik",     "Yakınlık"],
  ["telefon",      "Telefon"],
  ["email",        "E-posta"],
  ["kurs",         "Kurs"],
  ["seviye",       "Seviye"],
  ["beklenti",     "Beklentiler"],
  ["cocukNot",     "Çocuk Hakkında Not"],
  ["zaman",        "Tercih Edilen Zaman"],
  ["kaynak",       "Bizi Nereden Duydu"],
  ["denemeDersi",  "Deneme Dersi"],
  ["bulten",       "E-bülten"],
  ["kvkk",         "KVKK"],
  ["userAgent",    "Tarayıcı"]
];

// =====================================================================
//                  E N D P O I N T S
// =====================================================================

/**
 * Form gönderimini alır (POST).
 * Frontend "no-cors" + text/plain kullanır, dolayısıyla payload e.postData.contents içinde olur.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action !== "submit") {
      return _json({ ok: false, error: "Geçersiz işlem" });
    }
    const sheet = _getOrCreateSheet();
    const data = payload.data || {};
    const row = COLUMNS.map(([key]) => data[key] != null ? data[key] : "");
    sheet.appendRow(row);

    _sendNotification(data);

    return _json({ ok: true });
  } catch (err) {
    console.error(err);
    return _json({ ok: false, error: String(err) });
  }
}

/**
 * Admin paneli için başvuru listesini döner (GET ?action=list&key=...).
 */
function doGet(e) {
  try {
    const action = (e.parameter.action || "").toLowerCase();
    if (action === "list") {
      if (e.parameter.key !== CONFIG.ADMIN_API_KEY) {
        return _json({ ok: false, error: "Yetkisiz" });
      }
      const sheet = _getOrCreateSheet();
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return _json({ ok: true, applications: [] });

      const headers = values[0];                // satır 0 = başlık
      const apps = values.slice(1).map(row => {
        const obj = {};
        COLUMNS.forEach(([key], idx) => obj[key] = row[idx]);
        // Tarih ISO string'e dönüştür
        if (obj.tarih instanceof Date) obj.tarih = obj.tarih.toISOString();
        return obj;
      }).reverse();  // En yenisi üstte

      return _json({ ok: true, applications: apps });
    }

    if (action === "ping") {
      return _json({ ok: true, message: "ArtCoding API çalışıyor", time: new Date().toISOString() });
    }

    return _json({ ok: false, error: "Bilinmeyen action: " + action });
  } catch (err) {
    console.error(err);
    return _json({ ok: false, error: String(err) });
  }
}

// =====================================================================
//                  Y A R D I M C I L A R
// =====================================================================

function _getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  // Başlık satırını oluştur veya güncelle
  const headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  const existing = headerRange.getValues()[0];
  const desired = COLUMNS.map(c => c[1]);
  if (existing.join("|") !== desired.join("|")) {
    headerRange.setValues([desired]);
    headerRange
      .setFontWeight("bold")
      .setBackground("#5B2A86")
      .setFontColor("#FFFFFF")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    // Sütun genişliklerini biraz açalım
    [180, 160, 50, 160, 90, 130, 200, 200, 130, 280, 280, 160, 130, 80, 80, 90, 200]
      .forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  }
  return sheet;
}

function _sendNotification(d) {
  try {
    const subject = `🎨 Yeni ArtCoding Başvurusu • ${d.kurs || "Kurs?"} • ${d.ogrenciAd || ""}`;
    const denemeBadge = d.denemeDersi === "Evet"
      ? '<span style="background:#DCFCE7;color:#166534;padding:4px 10px;border-radius:99px;font-size:13px;font-weight:600;">✓ Deneme dersi istiyor</span>'
      : '<span style="background:#FEE2E2;color:#991B1B;padding:4px 10px;border-radius:99px;font-size:13px;font-weight:600;">Deneme dersi istemiyor</span>';

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;font-family:'Segoe UI',Helvetica,sans-serif;background:#F4ECF7;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(91,42,134,0.12);">
    <div style="background:linear-gradient(135deg,#5B2A86,#7C4DFF,#22D3EE);padding:24px 28px;color:#fff;">
      <h2 style="margin:0;font-size:22px;">🎨 Yeni Başvuru — ${CONFIG.SEASON_LABEL}</h2>
      <p style="margin:4px 0 0;opacity:.9;font-size:14px;">${new Date().toLocaleString("tr-TR")}</p>
    </div>
    <div style="padding:28px;">
      <h3 style="color:#5B2A86;margin:0 0 4px;">${_safe(d.ogrenciAd)} <span style="color:#8A7BAD;font-weight:400;">(${_safe(d.ogrenciYas)} yaş)</span></h3>
      <p style="margin:0 0 14px;color:#5A4F6E;">${denemeBadge}</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${_emailRow("Kurs", d.kurs)}
        ${_emailRow("Mevcut seviye", d.seviye)}
        ${_emailRow("Veli", `${_safe(d.veliAd)} (${_safe(d.yakinlik)})`)}
        ${_emailRow("Telefon", `<a href="tel:${_safe(d.telefon)}" style="color:#7C4DFF;text-decoration:none;">${_safe(d.telefon)}</a>`)}
        ${_emailRow("E-posta", `<a href="mailto:${_safe(d.email)}" style="color:#7C4DFF;text-decoration:none;">${_safe(d.email)}</a>`)}
        ${_emailRow("Tercih edilen zaman", d.zaman)}
        ${_emailRow("Bizi nereden duydu", d.kaynak)}
      </table>

      <h4 style="color:#5B2A86;margin:22px 0 6px;">Beklentiler</h4>
      <p style="background:#FAF7FC;padding:12px 14px;border-radius:8px;margin:0;color:#1F1235;">${_safe(d.beklenti)}</p>

      <h4 style="color:#5B2A86;margin:18px 0 6px;">Çocuk hakkında not</h4>
      <p style="background:#FAF7FC;padding:12px 14px;border-radius:8px;margin:0;color:#1F1235;">${_safe(d.cocukNot)}</p>

      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #E4D9EE;text-align:center;">
        <a href="tel:${_safe(d.telefon)}" style="display:inline-block;background:linear-gradient(135deg,#5B2A86,#7C4DFF);color:#fff;padding:12px 22px;border-radius:99px;text-decoration:none;font-weight:600;margin:4px;">📞 Hemen Ara</a>
        <a href="mailto:${_safe(d.email)}?subject=ArtCoding%20Ba%C5%9Fvurunuz%20Hakk%C4%B1nda" style="display:inline-block;background:#fff;border:2px solid #5B2A86;color:#5B2A86;padding:10px 20px;border-radius:99px;text-decoration:none;font-weight:600;margin:4px;">✉ E-posta Gönder</a>
      </div>
    </div>
    <div style="background:#1F1235;color:#B8AAD0;padding:16px;text-align:center;font-size:12px;">
      ArtCoding Online • Yönetici bildirimi
    </div>
  </div>
</body>
</html>`;

    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: subject,
      htmlBody: html,
      replyTo: d.email || CONFIG.NOTIFY_EMAIL
    });

    // Veliye otomatik yanıt
    if (d.email) {
      const veliHtml = `
<!DOCTYPE html><html><body style="margin:0;font-family:'Segoe UI',sans-serif;background:#F4ECF7;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#5B2A86,#7C4DFF,#22D3EE);padding:30px;color:#fff;text-align:center;">
    <h1 style="margin:0;font-size:26px;">Başvurun bize ulaştı! 🎉</h1>
  </div>
  <div style="padding:28px;color:#1F1235;">
    <p>Merhaba <strong>${_safe(d.veliAd)}</strong>,</p>
    <p><strong>${_safe(d.ogrenciAd)}</strong>'in <strong>${_safe(d.kurs)}</strong> kursu için başvurusunu aldık.</p>
    ${d.denemeDersi === "Evet" ? `<p style="background:#DCFCE7;color:#166534;padding:12px;border-radius:8px;"><strong>✓ Ücretsiz deneme dersi</strong> talebiniz not edildi.</p>` : ""}
    <p>Eğitim koordinatörümüz <strong>24 saat içinde</strong> sizinle iletişime geçecek. Bu arada aklınıza takılan herhangi bir şey olursa bu e-postaya yanıt verebilirsiniz.</p>
    <p style="margin-top:24px;color:#5A4F6E;font-size:14px;">Sevgiyle,<br><strong>ArtCoding Ekibi</strong></p>
  </div>
</div></body></html>`;
      MailApp.sendEmail({
        to: d.email,
        subject: "ArtCoding • Başvurunuzu aldık 🎨",
        htmlBody: veliHtml,
        name: "ArtCoding Online",
        replyTo: CONFIG.NOTIFY_EMAIL
      });
    }
  } catch (err) {
    console.error("E-posta gönderilemedi:", err);
  }
}

function _emailRow(k, v) {
  return `<tr>
    <td style="padding:8px 0;color:#5A4F6E;width:38%;">${k}</td>
    <td style="padding:8px 0;font-weight:500;">${_safe(v) || "—"}</td>
  </tr>`;
}

function _safe(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[<>]/g, "");
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
//                  T E S T
// =====================================================================
//
// Apps Script editöründe bu fonksiyonu seçip "Run" diyerek
// kurulumu test edebilirsin. Konsolda "OK" görüyorsan hazırsın.

function testKurulum() {
  const sheet = _getOrCreateSheet();
  console.log("Sayfa hazır:", sheet.getName());
  console.log("Sütun sayısı:", sheet.getLastColumn());
  _sendNotification({
    ogrenciAd: "Test Öğrenci",
    ogrenciYas: "10",
    veliAd: "Test Veli",
    yakinlik: "Anne",
    telefon: "0 555 555 55 55",
    email: CONFIG.NOTIFY_EMAIL,
    kurs: "Scratch ile Kodlama",
    seviye: "Hiç deneyimi yok",
    beklenti: "Bu bir test başvurusudur.",
    cocukNot: "Test notudur.",
    zaman: "Hafta sonu sabah",
    kaynak: "Test",
    denemeDersi: "Evet",
    bulten: "Hayır",
    kvkk: "Onaylandı"
  });
  console.log("OK — test e-postası gönderildi:", CONFIG.NOTIFY_EMAIL);
}
