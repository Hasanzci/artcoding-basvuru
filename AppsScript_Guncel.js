/**
 * ArtCoding Online — Başvuru Backend (v2 — Güvenli Kimlik Doğrulama)
 * -----------------------------------------------------------------
 * Bu sürümde admin kullanıcı adı, şifre hash'i ve oturum gizliliği
 * Apps Script tarafında saklanır. Hiçbiri client tarafına sızmaz.
 * EKLENEN ÖZELLİKLER: Not ekleme (update_note) ve kayıt silme (delete)
 */
  
// =====================================================================
//                    A Y A R L A R   ( G İ Z L İ )
// =====================================================================

const CONFIG = {
  // Sayfa adı (yoksa otomatik oluşturulur)
  SHEET_NAME: "Başvurular",

  // Bildirim e-postası
  NOTIFY_EMAIL: "izcihasan695@gmail.com",

  // Konu satırına eklenecek dönem etiketi
  SEASON_LABEL: "Haziran 2026",

  // Admin kullanıcı adı (Apps Script gizli, dışarı sızmaz)
  ADMIN_USERNAME: "elyanaatreus",

  // Şifrenin SHA-256 hash'i
  ADMIN_PASSWORD_HASH: "3b4869f453356f1ce9ee31d2e96b948efe26d8a206095fd282ddb507be792e59",

  // Oturum token'ları için imzalama anahtarı.
  // Bunu kimseyle paylaşma. En az 32 karakter, rastgele olsun.
  // Bir kez belirleyince DEĞİŞTİRME — değişirse tüm oturumlar iptal olur.
  SESSION_SECRET: "ea3b96f5-9074-4897-9003-c458a9d5bf07cf8536f9-3e8a-441e-b6cd-86cc5f68fff9"
};

// Sayfa sütun başlıkları
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
  ["userAgent",    "Tarayıcı"],
  ["adminNotu",    "Yönetici Notu"] // YENİ: Yönetici notunu tutacak sütun
];

// Oturum süresi (milisaniye) — 8 saat
const SESSION_DURATION = 8 * 60 * 60 * 1000;

// =====================================================================
//                  E N D P O I N T S
// =====================================================================

/**
 * Tüm POST işlemleri buradan geçer:
 *   - action=submit      → form gönderimi (herkese açık)
 *   - action=login       → admin girişi → token döner
 *   - action=list        → başvuru listesi (token gerektirir)
 *   - action=update_note → yönetici notunu günceller (token gerektirir)
 *   - action=delete      → başvuruyu siler (token gerektirir)
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = (payload.action || "").toLowerCase();

    if (action === "submit") {
      return _handleSubmit(payload.data || {});
    }

    if (action === "login") {
      return _handleLogin(payload.username, payload.password);
    }

    if (action === "list") {
      if (!_validateToken(payload.token)) {
        return _json({ ok: false, error: "Yetkisiz veya oturum süresi dolmuş" });
      }
      return _handleList();
    }
    
    if (action === "update_note") {
      if (!_validateToken(payload.token)) {
        return _json({ ok: false, error: "Yetkisiz veya oturum süresi dolmuş" });
      }
      return _handleUpdateNote(payload.id, payload.adminNotu);
    }
    
    if (action === "delete") {
      if (!_validateToken(payload.token)) {
        return _json({ ok: false, error: "Yetkisiz veya oturum süresi dolmuş" });
      }
      return _handleDelete(payload.id);
    }

    return _json({ ok: false, error: "Bilinmeyen action: " + action });
  } catch (err) {
    console.error(err);
    return _json({ ok: false, error: String(err) });
  }
}

/**
 * GET sadece "ping" için. Başka bir şey yapmıyoruz.
 */
function doGet(e) {
  return _json({
    ok: true,
    message: "ArtCoding API v2 (Not Ekleme ve Silme Güncellemesi Aktif)",
    time: new Date().toISOString()
  });
}

// =====================================================================
//                  A C T I O N   H A N D L E R S
// =====================================================================

function _handleSubmit(data) {
  const sheet = _getOrCreateSheet();
  const row = COLUMNS.map(([key]) => data[key] != null ? data[key] : "");
  sheet.appendRow(row);
  _sendNotification(data);
  return _json({ ok: true });
}

function _handleLogin(username, password) {
  if (!username || !password) {
    return _json({ ok: false, error: "Kullanıcı adı ve şifre gerekli" });
  }
  const hash = _sha256(password);
  if (username === CONFIG.ADMIN_USERNAME && hash === CONFIG.ADMIN_PASSWORD_HASH) {
    const token = _generateToken();
    return _json({ ok: true, token: token, expires: Date.now() + SESSION_DURATION });
  }
  // Bilgi sızdırmamak için "kullanıcı yok" / "şifre yanlış" ayırmıyoruz
  Utilities.sleep(500); // Brute-force'a karşı küçük gecikme
  return _json({ ok: false, error: "Kullanıcı adı veya şifre hatalı" });
}

function _handleList() {
  const sheet = _getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return _json({ ok: true, applications: [] });
  const apps = values.slice(1).map(row => {
    const obj = {};
    COLUMNS.forEach(([key], idx) => obj[key] = row[idx]);
    if (obj.tarih instanceof Date) obj.tarih = obj.tarih.toISOString();
    return obj;
  }).reverse();
  return _json({ ok: true, applications: apps });
}

