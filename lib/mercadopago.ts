import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

// Create MercadoPago instances dynamically to ensure env vars are loaded
export const getMercadoPago = () => {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return null
  }
  
  return new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
  })
}

export const getPreference = () => {
  const mp = getMercadoPago()
  return mp ? new Preference(mp) : null
}

export const getPayment = () => {
  const mp = getMercadoPago()
  return mp ? new Payment(mp) : null
}

// For backward compatibility
export const mercadopago = getMercadoPago()
export const preference = mercadopago ? new Preference(mercadopago) : null as any
export const payment = mercadopago ? new Payment(mercadopago) : null as any

// Public key for frontend SDK
export const getMercadoPagoPublicKey = () => {
  return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
}