// Centralized business configuration + feature flags.
// Only CONFIRMED values are rendered; unconfirmed values are gated by flags and tracked
// in DEMO_CONTENT_TODO.md.

export const site = {
  name: "8th State Production",
  shortName: "8th State",
  wordmarkLead: "8TH STATE",
  wordmarkTail: "PRODUCTION",
  location: { en: "Tbilisi, Georgia", ka: "თბილისი, საქართველო" },
  // The real public Instagram handle (art-direction reference in the brief).
  instagram: "https://www.instagram.com/8th_state_production",
  instagramHandle: "@8th_state_production",
} as const;

/**
 * Contact values. `confirmed: false` means the value is a placeholder and must NOT be
 * presented as verified fact - the UI renders it muted/labeled or hides it.
 */
export const contact = {
  email: { value: "hello@8thstate.ge", confirmed: false },
  phone: { value: "+995 000 000 000", confirmed: false },
} as const;

/**
 * Feature flags keep the demo honest: nothing that would require real infrastructure
 * or unverified claims is presented as real.
 */
export const flags = {
  // No real showreel video exists yet - never render a fake play control / duration.
  showreelEnabled: false,
  // No real credentials PDF - "Request Credentials" becomes a demo inquiry path.
  credentialsDeckEnabled: false,
  // Submission is simulated locally in this phase.
  liveSubmission: false,
  // Response-time commitment is unconfirmed - do not show a specific SLA.
  responseTimeConfirmed: false,
} as const;

export type SiteConfig = typeof site;
