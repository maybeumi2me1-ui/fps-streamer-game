export type Style = 'technical' | 'entertainment' | 'balanced'
export type ClipType = '技术型' | '娱乐型' | '教学型'
export type Tag =
  'steady' | 'risky' | 'eco' | 'full' | 'half' | 'team' | 'save' | 'challenge' | 'engage'
export type Category = 'tactical' | 'clutch' | 'teammate' | 'challenge' | 'business'
export interface Choice {
  id: string
  label: string
  hint: string
  tag: Tag
  chance: number
  economy: number
  hype: number
  team: number
  gear?: number
  energy?: number
  clip: ClipType
  challengeId?: string
  money?: number
}
export interface GameEvent {
  id: string
  category: Category
  stages: number[]
  title: string
  text: string
  choices: Choice[]
  minRank?: number
  minFans?: number
  requiresTag?: Tag
  condition?: 'behind' | 'ahead' | 'rich' | 'poor'
}
export interface ChallengeDefinition {
  id: string
  title: string
  text: string
  penalty: number
  bannedTag?: Tag
  maxGear?: number
  requiredTag?: Tag
}
export interface ActiveChallenge {
  id: string
  from: number
  to: number
  successes: number
  failures: number
  settled: boolean
}
export interface Clip {
  type: ClipType
  title: string
  quality: number
  day: number
  published: boolean
  promoted: boolean
}
export interface RoundResult {
  stage: number
  title: string
  choice: string
  tag: Tag
  won: boolean
  chance: number
  kills: number
  score: [number, number]
  message: string
}
export interface ChatLine {
  id: number
  name: string
  text: string
  kind: 'chat' | 'follow' | 'gift' | 'challenge'
}
export interface Match {
  style: Style
  seed: number
  stage: number
  score: [number, number]
  economy: number
  gear: number
  team: number
  performance: number
  hype: number
  viewers: number
  peak: number
  gifts: number
  kills: number
  streak: number
  eventId: string
  sideId: string
  resolved: boolean
  interacted: boolean
  results: RoundResult[]
  used: string[]
  tags: Tag[]
  challenges: ActiveChallenge[]
  best: Clip | null
  feed: ChatLine[]
  chatCursor: number
  chatSeen: string[]
  elapsed: number
  hits: number
  roundSeconds: number
  notifications: string[]
  pendingReward: number
}
export interface Report {
  fans: number
  money: number
  rank: number
  kills: number
  promoted: boolean
  won: boolean
  score: [number, number]
  peak: number
  clip: Clip | null
  legacy?: boolean
}
export interface History {
  legacy?: boolean
  day: number
  fans: number
  money: number
  rank: number
  won: boolean
  clip: Clip | null
}
export interface Save {
  version: 4
  day: number
  fans: number
  money: number
  skill: number
  energy: number
  rank: number
  trained: boolean
  rested: boolean
  edited: boolean
  gear: number
  phase: 'desk' | 'live' | 'report'
  report: Report | null
  match: Match | null
  history: History[]
  archive: string[]
  exposure: number
  style: Style
}
