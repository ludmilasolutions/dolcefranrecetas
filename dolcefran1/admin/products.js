import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { addToCart } from '../../services/cart'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState(9.99)
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('products').select('*').order('id')
      setProducts(data || [])
    }
    load()
  }, [])

  async function createProduct() {
    let imageUrl = ''
    if (image) {
      const { data, error } = await supabase.storage.from('product-images').upload(
        `/${Date.now()}_${image.name}`,
        image
      )
      if (!error) {
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.Key}`
      }
    }
    const { data: prod, error } = await supabase.from('products').insert([
      { name, price, description, image_url: imageUrl || '' }
    ]).select()
    if (prod) {
      setProducts(prev => [prod[0], ...prev])
      setName('')
      setPrice(9.99)
      setDescription('')
      setImage(null)
    }
  }

  async function updateProduct() {
    if (!selected) return
    const { data } = await supabase.from('products').update({ name, price, description }).eq('id', selected.id).select()
    if (data && data[0]) {
      setProducts(prev => prev.map(p => p.id === selected.id ? data[0] : p))
      setSelected(null)
      setName('')
      setPrice(9.99)
      setDescription('')
      setImage(null)
    }
  }

  async function deleteProduct(id) {
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <section className="container" style={{ padding: '2rem' }}>
      <h1>Productos (Admin)</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, height: 100 }} />
            <input placeholder="Precio" type="number" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value))} style={inputStyle} />
            <input type="file" onChange={e => setImage(e.target.files?.[0])} style={inputStyle} />
            <button onClick={selected ? updateProduct : createProduct} style={btnStyle}>{selected ? 'Actualizar Producto' : 'Crear Producto'}</button>
          </div>
          <div>
          {products.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <span onClick={() => { setSelected(p); setName(p.name); setPrice(p.price); setDescription(p.description); }} style={{ cursor: 'pointer' }}>{p.name}</span>
              <span>${p.price}</span>
              <button onClick={() => deleteProduct(p.id)} style={{ padding: '0.25rem 0.5rem' }}>Eliminar</button>
            </div>
          ))}
          </div>
        </div>
      </section>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: '0.75rem', marginTop: 8, borderRadius: 6, border: '1px solid #ddd' }
const btnStyle = { marginTop: 8, padding: '0.75rem 1rem', borderRadius: 6, border: 'none', background: '#f0b4bd', color: '#fff', fontWeight: 700 }
