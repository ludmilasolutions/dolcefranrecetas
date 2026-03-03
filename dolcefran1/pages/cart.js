import React, { useEffect, useState } from 'react'
import { getCart, setCart, removeFromCart, cartTotal } from '../services/cart'
import Link from 'next/link'

export default function Cart() {
  const [items, setItems] = useState([])

  useEffect(() => { setItems(getCart()) }, [])

  const total = cartTotal(items)

  function remove(id){
    const updated = removeFromCart(id)
    setItems(updated)
  }

  return (
    <section className="container" style={{ padding: '2rem' }}>
      <h1>Carrito</h1>
      {items.length === 0 ? (
        <p>Tu carrito está vacío. Explora el catálogo.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            {items.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <img src={i.image_url} alt={i.name} style={{ width: 60, height: 60, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  <div style={{ color: '#555' }}>Cantidad: {i.qty}</div>
                </div>
                <div style={{ fontWeight: 700 }}>${i.price * i.qty}</div>
                <button onClick={() => remove(i.id)} style={{ padding: '0.4rem 0.6rem' }}>Quitar</button>
              </div>
            ))}
          </div>
          <aside>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span><strong>${total}</strong>
              </div>
              <Link href="/checkout"><a style={{ display: 'inline-block', marginTop: 12, padding: '0.75rem 1rem', background: '#f0b4bd', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Checkout</a></Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
