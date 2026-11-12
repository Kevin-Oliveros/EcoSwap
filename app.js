/* =====================================================================
   ECO SWAP · Plataforma funcional de economía circular para RAEE
   Equipo: Alejandro Muñoz, Kevin Oliveros, Daniela Cubides, Samuel Ladino
   Conectada a Supabase (PostgreSQL + Auth + Realtime) y PWA instalable.
   ===================================================================== */
'use strict';

const DB_KEY = 'ecoswap_db_v4';
const SESSION_KEY = 'ecoswap_session_v4';
const GEMINI_KEY_STORAGE = 'ecoswap_gemini_key';
const SYS = 'u0'; // usuario "Eco Swap" (sistema / Eco-Hubs)

const SUPABASE_URL = 'https://zsjjgomptpomxzljntcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzampnb21wdHBvbXh6bGpudGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MzU1OTksImV4cCI6MjExMDAxMTU5OX0.KnSXnw_Tl31G4g71QZaK1uyB1j1_Sv5hVoaaJS7szqQ';
const sb = (typeof window !== 'undefined' && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/* ---------------------------- CATÁLOGOS ---------------------------- */
const CATS = {
  laptop:      { n: 'Portátil',               base: 600, kg: 2.2,  icon: 'fa-laptop',               pcb: 1, data: 1 },
  pc:          { n: 'Torre / PC escritorio',  base: 500, kg: 8,    icon: 'fa-desktop',              pcb: 1, data: 1 },
  monitor:     { n: 'Monitor',                base: 300, kg: 4,    icon: 'fa-tv' },
  celular:     { n: 'Celular',                base: 350, kg: 0.2,  icon: 'fa-mobile-screen',        pcb: 1, data: 1 },
  tablet:      { n: 'Tablet',                 base: 300, kg: 0.5,  icon: 'fa-tablet-screen-button', pcb: 1, data: 1 },
  ram:         { n: 'Memoria RAM',            base: 150, kg: 0.05, icon: 'fa-memory',               pcb: 1 },
  disco:       { n: 'Disco duro / SSD',       base: 200, kg: 0.4,  icon: 'fa-hard-drive',           pcb: 1, data: 1 },
  placa:       { n: 'Tarjeta madre / PCB',    base: 180, kg: 0.8,  icon: 'fa-microchip',            pcb: 1 },
  fuente:      { n: 'Fuente de poder',        base: 120, kg: 1.5,  icon: 'fa-plug',                 pcb: 1 },
  perifericos: { n: 'Teclado / Mouse',        base: 60,  kg: 0.6,  icon: 'fa-keyboard' },
  cables:      { n: 'Cables / Cargadores',    base: 30,  kg: 0.3,  icon: 'fa-plug-circle-bolt' },
  bateria:     { n: 'Batería',                base: 0,   kg: 0.3,  icon: 'fa-car-battery',          toxic: 1 },
  toner:       { n: 'Tóner / Cartucho',       base: 0,   kg: 0.5,  icon: 'fa-print',                toxic: 1 }
};
const CONDS = {
  funcional: { n: 'Funcional',            f: 1,    c: 'emerald' },
  reparable: { n: 'Reparable (daño menor)', f: 0.55, c: 'amber' },
  danado:    { n: 'Dañado / chatarra',     f: 0.2,  c: 'rose' }
};
const DESTS = {
  trueque:     { n: 'Reacondicionamiento y trueque', c: 'emerald', icon: 'fa-arrows-rotate', co2: 30 },
  mineria:     { n: 'Minería urbana (oro, cobre, paladio)', c: 'amber', icon: 'fa-gem', co2: 4 },
  downcycling: { n: 'Downcycling (madera plástica)', c: 'sky', icon: 'fa-recycle', co2: 1.5 },
  toxico:      { n: 'Gestión de tóxicos (aliado certificado)', c: 'rose', icon: 'fa-biohazard', co2: 0.5 }
};
const ROLES = {
  familia:    { n: 'Familia / Hogar',          icon: 'fa-house-user',         c: 'bg-emerald-500' },
  tecnico:    { n: 'Técnico / Taller',         icon: 'fa-screwdriver-wrench', c: 'bg-sky-600' },
  estudiante: { n: 'Estudiante de ingeniería', icon: 'fa-user-graduate',      c: 'bg-violet-600' },
  reciclador: { n: 'Reciclador (última milla)', icon: 'fa-truck-ramp-box',    c: 'bg-amber-500' },
  operador:   { n: 'Operador Eco-Hub',         icon: 'fa-warehouse',          c: 'bg-slate-700' },
  sistema:    { n: 'Eco Swap',                 icon: 'fa-recycle',            c: 'bg-emerald-700' }
};
const LOCALIDADES = {
  'Usaquén': [4.6950, -74.0310], 'Chapinero': [4.6486, -74.0628], 'Teusaquillo': [4.6400, -74.0800],
  'Suba': [4.7410, -74.0840], 'Engativá': [4.7070, -74.1130], 'Fontibón': [4.6780, -74.1440],
  'Kennedy': [4.6280, -74.1550], 'Bosa': [4.6180, -74.1900], 'Puente Aranda': [4.6150, -74.1100],
  'Barrios Unidos': [4.6680, -74.0750]
};
const HUBS = [
  { id: 'h1', n: 'Eco-Hub C.C. Andino',             lat: 4.6668, lng: -74.0530 },
  { id: 'h2', n: 'Eco-Hub C.C. Titán Plaza',        lat: 4.6946, lng: -74.0863 },
  { id: 'h3', n: 'Eco-Hub C.C. Gran Estación',      lat: 4.6476, lng: -74.1015 },
  { id: 'h4', n: 'Eco-Hub C.C. Plaza de las Américas', lat: 4.6186, lng: -74.1356 },
  { id: 'h5', n: 'Eco-Hub C.C. Santafé',            lat: 4.7626, lng: -74.0459 }
];
const PARTS = [
  { id: 'bisagra',   n: 'Bisagra de portátil',          cost: 40, icon: 'fa-laptop' },
  { id: 'carcasa',   n: 'Carcasa de mouse',             cost: 35, icon: 'fa-computer-mouse' },
  { id: 'tapa',      n: 'Tapa de batería (control/celular)', cost: 20, icon: 'fa-mobile' },
  { id: 'engranaje', n: 'Engranaje de impresora',        cost: 25, icon: 'fa-gear' },
  { id: 'soporte',   n: 'Soporte para disco 2.5"',       cost: 30, icon: 'fa-hard-drive' },
  { id: 'teclas',    n: 'Juego de teclas de repuesto',   cost: 30, icon: 'fa-keyboard' }
];
const ORDER_STEPS = [
  ['pendiente', 'Solicitado', 'fa-clipboard-list'],
  ['asignado', 'Reciclador asignado', 'fa-user-check'],
  ['en_camino', 'En camino', 'fa-truck-fast'],
  ['en_hub', 'En Eco-Hub', 'fa-warehouse'],
  ['diagnosticado', 'Diagnosticado', 'fa-circle-check']
];

/* ------------------------------ ESTADO ----------------------------- */
let db = null, session = null, view = 'inicio', charts = [], leafMap = null, draft = null;
let authMode = 'login', authLoading = false, syncStatus = 'connecting', deferredInstallPrompt = null, realtimeChannel = null;
const ui = { market: { q: '', cat: '', cond: '', hideMine: false }, route: null, routeHub: null };

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = $('#pwa-install-btn');
    if (btn) btn.classList.remove('hidden');
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

async function installPWA() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') { deferredInstallPrompt = null; toast('¡Instalando Eco Swap en tu dispositivo!', 'ok'); }
  } else {
    openModal(`<h2 class="text-xl font-bold mb-2"><i class="fa-solid fa-mobile-screen-button text-emerald-600 mr-2"></i>Instalar App Eco Swap</h2>
      <p class="text-sm text-slate-600 mb-3">Puedes instalar Eco Swap en tu celular o computador como una aplicación nativa:</p>
      <ul class="text-sm text-slate-600 space-y-2 mb-4">
        <li><b>📱 Android (Chrome):</b> Toca el menú <b>⋮</b> (arriba a la derecha) y selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.</li>
        <li><b>🍎 iPhone / iPad (Safari):</b> Toca el botón <b>Compartir</b> <i class="fa-solid fa-arrow-up-from-bracket"></i> y elige <b>"Agregar a inicio"</b>.</li>
        <li><b>💻 PC (Chrome / Edge):</b> Haz clic en el ícono de instalar <i class="fa-solid fa-download"></i> en la barra de direcciones.</li>
      </ul>
      <button onclick="closeModal()" class="btn btn-primary w-full">Entendido</button>`);
  }
}

/* ----------------------------- UTILIDADES -------------------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n || 0).toLocaleString('es-CO');
const fmt1 = n => (n || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 });
const fdate = ts => new Date(ts).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const user = id => db.users.find(u => u.id === id) || { id: id || 'u0', name: 'Usuario EcoSwap', role: 'estudiante', loc: 'Chapinero', coins: 0, interests: [] };
const item = id => db.items.find(i => i.id === id);
const hub = id => HUBS.find(h => h.id === id) || HUBS[0];
const me = () => (session && db && db.users) ? db.users.find(u => u.id === session) : null;
const nid = p => p + (++db.seq);
const coin = n => `<span class="font-bold text-emerald-700 whitespace-nowrap">🪙 ${fmt(n)}</span>`;

let saveTimer = null;
function save() {
  if (!db) return;
  db.updatedAt = Date.now();
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
  if (!sb) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const { data: s } = await sb.auth.getSession();
      if (!s || !s.session) return;
      const { error } = await sb.from('ecoswap_state').upsert({ id: 'main', data: db, updated_at: new Date().toISOString() });
      if (!error) setSyncBadge('online');
    } catch (e) {}
  }, 120);
}

function setSyncBadge(st) {
  syncStatus = st;
  const el = $('#sync-badge');
  if (!el) return;
  if (st === 'online') {
    el.className = 'hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>En vivo · Nube';
  } else {
    el.className = 'hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200';
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span>Sincronizando…';
  }
}
function hav(a, b) { // km (haversine × 1.3 factor vial urbano)
  const R = 6371, r = x => x * Math.PI / 180;
  const dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.3;
}
function nearestHub(lat, lng) { return HUBS.slice().sort((a, b) => hav({ lat, lng }, a) - hav({ lat, lng }, b))[0]; }
function defaultHub(u) { if (u.hub) return u.hub; const l = LOCALIDADES[u.loc] || LOCALIDADES.Chapinero; return nearestHub(l[0], l[1]).id; }

function addTx(from, to, amount, concept) {
  amount = Math.round(amount);
  if (amount <= 0) return;
  if (from) user(from).coins -= amount;
  if (to) user(to).coins += amount;
  db.txs.unshift({ id: nid('t'), from, to, amount, concept, date: Date.now() });
}
function notify(uid, text, icon = 'fa-bell') {
  if (!uid || uid === SYS) return;
  db.notifs.unshift({ id: nid('n'), user: uid, text, icon, date: Date.now(), read: false });
}

/* ---------------------- MOTOR DE VALORACIÓN (IA) -------------------- */
function valorar(d) {
  const c = CATS[d.cat];
  const yNow = new Date().getFullYear();
  const years = Math.max(0, yNow - (parseInt(d.year) || yNow));
  const age = Math.max(0.25, 1 - 0.08 * years);
  const cond = CONDS[d.cond] ? CONDS[d.cond].f : 1;
  const toxic = !!(c.toxic || d.hinchada);
  let value = Math.round(c.base * cond * age);
  let dest;
  if (toxic) { dest = 'toxico'; value = 0; }
  else if (d.cond !== 'danado') dest = 'trueque';
  else if (c.pcb) dest = 'mineria';
  else dest = 'downcycling';
  return { value, dest, kg: c.kg, toxic, age, years, condF: cond, base: c.base, confidence: 86 + Math.floor(Math.random() * 12) };
}
function rewardFor(dest, value, kg) {
  if (dest === 'trueque') return Math.round(value * 0.7);
  if (dest === 'mineria') return Math.round(kg * 60) + 10;
  if (dest === 'downcycling') return Math.round(kg * 20) + 5;
  return 30; // bono por disposición responsable de tóxicos
}

/* ------------------------ ALGORITMO MATCHMAKING --------------------- */
function sugerencias(u, limit = 4) {
  const mine = db.items.filter(i => i.owner === u.id && i.status === 'mercado');
  const others = db.items.filter(i => i.owner !== u.id && i.status === 'mercado');
  const out = [];
  mine.forEach(a => others.forEach(b => {
    const mx = Math.max(a.value, b.value) || 1;
    const sim = 1 - Math.abs(a.value - b.value) / mx;
    if (sim < 0.45) return;
    const ob = user(b.owner);
    let score = sim * 55;
    if ((u.interests || []).includes(b.cat)) score += 25;
    if ((ob.interests || []).includes(a.cat)) score += 15;
    if (ob.loc === u.loc) score += 5;
    out.push({ give: a, get: b, score: Math.min(99, Math.round(score)), diff: b.value - a.value });
  }));
  return out
    .filter(s => !db.offers.some(o => o.status === 'pendiente' && o.give === s.give.id && o.get === s.get.id))
    .sort((x, y) => y.score - x.score).slice(0, limit);
}
function recomendados(u, limit = 4) {
  return db.items.filter(i => i.status === 'mercado' && i.owner !== u.id && (u.interests || []).includes(i.cat))
    .sort((a, b) => a.value - b.value).slice(0, limit);
}

