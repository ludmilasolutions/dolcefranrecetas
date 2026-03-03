import React from 'react'
import Link from 'next/link'

export default function ProductCard({ product }) {
  return (
    <div style={cardStyle}>
      <Link href={`/product/${product.id}`}>
        <a>
          <img src={product.image_url} alt={product.name} style={imageStyle} />
        </a>
      </Link>
      <h3 style={{ margin: '0.5rem 0 0.25rem' }}>{product.name}</h3>
      <p style={descStyle}>{product.description}</p>
      <div style={priceStyle}>${product.price}</div>
    </div>
  )
}

const cardStyle = {
  width: '280px',
  borderRadius: '12px',
  border: '1px solid #f0d6d9',
  padding: '12px',
  background: '#fff',
};
const imageStyle = {
  width: '100%',
  height: '180px',
  objectFit: 'cover',
  borderRadius: '8px',
};
const descStyle = { color: '#666', height: '40px', overflow: 'hidden', display: 'block' };
const priceStyle = { fontWeight: 700, marginTop: '6px' };
