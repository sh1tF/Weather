const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const dateInput = document.getElementById("dateInput");
const modeSelect = document.getElementById("modeSelect");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const cityNameEl = document.getElementById("cityName");
const descEl = document.getElementById("desc");
const tempEl = document.getElementById("temp");
const metaEl = document.getElementById("meta");
const accentPicker = document.getElementById("accentPicker");
const themeSelect = document.getElementById("themeSelect");
const settingsMenu = document.getElementById("settingsMenu");
const skyIconEl = document.getElementById("skyIcon");
const skyTextEl = document.getElementById("skyText");

let lastLocation = null;

function setTodayDefault() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setError(text) {
  errorEl.textContent = text || "";
}

function shadeColor(color, percent) {
  const f = parseInt(color.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  const nr = Math.round((t - R) * p) + R;
  const ng = Math.round((t - G) * p) + G;
  const nb = Math.round((t - B) * p) + B;
  return "#" + ((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1);
}

function getThemeBase() {
  return document.documentElement.classList.contains("dark") ? "#12151c" : "#f4f6fb";
}

function applyAccent(color) {
  const root = document.documentElement;

  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-2", shadeColor(color, -12));

  root.style.setProperty("--bg", `color-mix(in srgb, ${color} 10%, ${getThemeBase()} 90%)`);
  root.style.setProperty("--bg-2", `color-mix(in srgb, ${color} 6%, ${getThemeBase()} 94%)`);
  root.style.setProperty("--surface", `color-mix(in srgb, ${color} 8%, ${getThemeBase()} 92%)`);
  root.style.setProperty("--surface-2", `color-mix(in srgb, ${color} 12%, ${getThemeBase()} 88%)`);
  root.style.setProperty("--surface-3", `color-mix(in srgb, ${color} 16%, ${getThemeBase()} 84%)`);

  localStorage.setItem("accent", color);
}

function applyTheme(mode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (mode === "auto") {
    const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(preferDark ? "dark" : "light");
  } else {
    root.classList.add(mode);
  }

  localStorage.setItem("theme", mode);

  const savedAccent = localStorage.getItem("accent") || accentPicker.value;
  applyAccent(savedAccent);
}

function weatherCodeToInfo(code) {
  if (code === 0) return { text: "ясно" };
  if (code === 1 || code === 2 || code === 3) return { text: "облачно" };
  if (code >= 45 && code <= 48) return { text: "туман" };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { text: "дождь" };
  if (code >= 71 && code <= 77) return { text: "снег" };
  if (code >= 95 && code <= 99) return { text: "гроза" };
  return { text: "переменная облачность" };
}

function skyForCode(code) {
  if (code === 0) {
    return {
      text: "Ясно",
      svg: `
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="11" fill="currentColor"/>
          <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M 32 6 v 8"/>
            <path d="M 32 50 v 8"/>
            <path d="M 6 32 h 8"/>
            <path d="M 50 32 h 8"/>
            <path d="M 14.5 14.5 l 5.6 5.6"/>
            <path d="M 43.9 4.9 l 5.6 5.6"/>
            <path d="M 49.5 14.5 l -5.6 5.6"/>
            <path d="M 19.6 43.9 l -5.6 5.6"/>
          </g>
        </svg>
      `
    };
  }

  if (code === 1 || code === 2) {
    return {
      text: "Солнце и лёгкие облака",
      svg: `
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="23" cy="23" r="9" fill="currentColor"/>
          <g fill="currentColor" opacity="0.95">
            <path d="M 40 46 a 11 11 0 0 0 -2 -23 c -1.4 0 -2.8 0.3 -4 0.8 A 14 14 0 0 0 9 28 a 9 9 0 0 0 1 18 h 30 z"/>
          </g>
        </svg>
      `
    };
  }

  if (code === 3 || (code >= 45 && code <= 48)) {
    return {
      text: "Облачно",
      svg: `
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <g fill="currentColor">
            <path d="M 18 44 a 10 10 0 0 1 1 -20 a 13 13 0 0 1 25 4 a 9 9 0 0 1 0 18 H 44 z"/>
          </g>
        </svg>
      `
    };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      text: "Солнце за облаками и дождь",
      svg: `
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="22" cy="22" r="8" fill="currentColor"/>
          <g fill="currentColor">
            <path d="M 40 44 a 11 11 0 0 0 0 -22 c -1.4 0 -2.7 0.3 -3.9 0.8 A 14 14 0 0 0 9 26 a 9 9 0 0 0 1 18 h 30 z"/>
            <path d="M24 46c0 3-2 5-2 5s-2-2-2-5a2 2 0 0 1 4 0z"/>
            <path d="M34 46c0 3-2 5-2 5s-2-2-2-5a2 2 0 0 1 4 0z"/>
          </g>
        </svg>
      `
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      text: "Облачно со снегом",
      svg: `
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <g fill="currentColor">
            <path d="M 18 40 a 10 10 0 0 1 1 -20 a 13 13 0 0 1 25 4 a 9 9 0 0 1 0 18 H 44 z"/>
            <circle cx="24" cy="50" r="2"/>
            <circle cx="32" cy="50" r="2"/>
            <circle cx="40" cy="50" r="2"/>
          </g>
        </svg>
      `
    };
  }

  if (code >= 95 && code <= 99) {
    return {
      text: "Гроза",
      svg: `
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <g fill="currentColor">
            <path d="M 18 40 a 10 10 0 0 1 1 -20 a 13 13 0 0 1 25 4 a 9 9 0 0 1 0 18 H 44 z"/>
            <path d="M 33 42 L 33 42 h 5 L 29 58 L 32 45 L 27 45 L 36 30 L 33 42"/>
          </g>
        </svg>
      `
    };
  }

  return {
    text: "Переменная облачность",
    svg: `
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="22" cy="22" r="8" fill="currentColor"/>
        <g fill="currentColor">
          <path d="M 40 44 a 11 11 0 0 0 0 -22 c -1.4 0 -2.7 0.3 -3.9 0.8 A 14 14 0 0 0 9 26 a 9 9 0 0 0 1 18 h 0 z"/>
        </g>
      </svg>
    `
  };
}

function renderWeather(title, temp, desc, meta) {
  cityNameEl.textContent = title;
  tempEl.textContent = temp;
  descEl.textContent = desc;
  metaEl.textContent = meta;
}

function updateSky(code) {
  const sky = skyForCode(code);
  skyIconEl.innerHTML = sky.svg;
  skyTextEl.textContent = sky.text;
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Geocoding HTTP ${r.status}`);
  const data = await r.json();
  if (!data.results || !data.results.length) return null;
  return data.results[0];
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const data = await r.json();
  return data.results && data.results[0] ? data.results[0] : null;
}

function validDateOrToday() {
  if (dateInput.value && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) return dateInput.value;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isPastDate(dateStr) {
  const selected = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today;
}

function buildWeatherUrl(lat, lon) {
  const date = validDateOrToday();

  if (modeSelect.value === "daily") {
    const base = isPastDate(date)
      ? "https://archive-api.open-meteo.com/v1/archive"
      : "https://api.open-meteo.com/v1/forecast";

    return `${base}?latitude=${lat}&longitude=${lon}&timezone=auto&daily=temperature_2m_max,temperature_2m_min,weather_code&start_date=${date}&end_date=${date}`;
  }

  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&current=temperature_2m,weather_code`;
}

async function loadWeather(lat, lon, label) {
  setError("");
  setStatus("Загружаю погоду...");
  lastLocation = { lat, lon, label };

  const url = buildWeatherUrl(lat, lon);
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Weather HTTP ${r.status}${text ? `: ${text.slice(0, 120)}` : ""}`);
  }

  const data = await r.json();

  if (modeSelect.value === "daily") {
    const code = data.daily?.weather_code?.[0];
    const minT = Math.round(data.daily?.temperature_2m_min?.[0]);
    const maxT = Math.round(data.daily?.temperature_2m_max?.[0]);
    const date = data.daily?.time?.[0] || validDateOrToday();
    const info = weatherCodeToInfo(code);
    renderWeather(label, `${minT}°C / ${maxT}°C`, `${info.text} на ${date}`, `Код погоды: ${code}`);
    updateSky(code);
  } else {
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const info = weatherCodeToInfo(code);
    renderWeather(label, `${temp}°C`, `Погода: ${info.text}`, `Код погоды: ${code}`);
    updateSky(code);
  }

  setStatus("Готово.");
}

async function searchCity() {
  const city = cityInput.value.trim();
  if (!city) {
    setError("Введите название города.");
    return;
  }

  try {
    const place = await geocodeCity(city);
    if (!place) {
      setError("Город не найден.");
      return;
    }
    const label = `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;
    await loadWeather(place.latitude, place.longitude, label);
  } catch (e) {
    setError(`Ошибка поиска города: ${e.message}`);
  }
}

