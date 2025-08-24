/***** CONFIG *****/
const DATA_URL = "https://maycon9245.github.io/surebet-data/surebets.json";

// Habilite para usar dados fake quando o JSON vier vazio
const USE_DEMO_WHEN_EMPTY = true;

// Intervalo de atualização (ms)
const REFRESH_MS = 30000;

/***** LISTAS (Esportes & Casas) *****/
const SPORTS = [
  "Futebol", "Basquete", "Tênis", "Vôlei", "MLB", "NFL", "NBA", "Hóquei", "Fórmula 1", "MMA", "Tênis de Mesa"
];

const BOOKMAKERS = [
  "Betfair", "Pinnacle", "Bet365", "Betano", "1xBet", "PixBet", "Ivibet", "Bwin", "888sport", "KTO", "Parimatch"
];

// Mapa para abrir sites (botão Abrir Casas)
const BOOKMAKER_URL = {
  "Betfair": "https://www.betfair.com/sport",
  "Pinnacle": "https://www.pinnacle.com/pt/",
  "Bet365": "https://www.bet365.com/",
  "Betano": "https://www.betano.com/",
  "1xBet": "https://1xbet.com/",
  "PixBet": "https://www.pixbet.com/",
  "Ivibet": "https://ivibet.com/pt",
  "Bwin": "https://sports.bwin.com/pt-br/sports",
  "888sport": "https://www.888sport.com/",
  "KTO": "https://kto.com/br/",
  "Parimatch": "https://www.parimatch.com/"
};

/***** STATE *****/
const $tbody = document.getElementById("linhas");
const $loading = document.getElementById("loading");
const $empty = document.getElementById("empty");

const hiddenIds = new Set(JSON.parse(localStorage.getItem("hiddenIds") || "[]")); // lixeiras
const firstSeen = new Map();   // id -> timestamp (ms) quando apareceu
const baseline = new Map();    // id -> snapshot inicial (para detectar mudança de odds)

let lastRenderIds = new Set(); // ids na tela
let lastFetched = [];          // última lista bruta usada (após filtros)

/***** HELPERS *****/
function sanitize(str) { return (str || "").toString().trim(); }

function buildId(s) {
  // ID estável por evento + times + casas (sem odds)
  try {
    const a = s.outcomes?.[0] || {};
    const b = s.outcomes?.[1] || {};
    return [
      sanitize(s.sport), sanitize(s.event),
      sanitize(a.team), sanitize(a.bookmaker),
      sanitize(b.team), sanitize(b.bookmaker)
    ].join("|").toLowerCase();
  } catch { return Math.random().toString(36).slice(2); }
}

function profitClass(p) {
  if (p <= 2) return "low";
  if (p <= 5) return "mid";
  return "high";
}

function timeAgo(ms) {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return `há ${h} h`;
}

function parseStart(s) {
  if (s.start_time_utc) {
    const d = new Date(s.start_time_utc);
    if (!isNaN(d.getTime())) return d;
  }
  if (s.start_time_br && /^\d{2}:\d{2}$/.test(s.start_time_br)) {
    const [hh, mm] = s.start_time_br.split(":").map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  }
  return null;
}

function withinWindow(startDate, windowVal) {
  if (!startDate) return true;
  const now = new Date();
  const diff = (startDate - now);
  if (windowVal === "any") return true;
  if (windowVal === "12h") return diff >= 12 * 60 * 60 * 1000;
  if (windowVal === "1d")  return diff >= 24 * 60 * 60 * 1000;
  if (windowVal === "2d")  return diff >= 48 * 60 * 60 * 1000;
  if (windowVal === "7d")  return diff >= 168 * 60 * 60 * 1000;
  if (windowVal === "30d") return diff >= 720 * 60 * 60 * 1000;
  return true;
}

