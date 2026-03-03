import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import ProductCard from '../components/ProductCard'
import { containerStyle, gridStyle } from '../styles/layouts'

export default function Catalog() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('id')
      setProducts(data || [])
    }
    fetchProducts()
  }, [])

  return (
    <section className="container" style={containerStyle}>
      <h1>Catálogo</h1>
      <p>Descubre nuestros productos de pastelería premium.</p>
      <div style={gridStyle}>
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
