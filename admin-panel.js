'use strict';
// Dolcefran Admin panel (vanilla JS)
(function() {
  // Supabase config
  const SUPABASE_URL = "https://dgsbeahwcruisvyuufcq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc2JlYWh3Y3J1aXN2eXV1ZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTEzMDQsImV4cCI6MjA4ODA4NzMwNH0.lhM3Uqn4U2PeO3TtuRzlgKRGtsHPx6RgRrkFC5DUwj0";
  let supabaseClient;

function initSupabase(){
  return new Promise((resolve) => {
    function createClient() {
      if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        resolve();
      } else {
        setTimeout(createClient, 100);
      }
    }
    createClient();
  });
}

function showError(el, msg){ el.textContent = msg; }

async function login(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const panel = document.getElementById('login-error');
  try{
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){ showError(panel, error.message); return; }
  }catch(err){ showError(panel, 'Error de autenticacion'); console.error(err); return; }
  await refreshUI();
}

async function logout(){
  await supabaseClient.auth.signOut();
  location.reload();
}

window.logout = logout;

async function refreshUI(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  const loginPanel = document.getElementById('login-panel');
  const adminPanel = document.getElementById('admin-panel');
  
  if(user){
    // Verificar si es admin
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!adminData) {
      loginPanel.innerHTML = '<p style="color:red;">Acceso denegado. No tienes permisos de administrador.</p><button onclick="logout()" class="btn">Cerrar Sesion</button>';
      loginPanel.style.display = 'block';
      adminPanel.style.display = 'none';
      return;
    }
    
    loginPanel.style.display = 'none';
    adminPanel.style.display = 'block';
    await loadProductsList();
    await loadOrders();
  } else {
    loginPanel.style.display = 'block';
    adminPanel.style.display = 'none';
  }
}

