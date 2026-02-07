'use client'

import { useEffect } from 'react'

/**
 * ErrorSuppressor Component
 * 
 * Suppresses console errors caused by browser extensions (Yoroi, Eternl, Polkadot.js)
 * that inject code into the page and create uncaught runtime.lastError warnings.
 * These errors are cosmetic and don't affect application functionality.
 */
export default function ErrorSuppressor() {
    useEffect(() => {
        // Store original console.error
        const originalError = console.error

        // Override console.error to filter extension-related errors
        console.error = function (...args: any[]) {
            const errorMessage = args.join(' ')

            // List of patterns to suppress (browser extension errors)
            const suppressPatterns = [
                'runtime.lastError',
                'chrome.runtime',
                'message channel closed before a response was received',
                'Disconnected from polkadot',
                'yoroi',
                'eternl',
                'dapp-connector'
            ]

            // Check if error matches any suppression pattern
            const shouldSuppress = suppressPatterns.some(pattern =>
                errorMessage.toLowerCase().includes(pattern.toLowerCase())
            )

            // Only log errors that are NOT from browser extensions
            if (!shouldSuppress) {
                originalError.apply(console, args)
            }
        }

        // Cleanup: restore original console.error on unmount
        return () => {
            console.error = originalError
        }
    }, [])

    return null // This component doesn't render anything
}