/* ------------------------------ SEMILLA ----------------------------- */
function seed(persist = true) {
  const now = Date.now(), D = 86400000;
  db = {
    seq: 1000, items: [], orders: [], offers: [], txs: [], certs: [], prints: [], notifs: [], quiz: {},
    users: [
      { id: 'u0', name: 'Eco Swap', role: 'sistema', loc: 'Chapinero', coins: 100000, interests: [] },
      { id: 'u1', name: 'Familia Gómez', role: 'familia', loc: 'Usaquén', coins: 300, interests: ['celular', 'tablet', 'perifericos', 'monitor'] },
      { id: 'u2', name: 'Taller Don Jorge', role: 'tecnico', loc: 'Kennedy', coins: 800, interests: ['placa', 'fuente', 'disco', 'ram', 'laptop'] },
      { id: 'u3', name: 'Kevin Oliveros', role: 'estudiante', loc: 'Teusaquillo', coins: 450, interests: ['ram', 'disco', 'placa', 'fuente'] },
      { id: 'u6', name: 'Alejandro Muñoz', role: 'estudiante', loc: 'Suba', coins: 380, interests: ['laptop', 'monitor', 'ram'] },
      { id: 'u7', name: 'Daniela Cubides', role: 'estudiante', loc: 'Engativá', coins: 520, interests: ['celular', 'tablet', 'placa'] },
      { id: 'u8', name: 'Samuel Ladino', role: 'estudiante', loc: 'Fontibón', coins: 410, interests: ['perifericos', 'monitor', 'disco'] },
      { id: 'u4', name: 'Pedro Ramírez', role: 'reciclador', loc: 'Engativá', coins: 120, interests: [] },
      { id: 'u5', name: 'Operador Hub Andino', role: 'operador', loc: 'Chapinero', coins: 0, interests: [], hub: 'h1' }
    ]
  };
  const mk = (owner, cat, title, brand, year, cond, status, extra = {}) => {
    const v = valorar({ cat, year, cond, hinchada: extra.hinchada });
    const it = Object.assign({
      id: nid('i'), owner, donor: owner, cat, title, brand, year, cond, desc: '', photo: null,
      value: v.value, dest: v.dest, kg: CATS[cat].kg, hasData: !!CATS[cat].data, status,
      created: now - Math.random() * 12 * D
    }, extra);
    db.items.push(it); return it;
  };
  mk('u2', 'ram', 'Memoria RAM 8GB DDR4', 'Kingston', 2021, 'funcional', 'mercado', { desc: 'Probada con MemTest, sin errores.' });
  mk('u2', 'fuente', 'Fuente de poder 500W', 'Corsair', 2018, 'reparable', 'mercado', { desc: 'Ventilador ruidoso, funciona.' });
  mk('u1', 'laptop', 'Portátil Lenovo IdeaPad (falla pantalla)', 'Lenovo', 2017, 'reparable', 'mercado', { desc: 'Enciende, la pantalla parpadea. Disco ya borrado.' });
  mk('u3', 'disco', 'SSD 240GB SATA', 'Kingston', 2020, 'funcional', 'mercado', { desc: 'Borrado seguro certificado.' });
  mk(SYS, 'monitor', 'Monitor 22" (reacondicionado)', 'Samsung', 2019, 'funcional', 'mercado', { desc: 'Reacondicionado en Eco-Hub Andino.', donor: 'u1' });
  mk(SYS, 'placa', 'Tarjeta madre H110 para prácticas', 'Gigabyte', 2017, 'reparable', 'mercado', { desc: 'Ideal para laboratorio de hardware.' });
  mk('u6', 'celular', 'Moto G7 con pantalla rota', 'Motorola', 2020, 'reparable', 'mercado', { desc: 'Placa funcional, cambiar display.' });
  mk('u8', 'perifericos', 'Combo teclado + mouse USB', 'Genius', 2019, 'funcional', 'mercado');
  mk('u7', 'tablet', 'Tablet Galaxy Tab A 8"', 'Samsung', 2019, 'funcional', 'mercado', { desc: 'Batería dura 4 horas.' });
  // Pedido pendiente de la Familia Gómez
  const t1 = mk('u1', 'tablet', 'Tablet vieja que no carga', 'Lenovo', 2015, 'danado', 'en_ruta');
  const b1 = mk('u1', 'bateria', 'Batería de portátil hinchada', 'Genérica', 2016, 'danado', 'en_ruta', { hinchada: true });
  const [la, ln] = LOCALIDADES['Usaquén'];
  db.orders.push({ id: 'o' + (++db.seq), user: 'u1', items: [t1.id, b1.id], loc: 'Usaquén', address: 'Calle 127 # 15-20, Apto 402', slot: 'Mañana (8am - 12m)', hub: 'h1', lat: la + 0.004, lng: ln - 0.003, status: 'pendiente', recicler: null, created: now - 0.2 * D });
  t1.order = b1.order = db.orders[0].id;
  // Pedido de Alejandro
  const m2 = mk('u6', 'monitor', 'Monitor CRT antiguo', 'LG', 2008, 'danado', 'en_ruta');
  const [la2, ln2] = LOCALIDADES['Suba'];
  db.orders.push({ id: 'o' + (++db.seq), user: 'u6', items: [m2.id], loc: 'Suba', address: 'Cra 91 # 145-30', slot: 'Tarde (2pm - 6pm)', hub: 'h5', lat: la2 - 0.005, lng: ln2 + 0.004, status: 'pendiente', recicler: null, created: now - 0.1 * D });
  m2.order = db.orders[1].id;
  // En cola de triage del Eco-Hub
  mk('u3', 'pc', 'Torre PC Dell Optiplex antigua', 'Dell', 2012, 'danado', 'en_hub', { hub: 'h1' });
  mk('u6', 'toner', 'Cartuchos de tóner usados (x3)', 'HP', 2019, 'danado', 'en_hub', { hub: 'h1' });
  mk('u1', 'celular', 'iPhone 7 (batería agotada)', 'Apple', 2017, 'reparable', 'en_hub', { hub: 'h1' });
  // Histórico procesado (para indicadores de impacto)
  const hist = [['u1', 'pc', 'mineria', 7.5], ['u2', 'placa', 'mineria', 2.4], ['u3', 'monitor', 'downcycling', 4.2], ['u6', 'bateria', 'toxico', 0.9], ['u7', 'laptop', 'trueque', 2.1], ['u1', 'perifericos', 'downcycling', 1.8], ['u2', 'celular', 'mineria', 0.6], ['u3', 'disco', 'trueque', 0.4]];
  hist.forEach(([u, c, d, kg]) => mk(u, c, CATS[c].n + ' (histórico)', '—', 2015, d === 'trueque' ? 'reparable' : 'danado', 'procesado', { finalDest: d, kg, processedAt: now - Math.random() * 20 * D, hub: 'h1' }));
  db.users.filter(u => u.id !== SYS).forEach(u => db.txs.push({ id: nid('t'), from: SYS, to: u.id, amount: 100, concept: 'Bono de bienvenida', date: now - 25 * D }));
  db.certs.push({ id: 'CERT-2026-0001', item: 'histórico', itemTitle: 'Disco duro 500GB', user: 'u3', hub: 'h1', method: 'NIST SP 800-88 Rev.1 (Purge)', operator: 'Operador Hub Andino', date: now - 9 * D });
  if (persist) save();
  else { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }
}

/* ------------------------------ ARRANQUE ---------------------------- */
function subscribeRealtime() {
  if (!sb || realtimeChannel) return;
  realtimeChannel = sb.channel('ecoswap_live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ecoswap_state', filter: 'id=eq.main' }, payload => {
      if (payload.new && payload.new.data) {
        const incoming = payload.new.data;
        if (!db || !incoming.updatedAt || incoming.updatedAt !== db.updatedAt) {
          db = incoming;
          try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
          const active = document.activeElement;
          const isTyping = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
          if (!isTyping && !$('#modal-root').innerHTML && view !== 'escanear') {
            render();
          }
        }
      }
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setSyncBadge('online');
    });
}

async function resolveProfileForAuthUser(authUser, extraMeta = {}) {
  if (!sb || !authUser) return null;
  let { data: prof } = await sb.from('ecoswap_profiles').select('*').eq('auth_id', authUser.id).maybeSingle();
  const meta = Object.assign({}, authUser.user_metadata || {}, extraMeta);
  if (!prof) {
    const uid = meta.uid || ('u_' + authUser.id.replace(/-/g, '').slice(0, 8));
    const newProf = {
      auth_id: authUser.id,
      user_id: uid,
      email: authUser.email,
      name: (meta.name || authUser.email.split('@')[0]).trim(),
      role: meta.role || 'estudiante',
      loc: meta.loc || 'Chapinero',
      hub: (meta.role === 'operador') ? (meta.hub || 'h1') : null
    };
    const res = await sb.from('ecoswap_profiles').upsert(newProf).select('*').maybeSingle();
    prof = res.data || newProf;
  }
  let u = db.users.find(x => x.id === prof.user_id);
  if (!u) {
    u = {
      id: prof.user_id,
      email: prof.email,
      name: prof.name,
      role: prof.role || 'estudiante',
      loc: prof.loc || 'Chapinero',
      coins: 0,
      interests: Array.isArray(meta.interests) ? meta.interests : [],
      hub: prof.hub || (prof.role === 'operador' ? 'h1' : undefined)
    };
    db.users.push(u);
    addTx(SYS, u.id, 100, 'Bono de bienvenida');
    save();
  } else {
    u.email = prof.email;
    if (prof.name) u.name = prof.name;
    if (prof.role) u.role = prof.role;
    if (prof.loc) u.loc = prof.loc;
    if (prof.hub) u.hub = prof.hub;
  }
  return u;
}

async function boot() {
  try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) { db = null; }
  if (!db || !db.users) seed(false);

  if (sb) {
    try {
      const { data: row } = await sb.from('ecoswap_state').select('data').eq('id', 'main').maybeSingle();
      if (row && row.data && row.data.users) {
        db = row.data;
        try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
      } else {
        seed(true);
      }
      setSyncBadge('online');
      subscribeRealtime();
      const { data: sessData } = await sb.auth.getSession();
      if (sessData && sessData.session && sessData.session.user) {
        const u = await resolveProfileForAuthUser(sessData.session.user);
        if (u) {
          session = u.id;
          localStorage.setItem(SESSION_KEY, u.id);
        }
      } else {
        session = null;
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      session = localStorage.getItem(SESSION_KEY);
      if (session && !db.users.find(u => u.id === session)) session = null;
    }
  } else {
    session = localStorage.getItem(SESSION_KEY);
    if (session && !db.users.find(u => u.id === session)) session = null;
  }
  render();
}

function setAuthMode(m) {
  authMode = m;
  render();
}

async function handleSignIn(e) {
  e.preventDefault();
  if (authLoading) return;
  const f = new FormData(e.target);
  const email = (f.get('email') || '').trim().toLowerCase();
  const password = f.get('password') || '';
  if (!email || !password) return;
  if (!sb) return toast('No hay conexión con el servidor de autenticación', 'err');
  authLoading = true;
  const btn = $('#auth-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Iniciando sesión…'; }
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message, 'err');
      return;
    }
    const u = await resolveProfileForAuthUser(data.user);
    session = u.id;
    localStorage.setItem(SESSION_KEY, u.id);
    view = navFor(u.role)[0][0];
    save();
    render();
    toast(`¡Bienvenido, ${u.name}!`, 'ok');
  } finally {
    authLoading = false;
    if ($('#auth-submit-btn')) { $('#auth-submit-btn').disabled = false; $('#auth-submit-btn').innerHTML = '<i class="fa-solid fa-right-to-bracket"></i>Iniciar sesión'; }
  }
}

async function register(e) {
  e.preventDefault();
  if (authLoading) return;
  const f = new FormData(e.target);
  const name = (f.get('name') || '').trim();
  const email = (f.get('email') || '').trim().toLowerCase();
  const password = f.get('password') || '';
  const role = f.get('role') || 'estudiante';
  const loc = f.get('loc') || 'Chapinero';
  const hubSel = role === 'operador' ? (f.get('hub') || 'h1') : null;
  const interests = f.getAll('interests');
  if (!name || !email || password.length < 6) {
    return toast('Completa todos los campos (contraseña mínimo 6 caracteres)', 'warn');
  }
  if (!sb) return toast('No hay conexión con el servidor', 'err');
  authLoading = true;
  const btn = $('#auth-submit-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Creando cuenta…'; }
  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { name, role, loc, hub: hubSel, interests } }
    });
    if (error) {
      toast(error.message.includes('already registered') ? 'Este correo ya está registrado. Inicia sesión.' : error.message, 'err');
      return;
    }
    let authUser = data.user;
    if (!data.session) {
      const signRes = await sb.auth.signInWithPassword({ email, password });
      if (signRes.data && signRes.data.user) authUser = signRes.data.user;
    }
    const u = await resolveProfileForAuthUser(authUser, { name, role, loc, hub: hubSel, interests });
    session = u.id;
    localStorage.setItem(SESSION_KEY, u.id);
    view = navFor(u.role)[0][0];
    save();
    render();
    toast(`¡Cuenta creada! Recibiste +100 EcoCoins de bienvenida, ${u.name}`, 'ok');
  } finally {
    authLoading = false;
    if ($('#auth-submit-btn')) { $('#auth-submit-btn').disabled = false; $('#auth-submit-btn').innerHTML = '<i class="fa-solid fa-user-plus"></i>Crear cuenta (+100 EcoCoins)'; }
  }
}

async function logout() {
  if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
  session = null;
  localStorage.removeItem(SESSION_KEY);
  ui.route = null;
  render();
}

async function resetDemo() {
  if (!confirm('¿Restaurar los datos iniciales del ecosistema en la nube?')) return;
  const curId = session;
  seed();
  if (sb) {
    try { await sb.rpc('reset_ecoswap_state', { new_data: db }); } catch (e) {}
  }
  session = curId;
  render();
  toast('Datos del ecosistema restaurados y sincronizados en la nube', 'ok');
}

/* ------------------------- UI: toast y modales ---------------------- */
function toast(msg, type = 'info') {
  const c = { ok: 'bg-emerald-600', warn: 'bg-amber-500', err: 'bg-rose-600', info: 'bg-slate-800' }[type];
  const ic = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', err: 'fa-circle-xmark', info: 'fa-circle-info' }[type];
  const el = document.createElement('div');
  el.className = `${c} text-white px-4 py-3 rounded-xl shadow-lg text-sm flex gap-2 items-start fade-in`;
  el.innerHTML = `<i class="fa-solid ${ic} mt-0.5"></i><span>${msg}</span>`;
  $('#toast-root').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 3200);
}
function openModal(html, wide = false) {
  $('#modal-root').innerHTML = `<div class="fixed inset-0 z-[2500] bg-slate-900/50 flex items-center justify-center p-4" onclick="if(event.target===this)closeModal()">
    <div class="card ${wide ? 'max-w-3xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-y-auto p-6 fade-in relative">
      <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><i class="fa-solid fa-xmark text-xl"></i></button>
      ${html}</div></div>`;
}
function closeModal() { stopCam(); $('#modal-root').innerHTML = ''; }

