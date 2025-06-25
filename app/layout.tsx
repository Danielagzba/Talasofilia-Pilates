import type React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '../components/theme-provider'
import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'
import { AuthProvider } from '../contexts/auth-context'
import { Toaster } from 'sonner'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
})

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-serif',
})

export const metadata: Metadata = {
    title: 'Talasofilia Pilates | Modern Pilates Studio in Puerto Escondido',
    description:
        'A modern Pilates experience in the heart of Puerto Escondido, focused on mindful movement and personal transformation.',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
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
