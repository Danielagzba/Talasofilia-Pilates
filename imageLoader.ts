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

// imageLoader.ts

// Retrieve the base URL from environment variables
const CLOUDFLARE_IMAGES_URL = 'https://imagedelivery.net/Ph86JZEbPiEJLBCLDii6hA'

if (!CLOUDFLARE_IMAGES_URL) {
    console.error(
        'Error: NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL environment variable is not set.'
    )
    // Throwing an error is usually better in production builds
    throw new Error(
        'Missing NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL environment variable'
    )
    // Or return a placeholder for development:
    // return `https://via.placeholder.com/${width}`;
}

// Ensure the base URL doesn't have a trailing slash
const cloudflareBaseUrl = CLOUDFLARE_IMAGES_URL.replace(/\/$/, '')

export default function cloudflareLoader({
    src, // This 'src' MUST be your Cloudflare Image ID (e.g., "P4130100.png")
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}) {
    const params = [`width=${width}`]
    if (quality) {
        // Ensure quality is within Cloudflare's range if needed, default is often ~75-85
        params.push(`quality=${quality || 75}`)
    }
    // Cloudflare uses comma-separated key=value pairs for the variant string
    const paramsString = params.join(',')

    // Ensure the src (Image ID) doesn't start with a slash
    // This handles cases where src might accidentally be passed as "/<IMAGE_ID>"
    const imageId = src.startsWith('/') ? src.slice(1) : src

    // **CRITICAL:** Construct the URL in the correct format:
    // BASE_URL / IMAGE_ID / VARIANT_PARAMS
    // Example: https://imagedelivery.net/<HASH>/P4130100.png/width=3840,quality=75
    return `${cloudflareBaseUrl}/${imageId}/${paramsString}`
}
