/** CONFIG **/
const DATA_URL = "https://maycon9245.github.io/surebet-data/surebets.json";

// Habilite para usar dados fake quando o JSON vier vazio
const USE_DEMO_WHEN_EMPTY = true;

// Intervalo de atualização (ms)
const REFRESH_MS = 30000;

/** LISTAS **/
const SPORTS = [
  "Artes marciais","Badminton","Bandy","Basquete","Basquete 3x3","Basquete 4x4","Beisebal","Beisebol finlandês",
  "Boliche","Cricket","Críquete","Dardos","Esportes virtuais","Basquete (SRL)","Cricket (SRL)","Futebol (SRL)",
  "Tênis (SRL)","Floorball","Futebol","Futebol 3x3","Futebol 4x4","Futebol 5x5","Futebol Gaélico","Futebol americano",
  "Futebol australiano","Futebol de praia","Futebol de salão","Golfe","Handebol","Handebol de praia","Hurling",
  "Hóquei","Hóquei 3x3","Hóquei de ar","Hóquei de ar 2x2","Hóquei em campo","Lacrosse","Netbol","O que Onde Quando",
  "Pólo aquático","Rugby","Short hockey","Sinuca","Tênis","Tênis de mesa","Voleibol","Voleibol de praia","Xadrez",
  "eSport","Arena of Valor","Call of Duty","Counter-Strike","Deadlock","Dota","E-Basquete","E-Futebol","E-Hóquei",
  "E-Tênis","E-Voleibol","Famosas em dispositivos móveis","King of Glory","League of Legends","NBA2K","Overwatch",
  "Rainbow","Rocket League","StarCraft","Valorant","Warcraft"
];

const BOOKMAKERS = [
  "Betfair","Pinnacle","Betano","Bet365","1xBet","PixBet","KTO","Sportingbet","Betway","Betpix365","LeoVegas",
  "Bodog","Parimatch","Betsson","22Bet","Galera.Bet","Esportes da Sorte","Rivalo","EstrelaBet","Casa de Apostas",
  "MrJack.bet","Viebett","F12.bet","Betcris","BetWarrior","BetNational","BetMais","Marathonbet","Blaze","Ivibet","Bwin","888sport"
];

// Mapa para abrir sites
const BOOKMAKER_URL = {
  "Betfair": "https://www.betfair.com/sport",
  "Pinnacle": "https://www.pinnacle.com/pt/",
  "Betano": "https://www.betano.com/",
  "Bet365": "https://www.bet365.com/",
  "1xBet": "https://1xbet.com/",
  "PixBet": "https://www.pixbet.com/",
  "KTO": "https://kto.com/br/",
  "Sportingbet": "https://sports.sportingbet.com/pt-br/sports",
  "Betway": "https://betway.com/pt",
  "Betpix365": "https://betpix365.com/",
  "LeoVegas": "https://www.leovegas.com/pt-br",
  "Bodog": "https://www.bodog.com/br",
  "Parimatch": "https://www.parimatch.com/",
  "Betsson": "https://www.betsson.com/br",
  "22Bet": "https://22bet.com/",
  "Galera.Bet": "https://www.galera.bet/",
  "Esportes da Sorte": "https://www.esportesdasorte.com/",
  "Rivalo": "https://www.rivalo.com/",
  "EstrelaBet": "https://www.estrelabet.com/",
  "Casa de Apostas": "https://casadeapostas.com/",
  "MrJack.bet": "https://mrjack.bet/",
  "Viebett": "https://viebett.com/",
  "F12.bet": "https://f12.bet/",
  "Betcris": "https://www.betcris.com/br",
  "BetWarrior": "https://betwarrior.bet/",
  "BetNational": "https://www.betnacional.com/",
  "BetMais": "https://www.betmais.com/",
  "Marathonbet": "https://www.marathonbet.com/",
  "Blaze": "https://blaze.com/",
  "Ivibet": "https://ivibet.com/pt",
  "Bwin": "https://sports.bwin.com/pt-br/sports",
  "888sport": "https://www.888sport.com/"
};

/** STATE **/
const $tbody = document.getElementById("linhas");
const $loading = document.getElementById("loading");
const $empty = document.getElementById("empty");

const hiddenIds = new Set(JSON.parse(localStorage.getItem("hiddenIds") || "[]"));
const firstSeen = new Map();
const baseline = new Map();
let lastRenderIds = new Set();
let lastFetched = [];

/** HELPERS **/
function sanitize(str) { return (str || "").toString().trim(); }

