export interface AdService {
  isAvailable(): Promise<boolean>
  showRewarded(): Promise<{ completed: boolean }>
}
// Future providers must return completed=true only after verified completion.
// No ad SDK or external requests are included in V0.4.
export const adService: AdService = {
  async isAvailable() {
    return false
  },
  async showRewarded() {
    return { completed: false }
  },
}
