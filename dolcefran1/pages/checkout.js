import React, { useState, useMemo } from 'react'
import { getCart } from '../services/cart'

export default function Checkout() {
  const cart = getCart()
  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const whatsappLink = useMemo(() => {
    const items = cart.map(i => `- ${i.name} x${i.qty} = $${i.price * i.qty}`).join('\n')
    const body = `Hola, quiero realizar un pedido.\nCliente: ${name || 'N/A'}\nTel: ${phone || 'N/A'}\n\nPedido:\n${items}\nTotal: $${total}`
    const encoded = encodeURIComponent(body)
    // Replace with your business WhatsApp number
    const number = '0000000000'
    return `https://wa.me/${number}?text=${encoded}`
  }, [cart, name, phone, total])

  return (
    <section className="container" style={{ padding: '2rem' }}>
      <h1>Checkout</h1>
      {cart.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3>Detalles</h3>
            <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            <input placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
            <div style={{ marginTop: 12 }}>Total: <strong>${total}</strong></div>
          </div>
          <div>
            <h3>Resumen</h3>
            {cart.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{i.name} x{i.qty}</span>
                <span>${i.price * i.qty}</span>
              </div>
            ))}
            <div style={{ marginTop: 6, fontWeight: 700 }}>Total: ${total}</div>
            <a href={whatsappLink} style={whatsAppBtn} target="_blank" rel="noreferrer">Pedir por WhatsApp</a>
          </div>
        </div>
      )}
    </section>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: '0.75rem', marginTop: 8, borderRadius: 6, border: '1px solid #ddd' }
const whatsAppBtn = {
  display: 'inline-block', marginTop: 12, padding: '0.75rem 1rem', background: '#25D366', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 700
}
