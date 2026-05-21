/* ── State ── */
let orders   = JSON.parse(localStorage.getItem('wbm-orders'))   || [];
let shops    = JSON.parse(localStorage.getItem('wbm-shops'))    || [];
let settings = JSON.parse(localStorage.getItem('wbm-settings')) || {
  brand: 'AquaCMS',
  owner: '',
  wa: '',
  city: 'Karachi',
  bottles: [
    { size: '250ml', rate: 5  },
    { size: '500ml', rate: 10 },
    { size: '1L',    rate: 18 },
    { size: '1.5L',  rate: 25 },
    { size: '5G',    rate: 60 },
    { size: '19L',   rate: 120 }
  ]
};

let orderEditIdx = -1;
let shopEditIdx  = -1;

/* ── Persist ── */
function persist() {
  localStorage.setItem('wbm-orders',   JSON.stringify(orders));
  localStorage.setItem('wbm-shops',    JSON.stringify(shops));
  localStorage.setItem('wbm-settings', JSON.stringify(settings));
}

/* ── Toast ── */
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.borderColor = err ? 'var(--red)' : 'var(--green)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── Navigation ── */
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (el) el.classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'orders')  { renderOrders(); populateOrderDropdowns(); }
  if (name === 'shops')     renderShops();
  if (name === 'reports')   renderReports();
  if (name === 'settings')  renderSettings();
}

/* ════════════════════════════════
   SETTINGS
════════════════════════════════ */
function renderSettings() {
  document.getElementById('cfg-brand').value = settings.brand || '';
  document.getElementById('cfg-owner').value = settings.owner || '';
  document.getElementById('cfg-wa').value    = settings.wa    || '';
  document.getElementById('cfg-city').value  = settings.city  || '';

  document.getElementById('bottle-rates-list').innerHTML =
    settings.bottles.map((b, i) => `
      <div class="bottle-row">
        <div class="bottle-size">${b.size}</div>
        <div class="bottle-rate">
          <input type="number" value="${b.rate}" min="0"
            onchange="settings.bottles[${i}].rate = Number(this.value)">
        </div>
        <div class="bottle-unit">Rs / bottle</div>
      </div>`).join('');
}

function saveSettings() {
  settings.brand = document.getElementById('cfg-brand').value.trim() || 'AquaCMS';
  settings.owner = document.getElementById('cfg-owner').value.trim();
  settings.wa    = document.getElementById('cfg-wa').value.trim();
  settings.city  = document.getElementById('cfg-city').value.trim();
  persist();
  toast('Settings saved');
  document.getElementById('brand-name').textContent = '💧 ' + settings.brand;
}

/* ════════════════════════════════
   SHOPS
════════════════════════════════ */
function renderShops() {
  const g = document.getElementById('shops-grid');
  if (!shops.length) {
    g.innerHTML = '<div class="empty">No shops yet — add one above</div>';
    return;
  }
  g.innerHTML = shops.map((s, i) => `
    <div class="shop-card">
      <div class="shop-avatar">${s.name.substring(0, 2).toUpperCase()}</div>
      <div class="shop-name">${s.name}</div>
      <div class="shop-detail">📞 ${s.phone}</div>
      <div class="shop-detail">📍 ${s.area}</div>
      ${s.contact ? `<div class="shop-detail">👤 ${s.contact}</div>` : ''}
      <div class="shop-footer">
        <button class="btn-sm btn-edit"   onclick="editShop(${i})">Edit</button>
        <button class="btn-sm btn-delete" onclick="deleteShop(${i})">Delete</button>
        <button class="btn-sm btn-wa"     onclick="waShop(${i})">WhatsApp</button>
      </div>
    </div>`).join('');
}

function saveShop() {
  const name    = document.getElementById('s-name').value.trim();
  const phone   = document.getElementById('s-phone').value.trim();
  const area    = document.getElementById('s-area').value.trim();
  const contact = document.getElementById('s-contact').value.trim();

  if (!name || !phone || !area) { toast('Fill all required fields', true); return; }

  const shop = { name, phone, area, contact };

  if (shopEditIdx === -1) {
    shops.push(shop);
    toast('Shop added');
  } else {
    shops[shopEditIdx] = shop;
    shopEditIdx = -1;
    toast('Shop updated');
    cancelShopEdit();
  }

  persist();
  renderShops();
  populateOrderDropdowns();
  ['s-name', 's-phone', 's-area', 's-contact'].forEach(id =>
    document.getElementById(id).value = ''
  );
}

