'use client'

// Pixel is fully loaded in root layout <head> script.
// This component exists only to maintain the import in layout.tsx.
// No additional tracking needed — the <head> script handles PageView
// and all custom events are fired via trackEvent() in their respective components.
export default function MetaPixel() {
  return null
}