/* --------------------------- UI: helpers ---------------------------- */
function avatar(u, size = 'w-10 h-10 text-sm') {
  const ini = u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `<div class="${size} ${ROLES[u.role].c} rounded-full text-white font-bold flex items-center justify-center shrink-0">${esc(ini)}</div>`;
}
function thumb(i, cls = 'w-full h-40') {
  return i.photo ? `<img src="${i.photo}" class="${cls} object-cover">`
    : `<div class="${cls} bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center"><i class="fa-solid ${CATS[i.cat].icon} text-4xl text-emerald-600/70"></i></div>`;
}
function badge(text, color, icon) {
  return `<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700">${icon ? `<i class="fa-solid ${icon}"></i>` : ''}${esc(text)}</span>`;
}
const condBadge = c => badge(CONDS[c].n, CONDS[c].c);
const destBadge = d => badge(DESTS[d].n, DESTS[d].c, DESTS[d].icon);
function kpi(label, value, icon, color = 'emerald') {
  return `<div class="card p-4 flex items-center gap-4"><div class="w-12 h-12 rounded-2xl bg-${color}-100 text-${color}-600 flex items-center justify-center text-xl"><i class="fa-solid ${icon}"></i></div>
    <div><div class="text-2xl font-extrabold">${value}</div><div class="text-xs text-slate-500">${label}</div></div></div>`;
}
function empty(text, icon = 'fa-box-open') { return `<div class="text-center text-slate-400 py-10"><i class="fa-solid ${icon} text-4xl mb-3"></i><p class="text-sm">${text}</p></div>`; }
function sectionTitle(t, sub) { return `<div class="mb-6"><h1 class="text-2xl md:text-3xl font-extrabold">${t}</h1>${sub ? `<p class="text-slate-500 mt-1">${sub}</p>` : ''}</div>`; }
function opts(obj, sel) { return Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(v.n || k)}</option>`).join(''); }
function locOpts(sel) { return Object.keys(LOCALIDADES).map(l => `<option ${l === sel ? 'selected' : ''}>${l}</option>`).join(''); }
function hubOpts(sel) { return HUBS.map(h => `<option value="${h.id}" ${h.id === sel ? 'selected' : ''}>${h.n}</option>`).join(''); }

/* ------------------------------ NAVEGACIÓN -------------------------- */
const NAV = {
  inicio: ['Inicio', 'fa-house'], mercado: ['Mercado', 'fa-store'], escanear: ['Escanear con IA', 'fa-camera'],
  recoleccion: ['Recolección', 'fa-truck'], trueques: ['Trueques', 'fa-handshake'], billetera: ['Billetera', 'fa-wallet'],
  impresion: ['Impresión 3D', 'fa-cube'], aprende: ['Aprende', 'fa-graduation-cap'], impacto: ['Impacto', 'fa-earth-americas'],
  rutas: ['Rutas GIS', 'fa-route'], hub: ['Eco-Hub', 'fa-warehouse']
};
function navFor(role) {
  const byRole = {
    reciclador: ['rutas', 'inicio', 'mercado', 'billetera', 'aprende', 'impacto'],
    operador: ['hub', 'impresion', 'rutas', 'mercado', 'impacto']
  };
  return (byRole[role] || ['inicio', 'mercado', 'escanear', 'recoleccion', 'trueques', 'billetera', 'impresion', 'aprende', 'impacto']).map(k => [k, ...NAV[k]]);
}
function go(v) { view = v; render(); window.scrollTo(0, 0); }

function destroyWidgets() {
  charts.forEach(c => c.destroy()); charts = [];
  if (leafMap) { leafMap.remove(); leafMap = null; }
}

function render() {
  destroyWidgets();
  const app = $('#app');
  const u = me();
  if (!u) { app.innerHTML = loginView(); return; }
  const nav = navFor(u.role);
  if (!nav.find(n => n[0] === view)) view = nav[0][0];
  const unread = db.notifs.filter(n => n.user === u.id && !n.read).length;
  const pendOffers = db.offers.filter(o => o.to === u.id && o.status === 'pendiente').length;
  const link = ([k, label, icon]) => `<button onclick="go('${k}')" class="nav-link ${view === k ? 'active' : ''}"><i class="fa-solid ${icon} w-5 text-center"></i><span class="flex-1">${label}</span>${k === 'trueques' && pendOffers ? `<span class="bg-rose-500 text-white text-[10px] rounded-full px-1.5">${pendOffers}</span>` : ''}</button>`;
  app.innerHTML = `
  <div class="min-h-screen flex">
    <aside class="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
      <div class="p-5 flex items-center gap-3 border-b border-slate-100">
        <img src="logo.jpg" class="w-11 h-11 rounded-xl object-cover" onerror="this.outerHTML='<div class=\\'w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center\\'><i class=\\'fa-solid fa-recycle\\'></i></div>'">
        <div><div class="font-extrabold text-lg leading-tight"><span class="text-emerald-600">ECO</span> <span class="text-sky-700">SWAP</span></div><div class="text-[11px] text-slate-400">Economía circular RAEE</div></div>
      </div>
      <nav class="p-3 space-y-1 flex-1 overflow-y-auto">${nav.map(link).join('')}</nav>
      <div class="p-3 border-t border-slate-100 space-y-1">
        <div class="flex items-center gap-3 p-2">${avatar(u)}<div class="min-w-0 flex-1"><div class="font-semibold text-sm truncate">${esc(u.name)}</div><div class="text-[11px] text-slate-500 truncate">${ROLES[u.role].n}</div></div></div>
        <button onclick="installPWA()" id="pwa-install-btn" class="nav-link text-sm text-emerald-700 font-semibold"><i class="fa-solid fa-mobile-screen-button w-5"></i>Instalar App</button>
        <button onclick="logout()" class="nav-link text-sm"><i class="fa-solid fa-right-from-bracket w-5"></i>Cerrar sesión</button>
        <button onclick="resetDemo()" class="nav-link text-xs text-slate-400"><i class="fa-solid fa-rotate-left w-5"></i>Restaurar datos base</button>
      </div>
    </aside>
    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white/90 backdrop-blur border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-[900]">
        <div class="flex items-center gap-2 md:hidden"><i class="fa-solid fa-recycle text-emerald-600 text-xl"></i><span class="font-extrabold">ECO SWAP</span></div>
        <div class="hidden md:flex items-center gap-3 text-sm text-slate-500"><span><i class="fa-solid fa-location-dot mr-1"></i>Bogotá · ${esc(u.loc)}</span><span id="sync-badge" class="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>En vivo · Nube</span></div>
        <div class="flex items-center gap-2 md:gap-3">
          ${u.role !== 'operador' ? `<button onclick="go('billetera')" class="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 text-sm">${coin(u.coins)} <span class="text-emerald-700 text-xs">EcoCoins</span></button>` : `<span class="text-sm font-semibold text-slate-600"><i class="fa-solid fa-warehouse mr-1"></i>${hub(u.hub).n}</span>`}
          <button onclick="installPWA()" class="md:hidden w-10 h-10 rounded-full hover:bg-slate-100 text-emerald-600" title="Instalar App"><i class="fa-solid fa-download"></i></button>
          <button onclick="showNotifs()" class="relative w-10 h-10 rounded-full hover:bg-slate-100"><i class="fa-solid fa-bell text-slate-600"></i>${unread ? `<span class="absolute top-1 right-1 bg-rose-500 text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">${unread}</span>` : ''}</button>
          <button onclick="logout()" class="md:hidden w-10 h-10 rounded-full hover:bg-slate-100" title="Cerrar sesión"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </header>
      <main class="p-4 md:p-8 pb-28 md:pb-10 flex-1 fade-in max-w-7xl w-full mx-auto">${VIEWS[view](u)}</main>
    </div>
    <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex overflow-x-auto z-[900]">
      ${nav.map(([k, label, icon]) => `<button onclick="go('${k}')" class="flex-1 min-w-[72px] py-2 flex flex-col items-center text-[10px] ${view === k ? 'text-emerald-600 font-bold' : 'text-slate-500'}"><i class="fa-solid ${icon} text-lg mb-0.5"></i>${label}</button>`).join('')}
    </nav>
  </div>`;
  if (AFTER[view]) AFTER[view](u);
}

function showNotifs() {
  const u = me();
  const list = db.notifs.filter(n => n.user === u.id);
  openModal(`<h2 class="text-xl font-bold mb-4"><i class="fa-solid fa-bell text-emerald-600 mr-2"></i>Notificaciones</h2>
    ${list.length ? `<div class="space-y-2">${list.slice(0, 30).map(n => `<div class="flex gap-3 p-3 rounded-xl ${n.read ? 'bg-slate-50' : 'bg-emerald-50'}"><i class="fa-solid ${n.icon} text-emerald-600 mt-1"></i><div><p class="text-sm">${n.text}</p><p class="text-[11px] text-slate-400">${fdate(n.date)}</p></div></div>`).join('')}</div>` : empty('Sin notificaciones', 'fa-bell-slash')}`);
  list.forEach(n => n.read = true); save();
  setTimeout(() => { const b = document.querySelector('header .bg-rose-500'); if (b) b.remove(); }, 50);
}

/* ------------------------------- LOGIN ------------------------------ */
function loginView() {
  const isLogin = authMode === 'login';
  return `
  <div class="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-sky-800 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full grid md:grid-cols-2 overflow-hidden fade-in">
      <div class="p-8 md:p-10 bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center">
        <img src="logo.jpg" class="w-36 h-36 object-contain mx-auto rounded-2xl mix-blend-multiply" onerror="this.style.display='none'">
        <h1 class="text-4xl font-extrabold text-center mt-3"><span class="text-emerald-600">ECO</span> <span class="text-sky-700">SWAP</span></h1>
        <p class="text-center text-emerald-800 italic mt-1">"La plataforma donde la basura de unos es el tesoro de otros"</p>
        <ul class="mt-8 space-y-3 text-sm text-slate-600">
          <li><i class="fa-solid fa-camera text-emerald-600 w-6"></i>Valoración de RAEE con IA y EcoCoins</li>
          <li><i class="fa-solid fa-handshake text-emerald-600 w-6"></i>Matchmaking inteligente de trueques</li>
          <li><i class="fa-solid fa-route text-emerald-600 w-6"></i>Logística inversa con ruteo GIS</li>
          <li><i class="fa-solid fa-warehouse text-emerald-600 w-6"></i>Eco-Hubs: triage, borrado seguro y tóxicos</li>
          <li><i class="fa-solid fa-cube text-emerald-600 w-6"></i>Repuestos con impresión 3D</li>
        </ul>
        <div class="mt-6 flex items-center justify-between">
          <p class="text-[11px] text-slate-400">Ingeniería de Sistemas + Ingeniería Industrial · Bogotá</p>
          <button type="button" onclick="installPWA()" class="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"><i class="fa-solid fa-mobile-screen-button"></i>Instalar App</button>
        </div>
      </div>
      <div class="p-8 md:p-10 flex flex-col justify-center">
        <div class="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button type="button" onclick="setAuthMode('login')" class="flex-1 py-2.5 text-sm font-bold rounded-lg transition ${isLogin ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"><i class="fa-solid fa-right-to-bracket mr-1.5"></i>Iniciar sesión</button>
          <button type="button" onclick="setAuthMode('register')" class="flex-1 py-2.5 text-sm font-bold rounded-lg transition ${!isLogin ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"><i class="fa-solid fa-user-plus mr-1.5"></i>Crear cuenta</button>
        </div>

        ${isLogin ? `
          <h2 class="text-2xl font-extrabold mb-1">Bienvenido de nuevo</h2>
          <p class="text-sm text-slate-500 mb-5">Ingresa con tu correo electrónico y contraseña.</p>
          <form onsubmit="handleSignIn(event)" class="space-y-4">
            <div>
              <label class="lbl">Correo electrónico</label>
              <div class="relative"><i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-slate-400"></i><input name="email" type="email" required autocomplete="email" placeholder="nombre@correo.com" class="inp pl-10"></div>
            </div>
            <div>
              <label class="lbl">Contraseña</label>
              <div class="relative"><i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-400"></i><input name="password" type="password" required autocomplete="current-password" placeholder="••••••••" class="inp pl-10"></div>
            </div>
            <button id="auth-submit-btn" class="btn btn-primary w-full py-3"><i class="fa-solid fa-right-to-bracket"></i>Iniciar sesión</button>
          </form>
          <p class="text-xs text-center text-slate-500 mt-6">¿Aún no tienes cuenta? <button type="button" onclick="setAuthMode('register')" class="text-emerald-700 font-bold hover:underline">Regístrate gratis (+100 EcoCoins)</button></p>
        ` : `
          <h2 class="text-2xl font-extrabold mb-1">Crear cuenta en Eco Swap</h2>
          <p class="text-sm text-slate-500 mb-4">Únete al ecosistema de economía circular y recibe 🪙 100 EcoCoins.</p>
          <form onsubmit="register(event)" class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="lbl">Nombre completo</label>
              <input name="name" required placeholder="Ej: Juan Pérez" class="inp">
            </div>
            <div class="col-span-2">
              <label class="lbl">Correo electrónico</label>
              <input name="email" type="email" required autocomplete="email" placeholder="nombre@correo.com" class="inp">
            </div>
            <div class="col-span-2">
              <label class="lbl">Contraseña</label>
              <input name="password" type="password" minlength="6" required autocomplete="new-password" placeholder="Mínimo 6 caracteres" class="inp">
            </div>
            <div>
              <label class="lbl">Rol en el ecosistema</label>
              <select name="role" class="inp" onchange="document.getElementById('reg-hub-wrap').style.display=this.value==='operador'?'block':'none'">${['familia', 'tecnico', 'estudiante', 'reciclador', 'operador'].map(r => `<option value="${r}">${ROLES[r].n}</option>`).join('')}</select>
            </div>
            <div>
              <label class="lbl">Localidad (Bogotá)</label>
              <select name="loc" class="inp">${locOpts('Chapinero')}</select>
            </div>
            <div id="reg-hub-wrap" style="display:none" class="col-span-2">
              <label class="lbl">Eco-Hub asignado</label>
              <select name="hub" class="inp">${hubOpts('h1')}</select>
            </div>
            <details class="col-span-2 text-sm bg-slate-50 p-3 rounded-xl border border-slate-200">
              <summary class="cursor-pointer font-semibold text-slate-600">Intereses (para el matchmaking IA)</summary>
              <div class="grid grid-cols-2 gap-1.5 mt-2 text-xs">${Object.entries(CATS).filter(([, c]) => !c.toxic).map(([k, c]) => `<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="interests" value="${k}">${c.n}</label>`).join('')}</div>
            </details>
            <button id="auth-submit-btn" class="btn btn-primary col-span-2 py-3 mt-1"><i class="fa-solid fa-user-plus"></i>Crear cuenta (+100 EcoCoins)</button>
          </form>
        `}
      </div>
    </div>
  </div>`;
}

/* =============================== VISTAS ============================= */
const VIEWS = {}, AFTER = {};

/* ------------------------------- INICIO ----------------------------- */
VIEWS.inicio = u => {
  if (u.role === 'reciclador') return inicioReciclador(u);
  const listed = db.items.filter(i => i.owner === u.id && i.status === 'mercado').length;
  const donated = db.items.filter(i => i.donor === u.id && i.finalDest);
  const kg = donated.reduce((s, i) => s + i.kg, 0);
  const co2 = donated.reduce((s, i) => s + i.kg * DESTS[i.finalDest].co2, 0);
  const swaps = db.offers.filter(o => o.status === 'aceptada' && (o.from === u.id || o.to === u.id)).length + db.txs.filter(t => t.concept.startsWith('Compra') && (t.from === u.id || t.to === u.id)).length;
  const sug = sugerencias(u, 3), rec = recomendados(u, 4);
  const myOrders = db.orders.filter(o => o.user === u.id && o.status !== 'en_hub');
  return `
  <div class="rounded-3xl bg-gradient-to-br from-emerald-600 to-sky-700 text-white p-6 md:p-8 mb-6 relative overflow-hidden">
    <i class="fa-solid fa-recycle absolute -right-6 -bottom-8 text-[180px] opacity-10"></i>
    <p class="opacity-80">¡Hola, ${esc(u.name.split(' ')[0])}! 👋</p>
    <p class="text-sm opacity-80 mt-4">Tu billetera verde</p>
    <div class="text-5xl font-extrabold">${fmt(u.coins)} <span class="text-lg font-semibold">EcoCoins</span></div>
    <div class="flex flex-wrap gap-2 mt-6">
      <button onclick="go('escanear')" class="btn bg-white text-emerald-700 hover:bg-emerald-50"><i class="fa-solid fa-camera"></i>Escanear RAEE</button>
      <button onclick="go('recoleccion')" class="btn bg-white/15 hover:bg-white/25 text-white"><i class="fa-solid fa-truck"></i>Pedir recolección</button>
      <button onclick="go('mercado')" class="btn bg-white/15 hover:bg-white/25 text-white"><i class="fa-solid fa-store"></i>Ir al mercado</button>
    </div>
  </div>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${kpi('Publicados en mercado', listed, 'fa-store')}
    ${kpi('Trueques / compras', swaps, 'fa-handshake', 'sky')}
    ${kpi('Kg entregados a Eco-Hubs', fmt1(kg), 'fa-weight-hanging', 'amber')}
    ${kpi('Kg CO₂e evitados (est.)', fmt(co2), 'fa-leaf', 'emerald')}
  </div>
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <h2 class="font-bold text-lg mb-1"><i class="fa-solid fa-wand-magic-sparkles text-violet-600 mr-2"></i>Trueques sugeridos por la IA</h2>
      <p class="text-xs text-slate-500 mb-4">Basado en el valor de tus objetos publicados, tus intereses y los de otros usuarios.</p>
      ${sug.length ? sug.map(sugCard).join('') : empty('Publica un objeto en el mercado para recibir sugerencias de trueque.', 'fa-wand-magic-sparkles')}
    </div>
    <div class="card p-6">
      <h2 class="font-bold text-lg mb-4"><i class="fa-solid fa-star text-amber-500 mr-2"></i>Recomendado para ti</h2>
      ${rec.length ? `<div class="grid grid-cols-2 gap-3">${rec.map(i => `<button onclick="itemDetail('${i.id}')" class="text-left rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition">${thumb(i, 'w-full h-24')}<div class="p-2"><div class="text-sm font-semibold truncate">${esc(i.title)}</div>${coin(i.value)}</div></button>`).join('')}</div>` : empty('Configura tus intereses o explora el mercado.')}
    </div>
    ${myOrders.length ? `<div class="card p-6 lg:col-span-2"><h2 class="font-bold text-lg mb-4"><i class="fa-solid fa-truck text-sky-600 mr-2"></i>Recolecciones activas</h2>${myOrders.map(orderCard).join('')}</div>` : ''}
  </div>`;
};
function inicioReciclador(u) {
  const pend = db.orders.filter(o => o.status === 'pendiente').length;
  const mine = db.orders.filter(o => o.recicler === u.id && ['asignado', 'en_camino'].includes(o.status)).length;
  const done = db.orders.filter(o => o.recicler === u.id && ['en_hub'].includes(o.status)).length;
  const earn = db.txs.filter(t => t.to === u.id && t.concept.startsWith('Pago recolección')).reduce((s, t) => s + t.amount, 0);
  return sectionTitle(`Hola, ${esc(u.name.split(' ')[0])} 🚚`, 'Eres parte de la logística inversa de última milla de Eco Swap (inclusión social de recicladores).') + `
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${kpi('Pedidos disponibles', pend, 'fa-clipboard-list', 'amber')}
    ${kpi('Mis rutas activas', mine, 'fa-truck-fast', 'sky')}
    ${kpi('Entregados en Eco-Hub', done, 'fa-warehouse')}
    ${kpi('EcoCoins ganados', fmt(earn), 'fa-coins', 'emerald')}
  </div>
  <button onclick="go('rutas')" class="btn btn-primary"><i class="fa-solid fa-route"></i>Ver pedidos y optimizar mi ruta</button>`;
}
function sugCard(s) {
  const pay = s.diff > 0 ? `Tú pagas ${coin(s.diff)}` : s.diff < 0 ? `Recibes ${coin(-s.diff)}` : 'Trueque exacto';
  return `<div class="border border-slate-200 rounded-xl p-3 mb-3 flex items-center gap-3">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 text-sm"><span class="truncate font-semibold">${esc(s.give.title)}</span><i class="fa-solid fa-right-left text-violet-500"></i><span class="truncate font-semibold">${esc(s.get.title)}</span></div>
      <div class="text-xs text-slate-500 mt-1">con ${esc(user(s.get.owner).name)} · ${pay}</div>
      <div class="h-1.5 bg-slate-100 rounded-full mt-2"><div class="h-1.5 bg-violet-500 rounded-full" style="width:${s.score}%"></div></div>
      <div class="text-[10px] text-violet-600 mt-0.5">Compatibilidad IA ${s.score}%</div>
    </div>
    <button onclick="createOffer('${s.give.id}','${s.get.id}')" class="btn btn-sm btn-primary">Proponer</button>
  </div>`;
}

/* ------------------------------ ESCANEAR ---------------------------- */
VIEWS.escanear = u => sectionTitle('Escanear RAEE con IA', 'Toma una foto con tu celular o cámara web, y nuestra IA reconocerá el dispositivo, estimará su valor en EcoCoins y su mejor destino.') + `
  <div class="grid lg:grid-cols-2 gap-6">
    <form id="scan-form" onsubmit="analizar(event)" class="card p-6 space-y-4">
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="lbl mb-0">Foto del equipo</label>
          <div class="flex gap-2">
            <button type="button" onclick="openCameraModal()" class="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"><i class="fa-solid fa-video"></i>Cámara en vivo</button>
            <button type="button" onclick="configGeminiKey()" class="text-xs text-slate-400 hover:text-violet-600 flex items-center gap-1" title="Configurar Gemini Vision API"><i class="fa-solid fa-key"></i>Gemini IA</button>
          </div>
        </div>
        <label class="block border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-emerald-500 overflow-hidden relative" id="photo-box">
          <div id="photo-preview" class="h-48 flex flex-col items-center justify-center text-slate-400"><i class="fa-solid fa-camera text-4xl mb-2 text-emerald-600"></i><span class="text-sm font-semibold text-slate-600">Toca para tomar foto o subir imagen</span><span class="text-xs text-slate-400 mt-0.5">Reconocimiento visual automático con IA</span></div>
          <input type="file" accept="image/*" capture="environment" class="hidden" onchange="loadPhoto(this)">
        </label>
        <div id="ai-vision-status" class="hidden mt-2 text-xs rounded-xl px-3 py-2 flex items-center gap-2"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><label class="lbl">Tipo de equipo</label><select name="cat" id="scan-cat" class="inp" onchange="document.getElementById('bat-row').style.display=this.value==='bateria'?'flex':'none'">${opts(CATS, 'laptop')}</select></div>
        <div class="col-span-2"><label class="lbl">Título</label><input name="title" id="scan-title" class="inp" required placeholder="Ej: Portátil HP con teclado dañado"></div>
        <div><label class="lbl">Marca</label><input name="brand" id="scan-brand" class="inp" placeholder="HP, Lenovo..."></div>
        <div><label class="lbl">Año aprox.</label><input name="year" id="scan-year" type="number" min="1990" max="${new Date().getFullYear()}" value="2020" class="inp"></div>
      </div>
      <div><label class="lbl">Estado</label>
        <div class="grid grid-cols-3 gap-2">${Object.entries(CONDS).map(([k, c], i) => `<label class="border border-slate-200 rounded-xl p-2 text-center text-xs cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"><input type="radio" name="cond" value="${k}" ${i === 0 ? 'checked' : ''} class="hidden">${c.n}</label>`).join('')}</div>
      </div>
      <label id="bat-row" style="display:none" class="items-center gap-2 text-sm bg-rose-50 text-rose-700 p-3 rounded-xl"><input type="checkbox" name="hinchada"> La batería está hinchada, con fuga o caliente</label>
      <div><label class="lbl">Descripción</label><textarea name="desc" id="scan-desc" rows="2" class="inp" placeholder="¿Qué falla? ¿Qué funciona?"></textarea></div>
      <button class="btn btn-primary w-full"><i class="fa-solid fa-wand-magic-sparkles"></i>Analizar con IA</button>
    </form>
    <div id="scan-result" class="card p-6 flex items-center justify-center">${empty('Toma o sube una foto y presiona "Analizar con IA" para ver la valoración.', 'fa-robot')}</div>
  </div>`;
let photoData = null, camStream = null;
AFTER.escanear = () => { photoData = null; stopCam(); };

function stopCam() {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
}

async function openCameraModal() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return toast('Tu navegador no soporta cámara en vivo. Usa el recuadro para subir o tomar foto.', 'warn');
  }
  openModal(`<h2 class="text-xl font-bold mb-3"><i class="fa-solid fa-camera text-emerald-600 mr-2"></i>Cámara en vivo</h2>
    <div class="rounded-2xl overflow-hidden bg-slate-900 relative aspect-video flex items-center justify-center">
      <video id="cam-video" autoplay playsinline class="w-full h-full object-cover"></video>
    </div>
    <div class="flex gap-2 mt-4">
      <button type="button" onclick="stopCam();closeModal()" class="btn btn-ghost flex-1">Cancelar</button>
      <button type="button" onclick="captureFromCamera()" class="btn btn-primary flex-1"><i class="fa-solid fa-camera"></i>Capturar foto</button>
    </div>`);
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    const v = $('#cam-video');
    if (v) v.srcObject = camStream;
  } catch (e) {
    closeModal();
    toast('No se pudo acceder a la cámara. Revisa los permisos del navegador.', 'err');
  }
}

function captureFromCamera() {
  const v = $('#cam-video');
  if (!v || !v.videoWidth) return;
  const max = 480, sc = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
  const cv = document.createElement('canvas'); cv.width = v.videoWidth * sc; cv.height = v.videoHeight * sc;
  cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
  photoData = cv.toDataURL('image/jpeg', 0.72);
  stopCam();
  closeModal();
  const prev = $('#photo-preview');
  if (prev) prev.outerHTML = `<div id="photo-preview" class="relative"><img src="${photoData}" class="w-full h-48 object-cover"></div>`;
  autoRecognizePhoto(photoData, 'captura_camara.jpg');
}

function configGeminiKey() {
  const cur = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  openModal(`<h2 class="text-xl font-bold mb-2"><i class="fa-solid fa-wand-magic-sparkles text-violet-600 mr-2"></i>Reconocimiento con Google Gemini Vision</h2>
    <p class="text-sm text-slate-600 mb-3">Si ingresas una API Key de Google AI Studio (Gemini), al tomar una foto la IA identificará automáticamente el tipo de RAEE, marca, título y estado físico real desde la imagen.</p>
    <input id="gemini-key-inp" type="password" value="${esc(cur)}" placeholder="AIzaSy..." class="inp mb-4">
    <div class="flex gap-2">
      <button type="button" onclick="closeModal()" class="btn btn-ghost flex-1">Cancelar</button>
      <button type="button" onclick="localStorage.setItem(GEMINI_KEY_STORAGE, document.getElementById('gemini-key-inp').value.trim());closeModal();toast('Configuración de Gemini IA guardada','ok')" class="btn btn-primary flex-1">Guardar</button>
    </div>`);
}

async function autoRecognizePhoto(dataUrl, fileName = '') {
  const st = $('#ai-vision-status');
  if (st) {
    st.className = 'mt-2 text-xs rounded-xl px-3 py-2 flex items-center gap-2 bg-violet-50 text-violet-700 border border-violet-200';
    st.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Analizando imagen con visión artificial…</span>';
  }
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE);
  if (apiKey) {
    try {
      const base64 = dataUrl.split(',')[1];
      const prompt = 'Analiza esta foto de un residuo o equipo electrónico (RAEE). Responde SOLO un objeto JSON válido con las claves: {"cat": una de [laptop, pc, monitor, celular, tablet, ram, disco, placa, fuente, perifericos, cables, bateria, toner], "title": nombre corto descriptivo en español, "brand": marca detectada o "", "year": año estimado número entre 2010 y 2025, "cond": uno de [funcional, reparable, danado], "desc": breve descripción del estado visual en español}.';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64 } }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      if (res.ok) {
        const json = await res.json();
        const txt = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
        applyVisionFields(parsed, 'Gemini Vision IA');
        return;
      }
    } catch (e) {}
  }
  const fn = fileName.toLowerCase();
  const hints = [
    [/portatil|laptop|macbook|ideapad|thinkpad|pavilion/, 'laptop', 'Portátil para revisión / repuestos', 'Lenovo'],
    [/celular|iphone|galaxy|redmi|moto|telefono|phone/, 'celular', 'Smartphone para reacondicionamiento', 'Samsung'],
    [/monitor|pantalla|lg|acer|benq/, 'monitor', 'Monitor LED de escritorio', 'LG'],
    [/teclado|mouse|raton|periferico|logitech|genius/, 'perifericos', 'Periférico USB', 'Logitech'],
    [/ram|kingston|corsair|ddr/, 'ram', 'Módulo de memoria RAM', 'Kingston'],
    [/ssd|disco|hdd|seagate|wd/, 'disco', 'Unidad de almacenamiento', 'Kingston'],
    [/placa|board|motherboard|asus|gigabyte/, 'placa', 'Tarjeta electrónica / PCB', 'Gigabyte'],
    [/bateria|pila/, 'bateria', 'Batería de litio usada', 'Genérica'],
    [/tablet|ipad/, 'tablet', 'Tablet táctil', 'Samsung']
  ];
  for (const [rx, cat, title, brand] of hints) {
    if (rx.test(fn)) {
      applyVisionFields({ cat, title, brand, year: 2020, cond: 'reparable', desc: 'Equipo identificado a partir de la imagen cargada.' }, 'Asistente IA');
      return;
    }
  }
  if (st) {
    st.className = 'mt-2 text-xs rounded-xl px-3 py-2 flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200';
    st.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Imagen lista y optimizada. Completa los datos o presiona Analizar con IA.</span>';
  }
}

function applyVisionFields(p, source) {
  if (p.cat && CATS[p.cat] && $('#scan-cat')) {
    $('#scan-cat').value = p.cat;
    const batRow = document.getElementById('bat-row');
    if (batRow) batRow.style.display = p.cat === 'bateria' ? 'flex' : 'none';
  }
  if (p.title && $('#scan-title') && !$('#scan-title').value) $('#scan-title').value = p.title;
  if (p.brand && $('#scan-brand') && !$('#scan-brand').value) $('#scan-brand').value = p.brand;
  if (p.year && $('#scan-year')) $('#scan-year').value = p.year;
  if (p.desc && $('#scan-desc') && !$('#scan-desc').value) $('#scan-desc').value = p.desc;
  if (p.cond && CONDS[p.cond]) {
    const rad = document.querySelector(`input[name="cond"][value="${p.cond}"]`);
    if (rad) rad.checked = true;
  }
  const st = $('#ai-vision-status');
  if (st) {
    st.className = 'mt-2 text-xs rounded-xl px-3 py-2 flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200';
    st.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span><b>${esc(source)}:</b> Detectado como <b>${esc(CATS[p.cat]?.n || 'RAEE')}</b>. Revisa y presiona Analizar.</span>`;
  }
}

