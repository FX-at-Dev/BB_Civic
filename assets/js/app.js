/* ---------- BACKEND API BASE URL ---------- */
const API_BASE = "http://localhost:5000/api";

/* ---------- HELPER FUNCTION ---------- */
async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (err) {
    console.error("API error:", err);
    alert("❌ " + err.message);
  }
}

/* ---------- FILE TO BASE64 ---------- */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- MAP INITIALIZER (Leaflet) ---------- */
function initPickerMap(containerId, onPick) {
  if (typeof L === "undefined") return;

  const map = L.map(containerId).setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  let marker;
  const setMarker = (latlng) => {
    if (marker) marker.remove();
    marker = L.marker(latlng).addTo(map);
    onPick(latlng);
  };

  map.on("click", (e) => setMarker(e.latlng));

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        map.setView([latitude, longitude], 13);
        setMarker({ lat: latitude, lng: longitude });
      },
      () => {}
    );
  }

  return map;
}

/* ---------- UPLOAD PAGE ---------- */
function initUploadPage() {
  const form = document.getElementById("report-form");
  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");

  initPickerMap("map", (ll) => {
    latInput.value = ll.lat.toFixed(6);
    lngInput.value = ll.lng.toFixed(6);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const email = form.email.value.trim();
    const severity = form.severity.value;
    const file = form.photo.files[0];
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    if (!title || !description || !email || !file || isNaN(lat) || isNaN(lng)) {
      alert("⚠️ Please fill all fields and pick a map location.");
      return;
    }

    const img = await fileToDataURL(file);

    const data = await apiRequest(`${API_BASE}/reports`, {
      method: "POST",
      body: JSON.stringify({ title, description, email, severity, img, lat, lng }),
    });

    if (data?.message) {
      alert("✅ Report submitted!");
      window.location.href = "gallery.html";
    }
  });
}

