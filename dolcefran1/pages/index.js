import React from 'react'
import Home from '../index/Home'
import Link from 'next/link'

export default function IndexPage() {
  return (
    <div>
      <Home />
      <section className="container" style={{ padding: '2rem 0' }}>
        <h2>Bienvenido a Dolcefran</h2>
        <p>Explora nuestra selección de pasteles artesanales y dulces premium.</p>
        <Link href="/catalog"><a>Ver Catálogo</a></Link>
      </section>
    </div>
  )
}