function getLocation() {
  setError("");
  setStatus("Определяю местоположение...");

  if (!navigator.geolocation) {
    setError("Браузер не поддерживает геолокацию.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        const label = place
          ? `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`
          : `Широта: ${latitude.toFixed(3)}, Долгота: ${longitude.toFixed(3)}`;

        await loadWeather(latitude, longitude, label);
      } catch (e) {
        setError(`Ошибка геолокации: ${e.message}`);
      }
    },
    (err) => {
      if (err.code === 1) {
        setError("Доступ к геолокации запрещён.");
      } else if (err.code === 2) {
        setError("Не удалось определить местоположение.");
      } else if (err.code === 3) {
        setError("Геолокация не успела определиться. Попробуй ещё раз или введи город вручную.");
      } else {
        setError(`Геолокация недоступна: ${err.message}`);
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 300000
    }
  );
}

function reloadLast() {
  if (!lastLocation) return;
  loadWeather(lastLocation.lat, lastLocation.lon, lastLocation.label).catch(e => setError(e.message));
}

function closeMenuOnOutsideClick(e) {
  if (!settingsMenu.open) return;
  if (!settingsMenu.contains(e.target)) settingsMenu.open = false;
}

searchBtn.addEventListener("click", searchCity);
geoBtn.addEventListener("click", getLocation);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchCity();
});

modeSelect.addEventListener("change", reloadLast);
dateInput.addEventListener("change", reloadLast);

accentPicker.addEventListener("input", (e) => applyAccent(e.target.value));
themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));

document.addEventListener("click", closeMenuOnOutsideClick);

const savedAccent = localStorage.getItem("accent");
const savedTheme = localStorage.getItem("theme") || "auto";
if (savedAccent) accentPicker.value = savedAccent;
themeSelect.value = savedTheme;
applyTheme(savedTheme);
applyAccent(accentPicker.value);

setTodayDefault();
setStatus("Введите город или нажмите геолокацию.");
updateSky(0);
