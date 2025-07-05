'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string
  }
}

export function MercadoPagoDevice() {
  useEffect(() => {
    // The device session ID will be available after the script loads
    // as window.MP_DEVICE_SESSION_ID
  }, [])

  return (
    <Script
      src="https://www.mercadopago.com/v2/security.js"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[MercadoPago] Security script loaded, Device ID:', window.MP_DEVICE_SESSION_ID)
      }}
    />
  )
}