// YENİ: Yönetici Notu Ekleme İşlemi
function _handleUpdateNote(id, adminNotu) {
  if (!id) return _json({ ok: false, error: "Kayıt kimliği (id) eksik" });
  const sheet = _getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _json({ ok: false, error: "Sayfa boş" });
  
  // Sadece ilk sütunu (Tarih sütunu) alıyoruz
  const dates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (let i = 0; i < dates.length; i++) {
    let rowDate = dates[i][0];
    if (rowDate instanceof Date) rowDate = rowDate.toISOString();
    
    // Eşleşen tarihi (id) bulduğumuzda notu güncelliyoruz
    if (String(rowDate) === String(id)) {
      const rowIndex = i + 2;
      const noteColIndex = COLUMNS.findIndex(c => c[0] === "adminNotu") + 1;
      sheet.getRange(rowIndex, noteColIndex).setValue(adminNotu || "");
      return _json({ ok: true });
    }
  }
  
  return _json({ ok: false, error: "Kayıt bulunamadı" });
}

// YENİ: Kayıt Silme İşlemi
function _handleDelete(id) {
  if (!id) return _json({ ok: false, error: "Kayıt kimliği (id) eksik" });
  const sheet = _getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _json({ ok: false, error: "Sayfa boş" });
  
  const dates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (let i = 0; i < dates.length; i++) {
    let rowDate = dates[i][0];
    if (rowDate instanceof Date) rowDate = rowDate.toISOString();
    
    // Eşleşen tarihi (id) bulduğumuzda tüm satırı siliyoruz
    if (String(rowDate) === String(id)) {
      sheet.deleteRow(i + 2);
      return _json({ ok: true });
    }
  }
  
  return _json({ ok: false, error: "Kayıt bulunamadı" });
}

// =====================================================================
//                  T O K E N
// =====================================================================
//
// Stateless HMAC-imzalı token. Sunucu tarafında veri saklamaya gerek yok.
// Token formatı:   <expiry>:<hmac_sha256(expiry, SECRET)>

function _generateToken() {
  const expiry = String(Date.now() + SESSION_DURATION);
  const sig = _hmac(expiry);
  return expiry + ":" + sig;
}

function _validateToken(token) {
  if (!token || typeof token !== "string" || token.indexOf(":") < 0) return false;
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [expiry, sig] = parts;
  if (Number(expiry) < Date.now()) return false;
  return _constantTimeEquals(_hmac(expiry), sig);
}

function _hmac(text) {
  const bytes = Utilities.computeHmacSha256Signature(text, CONFIG.SESSION_SECRET);
  return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))).join("");
}

function _sha256(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))).join("");
}

// Zamanlama saldırılarına karşı sabit-zamanlı string karşılaştırma
function _constantTimeEquals(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// =====================================================================
//                  Y A R D I M C I L A R
// =====================================================================

function _getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
  const existing = headerRange.getValues()[0];
  const desired = COLUMNS.map(c => c[1]);
  
  if (existing.join("|") !== desired.join("|")) {
    // Tüm başlıkları temizleyip yeniden yazalım
    sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).clearContent();
    headerRange.setValues([desired]);
    headerRange
      .setFontWeight("bold")
      .setBackground("#5B2A86")
      .setFontColor("#FFFFFF")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    
    // Genişlikleri ayarlama (Son eleman Yönetici Notu için 300 eklendi)
    [180, 160, 50, 160, 90, 130, 200, 200, 130, 280, 280, 160, 130, 80, 80, 90, 200, 300]
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

    const html = `<!DOCTYPE html><html><body style="margin:0;font-family:'Segoe UI',Helvetica,sans-serif;background:#F4ECF7;padding:20px;">
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
  <div style="background:#1F1235;color:#B8AAD0;padding:16px;text-align:center;font-size:12px;">ArtCoding Online • Yönetici bildirimi</div>
</div></body></html>`;

    MailApp.sendEmail({
      to: CONFIG.NOTIFY_EMAIL,
      subject: subject,
      htmlBody: html,
      replyTo: d.email || CONFIG.NOTIFY_EMAIL
    });

    if (d.email) {
      const veliHtml = `<!DOCTYPE html><html><body style="margin:0;font-family:'Segoe UI',sans-serif;background:#F4ECF7;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#5B2A86,#7C4DFF,#22D3EE);padding:30px;color:#fff;text-align:center;">
    <h1 style="margin:0;font-size:26px;">Başvurun bize ulaştı! 🎉</h1>
  </div>
  <div style="padding:28px;color:#1F1235;">
    <p>Merhaba <strong>${_safe(d.veliAd)}</strong>,</p>
    <p><strong>${_safe(d.ogrenciAd)}</strong>'in <strong>${_safe(d.kurs)}</strong> kursu için başvurusunu aldık.</p>
    ${d.denemeDersi === "Evet" ? `<p style="background:#DCFCE7;color:#166534;padding:12px;border-radius:8px;"><strong>✓ Ücretsiz deneme dersi</strong> talebiniz not edildi.</p>` : ""}
    <p>Eğitim koordinatörümüz <strong>24 saat içinde</strong> sizinle iletişime geçecek.</p>
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
  return `<tr><td style="padding:8px 0;color:#5A4F6E;width:38%;">${k}</td><td style="padding:8px 0;font-weight:500;">${_safe(v) || "—"}</td></tr>`;
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

function testKurulum() {
  const sheet = _getOrCreateSheet();
  console.log("Sayfa hazır:", sheet.getName());
  console.log("Sütun sayısı:", sheet.getLastColumn());
  const token = _generateToken();
  console.log("Test token:", token);
  console.log("Token geçerli mi?", _validateToken(token));
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
