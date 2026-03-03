import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useRouter } from 'next/router'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState(null)

  async function login(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/admin/products')
  }

  return (
    <section className="container" style={{ padding: '2rem' }}>
      <h1>Admin Login</h1>
      <form onSubmit={login} style={{ maxWidth: 400 }}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        <button type="submit" style={btnStyle}>Entrar</button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </form>
    </section>
  )
}

const inputStyle = { display: 'block', width: '100%', padding: '0.75rem', marginTop: 8, borderRadius: 6, border: '1px solid #ddd' }
const btnStyle = { marginTop: 8, padding: '0.75rem 1rem', borderRadius: 6, border: 'none', background: '#f0b4bd', color: '#fff', fontWeight: 700 }
