/* ====== ArtCoding • Arayüz iyileştirmeleri (v3) ======
   Sadece görsel/etkileşim katmanı. Form gönderimi ve başvuru
   mantığı assets/script.js içinde, ona dokunulmaz. */
(function () {
  "use strict";

  // Header gölgesi
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Hafif YouTube gömme: tıklanınca iframe yüklenir
  document.querySelectorAll(".video-embed[data-yt]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-yt");
      if (!/^[\w-]{6,20}$/.test(id)) return;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = btn.getAttribute("aria-label") || "YouTube videosu";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      btn.innerHTML = "";
      btn.appendChild(iframe);
      btn.style.cursor = "default";
    }, { once: true });
  });

  // Mobil sabit başvuru çubuğu
  var mobileCta = document.getElementById("mobileCta");
  var hero = document.getElementById("hero");
  var formSection = document.getElementById("basvuru");
  var footer = document.querySelector(".site-footer");
  if (mobileCta && hero && formSection && "IntersectionObserver" in window) {
    var state = { heroVisible: true, formVisible: false, footerVisible: false };
    var update = function () {
      mobileCta.classList.toggle("show", !state.heroVisible && !state.formVisible && !state.footerVisible);
    };
    var watch = function (el, key) {
      new IntersectionObserver(function (entries) {
        state[key] = entries[0].isIntersecting;
        update();
      }, { threshold: 0.05 }).observe(el);
    };
    watch(hero, "heroVisible");
    watch(formSection, "formVisible");
    if (footer) watch(footer, "footerVisible");
  }

  // Modal açıkken arka plan kaymasın + ESC ile kapansın
  var modals = document.querySelectorAll(".modal");
  var syncScrollLock = function () {
    var anyOpen = Array.prototype.some.call(modals, function (m) { return !m.hidden; });
    document.documentElement.style.overflow = anyOpen ? "hidden" : "";
    var cm = document.getElementById("courseModal");
    if (cm && cm.hidden) document.body.classList.remove("hacker-mode");
  };
  if ("MutationObserver" in window) {
    modals.forEach(function (m) {
      new MutationObserver(syncScrollLock).observe(m, { attributes: true, attributeFilter: ["hidden"] });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var course = document.getElementById("courseModal");
    var kvkk = document.getElementById("kvkkModal");
    if (course && !course.hidden) {
      var c = document.getElementById("courseClose");
      if (c) c.click();
    }
    if (kvkk && !kvkk.hidden) kvkk.hidden = true;
  });

})();
