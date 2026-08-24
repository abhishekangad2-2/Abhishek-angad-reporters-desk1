// Shared, client-safe definition of the site-chrome UI strings (masthead nav,
// byline prefix, footer tabs) so they can be translated into the reader's
// language like the article body. English is the source/default.

export const CHROME_DEFAULT = {
  wire: 'The Wire',
  podcast: 'Podcast',
  archives: 'Archives',
  by: 'By',
  investigate: 'Investigate this',
  pay: 'Pay for our journalism',
  newsletter: 'Subscribe to our newsletter',
  poll: 'Poll Section',
  bio: 'About the founder',
  photograph: 'Photograph',
  source: 'Source',
  support: 'Support',
} as const

export type ChromeLabels = Record<keyof typeof CHROME_DEFAULT, string>
