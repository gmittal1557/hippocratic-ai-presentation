import { track } from "@vercel/analytics"

/**
 * Centralized tracking utility.
 * Fires events to both Vercel Analytics and Microsoft Clarity.
 */

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void
  }
}

/** Fire a custom event to Vercel Analytics + tag the Clarity session */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>
) {
  // Vercel Analytics custom event
  track(name, properties)

  // Microsoft Clarity custom tag (labels the session for filtering)
  if (typeof window !== "undefined" && window.clarity) {
    window.clarity("set", name, properties ? JSON.stringify(properties) : "true")
  }
}

// ── Section view tracking ──────────────────────────────────────────

export function trackSectionView(sectionId: string) {
  trackEvent("section_view", { section: sectionId })
}

// ── Navigation ─────────────────────────────────────────────────────

export function trackNavClick(target: string) {
  trackEvent("nav_click", { target })
}

export function trackTocClick(sectionId: string) {
  trackEvent("toc_click", { section: sectionId })
}

// ── CTA & button clicks ───────────────────────────────────────────

export function trackButtonClick(button: string, context?: string) {
  trackEvent("button_click", { button, ...(context ? { context } : {}) })
}

// ── Tabs & toggles ────────────────────────────────────────────────

export function trackTabSwitch(tab: string, section: string) {
  trackEvent("tab_switch", { tab, section })
}

export function trackToggle(element: string, open: boolean) {
  trackEvent("toggle", { element, state: open ? "open" : "close" })
}

// ── External links ─────────────────────────────────────────────────

export function trackExternalLink(destination: string, url: string) {
  trackEvent("external_link", { destination, url })
}

// ── Content engagement ─────────────────────────────────────────────

export function trackPainPointSelect(index: number, title: string) {
  trackEvent("pain_point_select", { index, title })
}

export function trackMvpStepView(step: string, index: number) {
  trackEvent("mvp_step_view", { step, index })
}

export function trackDialogOpen(title: string) {
  trackEvent("dialog_open", { title })
}

// ── Media ──────────────────────────────────────────────────────────

export function trackVideoPlay(video: string) {
  trackEvent("video_play", { video })
}

export function trackAudioToggle(playing: boolean) {
  trackEvent("audio_toggle", { state: playing ? "play" : "pause" })
}

// ── Scroll depth ───────────────────────────────────────────────────

let maxScrollDepth = 0
export function trackScrollDepth(percent: number) {
  // Only fire at 25% increments to avoid spamming
  const milestone = Math.floor(percent / 25) * 25
  if (milestone > maxScrollDepth && milestone > 0) {
    maxScrollDepth = milestone
    trackEvent("scroll_depth", { percent: milestone })
  }
}
