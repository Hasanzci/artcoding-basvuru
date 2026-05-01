/* ====== ArtCoding • Yönetici paneli ====== */
(function () {
  "use strict";

  const cfg = window.ARTCODING_CONFIG || {};
  const SESSION_KEY = "artcoding_admin_session";

  // ---------- SHA-256 yardımcısı ----------
  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // ---------- Login ----------
  const loginForm = document.getElementById("loginForm");
  const loginScreen = document.getElementById("loginScreen");
  const dashboard = document.getElementById("dashboard");
  const loginError = document.getElementById("loginError");

  function showDashboard() {
    loginScreen.style.display = "none";
    dashboard.hidden = false;
    loadApplications();
  }

  function isLoggedIn() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return session && session.expires > Date.now();
    } catch { return false; }
  }

  if (isLoggedIn()) showDashboard();

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    loginError.textContent = "";
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;
    const hash = await sha256(p);

    if (u === cfg.ADMIN_USERNAME && hash === cfg.ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        expires: Date.now() + 8 * 60 * 60 * 1000  // 8 saat
      }));
      showDashboard();
    } else {
      loginError.textContent = "Kullanıcı adı veya şifre hatalı.";
    }
  });

  document.getElementById("logoutBtn") && document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  // ---------- Veriyi çekme ----------
  let allApps = [];

  async function loadApplications() {
    const container = document.getElementById("tableContainer");
    container.innerHTML = `<div class="empty-state"><img src="assets/maskot.svg" alt=""><p>Başvurular yükleniyor...</p></div>`;

    if (!cfg.APPS_SCRIPT_URL || cfg.APPS_SCRIPT_URL.includes("BURAYA")) {
      container.innerHTML = `<div class="empty-state">
        <img src="assets/maskot.svg" alt="">
        <h3>Yapılandırma eksik</h3>
        <p>Lütfen <code>assets/config.js</code> dosyasındaki <strong>APPS_SCRIPT_URL</strong> ve <strong>ADMIN_API_KEY</strong> değerlerini doldurun.</p>
      </div>`;
      return;
    }

    try {
      const url = `${cfg.APPS_SCRIPT_URL}?action=list&key=${encodeURIComponent(cfg.ADMIN_API_KEY)}`;
      const res = await fetch(url, { method: "GET" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Bilinmeyen hata");
      allApps = data.applications || [];
      renderAll();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="empty-state">
        <img src="assets/maskot.svg" alt="">
        <h3>Veriler yüklenemedi</h3>
        <p>${err.message}</p>
        <p style="font-size:0.85rem;">Apps Script URL'inizin doğru olduğundan ve "Anyone" erişimine açıldığından emin olun.</p>
      </div>`;
    }
  }

  document.getElementById("refreshBtn").addEventListener("click", loadApplications);

  // ---------- Filtreleme + render ----------
  const searchBox = document.getElementById("searchBox");
  const kursFilter = document.getElementById("kursFilter");
  const trialFilter = document.getElementById("trialFilter");
  searchBox.addEventListener("input", renderAll);
  kursFilter.addEventListener("change", renderAll);
  trialFilter.addEventListener("change", renderAll);

  function renderAll() {
    // Stats
    document.getElementById("statTotal").textContent = allApps.length;
    document.getElementById("statTrial").textContent =
      allApps.filter(a => a.denemeDersi === "Evet").length;
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("statToday").textContent =
      allApps.filter(a => (a.tarih || "").slice(0, 10) === today).length;

    // Top course
    const counts = {};
    allApps.forEach(a => { if (a.kurs) counts[a.kurs] = (counts[a.kurs] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("statTopCourse").textContent = top ? top[0].split(" ")[0] : "—";

    // Filter dropdown
    const courses = [...new Set(allApps.map(a => a.kurs).filter(Boolean))];
    const currentValue = kursFilter.value;
    kursFilter.innerHTML = '<option value="">Tüm kurslar</option>' +
      courses.map(c => `<option value="${escapeHtml(c)}"${c === currentValue ? " selected" : ""}>${escapeHtml(c)}</option>`).join("");

    // Filter
    const q = searchBox.value.trim().toLowerCase();
    const fk = kursFilter.value;
    const ft = trialFilter.value;
    const filtered = allApps.filter(a => {
      if (fk && a.kurs !== fk) return false;
      if (ft && a.denemeDersi !== ft) return false;
      if (q) {
        const blob = `${a.ogrenciAd} ${a.veliAd} ${a.email} ${a.telefon}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    document.getElementById("countLabel").textContent =
      `${filtered.length} / ${allApps.length} başvuru`;

    renderTable(filtered);
  }

  function renderTable(rows) {
    const container = document.getElementById("tableContainer");
    if (rows.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <img src="assets/maskot.svg" alt="">
        <h3>Henüz başvuru yok</h3>
        <p>Filtre ölçütlerinize uyan başvuru bulunamadı.</p>
      </div>`;
      return;
    }

    container.innerHTML = `<div class="table-wrap"><table class="applications">
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Öğrenci</th>
          <th>Yaş</th>
          <th>Veli</th>
          <th>İletişim</th>
          <th>Kurs</th>
          <th>Deneme</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((a, i) => `
          <tr>
            <td>${formatDate(a.tarih)}</td>
            <td><strong>${escapeHtml(a.ogrenciAd || "—")}</strong></td>
            <td>${escapeHtml(String(a.ogrenciYas || ""))}</td>
            <td>${escapeHtml(a.veliAd || "—")}<br><small style="color:#5A4F6E;">${escapeHtml(a.yakinlik || "")}</small></td>
            <td>
              <a href="tel:${escapeHtml(a.telefon || "")}">${escapeHtml(a.telefon || "—")}</a><br>
              <a href="mailto:${escapeHtml(a.email || "")}" style="font-size:0.85rem;">${escapeHtml(a.email || "")}</a>
            </td>
            <td><span class="tag">${escapeHtml(a.kurs || "—")}</span></td>
            <td>${a.denemeDersi === "Evet"
              ? '<span class="tag tag-yes">Evet</span>'
              : '<span class="tag tag-no">Hayır</span>'}</td>
            <td><button class="row-action" data-idx="${i}" title="Detay">👁</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table></div>`;

    container.querySelectorAll(".row-action").forEach(btn =>
      btn.addEventListener("click", () => showDetail(rows[+btn.dataset.idx]))
    );
  }

  // ---------- Detay modal ----------
  const detailModal = document.getElementById("detailModal");
  document.getElementById("detailClose").addEventListener("click", () => detailModal.hidden = true);
  detailModal.addEventListener("click", e => { if (e.target === detailModal) detailModal.hidden = true; });

  function showDetail(a) {
    document.getElementById("detailTitle").textContent =
      `${a.ogrenciAd} • ${a.kurs}`;
    document.getElementById("detailBody").innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
        ${row("Başvuru tarihi", formatDate(a.tarih, true))}
        ${row("Öğrenci", `${escapeHtml(a.ogrenciAd)} (${escapeHtml(String(a.ogrenciYas))} yaş)`)}
        ${row("Veli", `${escapeHtml(a.veliAd)} (${escapeHtml(a.yakinlik)})`)}
        ${row("Telefon", `<a href="tel:${escapeHtml(a.telefon)}">${escapeHtml(a.telefon)}</a>`)}
        ${row("E-posta", `<a href="mailto:${escapeHtml(a.email)}">${escapeHtml(a.email)}</a>`)}
        ${row("Kurs", escapeHtml(a.kurs))}
        ${row("Mevcut seviye", escapeHtml(a.seviye))}
        ${row("Tercih edilen zaman", escapeHtml(a.zaman))}
        ${row("Bizi nereden duydu", escapeHtml(a.kaynak))}
        ${row("Deneme dersi", a.denemeDersi === "Evet"
          ? '<span class="tag tag-yes">Evet</span>'
          : '<span class="tag tag-no">Hayır</span>')}
        ${row("E-bülten", escapeHtml(a.bulten))}
        ${row("KVKK", escapeHtml(a.kvkk))}
      </table>
      <h4 style="margin-top:18px;">Beklentiler</h4>
      <p>${escapeHtml(a.beklenti || "—")}</p>
      <h4>Çocuk hakkında not</h4>
      <p>${escapeHtml(a.cocukNot || "—")}</p>
      <div style="margin-top:20px; display:flex; gap:10px; flex-wrap: wrap;">
        <a href="tel:${escapeHtml(a.telefon)}" class="btn btn-primary">📞 Ara</a>
        <a href="mailto:${escapeHtml(a.email)}?subject=ArtCoding%20Ba%C5%9Fvurunuz%20Hakk%C4%B1nda" class="btn btn-ghost">✉ E-posta</a>
        <a href="https://wa.me/9${(a.telefon || "").replace(/\D/g,'')}" target="_blank" class="btn btn-ghost">💬 WhatsApp</a>
      </div>
    `;
    detailModal.hidden = false;
  }

  function row(k, v) {
    return `<tr>
      <td style="padding:6px 10px; color:#5A4F6E; width:40%; font-size:0.88rem;">${k}</td>
      <td style="padding:6px 10px; font-weight:500;">${v || "—"}</td>
    </tr>`;
  }

  // ---------- CSV indir ----------
  document.getElementById("exportBtn").addEventListener("click", () => {
    if (!allApps.length) { alert("Henüz başvuru yok."); return; }
    const headers = ["Tarih","Öğrenci","Yaş","Veli","Yakınlık","Telefon","E-posta","Kurs","Seviye","Beklenti","Çocuk Notu","Zaman","Kaynak","Deneme","Bülten","KVKK"];
    const keys = ["tarih","ogrenciAd","ogrenciYas","veliAd","yakinlik","telefon","email","kurs","seviye","beklenti","cocukNot","zaman","kaynak","denemeDersi","bulten","kvkk"];
    const csv = [headers.join(",")].concat(
      allApps.map(a => keys.map(k => csvEsc(a[k])).join(","))
    ).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `artcoding-basvurular-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  });

  // ---------- Yardımcılar ----------
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }
  function csvEsc(s) {
    if (s === null || s === undefined) return "";
    const v = String(s).replace(/"/g, '""');
    return /[",\n]/.test(v) ? `"${v}"` : v;
  }
  function formatDate(iso, full = false) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const pad = n => String(n).padStart(2, "0");
      const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
      if (!full) return date;
      return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return iso; }
  }
})();