/* ---------- GALLERY PAGE ---------- */
async function initGalleryPage() {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "Loading...";

  const reports = await apiRequest(`${API_BASE}/reports`);
  grid.innerHTML = "";

  if (!reports?.length) {
    grid.innerHTML = `<div class="alert">No reports yet. <a href="upload.html">Upload one</a>!</div>`;
    return;
  }

  reports.forEach((r) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <img src="${r.img}" alt="${r.title}"/>
      <div class="meta">
        <div>
          <div style="font-weight:700">${r.title}</div>
          <small class="muted">${new Date(r.createdAt).toLocaleString()}</small>
        </div>
        <span class="tag">${r.severity}</span>
      </div>
    `;
    grid.appendChild(item);
  });
}

/* ---------- LEADERBOARD PAGE ---------- */
async function initLeaderboardPage() {
  const tbody = document.getElementById("lb-body");
  tbody.innerHTML = "Loading...";

  const rows = await apiRequest(`${API_BASE}/reports/leaderboard`);
  tbody.innerHTML = "";

  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="3">No data yet.</td></tr>`;
    return;
  }

  let rank = 1;
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>#${rank++}</td>
        <td>${r.email}</td>
        <td>${r.count}</td>
      </tr>`
    )
    .join("");
}

/* ---------- KPIs (Dashboard) ---------- */
async function renderKpis() {
  const stats = await apiRequest(`${API_BASE}/reports/kpis`);
  if (!stats) return;

  const setText = (id, value) => (document.getElementById(id).textContent = value);
  setText("k-total", stats.total);
  setText("k-open", stats.open);
  setText("k-severe", stats.severe);
  setText("k-users", stats.users);
}

/* ---------- NAVBAR TOGGLE ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  navToggle?.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    document.body.classList.toggle("menu-open", navLinks.classList.contains("open"));
  });

  document.addEventListener("click", (e) => {
    if (navLinks?.classList.contains("open") && !navLinks.contains(e.target) && e.target !== navToggle) {
      navLinks.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
  });
});

/* ---------- EXPORT GLOBAL ---------- */
window.IP = {
  initUploadPage,
  initGalleryPage,
  initLeaderboardPage,
  renderKpis,
};

/* ---------- HELPER FUNCTION ---------- */
async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (err) {
    console.error("API error:", err);
    alert("❌ " + err.message);
  }
}

/* ---------- FILE TO BASE64 ---------- */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- MAP INITIALIZER (Leaflet) ---------- */
function initPickerMap(containerId, onPick) {
  if (typeof L === "undefined") return;

  const map = L.map(containerId).setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  let marker;
  const setMarker = (latlng) => {
    if (marker) marker.remove();
    marker = L.marker(latlng).addTo(map);
    onPick(latlng);
  };

  map.on("click", (e) => setMarker(e.latlng));

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        map.setView([latitude, longitude], 13);
        setMarker({ lat: latitude, lng: longitude });
      },
      () => {}
    );
  }

  return map;
}

/* ---------- UPLOAD PAGE ---------- */
function initUploadPage() {
  const form = document.getElementById("report-form");
  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");

  initPickerMap("map", (ll) => {
    latInput.value = ll.lat.toFixed(6);
    lngInput.value = ll.lng.toFixed(6);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const email = form.email.value.trim();
    const severity = form.severity.value;
    const file = form.photo.files[0];
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    if (!title || !description || !email || !file || isNaN(lat) || isNaN(lng)) {
      alert("⚠️ Please fill all fields and pick a map location.");
      return;
    }

    const img = await fileToDataURL(file);

    const data = await apiRequest(`${API_BASE}/reports`, {
      method: "POST",
      body: JSON.stringify({ title, description, email, severity, img, lat, lng }),
    });

    if (data?.message) {
      alert("✅ Report submitted!");
      window.location.href = "gallery.html";
    }
  });
}

/* ---------- GALLERY PAGE ---------- */
async function initGalleryPage() {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "Loading...";

  const reports = await apiRequest(`${API_BASE}/reports`);
  grid.innerHTML = "";

  if (!reports?.length) {
    grid.innerHTML = `<div class="alert">No reports yet. <a href="upload.html">Upload one</a>!</div>`;
    return;
  }

  reports.forEach((r) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <img src="${r.img}" alt="${r.title}"/>
      <div class="meta">
        <div>
          <div style="font-weight:700">${r.title}</div>
          <small class="muted">${new Date(r.createdAt).toLocaleString()}</small>
        </div>
        <span class="tag">${r.severity}</span>
      </div>
    `;
    grid.appendChild(item);
  });
}

/* ---------- LEADERBOARD PAGE ---------- */
async function initLeaderboardPage() {
  const tbody = document.getElementById("lb-body");
  tbody.innerHTML = "Loading...";

  const rows = await apiRequest(`${API_BASE}/reports/leaderboard`);
  tbody.innerHTML = "";

  if (!rows?.length) {
    tbody.innerHTML = `<tr><td colspan="3">No data yet.</td></tr>`;
    return;
  }

  let rank = 1;
  tbody.innerHTML = rows
    .map(
      (r) => `<tr>
        <td>#${rank++}</td>
        <td>${r.email}</td>
        <td>${r.count}</td>
      </tr>`
    )
    .join("");
}

/* ---------- KPIs (Dashboard) ---------- */
async function renderKpis() {
  const stats = await apiRequest(`${API_BASE}/reports/kpis`);
  if (!stats) return;

  const setText = (id, value) => (document.getElementById(id).textContent = value);
  setText("k-total", stats.total);
  setText("k-open", stats.open);
  setText("k-severe", stats.severe);
  setText("k-users", stats.users);
}

/* ---------- NAVBAR TOGGLE ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  navToggle?.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    document.body.classList.toggle("menu-open", navLinks.classList.contains("open"));
  });

  document.addEventListener("click", (e) => {
    if (navLinks?.classList.contains("open") && !navLinks.contains(e.target) && e.target !== navToggle) {
      navLinks.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
  });
});

/* ---------- EXPORT GLOBAL ---------- */
window.IP = {
  initUploadPage,
  initGalleryPage,
  initLeaderboardPage,
  renderKpis,
};
