/* ====== ArtCoding • Başvuru formu mantığı ====== */
(function () {
  "use strict";

  // ---------- Mobil menü ----------
  const navToggle = document.getElementById("navToggle");
  const header = document.querySelector(".site-header");
  if (navToggle && header) {
    navToggle.addEventListener("click", () => header.classList.toggle("menu-open"));
    document.querySelectorAll(".nav-links a").forEach(a =>
      a.addEventListener("click", () => header.classList.remove("menu-open"))
    );
  }

  // ---------- KVKK modal ----------
  const kvkkLink = document.getElementById("kvkkLink");
  const kvkkModal = document.getElementById("kvkkModal");
  const kvkkClose = document.getElementById("kvkkClose");
  const kvkkOk = document.getElementById("kvkkOk");
  if (kvkkLink) {
    kvkkLink.addEventListener("click", e => { e.preventDefault(); kvkkModal.hidden = false; });
    kvkkClose.addEventListener("click", () => kvkkModal.hidden = true);
    kvkkOk.addEventListener("click", () => kvkkModal.hidden = true);
    kvkkModal.addEventListener("click", e => { if (e.target === kvkkModal) kvkkModal.hidden = true; });
  }

  // ---------- Form ----------
  const form = document.getElementById("basvuruForm");
  if (!form) return;

  const note = document.getElementById("formNote");
  const submitBtn = document.getElementById("submitBtn");

  // Telefon maskeleme
  const tel = document.getElementById("telefon");
  tel && tel.addEventListener("input", () => {
    let v = tel.value.replace(/\D/g, "");
    if (v.startsWith("90")) v = v.substring(2);
    if (v.startsWith("0")) v = v.substring(1);
    v = v.substring(0, 10);
    let out = "0";
    if (v.length > 0) out += " " + v.substring(0, 3);
    if (v.length > 3) out += " " + v.substring(3, 6);
    if (v.length > 6) out += " " + v.substring(6, 8);
    if (v.length > 8) out += " " + v.substring(8, 10);
    tel.value = v.length === 0 ? "" : out;
  });

  function validate() {
    let ok = true;
    form.querySelectorAll("[required]").forEach(el => {
      const valid = el.type === "checkbox" ? el.checked : (el.value || "").trim().length > 0;
      el.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    const email = document.getElementById("email");
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add("invalid"); ok = false;
    }
    const phone = document.getElementById("telefon");
    if (phone.value && phone.value.replace(/\D/g, "").length < 10) {
      phone.classList.add("invalid"); ok = false;
    }
    return ok;
  }
  form.addEventListener("input", e => e.target.classList.remove("invalid"));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    note.className = "form-note"; note.textContent = "";

    if (!validate()) {
      note.classList.add("error");
      note.textContent = "Lütfen kırmızıyla işaretlenen alanları kontrol edin.";
      const firstInvalid = form.querySelector(".invalid");
      firstInvalid && firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const data = {
      tarih: new Date().toISOString(),
      ogrenciAd: form.ogrenciAd.value.trim(),
      ogrenciYas: form.ogrenciYas.value,
      veliAd: form.veliAd.value.trim(),
      yakinlik: form.yakinlik.value,
      telefon: form.telefon.value.trim(),
      email: form.email.value.trim(),
      kurs: form.kurs.value,
      seviye: form.seviye.value,
      beklenti: form.beklenti.value.trim(),
      cocukNot: form.cocukNot.value.trim(),
      zaman: form.zaman.value,
      kaynak: form.kaynak.value,
      denemeDersi: form.denemeDersi.checked ? "Evet" : "Hayır",
      bulten: form.bulten.checked ? "Evet" : "Hayır",
      kvkk: form.kvkk.checked ? "Onaylandı" : "—",
      userAgent: navigator.userAgent
    };

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;

    const url = (window.ARTCODING_CONFIG && window.ARTCODING_CONFIG.APPS_SCRIPT_URL) || "";
    if (!url || url.includes("BURAYA")) {
      submitBtn.classList.remove("is-loading"); submitBtn.disabled = false;
      note.classList.add("error");
      note.textContent = "Form henüz aktif değil. (Yönetici: assets/config.js içine Apps Script URL'i ekleyin.)";
      return;
    }

    try {
      // Apps Script doPost CORS dert etmesin diye text/plain ile yolluyoruz
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "submit", data })
      });

      // Form gönderildikten sonra teşekkür sayfasına yönlendir
      const params = new URLSearchParams({
        ad: data.ogrenciAd, kurs: data.kurs, deneme: data.denemeDersi
      });
      window.location.href = "tesekkurler.html?" + params.toString();
    } catch (err) {
      submitBtn.classList.remove("is-loading"); submitBtn.disabled = false;
      note.classList.add("error");
      note.textContent = "Bir hata oluştu, lütfen tekrar deneyin veya WhatsApp üzerinden bize ulaşın.";
      console.error(err);
    }
  });
})();
