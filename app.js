'use strict';
// Dolcefran - Frontend logic (vanilla JS, no frameworks)
(function() {
  // Supabase config
  const SUPABASE_URL = "https://dgsbeahwcruisvyuufcq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc2JlYWh3Y3J1aXN2eXV1ZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTEzMDQsImV4cCI6MjA4ODA4NzMwNH0.lhM3Uqn4U2PeO3TtuRzlgKRGtsHPx6RgRrkFC5DUwj0";
  const STORAGE_BUCKET = "images";
  const WHATSAPP_NUMBER = "";

  let supabaseClient;
  let cart = [];

function initSupabase(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "REPLACE_WITH_YOUR_ANON_KEY"){
    console.error('Faltan configuraciones de Supabase. Establece SUPABASE_URL y SUPABASE_ANON_KEY.');
    return;
  }
  
  function createClient() {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      setTimeout(createClient, 100);
    }
  }
  createClient();
}

function formatMoney(n){
  if(n == null || isNaN(n)) return '0.00';
  return Number(n).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Notificación visual al agregar al carrito
function showNotification(message, duration = 2000){
  // Remover notificación previa si existe
  const prev = document.querySelector('.notification');
  if(prev) prev.remove();
  
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.innerHTML = `✓ ${message}`;
  document.body.appendChild(notif);
  
  // Mostrar con animación
  setTimeout(() => notif.classList.add('show'), 10);
  
  // Ocultar y remover
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, duration);
}

async function loadProducts(){
  const loader = document.getElementById('loader');
  const grid = document.getElementById('products');
  grid.innerHTML = '';
  loader.style.display = 'block';
  try{
    const { data, error } = await supabaseClient.from('products').select('*').eq('active', true).order('created_at', {ascending:false});
    if(error){ throw error; }
    if(!data || data.length===0){ grid.innerHTML = '<p>No hay productos disponibles.</p>'; loader.style.display='none'; return; }
    const items = await Promise.all(data.map(async (p)=>{
      let img = p.image_url;
      if(img && !/^https?:\/\//i.test(img)){
        // si es path de storage, obtener URL publico
        const { publicURL, error:err2 } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(img);
        if(publicURL) img = publicURL;
      }
      return { ...p, image_url: img };
    }));
    items.forEach((it, index) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${it.image_url || ''}" alt="${it.name}" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${it.name}</h3>
          <p class="desc">${it.description || ''}</p>
          <div class="price">$ ${formatMoney(it.price)}</div>
          <button class="btn btn-primary btn-wave" data-id="${it.id}">
            <span>Agregar al carrito</span>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch(err){ console.error(err); }
  finally{ loader.style.display = 'none'; }
  
  // Attach listeners con efecto ripple
  grid.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      
      // Animación de click en el botón
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
      
      addToCartById(id);
    });
  });
}

function addToCartById(productId){
  // fetch product by id from already loaded data (quick fetch)
  // Fallback: fetch by query
  supabaseClient.from('products').select('*').eq('id', productId).single()
  .then(({ data, error }) => {
    if(error){ console.error(error); return; }
    const p = data;
    const existing = cart.find(c => c.product_id === productId);
    if(existing){ existing.quantity += 1; }
    else { cart.push({ product_id: productId, name: p.name, price: p.price, quantity: 1, image_url: p.image_url }); }
    saveCart();
    renderCart();
    
    // Mostrar notificación animada con el nombre del producto
    showNotification(`¡${p.name} agregado al carrito!`);
    
    // Animar el carrito
    const cartEl = document.querySelector('.cart');
    if(cartEl){
      cartEl.style.transform = 'scale(1.05)';
      setTimeout(() => {
        cartEl.style.transform = '';
      }, 200);
    }
  });
}

function saveCart(){ localStorage.setItem('dolcefran_cart', JSON.stringify(cart)); }
function loadCart(){
  const raw = localStorage.getItem('dolcefran_cart');
  if(raw){ try{ cart = JSON.parse(raw); } catch(_) { cart = []; } }
}

