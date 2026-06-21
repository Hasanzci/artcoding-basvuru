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

  // ---------- Scroll Reveal ----------
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length > 0 && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("active")); // fallback
  }

  // ---------- Course Filters ----------
  const filterBtns = document.querySelectorAll(".filter-btn");
  const courseCards = document.querySelectorAll(".course-card");
  if (filterBtns.length > 0 && courseCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.filter;
        courseCards.forEach(card => {
          if (filter === "all" || card.dataset.category === filter) {
            card.style.display = "flex";
            setTimeout(() => card.classList.add("active"), 10);
          } else {
            card.style.display = "none";
            card.classList.remove("active");
          }
        });
      });
    });
  }

  // ---------- Course Images Background (for blurred effect) ----------
  document.querySelectorAll(".course-image").forEach(container => {
    const img = container.querySelector("img");
    if (img && img.src) {
      container.style.backgroundImage = `url('${img.getAttribute("src")}')`;
    }
  });

  // ---------- Course Modal ----------
  const courseModal = document.getElementById("courseModal");
  const courseClose = document.getElementById("courseClose");
  if (courseModal) {
    courseClose.addEventListener("click", () => courseModal.hidden = true);
    courseModal.addEventListener("click", e => { if (e.target === courseModal) courseModal.hidden = true; });

    // Half-toggle helpers
    const halfToggleContainer = document.getElementById("halfToggleContainer");
    const halfBtn1 = document.getElementById("halfBtn1");
    const halfBtn2 = document.getElementById("halfBtn2");
    const halfDetailBox = document.getElementById("halfDetailBox");
    const halfDetailTitle = document.getElementById("halfDetailTitle");
    const halfDetailDesc = document.getElementById("halfDetailDesc");
    const halfDetailCurriculum = document.getElementById("halfDetailCurriculum");
    let currentCardData = null;

    function renderHalf(halfNum) {
      if (!currentCardData) return;
      const title = currentCardData[`half${halfNum}Title`];
      const desc = currentCardData[`half${halfNum}Desc`];
      const curriculum = currentCardData[`half${halfNum}Curriculum`];

      halfDetailTitle.textContent = title || "";
      halfDetailDesc.textContent = desc || "";
      halfDetailCurriculum.innerHTML = "";

      if (curriculum) {
        curriculum.split("|").forEach(item => {
          const li = document.createElement("li");
          // Parse "Hafta X — Title: Description" format
          const dashIdx = item.indexOf("—");
          if (dashIdx > -1) {
            const weekPart = item.substring(0, dashIdx).trim();
            const rest = item.substring(dashIdx + 1).trim();
            li.innerHTML = `<span class="week-num">${weekPart}</span><span class="week-content">${rest}</span>`;
          } else {
            li.innerHTML = `<span class="week-content">${item}</span>`;
          }
          halfDetailCurriculum.appendChild(li);
        });
      }

      // Re-trigger animation
      halfDetailBox.style.animation = "none";
      halfDetailBox.offsetHeight; // force reflow
      halfDetailBox.style.animation = "";

      // Update active states
      halfBtn1.classList.toggle("active", halfNum === 1);
      halfBtn2.classList.toggle("active", halfNum === 2);
    }

    if (halfBtn1) halfBtn1.addEventListener("click", () => renderHalf(1));
    if (halfBtn2) halfBtn2.addEventListener("click", () => renderHalf(2));

    document.querySelectorAll(".btn-details").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".course-card");
        if (!card) return;

        const title = card.dataset.title;
        const age = card.dataset.age;
        const image = card.dataset.image;
        const desc = card.dataset.desc;
        const curriculum = card.dataset.curriculum;
        const value = card.dataset.value;
        const hasHalves = card.dataset.hasHalves === "true";

        document.getElementById("modalImg").src = image;
        document.getElementById("modalImg").alt = title;
        document.querySelector(".course-modal-img").style.backgroundImage = `url('${image}')`;
        document.getElementById("modalAge").textContent = age;
        document.getElementById("modalTitle").textContent = title;
        document.getElementById("modalDesc").textContent = desc;

        const ul = document.getElementById("modalCurriculum");
        ul.innerHTML = "";
        if (curriculum) {
          curriculum.split("|").forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="curriculum-icon"></span><span class="curriculum-text">${item}</span>`;
            ul.appendChild(li);
          });
        }

        // Handle half-toggle for Arduino & Raspberry Pi
        if (hasHalves && halfToggleContainer) {
          currentCardData = {
            half1Title: card.dataset.half1Title,
            half1Desc: card.dataset.half1Desc,
            half1Curriculum: card.dataset.half1Curriculum,
            half2Title: card.dataset.half2Title,
            half2Desc: card.dataset.half2Desc,
            half2Curriculum: card.dataset.half2Curriculum,
          };
          halfToggleContainer.style.display = "block";
          renderHalf(1); // Show first half by default
        } else {
          halfToggleContainer.style.display = "none";
          currentCardData = null;
        }

        const applyBtn = document.getElementById("modalApplyBtn");
        if (applyBtn) {
          applyBtn.onclick = () => {
            courseModal.hidden = true;
            document.getElementById("kurs").value = value;
            document.getElementById("basvuru").scrollIntoView({ behavior: "smooth" });
          };
        }

        courseModal.hidden = false;
      });
    });
  }

  // ---------- Marquee & Lightbox ----------
  const marqueeTrack = document.querySelector(".marquee-track");
  if (marqueeTrack) {
    marqueeTrack.addEventListener("mouseenter", () => {
      marqueeTrack.getAnimations().forEach(anim => anim.playbackRate = 0.4);
    });
    marqueeTrack.addEventListener("mouseleave", () => {
      marqueeTrack.getAnimations().forEach(anim => anim.playbackRate = 1);
    });
  }

  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  
  if (lightboxModal && lightboxImg) {
    document.querySelectorAll(".marquee-track img").forEach(img => {
      img.addEventListener("click", () => {
        if (!img.src) return;
        lightboxImg.src = img.src;
        lightboxModal.style.backgroundImage = `url('${img.src}')`;
        lightboxModal.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });

    const closeLightbox = () => {
      lightboxModal.hidden = true;
      document.body.style.overflow = "";
    };

    lightboxClose.addEventListener("click", closeLightbox);
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightboxModal.hidden) closeLightbox();
    });
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
