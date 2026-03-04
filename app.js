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
          <div class="price">€ ${formatMoney(it.price)}</div>
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
  container.innerHTML = '';
  
  if(cart.length === 0){
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:1rem;">Tu carrito está vacío</p>';
    totalEl.textContent = formatMoney(0);
    return;
  }
  
  let total = 0;
  cart.forEach((it, idx) => {
    total += (it.price || 0) * (it.quantity || 1);
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.style.opacity = '0';
    row.style.animation = `slideUp 0.3s var(--ease-out-expo) ${idx * 0.05}s forwards`;
    row.innerHTML = `
      <img src="${it.image_url || ''}" alt="${it.name}" loading="lazy">
      <div class="cart-item-details">
        <div class="cart-item-name">${it.name}</div>
      </div>
      <div class="cart-item-controls">
        <input type="number" min="1" value="${it.quantity}" data-idx="${idx}" />
        <button data-idx="${idx}" class="btn-remove" title="Eliminar">×</button>
      </div>
    `;
    container.appendChild(row);
  });
  
  // update total con animación
  totalEl.style.opacity = '0';
  setTimeout(() => {
    totalEl.textContent = formatMoney(total);
    totalEl.style.opacity = '1';
    totalEl.style.transition = 'opacity 0.3s';
  }, cart.length * 50);
  
  // event listeners for quantity changes and remove
  container.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      const val = parseInt(e.target.value, 10);
      if(Number.isFinite(idx) && Number.isFinite(val) && val>0){ 
        cart[idx].quantity = val; 
        saveCart(); 
        renderCart(); 
      }
    });
  });
  
  container.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      const itemName = cart[idx]?.name;
      cart.splice(idx,1); 
      saveCart(); 
      renderCart();
      
      if(itemName){
        showNotification(`${itemName} eliminado del carrito`);
      }
    });
  });
}

async function finalizeOrder(){
  if(!cart || cart.length===0){ 
    showNotification('El carrito está vacío');
    return; 
  }
  
  const checkoutBtn = document.getElementById('btn-checkout');
  if(checkoutBtn){
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = 'Procesando...';
  }
  
  const name = prompt('Nombre del cliente:');
  if(!name) {
    if(checkoutBtn){
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = 'Finalizar pedido';
    }
    return; 
  }
  const phone = prompt('Teléfono:');
  
  const total = cart.reduce((s, it)=> s + (parseFloat(it.price)||0) * (parseInt(it.quantity)||1), 0);
  
  try{
    showNotification('Procesando pedido...', 3000);
    
    const orderId = crypto?.randomUUID ? crypto.randomUUID() : 'ord-' + Date.now();
    const { data: o, error: er } = await supabaseClient.from('orders').insert([{ 
      id: orderId, 
      customer_name: name, 
      phone: phone || '', 
      total: total, 
      created_at: new Date().toISOString() 
    }]);
    
    if(er) throw er;
    
    const items = cart.map(it => ({ 
      id: crypto?.randomUUID ? crypto.randomUUID() : 'it-' + Date.now() + Math.random(), 
      order_id: orderId, 
      product_id: it.product_id, 
      quantity: it.quantity, 
      price: it.price 
    }));
    
    const { data: oi, error: ei } = await supabaseClient.from('order_items').insert(items);
    if(ei) throw ei;
    
    cart = [];
    saveCart(); 
    renderCart();
    
    showNotification('¡Pedido realizado con éxito! 🎉', 4000);
    
    if(WHATSAPP_NUMBER){ 
      const text = `Nuevo pedido Dolcefran - Id: ${orderId}\nCliente: ${name}\nTel: ${phone}\nTotal: ${formatMoney(total)}€\nProductos: ${items.map(i=> i.product_id).join(',')}`; 
      const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(text)}`; 
      window.open(url, '_blank'); 
    }
    
  } catch(err){ 
    console.error(err); 
    showNotification('Error al guardar el pedido', 3000);
    setTimeout(() => alert('Error al guardar el pedido.'), 1000);
  } finally {
    if(checkoutBtn){
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = 'Finalizar pedido';
    }
  }
}

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