function renderCart(){
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const countEls = document.querySelectorAll('#cart-count, #cart-count-float');
  container.innerHTML = '';
  
  // Update cart count
  const totalQty = cart.reduce((sum, it) => sum + (it.quantity || 1), 0);
  countEls.forEach(el => { if(el) el.textContent = totalQty; });
  
  if(cart.length === 0){
    container.innerHTML = '<div class="cart-empty-msg">Tu carrito está vacío</div>';
    totalEl.textContent = formatMoney(0);
    return;
  }
  
  let total = 0;
  cart.forEach((it, idx) => {
    total += (it.price || 0) * (it.quantity || 1);
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${it.image_url || ''}" alt="${it.name}" loading="lazy">
      <div class="cart-item-info">
        <div class="cart-item-name">${it.name}</div>
        <div class="cart-item-price">$ ${formatMoney(it.price)}</div>
        <div class="cart-item-qty">
          <button onclick="updateQty(${idx}, ${(it.quantity || 1) - 1})">-</button>
          <span>${it.quantity || 1}</span>
          <button onclick="updateQty(${idx}, ${(it.quantity || 1) + 1})">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${idx})" title="Eliminar">×</button>
    `;
    container.appendChild(row);
  });
  
  totalEl.textContent = formatMoney(total);
}

// Global functions for cart buttons
window.updateQty = function(idx, newQty) {
  if(newQty < 1) {
    removeFromCart(idx);
    return;
  }
  if(cart[idx]) {
    cart[idx].quantity = newQty;
    saveCart();
    renderCart();
  }
};

window.removeFromCart = function(idx) {
  cart.splice(idx, 1);
  saveCart();
  renderCart();
  showNotification('Producto eliminado');
};

async function finalizeOrder(){
  if(!cart || cart.length===0){ 
    showNotification('El carrito está vacío');
    return; 
  }
  
  const total = cart.reduce((s, it)=> s + (parseFloat(it.price)||0) * (parseInt(it.quantity)||1), 0);
  
  // Create checkout modal
  const modal = document.createElement('div');
  modal.className = 'checkout-modal';
  modal.innerHTML = `
    <div class="checkout-overlay" onclick="closeCheckout()"></div>
    <div class="checkout-content">
      <button class="checkout-close" onclick="closeCheckout()">×</button>
      <h2>Finalizar Pedido</h2>
      
      <div class="checkout-summary">
        <h3>Tu Pedido</h3>
        <div class="checkout-items">
          ${cart.map(it => `
            <div class="checkout-item">
              <span class="checkout-item-qty">${it.quantity}x</span>
              <span class="checkout-item-name">${it.name}</span>
              <span class="checkout-item-price">$ ${formatMoney(it.price * it.quantity)}</span>
            </div>
          `).join('')}
        </div>
        <div class="checkout-total">
          <span>Total:</span>
          <span>$ ${formatMoney(total)}</span>
        </div>
      </div>
      
      <form id="checkout-form" onsubmit="submitOrder(event)">
        <h3>Datos de entrega</h3>
        <input type="text" id="customer-name" placeholder="Nombre completo" required />
        <input type="tel" id="customer-phone" placeholder="Teléfono" required />
        <input type="text" id="customer-address" placeholder="Dirección de entrega" required />
        <textarea id="customer-notes" placeholder="Notas adicionales (opcional)" rows="2"></textarea>
        <button type="submit" class="btn btn-primary">Enviar por WhatsApp</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

window.closeCheckout = function() {
  const modal = document.querySelector('.checkout-modal');
  if(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
};

window.submitOrder = function(e) {
  e.preventDefault();
  
  const name = document.getElementById('customer-name').value;
  const phone = document.getElementById('customer-phone').value;
  const address = document.getElementById('customer-address').value;
  const notes = document.getElementById('customer-notes').value;
  
  const total = cart.reduce((s, it)=> s + (parseFloat(it.price)||0) * (parseInt(it.quantity)||1), 0);
  
  const orderText = `🧁 *NUEVO PEDIDO - Dolcefran* 🧁

👤 *Cliente:* ${name}
📱 *Teléfono:* ${phone}
📍 *Dirección:* ${address}
${notes ? `📝 *Notas:* ${notes}` : ''}

🛒 *Productos:*
${cart.map(it => `• ${it.quantity}x ${it.name} - $ ${formatMoney(it.price * it.quantity)}`).join('\n')}

💰 *TOTAL:* $ ${formatMoney(total)}

─────────────────────`;

  const whatsappNumber = '5493416667128'; // Replace with actual number
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText)}`;
  
  window.open(waUrl, '_blank');
  
  cart = [];
  saveCart();
  renderCart();
  closeCheckout();
  showNotification('¡Pedido enviado! Te contactaremos pronto');
};

function bindCheckout(){
  const btn = document.getElementById('btn-checkout');
  if(btn){ btn.addEventListener('click', finalizeOrder); }
}

function initListeners(){
  document.getElementById('year').textContent = new Date().getFullYear();
  bindCheckout();
}

function init(){
  loadCart();
  initSupabase();
  loadProducts().then(()=>{});
  renderCart();
  initListeners();
  // If usuario no esta autenticado, Admin no aplica; catalogo siempre visible
}

document.addEventListener('DOMContentLoaded', init);
})();