function editShop(i) {
  const s = shops[i];
  document.getElementById('s-name').value    = s.name;
  document.getElementById('s-phone').value   = s.phone;
  document.getElementById('s-area').value    = s.area;
  document.getElementById('s-contact').value = s.contact || '';
  shopEditIdx = i;
  document.getElementById('shop-form-title').textContent = '✏️ Edit shop';
  document.getElementById('s-cancel-btn').style.display  = 'flex';
  document.getElementById('s-save-btn').textContent      = '💾 Update shop';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelShopEdit() {
  shopEditIdx = -1;
  document.getElementById('shop-form-title').textContent = '➕ Add shop';
  document.getElementById('s-cancel-btn').style.display  = 'none';
  document.getElementById('s-save-btn').textContent      = '💾 Save shop';
  ['s-name', 's-phone', 's-area', 's-contact'].forEach(id =>
    document.getElementById(id).value = ''
  );
}

function deleteShop(i) {
  if (!confirm('Delete this shop?')) return;
  shops.splice(i, 1);
  persist();
  renderShops();
  toast('Shop deleted');
}

function waShop(i) {
  const s = shops[i];
  const pending = orders
    .filter(o => o.shopName === s.name)
    .reduce((a, o) => a + Number(o.remaining), 0);
  const msg =
    `Assalamualaikum ${s.name},\n` +
    `Your pending balance is Rs ${pending.toLocaleString()}.\n` +
    `Please clear when possible.\n— ${settings.brand}`;
  window.open(
    `https://wa.me/92${s.phone.replace(/^0/, '').replace(/\D/g, '')}` +
    `?text=${encodeURIComponent(msg)}`
  );
}

/* ════════════════════════════════
   ORDERS
════════════════════════════════ */
function populateOrderDropdowns() {
  const ss = document.getElementById('o-shop');
  const cv = ss.value;
  ss.innerHTML =
    '<option value="">Select shop...</option>' +
    shops.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  if (cv) ss.value = cv;

  const sb = document.getElementById('o-size');
  const cb = sb.value;
  sb.innerHTML =
    '<option value="">Select size...</option>' +
    settings.bottles.map(b =>
      `<option value="${b.size}" data-rate="${b.rate}">${b.size} — Rs ${b.rate}/bottle</option>`
    ).join('');
  if (cb) sb.value = cb;

  sb.onchange = function () {
    const opt = this.options[this.selectedIndex];
    if (opt.dataset.rate) document.getElementById('o-rate').value = opt.dataset.rate;
    calcTotal();
  };
}

function calcTotal() {
  const qty  = parseFloat(document.getElementById('o-qty').value)  || 0;
  const rate = parseFloat(document.getElementById('o-rate').value) || 0;
  const paid = parseFloat(document.getElementById('o-paid').value) || 0;
  const total = qty * rate;
  const rem   = total - paid;
  const el    = document.getElementById('o-preview');
  if (qty && rate) {
    el.innerHTML =
      `Total: <span>Rs ${total.toLocaleString()}</span> &nbsp;|&nbsp; ` +
      `Remaining: <span>Rs ${rem.toLocaleString()}</span>`;
  } else {
    el.textContent = 'Total and remaining will calculate automatically';
  }
}

function saveOrder() {
  const shopName = document.getElementById('o-shop').value;
  const size     = document.getElementById('o-size').value;
  const qty      = parseFloat(document.getElementById('o-qty').value);
  const rate     = parseFloat(document.getElementById('o-rate').value);
  const paid     = parseFloat(document.getElementById('o-paid').value) || 0;

  if (!shopName || !size || !qty || !rate) {
    toast('Please fill all fields', true);
    return;
  }

  const total     = qty * rate;
  const remaining = total - paid;
  const shop      = shops.find(s => s.name === shopName) || {};

  const order = {
    shopName, phone: shop.phone || '', size,
    quantity: qty, rate, total, paid, remaining,
    date: new Date().toLocaleDateString('en-PK')
  };

  if (orderEditIdx === -1) {
    orders.push(order);
    toast('Order saved');
  } else {
    orders[orderEditIdx] = order;
    orderEditIdx = -1;
    toast('Order updated');
    cancelOrderEdit();
  }

  persist();
  renderOrders();
  renderDashboard();
  clearOrderForm();
}

function clearOrderForm() {
  document.getElementById('o-shop').value = '';
  document.getElementById('o-size').value = '';
  ['o-qty', 'o-rate', 'o-paid'].forEach(id =>
    document.getElementById(id).value = ''
  );
  document.getElementById('o-preview').textContent =
    'Total and remaining will calculate automatically';
}

function renderOrders(filter = '') {
  const g    = document.getElementById('orders-grid');
  const data = filter
    ? orders.filter(o => o.shopName.toLowerCase().includes(filter.toLowerCase()))
    : orders;

  if (!data.length) {
    g.innerHTML = `<div class="empty">${filter ? 'No matching orders' : 'No orders yet — add one above'}</div>`;
    return;
  }

  g.innerHTML = data.map(o => {
    const ai   = orders.indexOf(o);
    const paid = o.remaining <= 0;
    return `
      <div class="order-card ${!paid ? 'pending-card' : ''}">
        <div class="order-header">
          <div>
            <div class="order-shop">${o.shopName}</div>
            <div class="order-date">${o.date}</div>
          </div>
          <span class="badge ${paid ? 'badge-paid' : 'badge-pending'}">${paid ? 'Paid' : 'Pending'}</span>
        </div>
        <div class="order-info">
          <div class="info-row"><span class="info-label">Size</span><span class="info-val blue">${o.size}</span></div>
          <div class="info-row"><span class="info-label">Qty</span><span class="info-val">${o.quantity}</span></div>
          <div class="info-row"><span class="info-label">Rate</span><span class="info-val">Rs ${o.rate}</span></div>
          <div class="info-row"><span class="info-label">Total</span><span class="info-val">Rs ${o.total.toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Paid</span><span class="info-val green">Rs ${o.paid.toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Remaining</span>
            <span class="info-val ${!paid ? 'amber' : 'green'}">Rs ${o.remaining.toLocaleString()}</span>
          </div>
        </div>
        <div class="order-footer">
          <button class="btn-sm btn-edit"   onclick="editOrder(${ai})">Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteOrder(${ai})">Delete</button>
          ${o.phone ? `<button class="btn-sm btn-wa" onclick="waOrder(${ai})">WhatsApp</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function editOrder(i) {
  const o = orders[i];
  document.getElementById('o-shop').value = o.shopName;
  document.getElementById('o-size').value = o.size;
  document.getElementById('o-qty').value  = o.quantity;
  document.getElementById('o-rate').value = o.rate;
  document.getElementById('o-paid').value = o.paid;
  orderEditIdx = i;
  calcTotal();
  document.getElementById('order-form-title').textContent = '✏️ Edit order';
  document.getElementById('o-cancel-btn').style.display   = 'flex';
  document.getElementById('o-save-btn').textContent       = '💾 Update order';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelOrderEdit() {
  orderEditIdx = -1;
  document.getElementById('order-form-title').textContent = '➕ New order';
  document.getElementById('o-cancel-btn').style.display   = 'none';
  document.getElementById('o-save-btn').textContent       = '💾 Save order';
  clearOrderForm();
}

function deleteOrder(i) {
  if (!confirm('Delete this order?')) return;
  orders.splice(i, 1);
  persist();
  renderOrders();
  renderDashboard();
  toast('Order deleted');
}

function waOrder(i) {
  const o   = orders[i];
  const msg =
    `Assalamualaikum ${o.shopName},\n` +
    `Order: ${o.quantity} x ${o.size}\n` +
    `Total: Rs ${o.total.toLocaleString()}\n` +
    `Paid: Rs ${o.paid.toLocaleString()}\n` +
    `Remaining: Rs ${o.remaining.toLocaleString()}\n` +
    `— ${settings.brand}`;
  window.open(
    `https://wa.me/92${o.phone.replace(/^0/, '').replace(/\D/g, '')}` +
    `?text=${encodeURIComponent(msg)}`
  );
}

/* ════════════════════════════════
   DASHBOARD
════════════════════════════════ */
function renderDashboard() {
  document.getElementById('dash-date').textContent =
    new Date().toLocaleDateString('en-PK', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  const totalPaid    = orders.reduce((a, o) => a + o.paid, 0);
  const totalPending = orders.reduce((a, o) => a + o.remaining, 0);
  const totalBottles = orders.reduce((a, o) => a + o.quantity, 0);

  document.getElementById('d-total-orders').textContent = orders.length;
  document.getElementById('d-collected').textContent    = 'Rs ' + totalPaid.toLocaleString();
  document.getElementById('d-pending').textContent      = 'Rs ' + totalPending.toLocaleString();
  document.getElementById('d-bottles').textContent      = totalBottles.toLocaleString();

  const shopPending = {};
  orders.forEach(o => {
    if (o.remaining > 0)
      shopPending[o.shopName] = (shopPending[o.shopName] || 0) + o.remaining;
  });
  const top = Object.entries(shopPending).sort((a, b) => b[1] - a[1]).slice(0, 5);

  document.getElementById('top-pending-list').innerHTML = top.length
    ? top.map(([n, v]) =>
        `<div class="report-row">
           <span>${n}</span>
           <span class="amber" style="font-weight:600">Rs ${v.toLocaleString()}</span>
         </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:12px 0">No pending amounts — all clear!</div>';

  const recent = orders.slice(-5).reverse();
  document.getElementById('recent-orders-list').innerHTML = recent.length
    ? recent.map(o =>
        `<div class="report-row">
           <span>${o.shopName}
             <span style="color:var(--text3);font-size:11px;margin-left:6px">${o.size}</span>
           </span>
           <span class="${o.remaining > 0 ? 'amber' : 'green'}" style="font-weight:600">
             Rs ${o.total.toLocaleString()}
           </span>
         </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:12px 0">No orders yet</div>';
}

/* ════════════════════════════════
   REPORTS
════════════════════════════════ */
function renderReports() {
  const totalRev     = orders.reduce((a, o) => a + o.total, 0);
  const totalPending = orders.reduce((a, o) => a + o.remaining, 0);
  const totalBottles = orders.reduce((a, o) => a + o.quantity, 0);
  const activeShops  = new Set(orders.map(o => o.shopName)).size;

  document.getElementById('r-revenue').textContent  = 'Rs ' + totalRev.toLocaleString();
  document.getElementById('r-pending').textContent  = 'Rs ' + totalPending.toLocaleString();
  document.getElementById('r-shops').textContent    = activeShops;
  document.getElementById('r-bottles').textContent  = totalBottles.toLocaleString();

  const shopPending = {};
  orders.forEach(o => {
    shopPending[o.shopName] = (shopPending[o.shopName] || 0) + o.remaining;
  });
  const spSorted = Object.entries(shopPending)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxSP = spSorted[0]?.[1] || 1;

  document.getElementById('r-shop-pending').innerHTML = spSorted.length
    ? spSorted.map(([n, v]) =>
        `<div class="bar-wrap">
           <div class="bar-label">${n}</div>
           <div class="bar-track">
             <div class="bar-fill" style="width:${Math.round(v / maxSP * 100)}%;background:var(--amber)"></div>
           </div>
           <div class="bar-val amber">Rs ${v.toLocaleString()}</div>
         </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:12px 0">No pending amounts — all cleared!</div>';

  const bottleMap = {};
  orders.forEach(o => {
    bottleMap[o.size] = (bottleMap[o.size] || 0) + o.quantity;
  });
  const bSorted = Object.entries(bottleMap).sort((a, b) => b[1] - a[1]);
  const maxB    = bSorted[0]?.[1] || 1;

  document.getElementById('r-bottle-sizes').innerHTML = bSorted.length
    ? bSorted.map(([s, v]) =>
        `<div class="bar-wrap">
           <div class="bar-label">${s}</div>
           <div class="bar-track">
             <div class="bar-fill" style="width:${Math.round(v / maxB * 100)}%"></div>
           </div>
           <div class="bar-val">${v} bottles</div>
         </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:12px 0">No order data yet</div>';

  document.getElementById('r-orders-table').innerHTML = orders.length
    ? orders.slice().reverse().map(o =>
        `<div class="report-row">
           <span>${o.shopName}
             <span style="color:var(--text3);font-size:11px;margin-left:6px">${o.size} × ${o.quantity}</span>
           </span>
           <div style="display:flex;gap:16px;font-size:12px;align-items:center">
             <span class="green">+Rs ${o.paid.toLocaleString()}</span>
             ${o.remaining > 0 ? `<span class="amber">−Rs ${o.remaining.toLocaleString()}</span>` : ''}
             <span style="color:var(--text3)">${o.date}</span>
           </div>
         </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;padding:12px 0">No orders yet</div>';
}

/* ── Init ── */
renderDashboard();
renderSettings();
populateOrderDropdowns();

/* ════════════════════════════════
   PASSWORD CHANGE (Settings page)
════════════════════════════════ */
function changePassword() {
  const current = document.getElementById('cfg-current-pw').value;
  const newPw   = document.getElementById('cfg-new-pw').value;
  const confirm = document.getElementById('cfg-confirm-pw').value;

  const saved = localStorage.getItem('wbm-password') || 'water123';

  if (!current || !newPw || !confirm) {
    toast('Fill all password fields', true); return;
  }
  if (current !== saved) {
    toast('Current password is wrong', true); return;
  }
  if (newPw.length < 6) {
    toast('New password must be at least 6 characters', true); return;
  }
  if (newPw !== confirm) {
    toast('Passwords do not match', true); return;
  }

  localStorage.setItem('wbm-password', newPw);
  ['cfg-current-pw','cfg-new-pw','cfg-confirm-pw'].forEach(id =>
    document.getElementById(id).value = ''
  );
  toast('Password changed successfully ✅');
}
