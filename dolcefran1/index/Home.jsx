import React from 'react';

export default function Home() {
  return (
    <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: 0 }}>Dolcefran</h1>
      <p style={{ color: '#555', marginTop: '0.5rem' }}>Pastelería premium, productos artesanales para dulzar tus momentos.</p>
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <a href="/catalog" style={buttonStyle}>Ver Catálogo</a>
        <a href="/checkout" style={buttonStyle}>Pedir por WhatsApp</a>
      </div>
    </section>
  );
}

const buttonStyle = {
  display: 'inline-block',
  padding: '0.75rem 1.25rem',
  borderRadius: '999px',
  background: '#f8e6ea',
  color: '#8b2c3e',
  textDecoration: 'none',
  fontWeight: 600,
};
