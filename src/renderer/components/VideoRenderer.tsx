
import { useEffect, useRef } from 'react'
import { sanitizeUrl } from '@braintree/sanitize-url'
import { getOS } from '@/packages/navigator'

interface VideoRendererProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src?: string
    poster?: string
}

/**
 * A specialized Video component that implements Progressive Loading and Pre-warming.
 */
export const VideoRenderer = ({ src, poster, className, style, ...props }: VideoRendererProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const sanitizedSrc = src ? sanitizeUrl(src) : undefined

    // Pre-warm logic: Initiate connection as soon as component mounts (when URL is received)
    useEffect(() => {
        // Skip pre-warm logic on Android to avoid fetch/blob issues
        // The user requested to directly assign src and rely on native player
        if (!sanitizedSrc || getOS() === 'Android') return

        // 1. Browser Hint: <link rel="preload">
        // This is the standard way to tell the browser "we will need this soon"
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'video'
        link.href = sanitizedSrc
        document.head.appendChild(link)

        // 2. Active Pre-warm: fetch()
        // Explicitly start a fetch to force DNS, TCP, SSL, and Initial Buffering.
        // We use mode: 'no-cors' to allow opaque responses (e.g. from CDNs) to still warm up the socket
        // and populate the browser cache.
        const controller = new AbortController()

        // Use a timeout to avoid hanging connections forever if unnecessary
        const fetchTimeout = setTimeout(() => {
            fetch(sanitizedSrc, {
                signal: controller.signal,
                mode: 'no-cors',
                // We just want to initiate the transfer. For short videos, this might download the whole thing.
            }).catch(() => {
                // Ignore aborts or errors - this is just an optimization
            })
        }, 0)

        // 3. Force video element to load metadata if it hasn't started
        if (videoRef.current) {
            videoRef.current.preload = "auto"
        }

        return () => {
            clearTimeout(fetchTimeout)
            controller.abort()
            try {
                if (link.parentNode) {
                    link.parentNode.removeChild(link)
                }
            } catch (e) {
                // ignore
            }
        }
    }, [sanitizedSrc])

    const isAndroid = getOS() === 'Android'

    return (
        <video
            ref={videoRef}
            src={sanitizedSrc}
            poster={poster ? sanitizeUrl(poster) : undefined}
            // Progressive Loading: "auto" tells the browser to download the whole video as soon as possible
            // The browser will play as soon as it has enough data (progressive playback)
            preload="auto"
            controls
            playsInline
            // Optional: muted plays faster usually, but user clicks play so sound is expected.
            className={className}
            style={{
                // Ensure hardware acceleration is enabled on Android (WebView)
                ...(isAndroid ? { transform: 'translateZ(0)' } : {}),
                ...style,
            }}
            {...props}
        />
    )
}
