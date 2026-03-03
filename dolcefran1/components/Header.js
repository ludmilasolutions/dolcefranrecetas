import React from 'react';
import Link from 'next/link';

export default function Header() {
  // Simple header with pastel brand colors
  return (
    <header style={headerStyle}>
      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Dolcefran</div>
      <nav>
        <Link href="/" legacyBehavior><a style={linkStyle}>Inicio</a></Link>
        <Link href="/catalog" legacyBehavior><a style={linkStyle}>Catálogo</a></Link>
        <Link href="/cart" legacyBehavior><a style={linkStyle}>Carrito</a></Link>
        <Link href="/checkout" legacyBehavior><a style={linkStyle}>Checkout</a></Link>
      </nav>
    </header>
  );
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem',
  background: 'linear-gradient(90deg, #fff4f9 0%, #fff 60%, #fff4f9 100%)',
  borderBottom: '1px solid #f0d5d8',
};

const linkStyle = {
  marginLeft: '1rem',
  color: '#b76e87',
  textDecoration: 'none',
  fontWeight: 600,
};
