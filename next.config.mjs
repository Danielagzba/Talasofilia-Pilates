let userConfig = undefined
try {
    // try to import ESM first
    userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
    try {
        // fallback to CJS import
        userConfig = await import('./v0-user-next.config')
    } catch (innerError) {
        // ignore error
    }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        loader: 'custom',
        loaderFile: './imageLoader.ts',
        // Define supported image sizes for optimization
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Supported image formats
        formats: ['image/webp', 'image/avif'],
        // Minimize image size
        minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
        // Disable static imports optimization (since we use Cloudflare)
        disableStaticImages: true,
        // Domains allowed for external images
        domains: ['imagedelivery.net', 'i.imgur.com'],
    },
    experimental: {
        webpackBuildWorker: true,
        parallelServerBuildTraces: true,
        parallelServerCompiles: true,
    },
}

if (userConfig) {
    // ESM imports will have a "default" property
    const config = userConfig.default || userConfig

    for (const key in config) {
        if (
            typeof nextConfig[key] === 'object' &&
            !Array.isArray(nextConfig[key])
        ) {
            nextConfig[key] = {
                ...nextConfig[key],
                ...config[key],
            }
        } else {
            nextConfig[key] = config[key]
        }
    }
}

// export default nextConfig
let config = nextConfig

if (process.env.NEXT_PUBLIC_CF_PAGES) {
    const pkg = await import('@cloudflare/next-on-pages')
    config = pkg.withCloudflarePagesAdapter(nextConfig)
}

export default config