function buildId(s) {
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
  if (windowVal === "10m") return diff >= 10 * 60 * 1000;
  if (windowVal === "2h")  return diff >= 2 * 60 * 60 * 1000;
  if (windowVal === "12h") return diff >= 12 * 60 * 60 * 1000;
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

/** DEMO DATA **/
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

/** RENDER **/
function render(rows) {
  $tbody.innerHTML = "";
  lastRenderIds = new Set();

  rows.forEach((s) => {
    const id = buildId(s);
    if (hiddenIds.has(id)) return;

    if (!firstSeen.has(id)) firstSeen.set(id, Date.now());
    if (!baseline.has(id)) baseline.set(id, JSON.parse(JSON.stringify(s)));

    if (oddsChanged(baseline.get(id), s)) return;

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
      <td>${sanitize(s.sport)}</td>
      <td>${sanitize(s.start_time_br || "")}</td>
      <td>${sanitize(o1.team)}</td>
      <td class="${pClass}">${o1.odd ?? ""}</td>
      <td>${sanitize(o1.bookmaker)}</td>
      <td>${sanitize(o2.team)}</td>
      <td class="${pClass}">${o2.odd ?? ""}</td>
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

/** CRIAR CHECKBOXES **/
function createCheckboxes(items, containerId, selectedStorageKey) {
  const container = document.getElementById(containerId);
  const selected = JSON.parse(localStorage.getItem(selectedStorageKey) || "[]");

  items.forEach(name => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = name;
    input.checked = selected.includes(name);
    input.addEventListener("change", () => {
      const current = JSON.parse(localStorage.getItem(selectedStorageKey) || "[]");
      if (input.checked) {
        if (!current.includes(name)) current.push(name);
      } else {
        const idx = current.indexOf(name);
        if (idx > -1) current.splice(idx, 1);
      }
      localStorage.setItem(selectedStorageKey, JSON.stringify(current));
      render(applyFilters(lastFetched));
    });
    label.appendChild(input);
    label.appendChild(document.createTextNode(name));
    container.appendChild(label);
  });
}

// Inicializa checkboxes
createCheckboxes(SPORTS, "sports-list", "selectedSports");
createCheckboxes(BOOKMAKERS, "bookmakers-list", "selectedBookmakers");

/** FILTROS **/
function applyFilters(list) {
  const q = (document.getElementById("buscar").value || "").toLowerCase();
  const selectedSports = JSON.parse(localStorage.getItem("selectedSports") || "[]");
  const selectedBookmakers = JSON.parse(localStorage.getItem("selectedBookmakers") || "[]");
  const pMin = parseFloat(document.getElementById("profitMin").value) || 0;
  const pMax = parseFloat(document.getElementById("profitMax").value) || Infinity;
  const timeWin = document.getElementById("timeWindow").value;

  return list.filter(s => {
    if (q) {
      const hay = [s.event, s.sport, s.outcomes?.[0]?.team, s.outcomes?.[1]?.team, s.outcomes?.[0]?.bookmaker, s.outcomes?.[1]?.bookmaker]
        .map(x => (x || "").toString().toLowerCase()).join(" ");
      if (!hay.includes(q)) return false;
    }

    if (selectedSports.length > 0 && !selectedSports.includes(s.sport)) return false;

    if (selectedBookmakers.length > 0) {
      const b1 = s.outcomes?.[0]?.bookmaker, b2 = s.outcomes?.[1]?.bookmaker;
      if (!(selectedBookmakers.includes(b1) || selectedBookmakers.includes(b2))) return false;
    }

    const p = Number(s.profit || 0);
    if (p < pMin) return false;
    if (p > pMax) return false;

    const start = parseStart(s);
    if (!withinWindow(start, timeWin)) return false;

    return true;
  });
}

/** FETCH **/
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

/** BOTÃO RETRÁTIL **/
document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const target = document.getElementById(targetId);
    const isExpanded = target.style.display !== "none";

    if (isExpanded) {
      target.style.display = "none";
      btn.textContent = "▶️ Mostrar";
      btn.classList.remove("expanded");
      btn.classList.add("collapsed");
    } else {
      target.style.display = "block";
      btn.textContent = "🔽 Esconder";
      btn.classList.remove("collapsed");
      btn.classList.add("expanded");
    }
  });
});

/** FILTROS REAGEM **/
["buscar", "profitMin", "profitMax", "timeWindow"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => render(applyFilters(lastFetched)));
});

// Botões de ação
document.getElementById("sportsSelectAll").addEventListener("click", () => {
  document.querySelectorAll('#sports-list input[type="checkbox"]').forEach(cb => cb.checked = true);
  localStorage.setItem("selectedSports", JSON.stringify(SPORTS));
  render(applyFilters(lastFetched));
});

document.getElementById("sportsClear").addEventListener("click", () => {
  document.querySelectorAll('#sports-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  localStorage.setItem("selectedSports", JSON.stringify([]));
  render(applyFilters(lastFetched));
});

document.getElementById("bookiesSelectAll").addEventListener("click", () => {
  document.querySelectorAll('#bookmakers-list input[type="checkbox"]').forEach(cb => cb.checked = true);
  localStorage.setItem("selectedBookmakers", JSON.stringify(BOOKMAKERS));
  render(applyFilters(lastFetched));
});

document.getElementById("bookiesClear").addEventListener("click", () => {
  document.querySelectorAll('#bookmakers-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  localStorage.setItem("selectedBookmakers", JSON.stringify([]));
  render(applyFilters(lastFetched));
});

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
