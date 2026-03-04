'use strict';
// Dolcefran Admin panel (vanilla JS)
(function() {
  // Supabase config
  const SUPABASE_URL = "https://dgsbeahwcruisvyuufcq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnc2JlYWh3Y3J1aXN2eXV1ZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTEzMDQsImV4cCI6MjA4ODA4NzMwNH0.lhM3Uqn4U2PeO3TtuRzlgKRGtsHPx6RgRrkFC5DUwj0";
  let supabaseClient;

function initSupabase(){
  function createClient() {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      setTimeout(createClient, 100);
    }
  }
  createClient();
}

function showError(el, msg){ el.textContent = msg; }

async function login(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const panel = document.getElementById('login-error');
  try{
    const { user, session, error } = await supabaseClient.auth.signIn({ email, password });
    if(error){ showError(panel, error.message); return; }
  }catch(err){ showError(panel, 'Error de autenticacion'); console.error(err); return; }
  await refreshUI();
}

async function logout(){
  await supabaseClient.auth.signOut();
  location.reload();
}

async function refreshUI(){
  const user = supabaseClient.auth.user();
  const loginPanel = document.getElementById('login-panel');
  const adminPanel = document.getElementById('admin-panel');
  if(user){
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
  const name = document.getElementById('p-name').value;
  const desc = document.getElementById('p-desc').value;
  const price = parseFloat(document.getElementById('p-price').value);
  const imageInput = document.getElementById('p-image');
  let imageUrl = '';
  if(imageInput.files && imageInput.files[0]){
    const file = imageInput.files[0];
    const path = 'products/' + Date.now() + '_' + file.name;
    const { data: uploaded, error } = await supabase.storage.from('images').upload(path, file);
    if(error){ console.error(error); alert('Error al subir la imagen'); return; }
    imageUrl = uploaded ? uploaded.Key : path;
    // get public url
    const { publicURL } = supabase.storage.from('images').getPublicUrl(path);
    imageUrl = publicURL;
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
  if(!orders || orders.length===0){ div.innerHTML = '<p>No hay pedidos.</p>'; return; }
  for(const o of orders){
  const { data: items, error: ei } = await supabaseClient.from('order_items').select('*').eq('order_id', o.id);
    const itemsText = (items||[]).map(it => it.quantity + 'x ' + it.product_id).join(', ');
    const p = document.createElement('div');
    p.style.border = '1px solid #eee'; p.style.padding='6px'; p.style.margin='6px 0';
    p.innerHTML = `<strong>Pedido ${o.id}</strong> - ${o.customer_name} (${o.phone}) - Total ${o.total}€<br/><small>Items: ${itemsText}</small>`;
    div.appendChild(p);
  }
}

function initListeners(){
  // login
  document.getElementById('btn-login')?.addEventListener('click', (e)=>{ e.preventDefault(); login(); });
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  // create product form
  const form = document.getElementById('form-create-product');
  form?.addEventListener('submit', createProduct);
}

async function init(){
  initSupabase();
  await refreshUI();
  initListeners();
}

document.addEventListener('DOMContentLoaded', init);
})();
