export const brand = {
  id: 'hei-talk',
  name: 'HEI Talk',
  tagline: 'Events & Registration',
  description: 'The seamless RSVP and ticketing platform. Select an event below to get started.',
  ticketLabel: 'HEI TALK PASS',
  adminTitle: 'HEI Talk Admin',
  heroEyebrow: 'HEI Talk',
  eventUrlHost: 'heitalk.halalexpoindonesia.com',
  copyright: 'D-8 Halal Expo Indonesia 2026',
  footerTagline: 'Your RSVP registration system',
  mainSiteUrl: 'https://halalexpoindonesia.com',
} as const

export function eventUrlPrefix() {
  return `${brand.eventUrlHost}/event/`
}