function oddsChanged(baselineItem, currentItem) {
  if (!baselineItem || !currentItem) return false;
  const a0 = baselineItem.outcomes?.[0]?.odd ?? null;
  const b0 = baselineItem.outcomes?.[1]?.odd ?? null;
  const a1 = currentItem.outcomes?.[0]?.odd ?? null;
  const b1 = currentItem.outcomes?.[1]?.odd ?? null;
  const p0 = baselineItem.profit ?? null;
  const p1 = currentItem.profit ?? null;

  const eps = 1e-6;
  const changed =
    (a0 == null || a1 == null ? false : Math.abs(Number(a0) - Number(a1)) > eps) ||
    (b0 == null || b1 == null ? false : Math.abs(Number(b0) - Number(b1)) > eps) ||
    (p0 == null || p1 == null ? false : Math.abs(Number(p0) - Number(p1)) > eps);

  return changed;
}

/***** DEMO DATA (opcional) *****/
const DEMO = {
  last_updated: new Date().toISOString(),
  count: 3,
  surebets: [
    {
      event: "Flamengo vs Palmeiras",
      sport: "Futebol",
      start_time_br: "21:00",
      profit: 3.2,
      outcomes: [
        { team: "Flamengo", odd: 2.10, bookmaker: "Betfair" },
        { team: "Palmeiras", odd: 2.05, bookmaker: "Pinnacle" }
      ]
    },
    {
      event: "Barcelona vs Real Madrid",
      sport: "Futebol",
      start_time_br: "18:45",
      profit: 4.1,
      outcomes: [
        { team: "Barcelona", odd: 1.95, bookmaker: "Betano" },
        { team: "Real Madrid", odd: 2.10, bookmaker: "Pinnacle" }
      ]
    },
    {
      event: "Corinthians vs São Paulo",
      sport: "Futebol",
      start_time_br: "20:30",
      profit: 5.6,
      outcomes: [
        { team: "Corinthians", odd: 1.85, bookmaker: "Bet365" },
        { team: "São Paulo", odd: 2.20, bookmaker: "Betano" }
      ]
    }
  ]
};

/***** RENDER *****/
function render(rows) {
  $tbody.innerHTML = "";
  lastRenderIds = new Set();

  rows.forEach((s) => {
    const id = buildId(s);
    if (hiddenIds.has(id)) return;

    if (!firstSeen.has(id)) firstSeen.set(id, Date.now());
    if (!baseline.has(id)) baseline.set(id, JSON.parse(JSON.stringify(s)));

    if (oddsChanged(baseline.get(id), s)) {
      return;
    }

    lastRenderIds.add(id);

    const o1 = s.outcomes?.[0] || {};
    const o2 = s.outcomes?.[1] || {};

    const profit = Number(s.profit || 0);
    const pClass = `profit ${profitClass(profit)}`;

    const sinceMs = firstSeen.get(id) || Date.now();
    const sinceText = timeAgo(sinceMs);

    const tr = document.createElement("tr");
    tr.dataset.id = id;

    tr.innerHTML = `
      <td>${sanitize(s.event)}</td>
      <td>${sanitize(o1.team)}</td>
      <td class="odd">${o1.odd ?? ""}</td>
      <td>${sanitize(o1.bookmaker)}</td>
      <td>${sanitize(o2.team)}</td>
      <td class="odd">${o2.odd ?? ""}</td>
      <td>${sanitize(o2.bookmaker)}</td>
      <td class="${pClass}">${profit}%</td>
      <td><span class="badge-time" data-time="${sinceMs}">${sinceText}</span></td>
      <td>
        <div class="actions">
          <button class="action-btn" data-act="open">Abrir Casas</button>
          <button class="trash-btn" data-act="trash">🗑️</button>
        </div>
      </td>
    `;

    $tbody.appendChild(tr);
  });

  $empty.style.display = rows.length === 0 || lastRenderIds.size === 0 ? "block" : "none";
}

/***** BUSCA & FILTROS *****/
function getSelectedValues($select) {
  return Array.from($select.options).filter(o => o.selected).map(o => o.value);
}