function loadPhoto(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const max = 480, sc = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = img.width * sc; cv.height = img.height * sc;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      photoData = cv.toDataURL('image/jpeg', 0.72);
      $('#photo-preview').outerHTML = `<div id="photo-preview" class="relative"><img src="${photoData}" class="w-full h-48 object-cover"></div>`;
      autoRecognizePhoto(photoData, f.name || '');
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(f);
}
function analizar(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const d = { cat: f.get('cat'), title: f.get('title').trim(), brand: f.get('brand').trim(), year: f.get('year'), cond: f.get('cond'), hinchada: !!f.get('hinchada') && f.get('cat') === 'bateria', desc: f.get('desc').trim(), photo: photoData };
  const box = $('#scan-result');
  const steps = ['Reconociendo el objeto en la imagen…', 'Estimando estado y antigüedad…', 'Consultando precios de repuestos…', 'Calculando EcoCoins y destino óptimo…'];
  box.innerHTML = `<div class="w-full"><div class="relative h-40 rounded-2xl overflow-hidden mb-4 bg-slate-900">${d.photo ? `<img src="${d.photo}" class="w-full h-full object-cover opacity-70">` : `<div class="w-full h-full flex items-center justify-center"><i class="fa-solid ${CATS[d.cat].icon} text-6xl text-emerald-400"></i></div>`}<div class="scan-line"></div></div><p id="scan-step" class="text-center text-sm text-slate-600"><i class="fa-solid fa-spinner fa-spin mr-2"></i>${steps[0]}</p></div>`;
  let i = 0;
  const t = setInterval(() => { i++; if (i < steps.length) { const el = $('#scan-step'); if (el) el.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${steps[i]}`; } else { clearInterval(t); showResult(d); } }, 550);
}
function showResult(d) {
  const v = valorar(d);
  draft = Object.assign({}, d, { value: v.value, dest: v.dest, kg: v.kg, hasData: !!CATS[d.cat].data });
  const reward = rewardFor(v.dest, v.value, v.kg);
  const box = $('#scan-result'); if (!box) return;
  box.className = 'card p-6 fade-in';
  box.innerHTML = `
    <div class="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-3"><i class="fa-solid fa-circle-check"></i>Análisis completado · confianza ${v.confidence}%</div>
    <div class="flex gap-4 items-center">
      ${thumb(d, 'w-24 h-24 rounded-2xl')}
      <div><div class="text-xs text-slate-500">${CATS[d.cat].n}${d.brand ? ' · ' + esc(d.brand) : ''}</div><div class="font-bold text-lg">${esc(d.title)}</div>${condBadge(d.cond)}</div>
    </div>
    <div class="grid grid-cols-2 gap-3 my-5">
      <div class="bg-emerald-50 rounded-2xl p-4"><div class="text-xs text-emerald-700">Valor en mercado</div><div class="text-2xl font-extrabold text-emerald-700">🪙 ${fmt(v.value)}</div></div>
      <div class="bg-sky-50 rounded-2xl p-4"><div class="text-xs text-sky-700">Si lo entregas al Eco-Hub</div><div class="text-2xl font-extrabold text-sky-700">🪙 ${fmt(reward)}</div></div>
    </div>
    <div class="mb-3"><span class="lbl">Destino recomendado</span>${destBadge(v.dest)}</div>
    <details class="text-xs text-slate-500 mb-4"><summary class="cursor-pointer font-semibold">¿Cómo se calculó?</summary>
      <p class="mt-2">Valor = base de categoría (${v.base}) × factor de estado (${v.condF}) × depreciación por antigüedad (${v.age.toFixed(2)}, ${v.years} años) = <b>${fmt(v.value)}</b> EcoCoins. Peso estimado: ${v.kg} kg.</p></details>
    ${v.toxic ? `<div class="bg-rose-50 text-rose-700 text-sm rounded-xl p-3 mb-4"><i class="fa-solid fa-biohazard mr-1"></i>Elemento peligroso: <b>no lo botes a la basura</b>. Aíslalo en un lugar fresco; lo recogemos y lo entregamos a un gestor certificado (ej. EcoCómputo, LITO S.A.S.).</div>` : ''}
    ${draft.hasData ? `<div class="bg-amber-50 text-amber-800 text-sm rounded-xl p-3 mb-4"><i class="fa-solid fa-shield-halved mr-1"></i>Este equipo puede tener <b>datos personales</b>. En el Eco-Hub hacemos borrado seguro certificado (NIST 800-88). <button type="button" onclick="go('aprende')" class="underline">Aprende más</button></div>` : ''}
    <div class="flex flex-col gap-2">
      ${v.dest === 'trueque' ? `<button onclick="publishDraft('mercado')" class="btn btn-primary"><i class="fa-solid fa-store"></i>Publicar en el mercado por ${fmt(v.value)} EcoCoins</button>` : ''}
      <button onclick="publishDraft('hub')" class="btn btn-blue"><i class="fa-solid fa-truck"></i>Entregar al Eco-Hub (recibes ~${fmt(reward)} EcoCoins)</button>
    </div>`;
}
function publishDraft(mode) {
  if (!draft) return;
  const u = me();
  const it = { id: nid('i'), owner: u.id, donor: u.id, cat: draft.cat, title: draft.title, brand: draft.brand, year: draft.year, cond: draft.cond, desc: draft.desc, photo: draft.photo, value: draft.value, dest: draft.dest, kg: draft.kg, hasData: draft.hasData, hinchada: draft.hinchada, status: mode === 'mercado' ? 'mercado' : 'por_recoger', created: Date.now() };
  db.items.unshift(it); draft = null; save();
  if (mode === 'mercado') { toast('¡Publicado en el mercado! La IA buscará trueques compatibles.', 'ok'); go('mercado'); }
  else { toast('Objeto listo para recolección. Programa la visita del reciclador.', 'ok'); go('recoleccion'); }
}

/* ------------------------------- MERCADO ---------------------------- */
VIEWS.mercado = u => {
  const sug = u.role === 'operador' ? [] : sugerencias(u, 2);
  const m = ui.market;
  return sectionTitle('Mercado de trueque', 'Repuestos y equipos con segunda vida. Paga con EcoCoins o propone un trueque.') + `
  ${sug.length ? `<div class="card p-5 mb-6 border-violet-200 bg-violet-50/40"><h2 class="font-bold mb-3"><i class="fa-solid fa-wand-magic-sparkles text-violet-600 mr-2"></i>Matches para ti</h2><div class="grid md:grid-cols-2 gap-3">${sug.map(sugCard).join('')}</div></div>` : ''}
  <div class="card p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
    <div class="col-span-2 relative"><i class="fa-solid fa-magnifying-glass absolute left-3 top-3.5 text-slate-400"></i><input class="inp pl-9" placeholder="Buscar…" value="${esc(m.q)}" oninput="ui.market.q=this.value;renderMarket()"></div>
    <select class="inp" onchange="ui.market.cat=this.value;renderMarket()"><option value="">Todas las categorías</option>${Object.entries(CATS).filter(([, c]) => !c.toxic).map(([k, c]) => `<option value="${k}" ${m.cat === k ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
    <select class="inp" onchange="ui.market.cond=this.value;renderMarket()"><option value="">Cualquier estado</option>${Object.entries(CONDS).map(([k, c]) => `<option value="${k}" ${m.cond === k ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" ${m.hideMine ? 'checked' : ''} onchange="ui.market.hideMine=this.checked;renderMarket()">Ocultar los míos</label>
  </div>
  <div id="market-list"></div>`;
};
AFTER.mercado = () => renderMarket();
function renderMarket() {
  const u = me(), m = ui.market, q = m.q.toLowerCase();
  const list = db.items.filter(i => i.status === 'mercado'
    && (!m.cat || i.cat === m.cat) && (!m.cond || i.cond === m.cond)
    && (!m.hideMine || i.owner !== u.id)
    && (!q || (i.title + ' ' + i.brand + ' ' + CATS[i.cat].n).toLowerCase().includes(q)))
    .sort((a, b) => b.created - a.created);
  const el = $('#market-list'); if (!el) return;
  el.innerHTML = list.length ? `<div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">${list.map(i => {
    const o = user(i.owner), mine = i.owner === u.id;
    return `<div class="card overflow-hidden flex flex-col hover:shadow-lg transition">
      <button onclick="itemDetail('${i.id}')" class="relative">${thumb(i)}${mine ? '<span class="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-full">Tuyo</span>' : ''}${i.owner === SYS ? '<span class="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full"><i class="fa-solid fa-certificate mr-1"></i>Reacondicionado Eco-Hub</span>' : ''}</button>
      <div class="p-4 flex-1 flex flex-col">
        <div class="text-[11px] text-slate-500">${CATS[i.cat].n}</div>
        <button onclick="itemDetail('${i.id}')" class="font-bold text-left leading-tight hover:text-emerald-700">${esc(i.title)}</button>
        <div class="mt-1">${condBadge(i.cond)}</div>
        <div class="flex items-center gap-2 mt-3 text-xs text-slate-500">${avatar(o, 'w-6 h-6 text-[9px]')}<span class="truncate">${esc(o.name)} · ${esc(o.loc)}</span></div>
        <div class="mt-auto pt-3 flex items-center justify-between">${coin(i.value)}
          ${mine ? `<button onclick="retirar('${i.id}')" class="btn btn-sm btn-ghost">Retirar</button>` : u.role === 'operador' ? '' : `<div class="flex gap-1"><button onclick="proponerTrueque('${i.id}')" class="btn btn-sm btn-ghost" title="Proponer trueque"><i class="fa-solid fa-right-left"></i></button><button onclick="adquirir('${i.id}')" class="btn btn-sm btn-primary">Adquirir</button></div>`}
        </div>
      </div></div>`;
  }).join('')}</div>` : `<div class="card">${empty('No hay objetos con esos filtros.')}</div>`;
}
function itemDetail(id) {
  const i = item(id), u = me(), o = user(i.owner), mine = i.owner === u.id;
  openModal(`<div class="grid md:grid-cols-2 gap-6">
    <div class="rounded-2xl overflow-hidden">${thumb(i, 'w-full h-64')}</div>
    <div>
      <div class="text-xs text-slate-500">${CATS[i.cat].n}${i.brand ? ' · ' + esc(i.brand) : ''} · ${esc(i.year)}</div>
      <h2 class="text-2xl font-extrabold">${esc(i.title)}</h2>
      <div class="flex gap-2 flex-wrap mt-2">${condBadge(i.cond)}${i.hasData ? badge('Borrado seguro', 'sky', 'fa-shield-halved') : ''}</div>
      <p class="text-sm text-slate-600 mt-3">${esc(i.desc) || '<span class="text-slate-400">Sin descripción</span>'}</p>
      <div class="flex items-center gap-3 mt-4 p-3 bg-slate-50 rounded-xl">${avatar(o)}<div><div class="font-semibold text-sm">${esc(o.name)}</div><div class="text-xs text-slate-500">${ROLES[o.role].n} · ${esc(o.loc)}</div></div></div>
      <div class="text-3xl font-extrabold text-emerald-700 mt-4">🪙 ${fmt(i.value)}</div>
      <div class="text-xs text-slate-500">≈ ${fmt1(i.kg)} kg de RAEE con segunda vida · ${fmt(i.kg * 30)} kg CO₂e evitados (est.)</div>
      ${i.status === 'mercado' && !mine && u.role !== 'operador' ? `<div class="flex gap-2 mt-5"><button onclick="adquirir('${i.id}')" class="btn btn-primary flex-1"><i class="fa-solid fa-bag-shopping"></i>Adquirir</button><button onclick="proponerTrueque('${i.id}')" class="btn btn-ghost flex-1"><i class="fa-solid fa-right-left"></i>Trueque</button></div>` : ''}
    </div></div>`, true);
}
function adquirir(id) {
  const i = item(id), u = me();
  const ok = u.coins >= i.value;
  openModal(`<h2 class="text-xl font-bold mb-2">Confirmar adquisición</h2>
    <p class="text-sm text-slate-600 mb-4">Vas a adquirir <b>${esc(i.title)}</b> de ${esc(user(i.owner).name)}.</p>
    <div class="bg-slate-50 rounded-xl p-4 space-y-1 text-sm mb-4">
      <div class="flex justify-between"><span>Tu saldo</span>${coin(u.coins)}</div>
      <div class="flex justify-between"><span>Precio</span><span class="text-rose-600 font-bold">− ${fmt(i.value)}</span></div>
      <div class="flex justify-between border-t pt-1"><span>Saldo final</span>${coin(u.coins - i.value)}</div>
    </div>
    ${ok ? '' : '<p class="text-rose-600 text-sm mb-3"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Saldo insuficiente. Gana EcoCoins entregando RAEE o completando el módulo Aprende.</p>'}
    <div class="flex gap-2"><button onclick="closeModal()" class="btn btn-ghost flex-1">Cancelar</button><button ${ok ? '' : 'disabled'} onclick="doBuy('${i.id}')" class="btn btn-primary flex-1">Confirmar</button></div>`);
}
function doBuy(id) {
  const i = item(id), u = me();
  if (i.status !== 'mercado' || u.coins < i.value) return toast('No se pudo completar la operación', 'err');
  const seller = i.owner;
  addTx(u.id, seller, i.value, `Compra: ${i.title}`);
  i.owner = u.id; i.status = 'adquirido'; i.acquiredAt = Date.now();
  db.offers.filter(o => o.status === 'pendiente' && (o.give === id || o.get === id)).forEach(o => o.status = 'cancelada');
  notify(seller, `${esc(u.name)} adquirió tu "${esc(i.title)}". Recibiste 🪙 ${fmt(i.value)}.`, 'fa-coins');
  save(); closeModal(); toast('¡Listo! El objeto ya es tuyo. Coordina la entrega en el Eco-Hub más cercano.', 'ok'); render();
}
function retirar(id) { const i = item(id); i.status = 'por_recoger'; db.offers.filter(o => o.status === 'pendiente' && (o.give === id || o.get === id)).forEach(o => o.status = 'cancelada'); save(); toast('Retirado del mercado. Lo encuentras en Recolección → Mis objetos.', 'info'); render(); }
function republicar(id) { const i = item(id); i.status = 'mercado'; i.created = Date.now(); save(); toast('Publicado nuevamente en el mercado', 'ok'); render(); }

/* ------------------------------ TRUEQUES ---------------------------- */
function proponerTrueque(getId) {
  const u = me(), get = item(getId);
  const mine = db.items.filter(i => i.owner === u.id && i.status === 'mercado');
  openModal(`<h2 class="text-xl font-bold mb-1">Proponer trueque</h2>
    <p class="text-sm text-slate-500 mb-4">¿Qué ofreces a cambio de <b>${esc(get.title)}</b> (🪙 ${fmt(get.value)})? La diferencia se compensa con EcoCoins.</p>
    ${mine.length ? mine.map(g => {
      const diff = get.value - g.value;
      return `<button onclick="createOffer('${g.id}','${get.id}')" class="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl mb-2 hover:border-emerald-500 text-left">${thumb(g, 'w-14 h-14 rounded-lg')}<div class="flex-1"><div class="font-semibold text-sm">${esc(g.title)}</div><div class="text-xs text-slate-500">Vale 🪙 ${fmt(g.value)} · ${diff > 0 ? 'pagas ' + fmt(diff) : diff < 0 ? 'recibes ' + fmt(-diff) : 'exacto'}</div></div><i class="fa-solid fa-chevron-right text-slate-300"></i></button>`;
    }).join('') : empty('No tienes objetos publicados. Escanea uno primero.') + `<button onclick="closeModal();go('escanear')" class="btn btn-primary w-full">Escanear un objeto</button>`}`);
}
function createOffer(giveId, getId) {
  const u = me(), give = item(giveId), get = item(getId);
  const diff = get.value - give.value;
  if (diff > 0 && u.coins < diff) { closeModal(); return toast('No tienes EcoCoins suficientes para compensar la diferencia', 'err'); }
  const of = { id: nid('of'), from: u.id, to: get.owner, give: giveId, get: getId, diff, status: 'pendiente', date: Date.now() };
  db.offers.unshift(of);
  closeModal();
  if (get.owner === SYS) { // el sistema evalúa automáticamente
    const ratio = Math.abs(diff) / (Math.max(give.value, get.value) || 1);
    if (ratio <= 0.5) { acceptOffer(of.id, true); return; }
    of.status = 'rechazada'; save(); toast('El Eco-Hub rechazó el trueque: la diferencia de valor es mayor al 50%.', 'warn'); render(); return;
  }
  notify(get.owner, `${esc(u.name)} te propone un trueque: su "${esc(give.title)}" por tu "${esc(get.title)}".`, 'fa-handshake');
  save(); toast('Propuesta enviada. Te avisaremos cuando respondan.', 'ok'); render();
}
function acceptOffer(id, auto = false) {
  const of = db.offers.find(o => o.id === id);
  const give = item(of.give), get = item(of.get);
  if (give.status !== 'mercado' || get.status !== 'mercado' || give.owner !== of.from || get.owner !== of.to) { of.status = 'cancelada'; save(); render(); return toast('Uno de los objetos ya no está disponible', 'err'); }
  const payer = of.diff > 0 ? of.from : of.to, payee = of.diff > 0 ? of.to : of.from, amt = Math.abs(of.diff);
  if (amt && user(payer).coins < amt) return toast(`${esc(user(payer).name)} no tiene EcoCoins suficientes`, 'err');
  if (amt) addTx(payer, payee, amt, `Compensación trueque: ${give.title} ⇄ ${get.title}`);
  give.owner = of.to; get.owner = of.from; give.status = get.status = 'adquirido'; give.acquiredAt = get.acquiredAt = Date.now();
  of.status = 'aceptada'; of.closed = Date.now();
  db.offers.filter(o => o.status === 'pendiente' && o.id !== id && [o.give, o.get].some(x => x === give.id || x === get.id)).forEach(o => o.status = 'cancelada');
  notify(of.from, `¡Trueque aceptado! Recibiste "${esc(get.title)}".`, 'fa-handshake');
  notify(of.to, `Trueque completado: recibiste "${esc(give.title)}".`, 'fa-handshake');
  save(); toast(auto ? '¡El Eco-Hub aceptó tu trueque automáticamente!' : '¡Trueque completado!', 'ok'); render();
}
function rejectOffer(id) { const of = db.offers.find(o => o.id === id); of.status = 'rechazada'; notify(of.from, `Tu propuesta de trueque por "${esc(item(of.get).title)}" fue rechazada.`, 'fa-xmark'); save(); toast('Propuesta rechazada', 'info'); render(); }
function cancelOffer(id) { const of = db.offers.find(o => o.id === id); of.status = 'cancelada'; save(); render(); }
VIEWS.trueques = u => {
  const rec = db.offers.filter(o => o.to === u.id && o.status === 'pendiente');
  const sent = db.offers.filter(o => o.from === u.id && o.status === 'pendiente');
  const hist = db.offers.filter(o => (o.from === u.id || o.to === u.id) && o.status !== 'pendiente');
  const row = (o, actions) => {
    const g = item(o.give), t = item(o.get), other = user(o.from === u.id ? o.to : o.from);
    const pays = o.diff === 0 ? 'Trueque exacto' : (o.diff > 0) === (o.from === u.id) ? `Tú pagas 🪙 ${fmt(Math.abs(o.diff))}` : `Recibes 🪙 ${fmt(Math.abs(o.diff))}`;
    const st = { aceptada: ['Aceptada', 'emerald'], rechazada: ['Rechazada', 'rose'], cancelada: ['Cancelada', 'slate'], pendiente: ['Pendiente', 'amber'] }[o.status];
    return `<div class="border border-slate-200 rounded-2xl p-4 mb-3">
      <div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2 text-sm">${avatar(other, 'w-7 h-7 text-[10px]')}<b>${esc(other.name)}</b></div>${badge(st[0], st[1])}</div>
      <div class="flex items-center gap-3">
        <div class="flex-1 flex items-center gap-2 min-w-0">${thumb(g, 'w-14 h-14 rounded-lg shrink-0')}<div class="min-w-0"><div class="text-sm font-semibold truncate">${esc(g.title)}</div><div class="text-xs">🪙 ${fmt(g.value)}</div></div></div>
        <i class="fa-solid fa-right-left text-violet-500"></i>
        <div class="flex-1 flex items-center gap-2 min-w-0">${thumb(t, 'w-14 h-14 rounded-lg shrink-0')}<div class="min-w-0"><div class="text-sm font-semibold truncate">${esc(t.title)}</div><div class="text-xs">🪙 ${fmt(t.value)}</div></div></div>
      </div>
      <div class="flex items-center justify-between mt-3"><span class="text-xs text-slate-500">${pays} · ${fdate(o.date)}</span><div class="flex gap-2">${actions}</div></div></div>`;
  };
  return sectionTitle('Trueques', 'El algoritmo compensa con EcoCoins la asimetría de valor entre los objetos intercambiados.') + `
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6"><h2 class="font-bold text-lg mb-4"><i class="fa-solid fa-inbox text-emerald-600 mr-2"></i>Propuestas recibidas (${rec.length})</h2>
      ${rec.length ? rec.map(o => row(o, `<button onclick="rejectOffer('${o.id}')" class="btn btn-sm btn-danger">Rechazar</button><button onclick="acceptOffer('${o.id}')" class="btn btn-sm btn-primary">Aceptar</button>`)).join('') : empty('No tienes propuestas pendientes', 'fa-inbox')}</div>
    <div class="card p-6"><h2 class="font-bold text-lg mb-4"><i class="fa-solid fa-paper-plane text-sky-600 mr-2"></i>Propuestas enviadas (${sent.length})</h2>
      ${sent.length ? sent.map(o => row(o, `<button onclick="cancelOffer('${o.id}')" class="btn btn-sm btn-ghost">Cancelar</button>`)).join('') : empty('Explora el mercado o usa las sugerencias de la IA', 'fa-paper-plane')}</div>
    <div class="card p-6 lg:col-span-2"><h2 class="font-bold text-lg mb-4"><i class="fa-solid fa-wand-magic-sparkles text-violet-600 mr-2"></i>Sugerencias de matchmaking</h2>
      <div class="grid md:grid-cols-2 gap-x-4">${sugerencias(u, 6).map(sugCard).join('') || empty('Publica objetos para recibir sugerencias')}</div></div>
    <div class="card p-6 lg:col-span-2"><h2 class="font-bold text-lg mb-4"><i class="fa-solid fa-clock-rotate-left text-slate-500 mr-2"></i>Historial</h2>
      ${hist.length ? `<div class="grid md:grid-cols-2 gap-x-4">${hist.map(o => row(o, '')).join('')}</div>` : empty('Aún no hay historial', 'fa-clock-rotate-left')}</div>
  </div>`;
};

/* ----------------------------- RECOLECCIÓN -------------------------- */
function orderCard(o) {
  const idx = o.status === 'en_hub' && o.items.every(id => item(id).finalDest) ? 4 : ORDER_STEPS.findIndex(s => s[0] === o.status);
  const r = o.recicler ? user(o.recicler) : null;
  return `<div class="border border-slate-200 rounded-2xl p-4 mb-3">
    <div class="flex justify-between flex-wrap gap-2 text-sm"><div><b>Pedido #${o.id.slice(1)}</b> · ${esc(o.loc)} · ${esc(o.address)}</div><div class="text-slate-500 text-xs">${esc(o.slot)} · ${hub(o.hub).n}</div></div>
    <div class="flex flex-wrap gap-1 mt-2">${o.items.map(id => { const i = item(id); return `<span class="text-xs bg-slate-100 rounded-full px-2 py-0.5"><i class="fa-solid ${CATS[i.cat].icon} mr-1"></i>${esc(i.title)}${i.finalDest ? ' → ' + DESTS[i.finalDest].n.split(' (')[0] : ''}</span>`; }).join('')}</div>
    <div class="flex items-center mt-4">${ORDER_STEPS.map((s, k) => `<div class="flex-1 flex flex-col items-center text-center relative">
        ${k > 0 ? `<div class="absolute top-4 right-1/2 w-full h-0.5 ${k <= idx ? 'bg-emerald-500' : 'bg-slate-200'}"></div>` : ''}
        <div class="relative w-8 h-8 rounded-full flex items-center justify-center text-xs ${k <= idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}"><i class="fa-solid ${s[2]}"></i></div>
        <div class="text-[10px] mt-1 ${k <= idx ? 'text-emerald-700 font-semibold' : 'text-slate-400'}">${s[1]}</div></div>`).join('')}</div>
    ${r ? `<div class="text-xs text-slate-500 mt-3"><i class="fa-solid fa-truck-ramp-box mr-1"></i>Reciclador: <b>${esc(r.name)}</b></div>` : ''}
  </div>`;
}
VIEWS.recoleccion = u => {
  const avail = db.items.filter(i => i.owner === u.id && i.status === 'por_recoger');
  const acquired = db.items.filter(i => i.owner === u.id && i.status === 'adquirido');
  const orders = db.orders.filter(o => o.user === u.id);
  const hubDef = defaultHub(u);
  return sectionTitle('Recolección (logística inversa)', 'Nosotros vamos por tus equipos: no cargues aparatos pesados. Ruteo optimizado de última milla.') + `
  <div class="grid lg:grid-cols-5 gap-6">
    <form onsubmit="solicitarRecoleccion(event)" class="card p-6 lg:col-span-2 space-y-4">
      <h2 class="font-bold text-lg"><i class="fa-solid fa-truck text-sky-600 mr-2"></i>Nueva solicitud</h2>
      <div><label class="lbl">Objetos a recoger</label>
        ${avail.length ? avail.map(i => `<label class="flex items-center gap-3 p-2 border border-slate-200 rounded-xl mb-2 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"><input type="checkbox" name="items" value="${i.id}" checked>${thumb(i, 'w-10 h-10 rounded-lg')}<div class="flex-1 min-w-0"><div class="text-sm font-semibold truncate">${esc(i.title)}</div><div class="text-[11px] text-slate-500">${DESTS[i.dest].n.split(' (')[0]} · ~🪙 ${fmt(rewardFor(i.dest, i.value, i.kg))}</div></div>${i.dest === 'trueque' ? `<button type="button" onclick="republicar('${i.id}')" class="text-[11px] text-emerald-700 underline">Publicar</button>` : ''}</label>`).join('')
        : `<div class="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">No tienes objetos pendientes. <button type="button" onclick="go('escanear')" class="text-emerald-700 underline">Escanea uno</button>.</div>`}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="lbl">Localidad</label><select name="loc" class="inp" onchange="this.form.hub.value=nearestHub(...LOCALIDADES[this.value]).id">${locOpts(u.loc)}</select></div>
        <div><label class="lbl">Franja</label><select name="slot" class="inp"><option>Mañana (8am - 12m)</option><option>Tarde (2pm - 6pm)</option><option>Sábado (9am - 1pm)</option></select></div>
        <div class="col-span-2"><label class="lbl">Dirección</label><input name="address" required class="inp" placeholder="Calle 00 # 00-00, Apto"></div>
        <div class="col-span-2"><label class="lbl">Eco-Hub de destino (más cercano)</label><select name="hub" class="inp">${hubOpts(hubDef)}</select></div>
      </div>
      <button ${avail.length ? '' : 'disabled'} class="btn btn-primary w-full"><i class="fa-solid fa-calendar-check"></i>Programar recolección</button>
    </form>
    <div class="lg:col-span-3 space-y-6">
      <div class="card p-2 relative z-0"><div id="map" class="h-72 rounded-2xl"></div></div>
      <div class="card p-6"><h2 class="font-bold text-lg mb-4">Mis solicitudes</h2>${orders.length ? orders.map(orderCard).join('') : empty('Aún no has solicitado recolecciones', 'fa-truck')}</div>
      ${acquired.length ? `<div class="card p-6"><h2 class="font-bold text-lg mb-4">Mis objetos adquiridos</h2>${acquired.map(i => `<div class="flex items-center gap-3 p-2 border-b border-slate-100">${thumb(i, 'w-12 h-12 rounded-lg')}<div class="flex-1 text-sm font-semibold">${esc(i.title)}</div><button onclick="republicar('${i.id}')" class="btn btn-sm btn-ghost">Volver a publicar</button><button onclick="toRecoger('${i.id}')" class="btn btn-sm btn-ghost">Entregar a Eco-Hub</button></div>`).join('')}</div>` : ''}
    </div>
  </div>`;
};
AFTER.recoleccion = u => {
  const c = LOCALIDADES[u.loc];
  leafMap = baseMap('map', c, 12);
  db.orders.filter(o => o.user === u.id && o.status !== 'en_hub').forEach(o => {
    L.circleMarker([o.lat, o.lng], { radius: 9, color: '#0369a1', fillColor: '#38bdf8', fillOpacity: .9 }).addTo(leafMap).bindPopup(`<b>Pedido #${o.id.slice(1)}</b><br>${esc(o.address)}<br>${ORDER_STEPS.find(s => s[0] === o.status)[1]}`);
  });
};
function toRecoger(id) { const i = item(id); i.status = 'por_recoger'; i.donor = me().id; save(); render(); toast('Agregado a objetos por recoger', 'ok'); }
function solicitarRecoleccion(e) {
  e.preventDefault();
  const u = me(), f = new FormData(e.target), ids = f.getAll('items');
  if (!ids.length) return toast('Selecciona al menos un objeto', 'warn');
  const loc = f.get('loc'), [la, ln] = LOCALIDADES[loc];
  const o = { id: nid('o'), user: u.id, items: ids, loc, address: f.get('address'), slot: f.get('slot'), hub: f.get('hub'), lat: la + (Math.random() - .5) * 0.02, lng: ln + (Math.random() - .5) * 0.02, status: 'pendiente', recicler: null, created: Date.now() };
  db.orders.unshift(o);
  ids.forEach(id => { const i = item(id); i.status = 'en_ruta'; i.order = o.id; i.donor = u.id; });
  db.users.filter(x => x.role === 'reciclador').forEach(r => notify(r.id, `Nuevo pedido de recolección en ${loc} (${ids.length} objeto/s).`, 'fa-truck'));
  save(); toast('¡Recolección programada! Un reciclador tomará tu pedido.', 'ok'); render();
}

/* ------------------------------ RUTAS GIS --------------------------- */
VIEWS.rutas = u => {
  const isRec = u.role === 'reciclador';
  const hubId = ui.routeHub || defaultHub(u);
  const pend = db.orders.filter(o => o.status === 'pendiente');
  const mine = db.orders.filter(o => isRec ? (o.recicler === u.id && ['asignado', 'en_camino'].includes(o.status)) : ['asignado', 'en_camino'].includes(o.status));
  const r = ui.route;
  const ordRow = (o, actions) => `<div class="border border-slate-200 rounded-xl p-3 mb-2">
    <div class="flex justify-between text-sm"><b>#${o.id.slice(1)} · ${esc(o.loc)}</b>${badge(ORDER_STEPS.find(s => s[0] === o.status)[1], o.status === 'pendiente' ? 'amber' : 'sky')}</div>
    <div class="text-xs text-slate-500">${esc(o.address)} · ${esc(o.slot)}</div>
    <div class="text-xs text-slate-500">${o.items.length} objeto/s · ${fmt1(o.items.reduce((s, id) => s + item(id).kg, 0))} kg · ${esc(user(o.user).name)}${o.items.some(id => item(id).dest === 'toxico') ? ' · <span class="text-rose-600 font-semibold"><i class="fa-solid fa-biohazard"></i> contiene tóxicos</span>' : ''}</div>
    ${actions ? `<div class="flex gap-2 mt-2">${actions}</div>` : ''}</div>`;
  return sectionTitle('Rutas GIS · Logística inversa', 'Ruteo vehicular de última milla optimizado (heurística del vecino más cercano).') + `
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="card p-5">
        <label class="lbl">Eco-Hub base (inicio y fin de la ruta)</label>
        <select class="inp mb-3" onchange="ui.routeHub=this.value;ui.route=null;render()">${hubOpts(hubId)}</select>
        <button onclick="optimizeRoute()" class="btn btn-primary w-full"><i class="fa-solid fa-route"></i>Optimizar ruta</button>
        ${r ? `<div class="grid grid-cols-3 gap-2 mt-4 text-center">
          <div class="bg-emerald-50 rounded-xl p-2"><div class="text-lg font-extrabold text-emerald-700">${fmt1(r.km)} km</div><div class="text-[10px] text-slate-500">Distancia</div></div>
          <div class="bg-sky-50 rounded-xl p-2"><div class="text-lg font-extrabold text-sky-700">${r.min} min</div><div class="text-[10px] text-slate-500">Tiempo est.</div></div>
          <div class="bg-amber-50 rounded-xl p-2"><div class="text-lg font-extrabold text-amber-700">${r.naive > r.km ? Math.round((1 - r.km / r.naive) * 100) : 0}%</div><div class="text-[10px] text-slate-500">Ahorro vs. sin optimizar</div></div></div>
          <ol class="mt-3 text-xs space-y-1">${['<b>Salida:</b> ' + hub(r.hub).n, ...r.seq.map((id, k) => { const o = db.orders.find(x => x.id === id); return o ? `<b>Parada ${k + 1}:</b> ${esc(o.loc)} – ${esc(o.address)}` : ''; }), '<b>Llegada:</b> ' + hub(r.hub).n].map(x => `<li class="flex gap-2"><i class="fa-solid fa-location-dot text-emerald-600 mt-0.5"></i><span>${x}</span></li>`).join('')}</ol>` : ''}
      </div>
      <div class="card p-5"><h2 class="font-bold mb-3">${isRec ? 'Mis pedidos asignados' : 'Pedidos en curso'} (${mine.length})</h2>
        ${mine.length ? mine.map(o => ordRow(o, isRec ? (o.status === 'asignado' ? `<button onclick="setOrder('${o.id}','en_camino')" class="btn btn-sm btn-blue"><i class="fa-solid fa-truck-fast"></i>Iniciar</button>` : `<button onclick="entregarHub('${o.id}')" class="btn btn-sm btn-primary"><i class="fa-solid fa-warehouse"></i>Recogido y entregado en Hub</button>`) : '')).join('') : empty('Sin pedidos en curso', 'fa-truck')}</div>
      <div class="card p-5"><h2 class="font-bold mb-3">Pedidos disponibles (${pend.length})</h2>
        ${pend.length ? pend.map(o => ordRow(o, isRec ? `<button onclick="tomarPedido('${o.id}')" class="btn btn-sm btn-primary"><i class="fa-solid fa-hand"></i>Tomar pedido</button>` : '')).join('') : empty('No hay pedidos pendientes', 'fa-clipboard-check')}</div>
    </div>
    <div class="lg:col-span-3"><div class="card p-2 sticky top-20 relative z-0"><div id="map" class="h-[560px] rounded-2xl"></div>
      <div class="flex gap-4 text-xs text-slate-500 p-2"><span><span class="inline-block w-3 h-3 rounded-full bg-emerald-600 mr-1"></span>Eco-Hub</span><span><span class="inline-block w-3 h-3 rounded-full bg-amber-400 mr-1"></span>Pendiente</span><span><span class="inline-block w-3 h-3 rounded-full bg-sky-500 mr-1"></span>Asignado / en camino</span></div></div></div>
  </div>`;
};
AFTER.rutas = u => {
  leafMap = baseMap('map', [4.68, -74.09], 12);
  db.orders.filter(o => ['pendiente', 'asignado', 'en_camino'].includes(o.status)).forEach(o => {
    const col = o.status === 'pendiente' ? '#f59e0b' : '#0ea5e9';
    L.circleMarker([o.lat, o.lng], { radius: 9, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1 }).addTo(leafMap).bindPopup(`<b>#${o.id.slice(1)} · ${esc(o.loc)}</b><br>${esc(o.address)}<br>${o.items.length} objeto/s`);
  });
  const r = ui.route;
  if (r) {
    const h = hub(r.hub);
    const pts = [[h.lat, h.lng], ...r.seq.map(id => db.orders.find(o => o.id === id)).filter(Boolean).map(o => [o.lat, o.lng]), [h.lat, h.lng]];
    L.polyline(pts, { color: '#059669', weight: 5, opacity: .8, dashArray: '10 6' }).addTo(leafMap);
    pts.slice(1, -1).forEach((p, k) => L.marker(p, { icon: L.divIcon({ className: '', html: `<div style="background:#059669;color:#fff;border-radius:999px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${k + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(leafMap));
    leafMap.fitBounds(pts, { padding: [40, 40] });
  }
};
function optimizeRoute() {
  const u = me(), h = hub(ui.routeHub || defaultHub(u));
  const pts = db.orders.filter(o => u.role === 'reciclador' ? (o.recicler === u.id && ['asignado', 'en_camino'].includes(o.status)) : ['pendiente', 'asignado', 'en_camino'].includes(o.status));
  if (!pts.length) return toast(u.role === 'reciclador' ? 'Primero toma al menos un pedido' : 'No hay pedidos activos', 'warn');
  const seq = [], rest = pts.slice(); let cur = h, km = 0;
  while (rest.length) {
    let bi = 0, bd = Infinity;
    rest.forEach((o, k) => { const d = hav(cur, o); if (d < bd) { bd = d; bi = k; } });
    km += bd; cur = rest[bi]; seq.push(cur.id); rest.splice(bi, 1);
  }
  km += hav(cur, h);
  let naive = 0; cur = h; pts.slice().sort((a, b) => a.created - b.created).forEach(o => { naive += hav(cur, o); cur = o; }); naive += hav(cur, h);
  ui.route = { hub: h.id, seq, km, naive, min: Math.round(km / 20 * 60 + seq.length * 8) };
  render(); toast(`Ruta optimizada: ${fmt1(km)} km, ${seq.length} parada/s`, 'ok');
}
function tomarPedido(id) { const o = db.orders.find(x => x.id === id), u = me(); o.recicler = u.id; o.status = 'asignado'; notify(o.user, `${esc(u.name)} tomó tu pedido de recolección #${id.slice(1)}.`, 'fa-user-check'); ui.route = null; save(); toast('Pedido asignado a tu ruta', 'ok'); render(); }
function setOrder(id, st) { const o = db.orders.find(x => x.id === id); o.status = st; if (st === 'en_camino') notify(o.user, `Tu reciclador va en camino (pedido #${id.slice(1)}).`, 'fa-truck-fast'); save(); render(); }
function entregarHub(id) {
  const o = db.orders.find(x => x.id === id), u = me();
  o.status = 'en_hub'; o.delivered = Date.now();
  o.items.forEach(iid => { const i = item(iid); i.status = 'en_hub'; i.hub = o.hub; });
  addTx(SYS, u.id, 15 + 5 * o.items.length, `Pago recolección pedido #${id.slice(1)}`);
  notify(o.user, `Tus objetos llegaron a ${hub(o.hub).n}. Pronto recibirás tus EcoCoins tras el diagnóstico.`, 'fa-warehouse');
  ui.route = null; save(); toast(`Entregado. Ganaste 🪙 ${15 + 5 * o.items.length}`, 'ok'); render();
}

/* ------------------------------- ECO-HUB ---------------------------- */
VIEWS.hub = u => {
  const queue = db.items.filter(i => i.status === 'en_hub');
  const processed = db.items.filter(i => i.finalDest);
  const kg = processed.reduce((s, i) => s + i.kg, 0);
  const tox = processed.filter(i => i.finalDest === 'toxico').length;
  const prints = db.prints.filter(p => p.status !== 'entregado').length;
  return sectionTitle(`${hub(u.hub).n}`, 'Centro de diagnóstico estandarizado: triage, pesaje, borrado seguro, cuarto de tóxicos y laboratorio 3D.') + `
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${kpi('En cola de triage', queue.length, 'fa-list-check', 'amber')}
    ${kpi('Kg procesados', fmt1(kg), 'fa-weight-hanging', 'sky')}
    ${kpi('Certificados de borrado', db.certs.length, 'fa-shield-halved')}
    ${kpi('Tóxicos en cuarto seguro', tox, 'fa-biohazard', 'rose')}
  </div>
  <div class="card p-6 mb-6">
    <h2 class="font-bold text-lg mb-1"><i class="fa-solid fa-list-check text-amber-500 mr-2"></i>Zona de triage y pesaje</h2>
    <p class="text-xs text-slate-500 mb-4">Confirma el destino sugerido por la IA, registra el peso real y certifica el borrado de datos.</p>
    ${queue.length ? `<div class="space-y-3">${queue.map(i => `
      <div class="border border-slate-200 rounded-2xl p-4 grid md:grid-cols-12 gap-3 items-center">
        <div class="md:col-span-4 flex items-center gap-3">${thumb(i, 'w-14 h-14 rounded-xl shrink-0')}<div class="min-w-0"><div class="font-semibold text-sm">${esc(i.title)}</div><div class="text-[11px] text-slate-500">${CATS[i.cat].n} · Donante: ${esc(user(i.donor).name)}</div><div class="mt-1">${condBadge(i.cond)}</div></div></div>
        <div class="md:col-span-3"><label class="lbl">Destino <span class="normal-case text-violet-600">(IA: ${DESTS[i.dest].n.split(' (')[0]})</span></label><select id="dest-${i.id}" class="inp text-xs" ${i.dest === 'toxico' ? 'disabled' : ''}>${opts(DESTS, i.dest)}</select></div>
        <div class="md:col-span-2"><label class="lbl">Peso real (kg)</label><input id="kg-${i.id}" type="number" step="0.05" min="0.01" value="${i.kg}" class="inp text-xs"></div>
        <div class="md:col-span-3 flex flex-col gap-2">
          ${i.hasData ? `<label class="text-xs flex items-center gap-2 bg-sky-50 text-sky-800 p-2 rounded-lg"><input type="checkbox" id="wipe-${i.id}">Borrado seguro NIST 800-88 realizado</label>` : ''}
          <button onclick="procesar('${i.id}')" class="btn btn-sm btn-primary"><i class="fa-solid fa-check"></i>Procesar y pagar EcoCoins</button>
        </div>
      </div>`).join('')}</div>` : empty('No hay equipos en cola. ¡Todo procesado!', 'fa-circle-check')}
  </div>
  <div class="grid md:grid-cols-4 gap-4 mb-6">
    ${[['fa-arrows-rotate', 'Reacondicionamiento', 'trueque', 'emerald'], ['fa-gem', 'Minería urbana', 'mineria', 'amber'], ['fa-recycle', 'Downcycling', 'downcycling', 'sky'], ['fa-biohazard', 'Cuarto seguro', 'toxico', 'rose']].map(([ic, n, d, c]) => {
      const its = processed.filter(i => i.finalDest === d);
      return `<div class="card p-4 border-l-4 border-${c}-500"><div class="text-${c}-600"><i class="fa-solid ${ic} mr-1"></i><b>${n}</b></div><div class="text-2xl font-extrabold mt-1">${its.length} <span class="text-sm font-normal text-slate-500">objetos</span></div><div class="text-xs text-slate-500">${fmt1(its.reduce((s, i) => s + i.kg, 0))} kg</div></div>`;
    }).join('')}
  </div>
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="card p-6"><h2 class="font-bold mb-3">Distribución por destino (kg)</h2><canvas id="ch-dest" height="220"></canvas></div>
    <div class="card p-6"><h2 class="font-bold mb-3">Últimos certificados de borrado</h2>
      ${db.certs.slice(0, 6).map(c => `<div class="flex items-center gap-3 py-2 border-b border-slate-100"><i class="fa-solid fa-shield-halved text-sky-600"></i><div class="flex-1 text-sm"><b>${c.id}</b> · ${esc(c.itemTitle)}<div class="text-[11px] text-slate-500">${esc(user(c.user).name)} · ${fdate(c.date)}</div></div><button onclick="openCert('${c.id}')" class="btn btn-sm btn-ghost">Ver</button></div>`).join('') || empty('Sin certificados')}
      <p class="text-xs text-slate-500 mt-3"><i class="fa-solid fa-cube mr-1"></i>${prints} repuesto/s en cola del laboratorio 3D · <button onclick="go('impresion')" class="underline">ver</button></p></div>
  </div>`;
};
AFTER.hub = () => destChart('ch-dest');
function procesar(id) {
  const i = item(id), u = me();
  const dest = i.dest === 'toxico' ? 'toxico' : $('#dest-' + id).value;
  const kg = parseFloat($('#kg-' + id).value) || i.kg;
  const wipeEl = $('#wipe-' + id);
  if (i.hasData && dest !== 'toxico' && !(wipeEl && wipeEl.checked)) return toast('Debes certificar el borrado seguro de datos antes de procesar este equipo.', 'warn');
  const reward = rewardFor(dest, i.value, kg);
  addTx(SYS, i.donor, reward, `Entrega en Eco-Hub: ${i.title}`);
  let certTxt = '';
  if (i.hasData && wipeEl && wipeEl.checked) {
    const c = { id: `CERT-${new Date().getFullYear()}-${String(db.certs.length + 1).padStart(4, '0')}`, item: i.id, itemTitle: i.title, user: i.donor, hub: u.hub || i.hub, method: 'NIST SP 800-88 Rev.1 (Purge)', operator: u.name, date: Date.now() };
    db.certs.unshift(c); certTxt = ` Certificado de borrado ${c.id} emitido.`;
  }
  i.finalDest = dest; i.kg = kg; i.processedAt = Date.now();
  if (dest === 'trueque') {
    i.owner = SYS; i.status = 'mercado'; i.cond = i.cond === 'danado' ? 'reparable' : i.cond; i.value = Math.max(20, Math.round(i.value * 1.1)); i.created = Date.now();
    if (!/reacondicionado/i.test(i.title)) i.title += ' (reacondicionado)';
  } else i.status = 'procesado';
  notify(i.donor, `Tu "${esc(i.title)}" fue diagnosticado → ${DESTS[dest].n}. Recibiste 🪙 ${fmt(reward)}.${certTxt}`, 'fa-coins');
  save(); toast(`Procesado: ${DESTS[dest].n}. Donante recibe 🪙 ${fmt(reward)}.${certTxt}`, 'ok'); render();
}
function openCert(id) {
  const c = db.certs.find(x => x.id === id);
  openModal(`<div id="cert" class="border-4 border-double border-emerald-600 rounded-2xl p-6 text-center">
    <i class="fa-solid fa-shield-halved text-4xl text-emerald-600"></i>
    <h2 class="text-2xl font-extrabold mt-2">Certificado de Borrado Seguro</h2>
    <p class="text-xs text-slate-500">ECO SWAP · ${hub(c.hub).n}</p>
    <p class="mt-4 text-sm">Se certifica que el dispositivo <b>${esc(c.itemTitle)}</b>, entregado por <b>${esc(user(c.user).name)}</b>, fue sometido a borrado seguro de datos mediante el método <b>${esc(c.method)}</b>, quedando la información irrecuperable.</p>
    <div class="grid grid-cols-2 gap-2 text-xs mt-4 text-left bg-slate-50 p-3 rounded-xl"><div><b>Código:</b> ${c.id}</div><div><b>Fecha:</b> ${fdate(c.date)}</div><div><b>Operador:</b> ${esc(c.operator)}</div><div><b>Verificación:</b> ${btoa(c.id).slice(0, 12)}</div></div>
  </div>
  <button onclick="printCert('${c.id}')" class="btn btn-primary w-full mt-4"><i class="fa-solid fa-print"></i>Imprimir / Guardar PDF</button>`);
}
function printCert(id) {
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>${id}</title><script src="https://cdn.tailwindcss.com"><\/script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></head><body class="p-10">${$('#cert').outerHTML}<script>setTimeout(()=>print(),800)<\/script></body></html>`);
  w.document.close();
}

/* ----------------------------- IMPRESIÓN 3D ------------------------- */
VIEWS.impresion = u => {
  const isOp = u.role === 'operador';
  const list = isOp ? db.prints : db.prints.filter(p => p.user === u.id);
  const ST = { pendiente: ['En cola', 'amber'], imprimiendo: ['Imprimiendo', 'sky'], listo: ['Listo para recoger', 'emerald'], entregado: ['Entregado', 'slate'] };
  const NEXT = { pendiente: 'imprimiendo', imprimiendo: 'listo', listo: 'entregado' };
  return sectionTitle('Laboratorio de manufactura aditiva', 'Repuestos descatalogados y carcasas impresas en 3D con plástico reciclado en los Eco-Hubs.') + `
  ${isOp ? '' : `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">${PARTS.map(p => `<div class="card p-5 flex flex-col">
      <div class="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl mb-3"><i class="fa-solid ${p.icon}"></i></div>
      <div class="font-bold">${p.n}</div><div class="text-xs text-slate-500 mb-3">PLA/ABS reciclado · 24-48 h</div>
      <div class="mt-auto flex items-center justify-between">${coin(p.cost)}<button onclick="pedirPieza('${p.id}')" class="btn btn-sm btn-primary"><i class="fa-solid fa-cube"></i>Solicitar</button></div></div>`).join('')}</div>`}
  <div class="card p-6"><h2 class="font-bold text-lg mb-4">${isOp ? 'Cola de impresión' : 'Mis solicitudes'}</h2>
    ${list.length ? `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-xs text-slate-500 border-b"><th class="py-2">Pieza</th>${isOp ? '<th>Usuario</th>' : ''}<th>Eco-Hub</th><th>Fecha</th><th>Estado</th>${isOp ? '<th></th>' : ''}</tr></thead><tbody>
      ${list.map(p => { const part = PARTS.find(x => x.id === p.part); return `<tr class="border-b border-slate-100"><td class="py-2 font-semibold"><i class="fa-solid ${part.icon} text-violet-500 mr-2"></i>${part.n}</td>${isOp ? `<td>${esc(user(p.user).name)}</td>` : ''}<td class="text-xs">${hub(p.hub).n}</td><td class="text-xs">${fdate(p.date)}</td><td>${badge(...ST[p.status])}</td>${isOp ? `<td>${NEXT[p.status] ? `<button onclick="avanzarPieza('${p.id}')" class="btn btn-sm btn-ghost">→ ${ST[NEXT[p.status]][0]}</button>` : ''}</td>` : ''}</tr>`; }).join('')}
    </tbody></table></div>` : empty('Sin solicitudes de impresión', 'fa-cube')}</div>`;
};
function pedirPieza(pid) {
  const u = me(), p = PARTS.find(x => x.id === pid);
  if (u.coins < p.cost) return toast('EcoCoins insuficientes', 'err');
  addTx(u.id, SYS, p.cost, `Impresión 3D: ${p.n}`);
  db.prints.unshift({ id: nid('p'), user: u.id, part: pid, hub: defaultHub(u), status: 'pendiente', date: Date.now() });
  save(); toast(`Solicitud enviada al laboratorio de ${hub(defaultHub(u)).n}`, 'ok'); render();
}
function avanzarPieza(id) {
  const p = db.prints.find(x => x.id === id);
  p.status = { pendiente: 'imprimiendo', imprimiendo: 'listo', listo: 'entregado' }[p.status];
  if (p.status === 'listo') notify(p.user, `Tu repuesto "${PARTS.find(x => x.id === p.part).n}" está listo en ${hub(p.hub).n}.`, 'fa-cube');
  save(); render();
}

/* ------------------------------ BILLETERA --------------------------- */
VIEWS.billetera = u => {
  const txs = db.txs.filter(t => t.from === u.id || t.to === u.id);
  const inc = txs.filter(t => t.to === u.id).reduce((s, t) => s + t.amount, 0);
  const out = txs.filter(t => t.from === u.id).reduce((s, t) => s + t.amount, 0);
  const certs = db.certs.filter(c => c.user === u.id);
  return sectionTitle('Billetera EcoCoins', 'Token virtual interno que compensa la asimetría de valor entre artículos intercambiados.') + `
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="space-y-6">
      <div class="rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-800 text-white p-6">
        <div class="text-sm opacity-70">Saldo disponible</div><div class="text-4xl font-extrabold mt-1">🪙 ${fmt(u.coins)}</div>
        <div class="flex gap-6 mt-6 text-sm"><div><div class="opacity-70 text-xs">Ingresos</div><div class="font-bold text-emerald-300">+${fmt(inc)}</div></div><div><div class="opacity-70 text-xs">Egresos</div><div class="font-bold text-rose-300">−${fmt(out)}</div></div></div>
        <div class="text-[10px] opacity-50 mt-4">ID billetera: ECO-${u.id.toUpperCase()}-${btoa(encodeURIComponent(u.name)).replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}</div>
      </div>
      <form onsubmit="transferir(event)" class="card p-5 space-y-3"><h2 class="font-bold"><i class="fa-solid fa-paper-plane text-emerald-600 mr-2"></i>Transferir EcoCoins</h2>
        <select name="to" class="inp">${db.users.filter(x => x.id !== u.id && !['sistema', 'operador'].includes(x.role)).map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
        <input name="amount" type="number" min="1" required class="inp" placeholder="Cantidad">
        <input name="concept" class="inp" placeholder="Concepto (opcional)">
        <button class="btn btn-primary w-full">Enviar</button></form>
      <div class="card p-5"><h2 class="font-bold mb-3"><i class="fa-solid fa-shield-halved text-sky-600 mr-2"></i>Mis certificados de borrado</h2>
        ${certs.length ? certs.map(c => `<button onclick="openCert('${c.id}')" class="w-full text-left flex items-center gap-3 py-2 border-b border-slate-100 hover:bg-slate-50"><i class="fa-solid fa-file-shield text-sky-600"></i><div class="text-sm flex-1"><b>${c.id}</b><div class="text-[11px] text-slate-500">${esc(c.itemTitle)}</div></div><i class="fa-solid fa-chevron-right text-slate-300"></i></button>`).join('') : '<p class="text-sm text-slate-500">Cuando entregues equipos con datos, aquí verás tus certificados.</p>'}</div>
    </div>
    <div class="card p-6 lg:col-span-2"><h2 class="font-bold text-lg mb-4">Movimientos</h2>
      ${txs.length ? `<div class="divide-y divide-slate-100">${txs.map(t => { const inn = t.to === u.id; const other = user(inn ? t.from : t.to); return `<div class="flex items-center gap-3 py-3"><div class="w-10 h-10 rounded-full flex items-center justify-center ${inn ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}"><i class="fa-solid ${inn ? 'fa-arrow-down' : 'fa-arrow-up'}"></i></div><div class="flex-1 min-w-0"><div class="text-sm font-semibold truncate">${esc(t.concept)}</div><div class="text-[11px] text-slate-500">${other ? esc(other.name) + ' · ' : ''}${fdate(t.date)}</div></div><div class="font-bold ${inn ? 'text-emerald-600' : 'text-rose-600'}">${inn ? '+' : '−'}${fmt(t.amount)}</div></div>`; }).join('')}</div>` : empty('Sin movimientos', 'fa-receipt')}</div>
  </div>`;
};
function transferir(e) {
  e.preventDefault();
  const u = me(), f = new FormData(e.target), amt = parseInt(f.get('amount'));
  if (!(amt > 0)) return;
  if (u.coins < amt) return toast('Saldo insuficiente', 'err');
  addTx(u.id, f.get('to'), amt, f.get('concept') || 'Transferencia');
  notify(f.get('to'), `${esc(u.name)} te envió 🪙 ${fmt(amt)}.`, 'fa-coins');
  save(); toast('Transferencia realizada', 'ok'); render();
}

/* -------------------------------- APRENDE --------------------------- */
const QUIZ = [
  { q: '¿Formatear un disco duro elimina definitivamente tus datos?', o: ['Sí, quedan borrados para siempre', 'No, pueden recuperarse con software especializado', 'Solo si el disco es nuevo'], a: 1 },
  { q: '¿Qué debes hacer con una batería hinchada?', o: ['Botarla en la basura común', 'Cargarla para ver si funciona', 'Aislarla en un lugar fresco y entregarla para gestión de tóxicos'], a: 2 },
  { q: '¿Qué metales se recuperan de las tarjetas electrónicas (PCB) en minería urbana?', o: ['Oro, cobre y paladio', 'Solo hierro', 'Ninguno, no tienen valor'], a: 0 },
  { q: '¿Para qué sirven las EcoCoins?', o: ['Para compensar la diferencia de valor en los trueques', 'Para pagar servicios públicos', 'No tienen uso'], a: 0 },
  { q: '¿Por qué los buzones tradicionales dañan los equipos?', o: ['Porque son muy pequeños', 'Por contaminación cruzada: fricción y polvo químico de tóners', 'Porque están al aire libre'], a: 1 }
];
VIEWS.aprende = u => {
  const done = db.quiz[u.id];
  const mods = [
    ['fa-shield-halved', 'sky', 'Borrado seguro de datos', ['Formatear o "restablecer" NO es suficiente: los datos pueden recuperarse.', 'Celulares: cifra el dispositivo, cierra sesión de tus cuentas y luego restablece de fábrica.', 'PC: usa herramientas de sobrescritura (ej. DBAN, borrado seguro del fabricante para SSD).', 'En los Eco-Hubs aplicamos el estándar NIST SP 800-88 y te entregamos un certificado.']],
    ['fa-house-chimney-crack', 'amber', 'Hibernación tecnológica', ['Muchos hogares guardan equipos por miedo a perder datos o por falta de incentivos.', 'Cada año que un equipo se guarda, pierde valor de reúso.', 'Con Eco Swap recibes EcoCoins y garantías de privacidad.']],
    ['fa-biohazard', 'rose', 'Manejo de tóxicos', ['Baterías hinchadas pueden incendiarse: no las perfores ni las cargues.', 'Los tóners contienen polvo químico: guárdalos en bolsa cerrada.', 'Entregamos estos residuos a gestores certificados (EcoCómputo, LITO S.A.S.).']],
    ['fa-arrows-spin', 'emerald', 'Cierre del ciclo', ['Reúso y trueque → técnicos, estudiantes y familias.', 'Minería urbana → oro, cobre y paladio de PCB quemadas.', 'Downcycling → plásticos ABS/PC triturados para madera plástica.', 'Impresión 3D → repuestos descatalogados.']]
  ];
  return sectionTitle('Aprende', 'Módulos de pedagogía ambiental y de seguridad de datos. Completa el reto y gana 50 EcoCoins.') + `
  <div class="grid md:grid-cols-2 gap-4 mb-8">${mods.map(([ic, c, t, pts]) => `<div class="card p-6"><div class="flex items-center gap-3 mb-3"><div class="w-11 h-11 rounded-xl bg-${c}-100 text-${c}-600 flex items-center justify-center text-lg"><i class="fa-solid ${ic}"></i></div><h3 class="font-bold">${t}</h3></div><ul class="space-y-2 text-sm text-slate-600">${pts.map(p => `<li class="flex gap-2"><i class="fa-solid fa-check text-${c}-500 mt-1"></i><span>${p}</span></li>`).join('')}</ul></div>`).join('')}</div>
  <form onsubmit="submitQuiz(event)" class="card p-6">
    <h2 class="font-bold text-lg mb-1"><i class="fa-solid fa-trophy text-amber-500 mr-2"></i>Reto Eco Swap</h2>
    <p class="text-sm text-slate-500 mb-4">${done ? '✅ Ya completaste el reto y recibiste tu recompensa. Puedes repetirlo para practicar.' : 'Responde todas correctamente y gana 🪙 50.'}</p>
    ${QUIZ.map((q, k) => `<div class="mb-4"><p class="font-semibold text-sm mb-2">${k + 1}. ${q.q}</p>${q.o.map((o, j) => `<label class="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="radio" name="q${k}" value="${j}" required>${o}</label>`).join('')}</div>`).join('')}
    <button class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i>Enviar respuestas</button>
  </form>`;
};
function submitQuiz(e) {
  e.preventDefault();
  const u = me(), f = new FormData(e.target);
  const ok = QUIZ.filter((q, k) => parseInt(f.get('q' + k)) === q.a).length;
  if (ok === QUIZ.length) {
    if (!db.quiz[u.id]) { db.quiz[u.id] = Date.now(); addTx(SYS, u.id, 50, 'Recompensa: Reto Aprende'); save(); toast('¡Perfecto! Ganaste 🪙 50 EcoCoins', 'ok'); render(); }
    else toast('¡Perfecto! (la recompensa ya fue reclamada)', 'ok');
  } else toast(`Tuviste ${ok}/${QUIZ.length} correctas. ¡Inténtalo de nuevo!`, 'warn');
}

/* -------------------------------- IMPACTO --------------------------- */
VIEWS.impacto = () => {
  const proc = db.items.filter(i => i.finalDest);
  const reused = db.items.filter(i => i.status === 'adquirido' || i.finalDest === 'trueque');
  const kg = proc.reduce((s, i) => s + i.kg, 0) + db.items.filter(i => i.status === 'adquirido' && !i.finalDest).reduce((s, i) => s + i.kg, 0);
  const co2 = proc.reduce((s, i) => s + i.kg * DESTS[i.finalDest].co2, 0) + db.items.filter(i => i.status === 'adquirido' && !i.finalDest).reduce((s, i) => s + i.kg * 30, 0);
  const pcbKg = proc.filter(i => i.finalDest === 'mineria').reduce((s, i) => s + i.kg, 0);
  const circ = db.users.filter(u => u.id !== SYS).reduce((s, u) => s + u.coins, 0);
  return sectionTitle('Impacto ambiental y social', 'Indicadores en tiempo real del ecosistema Eco Swap (valores estimados con factores de referencia).') + `
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${kpi('Kg de RAEE recuperados', fmt1(kg), 'fa-weight-hanging', 'emerald')}
    ${kpi('Objetos con segunda vida', reused.length, 'fa-arrows-rotate', 'sky')}
    ${kpi('Kg CO₂e evitados (est.)', fmt(co2), 'fa-leaf', 'emerald')}
    ${kpi('EcoCoins en circulación', fmt(circ), 'fa-coins', 'amber')}
  </div>
  <div class="grid grid-cols-3 gap-4 mb-6">
    ${[['Oro', 0.25, 'g', 'amber'], ['Cobre', 150, 'g', 'orange'], ['Paladio', 0.1, 'g', 'slate']].map(([n, f, un, c]) => `<div class="card p-4 text-center"><i class="fa-solid fa-gem text-${c}-500 text-2xl"></i><div class="text-xl font-extrabold mt-1">${fmt1(pcbKg * f)} ${un}</div><div class="text-xs text-slate-500">${n} recuperable (minería urbana)</div></div>`).join('')}
  </div>
  <div class="grid lg:grid-cols-2 gap-6 mb-6">
    <div class="card p-6"><h2 class="font-bold mb-3">Destino de los materiales (kg)</h2><canvas id="ch-dest" height="230"></canvas></div>
    <div class="card p-6"><h2 class="font-bold mb-3">Kg por categoría de equipo</h2><canvas id="ch-cat" height="230"></canvas></div>
  </div>
  <div class="card p-2 relative z-0"><div class="px-4 pt-3 font-bold">Red de Eco-Hubs en Bogotá</div><div id="map" class="h-96 rounded-2xl mt-2"></div></div>`;
};
AFTER.impacto = () => {
  destChart('ch-dest');
  const by = {};
  db.items.filter(i => i.finalDest || i.status === 'adquirido').forEach(i => { by[i.cat] = (by[i.cat] || 0) + i.kg; });
  const ks = Object.keys(by);
  charts.push(new Chart($('#ch-cat'), { type: 'bar', data: { labels: ks.map(k => CATS[k].n), datasets: [{ data: ks.map(k => +by[k].toFixed(2)), backgroundColor: '#0ea5e9', borderRadius: 8 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } }));
  leafMap = baseMap('map', [4.68, -74.09], 11);
};
function destChart(id) {
  const el = $('#' + id); if (!el) return;
  const ks = Object.keys(DESTS);
  const vals = ks.map(k => +db.items.filter(i => i.finalDest === k).reduce((s, i) => s + i.kg, 0).toFixed(2));
  charts.push(new Chart(el, { type: 'doughnut', data: { labels: ks.map(k => DESTS[k].n.split(' (')[0]), datasets: [{ data: vals, backgroundColor: ['#10b981', '#f59e0b', '#0ea5e9', '#f43f5e'] }] }, options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' } }));
}

/* ---------------------------------- MAPA ---------------------------- */
function baseMap(id, center, zoom) {
  if (typeof L === 'undefined' || !$('#' + id)) return null;
  const m = L.map(id, { scrollWheelZoom: false }).setView(center, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
  HUBS.forEach(h => {
    const q = db.items.filter(i => i.status === 'en_hub' && i.hub === h.id).length;
    L.marker([h.lat, h.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#047857;color:#fff;border-radius:12px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"><i class="fa-solid fa-warehouse" style="font-size:13px"></i></div>', iconSize: [32, 32], iconAnchor: [16, 16] }) })
      .addTo(m).bindPopup(`<b>${h.n}</b><br>Triage · Pesaje · Cuarto seguro · Lab 3D<br>En cola: ${q}`);
  });
  setTimeout(() => m.invalidateSize(), 100);
  return m;
}

boot();
