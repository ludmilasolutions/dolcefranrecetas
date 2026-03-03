import React from 'react'
import '../styles/globals.css'
import Header from '../components/Header'

export default function App({ Component, pageProps }) {
  return (
    <div>
      <Header />
      <main style={{ paddingTop: '1rem' }}>
        <Component {...pageProps} />
      </main>
    </div>
  )
}