function applyFilters(list) {
  const q = (document.getElementById("buscar").value || "").toLowerCase();
  const sportsSel = getSelectedValues(document.getElementById("sports"));
  const bookiesSel = getSelectedValues(document.getElementById("bookmakers"));
  const pMin = parseFloat(document.getElementById("profitMin").value);
  const pMax = parseFloat(document.getElementById("profitMax").value);
  const timeWin = document.getElementById("timeFilter").value;

  return list.filter(s => {
    if (q) {
      const hay = [s.event, s.sport, s.outcomes?.[0]?.team, s.outcomes?.[1]?.team, s.outcomes?.[0]?.bookmaker, s.outcomes?.[1]?.bookmaker]
        .map(x => (x || "").toString().toLowerCase()).join(" ");
      if (!hay.includes(q)) return false;
    }

    if (sportsSel.length > 0 && !sportsSel.includes(s.sport)) return false;

    if (bookiesSel.length > 0) {
      const b1 = s.outcomes?.[0]?.bookmaker, b2 = s.outcomes?.[1]?.bookmaker;
      if (!(bookiesSel.includes(b1) || bookiesSel.includes(b2))) return false;
    }

    const p = Number(s.profit || 0);
    if (!isNaN(pMin) && s.profit != null && p < pMin) return false;
    if (!isNaN(pMax) && s.profit != null && p > pMax) return false;

    const start = parseStart(s);
    if (!withinWindow(start, timeWin)) return false;

    return true;
  });
}

/***** FETCH *****/
async function fetchData() {
  $loading.style.display = "block";
  try {
    const resp = await fetch(DATA_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("Falha ao carregar o JSON");
    const data = await resp.json();

    let list = Array.isArray(data?.surebets) ? data.surebets : [];

    if (list.length === 0 && USE_DEMO_WHEN_EMPTY) {
      list = DEMO.surebets;
    }

    const fetchedById = new Map(list.map(s => [buildId(s), s]));

    for (const id of Array.from(firstSeen.keys())) {
      if (!fetchedById.has(id)) {
        firstSeen.delete(id);
        baseline.delete(id);
      }
    }

    lastFetched = list;
    const filtered = applyFilters(list);
    render(filtered);
  } catch (e) {
    console.error(e);
    $tbody.innerHTML = "";
    $empty.style.display = "block";
  } finally {
    $loading.style.display = "none";
  }
}

/***** EVENTOS UI *****/
// Popular selects
(function initSelects() {
  const $sports = document.getElementById("sports");
  const $bookies = document.getElementById("bookmakers");

  SPORTS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s; opt.textContent = s;
    $sports.appendChild(opt);
  });

  BOOKMAKERS.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    $bookies.appendChild(opt);
  });
})();

// Filtros reagem
["buscar","profitMin","profitMax"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => render(applyFilters(lastFetched)));
});
["timeFilter"].forEach(id => {
  document.getElementById(id).addEventListener("change", () => render(applyFilters(lastFetched)));
});

// Botão atualizar
document.getElementById("btnAtualizar").addEventListener("click", fetchData);

// Ações por linha
$tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = e.target.closest("tr");
  const id = tr?.dataset?.id;
  if (!id) return;

  const act = btn.dataset.act;
  const item = lastFetched.find(s => buildId(s) === id);
  if (!item) return;

  if (act === "trash") {
    hiddenIds.add(id);
    localStorage.setItem("hiddenIds", JSON.stringify(Array.from(hiddenIds)));
    tr.remove();
    if ($tbody.children.length === 0) $empty.style.display = "block";
    return;
  }

  if (act === "open") {
    const b1 = item.outcomes?.[0]?.bookmaker, b2 = item.outcomes?.[1]?.bookmaker;
    const u1 = BOOKMAKER_URL[b1] || null;
    const u2 = BOOKMAKER_URL[b2] || null;
    if (u1) window.open(u1, "_blank");
    if (u2) window.open(u2, "_blank");
  }
});

// Atualiza “há X minutos” a cada 5s
setInterval(() => {
  document.querySelectorAll(".badge-time").forEach(el => {
    const t = Number(el.getAttribute("data-time"));
    if (!isNaN(t)) el.textContent = timeAgo(t);
  });
}, 5000);

// Atualização automática
setInterval(fetchData, REFRESH_MS);

// Primeira carga
fetchData();
