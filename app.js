/* ============================================================
   Dar El Djazair Kitchen — app.js
   Bistro menu & quick-order logic for Batna City.

   MARKER: everything the next step (Step 3) touches is inside
   the `dataService` block below. Swap localStorage for Supabase
   there without touching the UI.
   ============================================================ */

/* ================= MENU DATA (realistic Algerian dishes) ================ */
const MENU = [
  { id: "cbc",   name: "Chakhchoukha Batnia", desc: "Semolina wheat pasta in a fragrant spiced tomato base",             price: 850,  cat: "Traditional", time: 35, icon: "utensils", available: true },
  { id: "mech",  name: "Mechoui Plate",       desc: "Slow-roasted lamb in garbanzo beans, harissa and preserved olives",   price: 1400, cat: "Grills",      time: 45, icon: "flame",     available: true },
  { id: "shaw",  name: "Chicken Shawarma",   desc: "Grilled chicken in garlic & coriander sauce with fries",               price: 650,  cat: "Grills",      time: 30, icon: "flame",     available: true },
  { id: "tacos", name: "Tacos Gratinés",     desc: "Grilled steak tacos with melted mozzarella, bell peppers & olives",    price: 720,  cat: "Fast Food",   time: 25, icon: "square",    available: true },
  { id: "bourek",name: "Bourek",             desc: "Fried parcels stuffed with potatoes, herbs and melted cheese",        price: 450,  cat: "Fast Food",   time: 20, icon: "square",    available: true },
  { id: "tea",   name: "Mint Tea",           desc: "Crushed green mint steeped in sweet broth",                          price: 120,  cat: "Drinks",      time: 8,  icon: "leaf",      available: true },
  { id: "hb",    name: "Hamoud Boualem Platter", desc: "Classic family platter with a variety of meats and sides",        price: 1250, cat: "Traditional", time: 40, icon: "utensils", available: true },
];

const CATEGORIES = ["All", "Traditional", "Grills", "Fast Food", "Drinks"];

const LOCAL_DELIVERY_FEE = 200; // DA — flat fee for Batna City delivery

/* ====================== FORMATTING ====================== */
function formatDA(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " DA";
}

/* ====================== VALIDATION ====================== */
const PHONE_RE = /^0[567][0-9]{8}$/; // 10 digits starting with 05, 06 or 07
function isValidAlgerianPhone(p) {
  return PHONE_RE.test(p.trim());
}

function isValidOrderCode(code) {
  return /^[A-Z]{3}-\d{4}$/.test(code.trim());
}

/* ====================== ORDER CODE ====================== */
function generateOrderCode() {
  const n = (Date.now() % 9999).toString().padStart(4, "0");
  return `ORD-${n}`;
}

/* ====================== DATA SERVICE (Step 3 target) ====================== */
const dataService = {
  STORAGE_KEY: "dar-el-djazair-orders",

  async getMenuItems() {
    await Promise.resolve(); // async tick
    return MENU; // local seeding — replace with Supabase query in Step 3
  },

  async createOrder(order) {
    await Promise.resolve();
    const orders = this._load();
    orders.push(order);
    this._save(orders);
    return order;
  },

  async getOrderByCode(code) {
    await Promise.resolve();
    const orders = this._load();
    return orders.find(o => o.code === code) || null;
  },

  _load() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]"); }
    catch (e) { return []; }
  },
  _save(orders) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
  },
};
/* ==================== END DATA SERVICE (SUPABASE_CONFIG goes here in Step 3) ==================== */

