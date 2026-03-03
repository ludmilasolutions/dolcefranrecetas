import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function AdminOrders(){
  const [orders, setOrders] = useState([])
  useEffect(() => {
    async function load(){
      const { data } = await supabase.from('orders').select('*').order('id')
      setOrders(data || [])
    }
    load()
  }, [])
  return (
    <section className="container" style={{ padding: '2rem' }}>
      <h1>Pedidos</h1>
      {orders.map(o => (
        <div key={o.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
          <strong>Pedido #{o.id}</strong> - Total ${o.total}
          <div>Cliente: {o.name} - Tel: {o.phone}</div>
        </div>
      ))}
    </section>
  )
}
