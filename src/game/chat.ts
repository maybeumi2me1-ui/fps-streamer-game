import type { Match, Save } from './types'
export const audience = [
  {
    name: '老粉阿强',
    personality: '嘴上吐槽，始终陪伴',
    lines: [
      '饭已备好，等主播下饭。',
      '这次真没法黑。',
      '熟悉的味道，又倒了。',
      '领先了也别开始逛街。',
      '没事，分能再打。',
      '稳得像在上班。',
      '你是真不怕掉分啊。',
      '省这点钱准备买房？',
      '终于舍得掏步枪了。',
      '这连胜连败都很有节目。',
      '挑战可以，别挑战我的血压。',
      '昨天那波我已经看了三遍。',
    ],
  },
  {
    name: '白银战神',
    personality: '热心指挥，点位专家',
    lines: [
      '我建议先控中路。',
      '我刚才说的就是这个意思！',
      '这波应该先拉枪线。',
      '优势别单走，打补枪。',
      '落后就换个默认吧。',
      '交叉枪线是对的。',
      '干拉要有队友能补。',
      'ECO 贴近点，别对远枪。',
      '全起要把道具打完。',
      '节奏起来了，继续沟通。',
      '限定装备就换近点架法。',
      '还记得上次那个转点吗？',
    ],
  },
  {
    name: '枪法质检员',
    personality: '理性评价每次操作',
    lines: [
      '今天的预瞄在及格线上。',
      '这一枪的定位很干净。',
      '急停没到位，记下来。',
      '领先也保持准星高度。',
      '落后别着急开枪。',
      '架枪点选得合理。',
      '这次拉枪风险有点大。',
      '手枪的首发很重要。',
      '步枪控得住才算赚。',
      '手感趋势值得观察。',
      '限制装备，基本功更重要。',
      '前几天的准星习惯改善了。',
    ],
  },
  {
    name: '老板不差钱',
    personality: '喜欢互动，偶尔送礼',
    lines: [
      '今天有好活吗？',
      '这波值一杯咖啡。',
      '没事，输了也别冷场。',
      '领先了给大家讲两句。',
      '逆风继续播，我还在。',
      '这份耐心挺难得。',
      '大胆，有点意思。',
      '省经济，懂得理财。',
      '好装备好好打。',
      '这节奏我爱看。',
      '完成挑战再谈礼物。',
      '昨天的切片我转给朋友了。',
    ],
  },
  {
    name: '切片大师',
    personality: '寻找技术与娱乐高光',
    lines: [
      '录屏已经开了。',
      '技术型素材有了！',
      '这失误能剪成喜剧。',
      '连着赢可以做教学。',
      '逆风翻盘才有故事。',
      '这波思路适合配字幕。',
      '大心脏镜头，先记时间。',
      'ECO 翻盘的标题我都想好了。',
      '装备铺垫要留在片头。',
      '这段适合连起来剪。',
      '离谱挑战，记得留反应。',
      '昨天发布的片段有新观众了。',
    ],
  },
  {
    name: '路人882',
    personality: '从切片入坑的新朋友',
    lines: [
      '从首页来的，先看看。',
      '刚进来就看到赢，舒服。',
      '输了也有点好笑。',
      '原来已经领先这么多。',
      '追分过程还挺有意思。',
      '第一次看懂架枪思路。',
      '这就是切片里的猛人吗？',
      'ECO 是先攒钱的意思吧？',
      '装备变好了，期待一下。',
      '是不是一直是这个节奏？',
      '这挑战规则真能打吗？',
      '我就是看那条切片来的！',
    ],
  },
  {
    name: '排位受害者',
    personality: '吐槽队友，也懂配合',
    lines: [
      '今天的队友会报点吗？',
      '终于遇到能配合的了。',
      '这局我太熟了。',
      '优势别给对面送温暖。',
      '逆风麦克风别吵起来。',
      '有人补枪真幸福。',
      '我队友也爱这样冲出去。',
      '至少这次经济对上了。',
      '有枪就别一个人送。',
      '排位的起伏就是这么大。',
      '挑战别把队友心态打没。',
      '上次那个指挥我还记得。',
    ],
  },
  {
    name: '沉默观众',
    personality: '潜水很久，偶尔认真发言',
    lines: [
      '在。',
      '好枪。',
      '下一回合。',
      '守住。',
      '还来得及。',
      '这个选择不错。',
      '有点紧张。',
      '存一点资源。',
      '准备好了。',
      '节奏变了。',
      '我想看这个挑战。',
      '其实之前的直播我也看了。',
    ],
  },
]
export const contexts = [
  'idle',
  'win',
  'lose',
  'ahead',
  'behind',
  'steady',
  'risky',
  'eco',
  'full',
  'streak',
  'challenge',
  'history',
] as const
export type Context = (typeof contexts)[number]
export function chatContext(s: Save, m: Match): Context[] {
  const last = m.results.at(-1),
    out: Context[] = ['idle']
  if (last) out.push(last.won ? 'win' : 'lose')
  if (m.score[0] !== m.score[1]) out.push(m.score[0] > m.score[1] ? 'ahead' : 'behind')
  const tag = m.tags.at(-1)
  if (tag === 'eco' || tag === 'save') out.push('eco')
  else if (tag === 'full' || tag === 'half') out.push('full')
  else if (tag === 'risky') out.push('risky')
  else if (tag) out.push('steady')
  if (Math.abs(m.streak) >= 2) out.push('streak')
  if (m.challenges.some((c) => !c.settled)) out.push('challenge')
  if (s.archive.length || s.exposure > 0) out.push('history')
  return out
}
