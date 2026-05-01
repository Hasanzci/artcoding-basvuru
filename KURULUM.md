# 📘 ArtCoding Başvuru Sistemi — Adım Adım Kurulum

Bu dosyayı baştan sona takip edersen yaklaşık **15 dakikada** sistem ayakta olur.

## ✅ Ön gereksinimler

- Bir **Google hesabı** (Sheets ve Apps Script için)
- Bir **GitHub hesabı** (siteyi ücretsiz yayınlamak için)
- (İsteğe bağlı) Kendi logo ve maskot görselleriniz (PNG veya SVG)

---

## 1️⃣ Google Sheets ve Apps Script

### 1.1 Yeni bir Google Sheet oluştur

1. [sheets.google.com](https://sheets.google.com) → **Boş** tablo oluştur.
2. Tablonun adını "**ArtCoding Başvurular 2026**" olarak değiştir.

### 1.2 Apps Script'i bağla

1. Açılan tabloda **Uzantılar → Apps Script** menüsüne tıkla.
2. Solda görünen `Code.gs` dosyasını **tamamen sil**.
3. Bu repo'daki `google-apps-script/Code.gs` dosyasının **içeriğini kopyala**, oraya yapıştır.

### 1.3 Ayarları gir

`Code.gs` dosyasının üstündeki `CONFIG` bölümünü düzenle:

```javascript
const CONFIG = {
  SHEET_NAME: "Başvurular",
  NOTIFY_EMAIL: "izcihasan695@gmail.com",   // ← bildirim e-postanız
  SEASON_LABEL: "Haziran 2026",
  ADMIN_API_KEY: "DEGISTIR-buraya-uzun-rastgele-bir-anahtar-yapistir-2026"
  //               ↑ Bunu mutlaka değiştir!
};
```

> **API Anahtarı nasıl üretilir?** Tarayıcıda yeni bir sekme aç, F12 → Console → şunu yapıştır:
> ```js
> crypto.randomUUID() + crypto.randomUUID()
> ```
> Çıkan uzun stringi kopyalayıp `ADMIN_API_KEY` yerine yapıştır. Bu anahtarı sonra `assets/config.js` içine de gireceğiz.

### 1.4 Test et

1. Apps Script editöründe üstteki fonksiyon listesinden **`testKurulum`** seç.
2. **▶ Çalıştır** butonuna bas.
3. İlk seferde Google izin isteyecek → "Yetkilendir" → kendi hesabını seç → "Gelişmiş" → "Devam et" → "İzin ver".
4. Çalışma bitince Google Sheet'e dönüp **Başvurular** sekmesinin başlıklarla oluştuğunu, mail adresine de **test e-postası** geldiğini gör. ✅

### 1.5 Web App olarak yayınla

1. Sağ üstte **Deploy → New deployment** → ⚙ ikonu → **Web app** seç.
2. Şu ayarları gir:
   - **Description:** `ArtCoding form v1`
   - **Execute as:** `Me (kendi e-postanız)`
   - **Who has access:** **Anyone** (önemli — herkesin başvuru yapabilmesi için)
3. **Deploy** → izinleri tekrar onayla.
4. Çıkan **Web app URL**'i kopyala. Şuna benzer:
   `https://script.google.com/macros/s/AKfyc.../exec`

> **Not:** Daha sonra `Code.gs`'i değiştirirsen → tekrar **Deploy → Manage deployments → ✏ → New version** yapman lazım, yoksa değişiklik canlıya gitmez.

---

## 2️⃣ Site dosyalarını yapılandır

`assets/config.js` dosyasını aç ve üç değeri değiştir:

```javascript
window.ARTCODING_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfyc.../exec",  // ← 1.5'te aldığın URL
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD_HASH: "...",  // ← aşağıda
  ADMIN_API_KEY: "DEGISTIR-...."  // ← Code.gs'deki ile birebir aynı
};
```

### 2.1 Admin şifresi için hash üret

Tarayıcıda yeni bir sekme aç, **F12 → Console**, şunu yapıştır (parolanı değiştir):

```js
const sifre = "BenimGizliSifrem2026!";
crypto.subtle.digest("SHA-256", new TextEncoder().encode(sifre))
  .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join(""))
  .then(console.log);
```

Çıkan 64 karakterli stringi (örn. `7c5d...`) `ADMIN_PASSWORD_HASH` yerine yapıştır.

### 2.2 (Opsiyonel) Logo ve maskotu güncelle

`assets/logo.svg` ve `assets/maskot.svg` dosyalarını kendi versiyonlarınızla değiştirin. SVG yerine PNG kullanmak isterseniz:

1. Görselleri `assets/logo.png` ve `assets/maskot.png` olarak kopyalayın.
2. Tüm HTML dosyalarında `logo.svg` ve `maskot.svg` referanslarını `logo.png` / `maskot.png` ile değiştirin.

---

## 3️⃣ GitHub'a yükle ve yayınla

### 3.1 Yeni repo oluştur

1. [github.com/new](https://github.com/new) → repo adı: **`artcoding-basvuru`**
2. **Public** seç → **Create repository**.

### 3.2 Dosyaları yükle

Terminal kullanmak istemiyorsan **drag & drop** en kolayı:

1. Yeni repo sayfasında **"uploading an existing file"** linkine tıkla.
2. Klasördeki **tüm dosyaları seçip** sürükle bırak.
3. Aşağıda **"Commit changes"** → tıkla.

Terminal kullanıcıları için:
```bash
cd artcoding-basvuru
git init
git add .
git commit -m "İlk yayın"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/artcoding-basvuru.git
git push -u origin main
```

### 3.3 GitHub Pages'i aç

1. Repo sayfası → **Settings** sekmesi
2. Sol menüde **Pages**
3. **Source:** `Deploy from a branch`
4. **Branch:** `main`, klasör: `/ (root)` → **Save**
5. 1-2 dakika bekle → sayfanın üstünde adres çıkacak:
   `https://KULLANICI_ADIN.github.io/artcoding-basvuru/`

🎉 **Tebrikler!** Site canlıda. Kendi domaininiz varsa Pages ayarlarından "Custom domain" ekleyebilirsiniz.

---

## 4️⃣ Test ve doğrulama

1. Sitenizi açın → formu doldurup gönderin.
2. **Teşekkür sayfası** açılmalı.
3. **Google Sheet'e** yeni bir satır eklenmeli.
4. **E-postanıza** bildirim gelmeli (size + form sahibine).
5. `https://...github.io/artcoding-basvuru/admin.html` adresinden admin panele girip başvurunuzu görmelisiniz.

---

## 🔄 Bakım

- **Kursları değiştirmek:** `index.html` → `<select id="kurs">` ve `<section id="kurslar">` bloklarını düzenle.
- **Şifre değiştirmek:** Yeni hash üret (2.1 adımı) → `config.js` güncelle → GitHub'a push.
- **Yeni alan eklemek:** `index.html` (input ekle) + `script.js` (data nesnesine ekle) + `Code.gs` (`COLUMNS` array'ine ekle) + `Sheet'in başlık satırını manuel sil` (script yeniden oluşturur).
- **Sezonu kapatmak:** Form yerine sade bir "Kayıtlar bitti" mesajı göstermek için `index.html`'i geçici olarak değiştirin.

---

## ❓ Yaygın sorular

**S: Bot başvuruları çok geliyor.**
C: `index.html` formuna basit bir honeypot ekleyin (gizli alan; doluysa reddet) ya da Google reCAPTCHA v3 entegre edin.

**S: Veriler nerede saklanıyor?**
C: Sadece sizin Google Sheet'inizde. Üçüncü taraf yok.

**S: Apps Script ücretsiz mi?**
C: Evet — Google Workspace bedava limitlerinde günlük binlerce form rahat kaldırır.

**S: HTTPS var mı?**
C: Evet, GitHub Pages otomatik HTTPS sağlar.

İyi başvurular! 🎨💜
