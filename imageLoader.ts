// const normalizeSrc = (src: string) => {
//     return src.startsWith('/') ? src.slice(1) : src
// }

// export default function cloudflareLoader({
//     src,
//     width,
//     quality,
// }: {
//     src: string
//     width: number
//     quality?: number
// }) {
//     const params = [`width=${width}`]
//     if (quality) {
//         params.push(`quality=${quality}`)
//     }
//     const paramsString = params.join(',')
//     const CLOUDFLARE_IMAGE_DELIVERY_URL =
//         'https://imagedelivery.net/Ph86JZEbPiEJLBCLDii6hA'

//     return `${CLOUDFLARE_IMAGE_DELIVERY_URL}/cdn-cgi/image/${paramsString}/${normalizeSrc(
//         src
//     )}`
// }

// Optimized Cloudflare Image Loader with advanced features

const CLOUDFLARE_IMAGES_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL || 'https://imagedelivery.net/Ph86JZEbPiEJLBCLDii6hA'

const cloudflareBaseUrl = CLOUDFLARE_IMAGES_URL.replace(/\/$/, '')

// Device pixel ratio breakpoints for responsive images
const devicePixelRatios = [1, 2]

export default function cloudflareLoader({
    src,
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}) {
    // Handle local placeholder images
    if (src.includes('placeholder.svg')) {
        return src
    }

    // Build transformation parameters
    const params: string[] = []
    
    // Width optimization
    params.push(`width=${width}`)
    
    // Quality optimization (default to 85 for good balance)
    const optimizedQuality = quality || 85
    params.push(`quality=${optimizedQuality}`)
    
    // Format auto-selection (WebP/AVIF when supported)
    params.push('format=auto')
    
    // Fit mode for consistent sizing
    params.push('fit=scale-down')
    
    // Enable progressive loading for better perceived performance
    params.push('metadata=none')
    
    // Add sharpening for smaller images
    if (width < 400) {
        params.push('sharpen=0.2')
    }

    const paramsString = params.join(',')
    const imageId = src.startsWith('/') ? src.slice(1) : src

    return `${cloudflareBaseUrl}/${imageId}/${paramsString}`
}
