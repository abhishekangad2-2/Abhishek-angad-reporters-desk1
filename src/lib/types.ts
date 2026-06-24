export type LandingTemplate = 'none' | 'three-column' | 'z-pattern' | 'newspaper' | 'immersive'

export type Story = {
  id: string
  headline: string
  strap: string
  section: string
  heroImage: string
}

export type ImmersiveChapter = {
  id: string
  text: string
  backgroundImage: string
}

export type PollOption = { label: string; voteCount: number }

export type Poll = {
  id: string
  question: string
  options: PollOption[]
  resultsVisible: 'live' | 'after-close'
}

export type Dispatch = {
  id: string
  text: string
  journalist: { initials: string; name: string }
  postedAt: string
}
