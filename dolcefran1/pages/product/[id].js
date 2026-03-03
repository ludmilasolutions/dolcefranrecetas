import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../services/supabaseClient'
import { addToCart } from '../../services/cart'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState(null)

  useEffect(() => {
    if (!id) return
    async function fetchProduct() {
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(data)
    }
    fetchProduct()
  }, [id])

  if (!product) return <div className="container">Cargando...</div>

  return (
    <section className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <img src={product.image_url} alt={product.name} style={{ width: 340, height: 340, objectFit: 'cover', borderRadius: 8 }} />
        <div>
          <h1>{product.name}</h1>
          <p style={{ color: '#555' }}>{product.description}</p>
          <div style={{ fontWeight: 700, fontSize: '1.4rem' }}>${product.price}</div>
          <button onClick={() => addToCart(product, 1)} style={buyBtn}>Añadir al carrito</button>
        </div>
      </div>
    </section>
  )
}

const buyBtn = {
  marginTop: 16,
  padding: '0.75rem 1rem',
  borderRadius: 6,
  border: 'none',
  background: '#f0b4bd',
  color: '#fff',
  fontWeight: 700,
}
