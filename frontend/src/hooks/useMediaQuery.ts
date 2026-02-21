/**
 * useMediaQuery Hook - Media query detection for responsive design (E1.4)
 *
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 640px)')
 *   const isTablet = useMediaQuery('(max-width: 1024px)')
 */

import { useEffect, useState } from 'react'

/**
 * Hook to detect media query matches in real-time
 *
 * @param query - CSS media query string (e.g., '(max-width: 640px)')
 * @returns boolean - true if media query matches current viewport
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 640px)')
 * const isTablet = useMediaQuery('(max-width: 1024px)')
 *
 * if (isMobile) {
 *   return <MobileLayout />
 * }
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Create media query list
    const mediaQueryList = window.matchMedia(query)

    // Set initial state
    setMatches(mediaQueryList.matches)

    // Define listener for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // Add listener (handle both old and new API)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener)
    } else {
      // Legacy API support
      mediaQueryList.addListener(listener)
    }

    // Cleanup
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener)
      } else {
        // Legacy API support
        mediaQueryList.removeListener(listener)
      }
    }
  }, [query])

  return matches
}

/**
 * Common responsive breakpoints
 */
export const BREAKPOINTS = {
  xs: '(max-width: 480px)',      // Extra small (phones)
  sm: '(max-width: 640px)',      // Small (portrait tablets)
  md: '(max-width: 1024px)',     // Medium (landscape tablets)
  lg: '(min-width: 1025px)',     // Large (desktop)
} as const

/**
 * Convenience hooks for common breakpoints
 */
export function useIsMobile(): boolean {
  return useMediaQuery(BREAKPOINTS.sm)
}

export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.md)
}

export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.lg)
}