async function loadProductsList(){
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '';
  const { data, error } = await supabaseClient.from('products').select('*').order('created_at', {ascending:false});
  if(error){ console.error(error); return; }
  for(const p of data){
    const tr = document.createElement('tr');
    const img = `<img src="${p.image_url || ''}" width="60" height="40"/>`;
    tr.innerHTML = `
      <td>${img}</td>
      <td>${p.name}</td>
      <td>${p.price ?? ''}</td>
      <td>${p.active ? 'Sí' : 'No'}</td>
      <td>
        <button data-id="${p.id}" class="btn">Editar</button>
        <button data-id="${p.id}" class="btn" style="margin-left:6px;">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
  // attach actions
  tbody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-id');
      if(e.target.textContent.includes('Eliminar')){ await deleteProduct(id); } else { await editProduct(id); }
    });
  });
}

async function deleteProduct(id){
  const confirmDel = confirm('Eliminar producto?');
  if(!confirmDel) return;
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if(error){ console.error(error); return; }
  await loadProductsList();
}

async function editProduct(id){
  const newName = prompt('Nuevo nombre:');
  const newPrice = prompt('Nuevo precio:');
  const { data, error } = await supabaseClient.from('products').select('*').eq('id', id).single();
  if(error){ console.error(error); return; }
  const updates = {};
  if(newName){ updates.name = newName; }
  if(newPrice){ updates.price = parseFloat(newPrice); }
  if(Object.keys(updates).length>0){ const { error:err } = await supabase.from('products').update(updates).eq('id', id); if(err){ console.error(err); } }
  await loadProductsList();
}

async function createProduct(e){
  e.preventDefault();
  if(!supabaseClient){ alert('Esperando conexión...'); return; }
  const name = document.getElementById('p-name').value;
  const desc = document.getElementById('p-desc').value;
  const price = parseFloat(document.getElementById('p-price').value);
  const imageInput = document.getElementById('p-image');
  let imageUrl = '';
  if(imageInput.files && imageInput.files[0]){
    const file = imageInput.files[0];
    const path = 'products/' + Date.now() + '_' + file.name;
    const { data: uploaded, error } = await supabaseClient.storage.from('images').upload(path, file);
    if(error){ console.error(error); alert('Error al subir la imagen'); return; }
    imageUrl = uploaded ? uploaded.path : path;
    const { data: urlData } = supabaseClient.storage.from('images').getPublicUrl(path);
    imageUrl = urlData.publicUrl;
  }
  const { data, error: insErr } = await supabaseClient.from('products').insert({ name, description: desc, price, image_url: imageUrl, active: true });
  if(insErr){ console.error(insErr); alert('Error al crear producto'); return; }
  document.getElementById('form-create-product').reset();
  await loadProductsList();
}

async function loadOrders(){
  const div = document.getElementById('orders-list');
  div.innerHTML = '';
  const { data: orders, error } = await supabaseClient.from('orders').select('*').order('created_at', {ascending:false});
  if(error){ console.error(error); return; }
  if(!orders || orders.length===0){ 
    div.innerHTML = '<div class="empty-state"><p>No hay pedidos aún</p></div>'; 
    return; 
  }
  
  for(const o of orders){
    const { data: items } = await supabaseClient.from('order_items').select('*').eq('order_id', o.id);
    const date = new Date(o.created_at).toLocaleString('es-AR');
    
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card-admin';
    orderCard.innerHTML = `
      <div class="order-header-admin">
        <div class="order-id-badge">#${o.id.slice(0, 8)}</div>
        <div class="order-status order-status-${o.status || 'pendiente'}">${o.status || 'pendiente'}</div>
        <div class="order-date-admin">${date}</div>
      </div>
      <div class="order-body-admin">
        <div class="order-customer">
          <div class="customer-info">
            <span class="customer-label">Cliente:</span>
            <span class="customer-name">${o.customer_name}</span>
          </div>
          <div class="customer-info">
            <span class="customer-label">Teléfono:</span>
            <a href="tel:${o.phone}" class="customer-phone">${o.phone}</a>
          </div>
          <div class="customer-info">
            <span class="customer-label">Dirección:</span>
            <span class="customer-address">${o.address || 'No especificada'}</span>
          </div>
          ${o.notes ? `
          <div class="customer-info">
            <span class="customer-label">Notas:</span>
            <span class="customer-notes">${o.notes}</span>
          </div>
          ` : ''}
        </div>
        <div class="order-products-admin">
          <h4>Productos</h4>
          <div class="order-items-list">
            ${(items || []).map(it => `
              <div class="order-item-admin">
                <span class="item-qty">${it.quantity}x</span>
                <span class="item-name">${it.product_name}</span>
                <span class="item-price">$ ${formatMoney(it.price * it.quantity)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="order-footer-admin">
          <div class="order-total-admin">
            <span>Total:</span>
            <span class="total-amount">$ ${formatMoney(o.total)}</span>
          </div>
          <div class="order-actions">
            <button class="btn-status btn-pending" onclick="updateOrderStatus('${o.id}', 'pendiente')">Pendiente</button>
            <button class="btn-status btn-confirmed" onclick="updateOrderStatus('${o.id}', 'confirmado')">Confirmar</button>
            <button class="btn-status btn-completed" onclick="updateOrderStatus('${o.id}', 'entregado')">Entregado</button>
          </div>
        </div>
      </div>
    `;
    div.appendChild(orderCard);
  }
}

window.formatMoney = function(n){
  if(n == null || isNaN(n)) return '0.00';
  return Number(n).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2});
};

window.updateOrderStatus = async function(orderId, status) {
  const { error } = await supabaseClient.from('orders').update({ status }).eq('id', orderId);
  if(error){ console.error(error); return; }
  showNotification('Estado actualizado');
  await loadOrders();
};

function initListeners(){
  // login
  document.getElementById('btn-login')?.addEventListener('click', (e)=>{ e.preventDefault(); login(); });
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  // create product form
  const form = document.getElementById('form-create-product');
  form?.addEventListener('submit', createProduct);
}

async function init(){
  await initSupabase();
  await refreshUI();
  initListeners();
}

document.addEventListener('DOMContentLoaded', init);
})();
