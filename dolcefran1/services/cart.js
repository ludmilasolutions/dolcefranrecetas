// Simple client-side cart persisted in localStorage
const STORAGE_KEY = 'dolcefran_cart'

export function getCart() {
  const raw = localStorage.getItem(STORAGE_KEY)
  try { return raw ? JSON.parse(raw) : [] } catch { return [] }
}

export function setCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToCart(product, qty = 1) {
  const cart = getCart()
  const found = cart.find(i => i.id === product.id)
  if (found) found.qty += qty
  else cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, qty })
  setCart(cart)
  return cart
}

export function removeFromCart(productId) {
  let cart = getCart()
  cart = cart.filter(i => i.id !== productId)
  setCart(cart)
  return cart
}

export function clearCart() {
  setCart([])
}

export function cartTotal(items) {
  return items.reduce((sum, i) => sum + (i.price * i.qty), 0)
}
