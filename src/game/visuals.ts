import type { Match, Tag } from './types'
export const maps = [
  {
    id: 'oldtown',
    name: '曦光旧城',
    english: 'SOLSTICE / OLD TOWN',
    area: 'A 区 · 钟楼巷',
    note: '石墙、拱廊与日光交错的交火区',
    position: '0%',
    accent: '#cfb68a',
  },
  {
    id: 'transit',
    name: '蓝隙通道',
    english: 'BLUE SHIFT / TRANSIT',
    area: 'B 区 · 货运枢纽',
    note: '冷蓝灯光下的多层工业通道',
    position: '50%',
    accent: '#74c0e6',
  },
  {
    id: 'harbor',
    name: '晴湾交火区',
    english: 'DAYBREAK / HARBOR',
    area: 'C 区 · 集装箱港',
    note: '开阔货场、纵深掩体与高架桥',
    position: '100%',
    accent: '#77c9bd',
  },
] as const
export type MapId = (typeof maps)[number]['id']
export const mapById = (id: string) => maps.find((m) => m.id === id) ?? maps[0]
export const effects: Record<
  Tag,
  { name: string; kind: string; icon: string; description: string }
> = {
  team: { name: '烟幕封锁', kind: 'smoke', icon: '◉', description: '掩护队友，同步进点' },
  steady: { name: '侦察扫描', kind: 'scan', icon: '⌖', description: '锁定枪线，保持交叉火力' },
  risky: { name: '相位突进', kind: 'dash', icon: 'ϟ', description: '高速切入，争夺前点' },
  eco: { name: '轻装潜行', kind: 'eco', icon: '◇', description: '手枪贴近，保存购买预算' },
  half: { name: '闪光佯攻', kind: 'flash', icon: '✧', description: '短距机动，创造火力窗口' },
  full: { name: '重装压制', kind: 'suppress', icon: '▰', description: '步枪火力，控制进攻通道' },
  save: { name: '掩护撤离', kind: 'retreat', icon: '↶', description: '保留装备，撤出交火区域' },
  challenge: { name: '挑战进行中', kind: 'scan', icon: '⚑', description: '限制装备，接受观众考验' },
  engage: { name: '队伍协同', kind: 'smoke', icon: '◈', description: '信息同步，组织下一波进攻' },
}
export function battleVisual(match: Match | null, preview?: Tag | null) {
  const result = match?.resolved ? match.results.at(-1) : undefined
  const tag =
    preview ??
    result?.tag ??
    (match?.stage === 3 ? 'steady' : match?.stage === 2 ? 'team' : undefined)
  return {
    tag,
    effect: tag ? effects[tag] : null,
    result,
    gear: match?.gear ?? 3,
    outcome: result ? (result.tag === 'save' ? 'saved' : result.won ? 'won' : 'lost') : 'ready',
    enemyCount: match?.stage === 3 ? 2 : 1,
  }
}
