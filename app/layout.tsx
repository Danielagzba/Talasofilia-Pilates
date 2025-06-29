'use client'

import type React from 'react'
import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '../components/theme-provider'
import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'
import { AuthProvider } from '../contexts/auth-context'
import { Toaster } from 'sonner'
import { useEffect } from 'react'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
})

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-serif',
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    useEffect(() => {
        // Set page metadata
        document.title = 'Talasofilia Pilates | Modern Pilates Studio in Puerto Escondido'
        const metaDescription = document.querySelector('meta[name="description"]')
        if (metaDescription) {
            metaDescription.setAttribute('content', 'A modern Pilates experience in the heart of Puerto Escondido, focused on mindful movement and personal transformation.')
        } else {
            const meta = document.createElement('meta')
            meta.name = 'description'
            meta.content = 'A modern Pilates experience in the heart of Puerto Escondido, focused on mindful movement and personal transformation.'
            document.head.appendChild(meta)
        }
    }, [])

    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.variable} ${playfair.variable} font-sans`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <div className="relative flex min-h-screen flex-col">
                            <SiteHeader />
                            <div className="flex-1">{children}</div>
                            <SiteFooter />
                        </div>
                        <Toaster position="top-center" />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
