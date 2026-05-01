# 🎨 ArtCoding Online — Başvuru Sistemi

ArtCoding Online'ın **Haziran 2026** dönem kayıtları için profesyonel başvuru sayfası, admin paneli ve Google Sheets entegrasyonu.

![status](https://img.shields.io/badge/durum-üretime_hazır-2ea44f) ![host](https://img.shields.io/badge/host-GitHub_Pages-blue) ![backend](https://img.shields.io/badge/backend-Google_Apps_Script-yellow)

## 🌟 Neler Var?

- **`index.html`** — Şık, animasyonlu, mobil uyumlu başvuru sayfası
- **`admin.html`** — Şifre korumalı yönetici paneli (filtreleme, arama, CSV indirme)
- **`tesekkurler.html`** — Konfetili teşekkür sayfası
- **`google-apps-script/Code.gs`** — Google Sheets backend + e-posta bildirimi

## 🚀 Kurulum (3 Adım)

Tüm adımlar için → **[KURULUM.md](KURULUM.md)** dosyasına göz atın.

```
1. Google Sheets oluştur → Apps Script'i yapıştır → Deploy
2. assets/config.js içine Apps Script URL'ini ve admin bilgilerini gir
3. GitHub Pages'e yükle ve yayına başla
```

## 📁 Klasör Yapısı

```
artcoding-basvuru/
├── index.html              ← Başvuru formu (anasayfa)
├── admin.html              ← Yönetici paneli
├── tesekkurler.html        ← Başvuru sonrası ekranı
├── assets/
│   ├── config.js           ← ⚠ Yapılandırma (URL, şifre vs.)
│   ├── style.css
│   ├── script.js           ← Form mantığı
│   ├── admin.js            ← Admin paneli mantığı
│   ├── logo.svg            ← Marka logosu
│   └── maskot.svg          ← Maskot karakter
├── google-apps-script/
│   └── Code.gs             ← Backend kodu (Google'a yapıştırılır)
├── KURULUM.md              ← Adım adım kurulum
├── README.md               ← Bu dosya
└── .gitignore
```

## 🎨 Markayı Özelleştirme

- **Renkler:** `assets/style.css` üst kısmındaki `:root` değişkenleri
- **Logo & Maskot:** `assets/logo.svg` ve `assets/maskot.svg` dosyalarını kendi PNG/SVG'leriniz ile değiştirin (aynı dosya adıyla kaydederseniz HTML'de değişiklik gerekmez)
- **Kurslar:** `index.html` içindeki `<section id="kurslar">` ve form `<select id="kurs">` blokları

## 🔐 Güvenlik Notları

- **Apps Script URL'i** ve **API Anahtarı** `config.js` üzerinden okunur. Bu dosya GitHub'a yüklenir, ama:
  - URL "Anyone" yetkisinde, bu normaldir (form gönderebilmek için).
  - API key sadece liste çekmeyi sınırlar — şifre yerine ek katmandır.
- **Admin şifresi** SHA-256 hash'i olarak saklanır, düz metin DEĞİL.
- Hassas işlemler tarayıcıda yapılır (görüntüleme), bu açık kaynaklı bir admin paneli için yeterlidir.
- Daha sıkı güvenlik için: Admin sayfasını ayrı bir özel repo'da tutup yalnızca kendiniz ile paylaşabilirsiniz.

## 🆘 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Form gönderilince hata | `assets/config.js` → `APPS_SCRIPT_URL` doğru mu? Apps Script Deploy → "Anyone" mı? |
| Admin paneline veri gelmiyor | `ADMIN_API_KEY` her iki dosyada da aynı mı? |
| E-posta gelmiyor | `Code.gs` → `NOTIFY_EMAIL` doğru mu? Spam klasörüne baktınız mı? Apps Script ilk çalıştırmada izin ister, onaylayın. |
| GitHub Pages açılmıyor | Settings → Pages → Source = "main" / "/" doğru mu? Birkaç dakika bekleyin. |

## 📜 Lisans

Bu proje ArtCoding Online'a aittir. Eğitim ve özel kullanım için serbestçe değiştirilebilir.

---

**Hazırlayan:** Claude (Anthropic) yardımıyla • **Sahibi:** ArtCoding Online
