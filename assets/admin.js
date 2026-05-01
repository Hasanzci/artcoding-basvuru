/* ====== ArtCoding • Yonetici paneli (v2 — token tabanli) ====== */
(function () {
  "use strict";

  var cfg = window.ARTCODING_CONFIG || {};
  var TOKEN_KEY = "artcoding_admin_token";

  function api(action, payload) {
    if (!cfg.APPS_SCRIPT_URL || cfg.APPS_SCRIPT_URL.indexOf("BURAYA") >= 0) {
      return Promise.reject(new Error("APPS_SCRIPT_URL ayarli degil"));
    }
    var body = Object.assign({ action: action }, payload || {});
    return fetch(cfg.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) throw new Error("Sunucu yanit vermedi (" + res.status + ")");
      return res.json();
    });
  }

  function getToken() {
    try {
      var t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
      if (!t || !t.token || t.expires < Date.now()) return null;
      return t.token;
    } catch (e) { return null; }
  }
  function setToken(token, expires) {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: token, expires: expires }));
  }
  function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

  var loginForm = document.getElementById("loginForm");
  var loginScreen = document.getElementById("loginScreen");
  var dashboard = document.getElementById("dashboard");
  var loginError = document.getElementById("loginError");

  function showDashboard() {
    loginScreen.style.display = "none";
    dashboard.hidden = false;
    loadApplications();
  }
  function showLogin() {
    loginScreen.style.display = "";
    dashboard.hidden = true;
  }

  if (getToken()) showDashboard();

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var u = document.getElementById("loginUser").value.trim();
    var p = document.getElementById("loginPass").value;
    if (!u || !p) { loginError.textContent = "Kullanici adi ve sifre gerekli."; return; }
    var btn = loginForm.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Dogrulaniyor...";
    api("login", { username: u, password: p }).then(function (data) {
      if (data.ok && data.token) {
        setToken(data.token, data.expires);
        showDashboard();
      } else {
        loginError.textContent = data.error || "Giris basarisiz.";
      }
    }).catch(function (err) {
      console.error(err);
      loginError.textContent = "Sunucuya ulasilamadi: " + err.message;
    }).finally(function () {
      btn.disabled = false; btn.textContent = "Giris Yap";
    });
  });

  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", function () {
    clearToken(); location.reload();
  });

  var allApps = [];

  function loadApplications() {
    var container = document.getElementById("tableContainer");
    container.innerHTML = '<div class="empty-state"><img src="assets/maskot.svg" alt=""><p>Basvurular yukleniyor...</p></div>';
    var token = getToken();
    if (!token) { showLogin(); return; }
    api("list", { token: token }).then(function (data) {
      if (!data.ok) {
        if (/yetkisiz|suresi/i.test(data.error || "")) {
          clearToken(); showLogin(); return;
        }
        throw new Error(data.error || "Bilinmeyen hata");
      }
      allApps = data.applications || [];
      renderAll();
    }).catch(function (err) {
      console.error(err);
      container.innerHTML = '<div class="empty-state"><img src="assets/maskot.svg" alt=""><h3>Veriler yuklenemedi</h3><p>' + escapeHtml(err.message) + '</p></div>';
    });
  }

  document.getElementById("refreshBtn").addEventListener("click", loadApplications);

  var searchBox = document.getElementById("searchBox");
  var kursFilter = document.getElementById("kursFilter");
  var trialFilter = document.getElementById("trialFilter");
  searchBox.addEventListener("input", renderAll);
  kursFilter.addEventListener("change", renderAll);
  trialFilter.addEventListener("change", renderAll);

  function renderAll() {
    document.getElementById("statTotal").textContent = allApps.length;
    document.getElementById("statTrial").textContent = allApps.filter(function (a) { return a.denemeDersi === "Evet"; }).length;
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById("statToday").textContent = allApps.filter(function (a) { return (a.tarih || "").slice(0, 10) === today; }).length;

    var counts = {};
    allApps.forEach(function (a) { if (a.kurs) counts[a.kurs] = (counts[a.kurs] || 0) + 1; });
    var top = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; })[0];
    document.getElementById("statTopCourse").textContent = top ? top[0].split(" ")[0] : "-";

    var courses = Array.from(new Set(allApps.map(function (a) { return a.kurs; }).filter(Boolean)));
    var currentValue = kursFilter.value;
    kursFilter.innerHTML = '<option value="">Tum kurslar</option>' + courses.map(function (c) {
      return '<option value="' + escapeHtml(c) + '"' + (c === currentValue ? ' selected' : '') + '>' + escapeHtml(c) + '</option>';
    }).join("");

    var q = searchBox.value.trim().toLowerCase();
    var fk = kursFilter.value;
    var ft = trialFilter.value;
    var filtered = allApps.filter(function (a) {
      if (fk && a.kurs !== fk) return false;
      if (ft && a.denemeDersi !== ft) return false;
      if (q) {
        var blob = (a.ogrenciAd + " " + a.veliAd + " " + a.email + " " + a.telefon).toLowerCase();
        if (blob.indexOf(q) < 0) return false;
      }
      return true;
    });

    document.getElementById("countLabel").textContent = filtered.length + " / " + allApps.length + " basvuru";
    renderTable(filtered);
  }

  function renderTable(rows) {
    var container = document.getElementById("tableContainer");
    if (rows.length === 0) {
      container.innerHTML = '<div class="empty-state"><img src="assets/maskot.svg" alt=""><h3>Henuz basvuru yok</h3></div>';
      return;
    }
    var html = '<div class="table-wrap"><table class="applications"><thead><tr><th>Tarih</th><th>Ogrenci</th><th>Yas</th><th>Veli</th><th>Iletisim</th><th>Kurs</th><th>Deneme</th><th></th></tr></thead><tbody>';
    rows.forEach(function (a, i) {
      html += '<tr>';
      html += '<td>' + formatDate(a.tarih) + '</td>';
      html += '<td><strong>' + escapeHtml(a.ogrenciAd || "-") + '</strong></td>';
      html += '<td>' + escapeHtml(String(a.ogrenciYas || "")) + '</td>';
      html += '<td>' + escapeHtml(a.veliAd || "-") + '<br><small style="color:#5A4F6E;">' + escapeHtml(a.yakinlik || "") + '</small></td>';
      html += '<td><a href="tel:' + escapeHtml(a.telefon || "") + '">' + escapeHtml(a.telefon || "-") + '</a><br><a href="mailto:' + escapeHtml(a.email || "") + '" style="font-size:0.85rem;">' + escapeHtml(a.email || "") + '</a></td>';
      html += '<td><span class="tag">' + escapeHtml(a.kurs || "-") + '</span></td>';
      html += '<td>' + (a.denemeDersi === "Evet" ? '<span class="tag tag-yes">Evet</span>' : '<span class="tag tag-no">Hayir</span>') + '</td>';
      html += '<td><button class="row-action" data-idx="' + i + '">Detay</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
    container.querySelectorAll(".row-action").forEach(function (btn) {
      btn.addEventListener("click", function () { showDetail(rows[+btn.dataset.idx]); });
    });
  }

  var detailModal = document.getElementById("detailModal");
  document.getElementById("detailClose").addEventListener("click", function () { detailModal.hidden = true; });
  detailModal.addEventListener("click", function (e) { if (e.target === detailModal) detailModal.hidden = true; });

  function showDetail(a) {
    document.getElementById("detailTitle").textContent = a.ogrenciAd + " - " + a.kurs;
    var body = '<table style="width:100%;border-collapse:collapse;">';
    body += row("Basvuru tarihi", formatDate(a.tarih, true));
    body += row("Ogrenci", escapeHtml(a.ogrenciAd) + " (" + escapeHtml(String(a.ogrenciYas)) + " yas)");
    body += row("Veli", escapeHtml(a.veliAd) + " (" + escapeHtml(a.yakinlik) + ")");
    body += row("Telefon", '<a href="tel:' + escapeHtml(a.telefon) + '">' + escapeHtml(a.telefon) + '</a>');
    body += row("E-posta", '<a href="mailto:' + escapeHtml(a.email) + '">' + escapeHtml(a.email) + '</a>');
    body += row("Kurs", escapeHtml(a.kurs));
    body += row("Mevcut seviye", escapeHtml(a.seviye));
    body += row("Tercih edilen zaman", escapeHtml(a.zaman));
    body += row("Bizi nereden duydu", escapeHtml(a.kaynak));
    body += row("Deneme dersi", a.denemeDersi === "Evet" ? '<span class="tag tag-yes">Evet</span>' : '<span class="tag tag-no">Hayir</span>');
    body += row("E-bulten", escapeHtml(a.bulten));
    body += row("KVKK", escapeHtml(a.kvkk));
    body += '</table><h4 style="margin-top:18px;">Beklentiler</h4><p>' + escapeHtml(a.beklenti || "-") + '</p>';
    body += '<h4>Cocuk hakkinda not</h4><p>' + escapeHtml(a.cocukNot || "-") + '</p>';
    body += '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">';
    body += '<a href="tel:' + escapeHtml(a.telefon) + '" class="btn btn-primary">Ara</a>';
    body += '<a href="mailto:' + escapeHtml(a.email) + '" class="btn btn-ghost">E-posta</a>';
    body += '<a href="https://wa.me/9' + (a.telefon || "").replace(/\D/g, '') + '" target="_blank" class="btn btn-ghost">WhatsApp</a>';
    body += '</div>';
    document.getElementById("detailBody").innerHTML = body;
    detailModal.hidden = false;
  }

  function row(k, v) {
    return '<tr><td style="padding:6px 10px;color:#5A4F6E;width:40%;font-size:0.88rem;">' + k + '</td><td style="padding:6px 10px;font-weight:500;">' + (v || "-") + '</td></tr>';
  }

  document.getElementById("exportBtn").addEventListener("click", function () {
    if (!allApps.length) { alert("Henuz basvuru yok."); return; }
    var headers = ["Tarih","Ogrenci","Yas","Veli","Yakinlik","Telefon","E-posta","Kurs","Seviye","Beklenti","Cocuk Notu","Zaman","Kaynak","Deneme","Bulten","KVKK"];
    var keys = ["tarih","ogrenciAd","ogrenciYas","veliAd","yakinlik","telefon","email","kurs","seviye","beklenti","cocukNot","zaman","kaynak","denemeDersi","bulten","kvkk"];
    var lines = [headers.join(",")];
    allApps.forEach(function (a) {
      lines.push(keys.map(function (k) { return csvEsc(a[k]); }).join(","));
    });
    var csv = lines.join("\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "artcoding-basvurular-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
  });

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }
  function csvEsc(s) {
    if (s === null || s === undefined) return "";
    var v = String(s).replace(/"/g, '""');
    return /[",\n]/.test(v) ? '"' + v + '"' : v;
  }
  function formatDate(iso, full) {
    if (!iso) return "-";
    try {
      var d = new Date(iso);
      var pad = function (n) { return String(n).padStart(2, "0"); };
      var date = pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
      if (!full) return date;
      return date + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    } catch (e) { return iso; }
  }
})();