/* ====================== ICONS ====================== */
const ICONS = {
  utensils: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v8a3 3 0 0 0 6 0V4"/><path d="M7 14v4a3 3 0 0 1-6 0"/><path d="M3 4l2-2"/><path d="M17 4v8a3 3 0 0 0 6 0V4"/><path d="M15 14v4a3 3 0 0 1-6 0"/><path d="M11 4v4"/></svg>`,
  flame:    `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.4 6.5 2.5 10 2.5 14A5.5 5.5 0 0 1 4 16.5C7.5 11 9 7.5 9 3z"/></svg>`,
  square:   `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  leaf:     `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a8 8 0 1 0 8 8c0-3.2-2.8-5-8-5z"/><path d="m10 10 5-5"/></svg>`,
  plus:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  minus:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>`,
};
function iconHtml(name) { return ICONS[name] || ICONS.utensils; }

/* ====================== APP STATE ====================== */
const $ = (id) => document.getElementById(id);

const state = {
  menu: [],
  selected: [],      // [{ id, name, price, qty, icon, badge }]
  activeCategory: "All",
  trayOpen: false,
  orderType: "",     // DineIn | Takeaway | LocalDelivery
  trackStatus: null,
};

/* ====================== RENDER: Menu ====================== */
function buildCategoryPills() {
  $("catPills").innerHTML = CATEGORIES.map((c, i) =>
    `<button class="cat-pill${c === "All" ? " active" : ""}" data-cat="${c}" aria-pressed="${c === "All"}">${c}</button>`
  ).join("");
  $("catPills").querySelectorAll(".cat-pill").forEach(btn => btn.addEventListener("click", () => {
    state.activeCategory = btn.dataset.cat;
    $("catPills").querySelectorAll(".cat-pill").forEach(b => b.setAttribute("aria-pressed", b === btn));
    $("catPills").querySelectorAll(".cat-pill").forEach(b => b.classList.toggle("active", b === btn));
    renderMenu();
  }));
}

function renderMenu() {
  const grid = $("menuGrid");
  const filtered = state.menu.filter(m =>
    state.activeCategory === "All" || m.cat === state.activeCategory
  );
  grid.innerHTML = filtered.map(m => `
      <div class="menu-card${m.available ? "" : " disabled"}" data-id="${m.id}">
        <div class="card-top">
          <div class="card-icon">${iconHtml(m.icon)}</div>
          <div class="card-right">
            <div class="card-head"><span class="prep-badge">${m.time} min</span></div>
            <h3 class="card-name${m.available ? "" : " unavailable"}">${m.name}</h3>
          </div>
        </div>
        <p class="card-desc">${m.desc}</p>
        <div class="card-foot">
          <span class="card-price">${formatDA(m.price)}</span>
          <button class="add-btn" data-id="${m.id}">+ Add</button>
        </div>
      </div>`).join("");

  grid.querySelectorAll(".menu-card").forEach(card => {
    const addBtn = card.querySelector(".add-btn");
    if (addBtn) addBtn.addEventListener("click", e => { e.stopPropagation(); addToTray(card.dataset.id); });
    card.addEventListener("click", () => {
      if (!state.selected.some(s => s.id === card.dataset.id)) addToTray(card.dataset.id);
    });
  });
}

/* ====================== RENDER: Tray ====================== */
function updateTrayBadge() {
  const n = state.selected.reduce((a, s) => a + s.qty, 0);
  $("trayBadge").textContent = n;
}
function updateTrayCount() {
  $("trayCount").textContent = `${state.selected.length} items`;
}

function renderTrayItems() {
  $("trayItems").innerHTML = state.selected.map((s, i) => `
    <div class="tray-item">
      <div class="tray-item-top">
        <span class="tray-item-name">${s.qty}× ${s.name}</span>
        <span class="tray-item-price">${formatDA(s.price * s.qty)}</span>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" data-id="${s.id}" data-delta="-1" aria-label="Decrease">−</button>
        <span class="qty-num">${s.qty}</span>
        <button class="qty-btn" data-id="${s.id}" data-delta="+1" aria-label="Increase">+</button>
        <button class="qty-btn" data-id="${s.id}" data-delta="del" aria-label="Remove" style="background:#B91C1C;border-color:#B91C1C;color:#fff;border-radius:6px;width:auto">✕</button>
      </div>
    </div>`).join("");

  $("trayItems").querySelectorAll(".qty-btn").forEach(btn => btn.addEventListener("click", () => {
    const s = state.selected.find(x => x.id === btn.dataset.id);
    if (!s) return;
    if (btn.dataset.delta === "del") {
      state.selected = state.selected.filter(x => x.id !== s.id);
    } else {
      const delta = btn.dataset.delta === "+1" ? 1 : -1;
      s.qty = Math.max(0, s.qty + delta);
      if (s.qty === 0) state.selected = state.selected.filter(x => x !== s);
    }
    refreshTray();
  }));
}

function refreshTray() {
  updateTrayBadge();
  updateTrayCount();
  renderTrayItems();

  const deliveryFee = state.orderType === "LocalDelivery" ? LOCAL_DELIVERY_FEE : 0;
  const subtotal = state.selected.reduce((a, s) => a + s.price * s.qty, 0);
  const total = subtotal + deliveryFee;

  $("subtotal").textContent = formatDA(subtotal);
  $("deliveryFee").textContent = formatDA(deliveryFee);
  $("deliveryFeeRow").style.display = state.orderType === "LocalDelivery" ? "" : "none";
  $("trayTotal").textContent = formatDA(total);

  const empty = state.selected.length === 0;
  $("emptyTray").style.display = empty ? "" : "none";
  $("checkoutForm").style.display = empty ? "none" : "";
  $("submitOrder").disabled = empty;
}

/* ====================== TRAY OPEN / CLOSE ====================== */
function openTray() {
  state.trayOpen = true;
  $("orderTray").classList.add("open");
  $("trayScrim").classList.add("open");
  refreshTray();
}
function closeTray() {
  state.trayOpen = false;
  $("orderTray").classList.remove("open");
  $("trayScrim").classList.remove("open");
}

/* ====================== ADD TO TRAY ====================== */
function addToTray(id) {
  const m = state.menu.find(x => x.id === id);
  if (!m || !m.available) return;
  const existing = state.selected.find(s => s.id === id);
  if (existing) existing.qty += 1;
  else state.selected.push({ id: m.id, name: m.name, price: m.price, qty: 1, icon: m.icon, badge: m.cat });
  openTray();
  refreshTray();
  renderMenu(); // update the check on the card
}

/* ====================== CHECKOUT (submit) ====================== */
function showFormError(msg) {
  $("formError").textContent = msg;
  $("formError").classList.remove("hidden");
}
/* ====================== CONDITIONAL FIELDS ====================== */
function updateConditionalFields() {
  const v = $("cType").value;
  state.orderType = v;
  const t = $("fieldTable"), p = $("fieldPickup"), a = $("fieldAddress");
  t.style.display = "none"; p.style.display = "none"; a.style.display = "none";
  if (v === "DineIn") { t.style.display = ""; $("cTable").required = true; $("cTable").placeholder = "e.g. Table 4"; }
  if (v === "Takeaway") { p.style.display = ""; $("cPickup").required = true; }
  if (v === "LocalDelivery") { a.style.display = ""; $("cAddress").required = true; $("cAddress").placeholder = "e.g. Kechida, Centre-Ville, Cité 1200 Logements, Bouzourane"; }
  $("cTable").required = v === "DineIn";
  $("cPickup").required = v === "Takeaway";
  $("cAddress").required = v === "LocalDelivery";
  refreshTray();
}

async function submitOrder(e) {
  e.preventDefault();
  if (state.selected.length === 0) { showFormError("Add at least one item to the tray."); return; }

  const phone = $("cPhone").value.trim();
  if (!isValidAlgerianPhone(phone)) {
    showFormError("Phone must be a valid Algerian mobile number: starts with 05, 06 or 07 and has 10 digits.");
    $("cPhone").focus();
    return;
  }

  const v = $("cType").value;
  if (!v) { showFormError("Choose an order type (Dine-in / Takeaway / Local Delivery)."); return; }
  const extra = v === "DineIn" ? $("cTable").value.trim() :
                v === "Takeaway" ? $("cPickup").value :
                v === "LocalDelivery" ? $("cAddress").value.trim() : "";
  if (!extra) { showFormError("This order type requires its detail (table / pickup preference / Batna address)."); return; }

  const deliveryFee = v === "LocalDelivery" ? LOCAL_DELIVERY_FEE : 0;
  const subtotal = state.selected.reduce((a, s) => a + s.price * s.qty, 0);
  const total = subtotal + deliveryFee;
  const name = $("cName").value.trim();

  const order = {
    code: generateOrderCode(),
    name: name || "Customer",
    phone,
    type: v,
    detail: extra || "",
    items: state.selected.map(s => ({ name: s.name, qty: s.qty, price: s.price })),
    subtotal, deliveryFee, total,
    status: "Pending",
    notes: $("cNotes").value.trim(),
    createdAt: new Date().toISOString(),
  };

  // save via data service
  await dataService.createOrder(order);

  // clear the tray
  state.selected = [];
  closeTray();
  updateTrayBadge();
  renderMenu();

  // show the ticket card
  showTicket(order, name);
}

function showTicket(order, name) {
  const code = $("ticketCode");
  const nm = $("ticketName");
  const status = $("ticketStatus");

  code.textContent = order.code;
  nm.textContent = name || "Customer";
  status.textContent = "Preparing…";
  $("ticketModal").classList.add("open");
}

/* ====================== TRACK MY ORDER ====================== */
async function trackOrder(e) {
  e.preventDefault();
  const code = $("trackCodeInput").value.trim().toUpperCase();
  const result = $("trackResult");
  result.innerHTML = "";
  if (!isValidOrderCode(code)) {
    result.innerHTML = `<div class="status-card" style="color:#B91C1C">Enter a valid order code like "ORD-4821".</div>`;
    return;
  }
  $("trackResult").innerHTML = `<div class="status-card"><span class="track-spinner"></span>Looking up ${code}…</div>`;

  const order = await dataService.getOrderByCode(code);
  if (order) {
    state.trackStatus = order.status;
    result.innerHTML = `
      <div class="status-card">
        <span class="status-tag ${order.status}">${order.status}</span>
        <span><strong>${order.code}</strong> · ${order.name} · ${formatDA(order.total)}</span>
      </div>
      <p style="font-size:12px;margin:8px 0 0;color:#6B6967">Prepared by our team. ${order.notes ? "Notes: " + order.notes : ""}</p>`;
  } else {
    result.innerHTML = `<div class="status-card" style="color:#B91C1C">No order found with code ${code}.</div>`;
  }
}

/* ====================== INIT ====================== */
async function init() {
  state.menu = await dataService.getMenuItems();
  buildCategoryPills();
  renderMenu();
  updateTrayBadge();

  // tray + form wiring
  $("trayToggle").addEventListener("click", openTray);
  $("trayScrim").addEventListener("click", closeTray);
  $("trayClose").addEventListener("click", closeTray);
  $("checkoutForm").addEventListener("submit", submitOrder);
  $("cType").addEventListener("change", updateConditionalFields);
  $("ticketClose").addEventListener("click", () => $("ticketModal").classList.remove("open"));
  // track lookup
  $("trackBtn").addEventListener("click", trackOrder);
  $("trackCodeInput").addEventListener("keydown", e => { if (e.key === "Enter") trackOrder(e); });
}

document.addEventListener("DOMContentLoaded", init);
