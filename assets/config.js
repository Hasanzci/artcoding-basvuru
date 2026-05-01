/* ============================================
   ArtCoding • Yapılandırma Dosyası
   ============================================
   Bu dosyaya Google Apps Script "Web App URL"
   adresinizi ve admin giriş bilgilerinizi girin.

   ⚠️  GitHub'a yüklemeden önce mutlaka düzenleyin.
   ============================================ */

window.ARTCODING_CONFIG = {
  // 1) Google Apps Script web app URL'i
  //    Apps Script editöründe "Deploy → New deployment → Web app"
  //    adımını tamamladıktan sonra aldığınız URL'i buraya yapıştırın.
  //    Örnek: https://script.google.com/macros/s/AKfyc.../exec
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyow1ottJcjb4ZdIAC6QVAEAx2o4NaYmK2yDDgOXpMVhPNPUk-rI-HPPEF1y13QSSVQ/exec",

  // 2) Admin paneli giriş bilgileri (sha-256 hash'i)
  //    Aşağıda "admin" / "ArtCoding2026!" çiftinin hash'i var.
  //    Yenisini üretmek için README'deki adımı takip edin.
  ADMIN_USERNAME: "elyanaatreus",
  ADMIN_PASSWORD_HASH: "3b4869f453356f1ce9ee31d2e96b948efe26d8a206095fd282ddb507be792e59",
  // ↑ örnek hash (DEĞİŞTİRİN). Adımı README.md'ye bakın.

  // 3) Admin panelinin başvuruları çekmek için kullanacağı API anahtarı
  //    Apps Script'teki ADMIN_API_KEY ile birebir aynı olmalıdır.
  ADMIN_API_KEY: "f8c3de3d-1fea-4d7c-a8b0-29f82c18df115a3a0e63-718c-4f51-b99b-0081076f8e4a"
};
