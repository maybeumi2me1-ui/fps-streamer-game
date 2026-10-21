<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
type Report = { fans: number; money: number; rank: number; kills: number; promoted: boolean }
type Save = { day: number; fans: number; money: number; skill: number; energy: number; rank: number; trained: boolean; rested?: boolean; edited?: boolean; gear?: number; history?: { day: number; fans: number; money: number }[]; phase: 'desk' | 'report'; report: Report | null }
const showData = ref(false)
const key = 'fps-streamer-save-v1'
const fresh = (): Save => ({day:1,fans:128,money:200,skill:42,energy:100,rank:1000,trained:false,phase:'desk',report:null})
const notice = ref('')
function read(): Save {
 try { const v = JSON.parse(localStorage.getItem(key) || 'null'); if(v && Number.isInteger(v.day) && v.day>=1 && v.day<=7 && ['desk','report'].includes(v.phase) && ['fans','money','skill','energy','rank'].every(k=> typeof v[k]==='number' && Number.isFinite(v[k])) && typeof v.trained==='boolean' && (v.phase==='desk' || v.report && ['fans','money','rank','kills'].every(k=>typeof v.report[k]==='number'))) return v } catch { notice.value='存档无法读取，已开启新档。' } return fresh()
}
const s = ref<Save>(read())
const live = ref(false), round = ref(0), kills = ref(0), hype = ref(0), eventIndex = ref(0), chosen = ref(false), hits = ref(0)
const feed = ref(['小橘：来了来了，今天冲分！','路人甲：主播这个桌面有点帅','阿北：前排坐好。'])
const events = [
 {title:'队友请求你指挥',text:'比分落后，队伍语音里突然安静下来。你决定怎么打？',choices:['冷静报点，配合进攻','直接干拉，整点节目效果'],effects:[{h:8,k:2},{h:20,k:-1}]},
 {title:'弹幕开始质疑枪法',text:'“就这？我上我也行。”几条挑衅弹幕飘过。',choices:['专注对局，用操作回应','幽默接梗，邀请水友互动'],effects:[{h:6,k:3},{h:22,k:0}]},
 {title:'最后一局，关键残局',text:'只剩你一个人。直播间的人越来越多，所有人都等着这一枪。',choices:['稳住架枪，等待时机','相信手感，主动出击'],effects:[{h:10,k:2},{h:25,k:1}]}
]
const event = computed(()=>events[eventIndex.value]!)
const tier = computed(()=>s.value.rank>=1250?'黄金 III':s.value.rank>=1100?'白银 I':'白银 III')
const viewers = computed(()=>Math.round(s.value.fans*.22+round.value*9+hype.value))
const ended = computed(()=>s.value.day===7 && s.value.phase==='report')
function save(){try {localStorage.setItem(key,JSON.stringify(s.value))}catch{notice.value='浏览器存储不可用，请勿关闭页面。'}}
function rest(){if(s.value.rested)return;s.value.rested=true;s.value.energy=Math.min(100,s.value.energy+20);notice.value='休息完成：体力恢复 20。';save()}
function edit(){if(s.value.edited || s.value.energy<15)return;s.value.edited=true;s.value.energy-=15;s.value.fans+=25;notice.value='日常切片发布：粉丝 +25，体力 -15。';save()}
function upgrade(){const cost=150*((s.value.gear||0)+1);if(s.value.money<cost || (s.value.gear||0)>=3)return;s.value.money-=cost;s.value.gear=(s.value.gear||0)+1;notice.value='设备已升级，之后每场直播获得更多收入和曝光。';save()}
function train(){if(s.value.trained || s.value.energy<20)return;s.value.skill=Math.min(100,s.value.skill+8);s.value.energy-=20;s.value.trained=true;notice.value='练枪完成：枪法 +8，体力 -20。今天直播试试手感！';save()}
let timer: ReturnType<typeof setInterval> | undefined
function start(){live.value=true;round.value=1;kills.value=0;hype.value=0;eventIndex.value=0;chosen.value=false;hits.value=0;notice.value='';timer=setInterval(()=>{const lines=['这枪好快！','主播加油，今天上大分','刚来的，什么段位？','这波配合可以','哈哈哈节目效果拉满'];feed.value.push(`水友${Math.floor(Math.random()*900+100)}：${lines[Math.floor(Math.random()*lines.length)]}`);feed.value=feed.value.slice(-7)},2200)}
function aim(){if(hits.value>=6)return;hits.value++;kills.value++;hype.value+=2}
function choose(i:number){if(chosen.value)return;const e=event.value.effects[i]!;hype.value+=e.h;kills.value=Math.max(0,kills.value+e.k+Math.floor(s.value.skill/20)+(s.value.energy>=80?1:0));chosen.value=true;feed.value.push(`房管：${event.value.choices[i]}，这波有了！`);feed.value=feed.value.slice(-7)}
function next(){if(!chosen.value)return;if(eventIndex.value<2){eventIndex.value++;round.value++;chosen.value=false;hits.value=0;return}clearInterval(timer);live.value=false;const fans=Math.round(15+hype.value*1.3+kills.value*2+Math.random()*15+(s.value.gear||0)*10);const money=Math.round(20+viewers.value*.3+hype.value*.6+(s.value.gear||0)*15);const rank=kills.value>=12?25+Math.round(s.value.skill/4):-15;s.value.report={fans,money,rank,kills:kills.value,promoted:false};s.value.fans+=fans;s.value.money+=money;s.value.rank=Math.max(0,s.value.rank+rank);s.value.energy=Math.max(0,s.value.energy-50);s.value.history=[...(s.value.history||[]),{day:s.value.day,fans:s.value.fans,money}];s.value.phase='report';save()}
function promote(){const r=s.value.report;if(!r||r.promoted||s.value.money<80)return;s.value.money-=80;const gain=Math.round(r.fans*.5);s.value.fans+=gain;r.fans+=gain;r.promoted=true;const last=s.value.history?.at(-1);if(last)last.fans=s.value.fans;save()}
function nextDay(){if(ended.value)return;s.value.day++;s.value.phase='desk';s.value.energy=100;s.value.trained=false;s.value.rested=false;s.value.edited=false;s.value.report=null;notice.value='新的一天，体力已恢复。';save()}
function restart(){if(!confirm('重新开始会覆盖当前的 7 天存档，确定吗？'))return;clearInterval(timer);live.value=false;s.value=fresh();save();notice.value='新的主播生涯开始了。'}
onUnmounted(()=>clearInterval(timer))
</script>

<template>
 <div class="shell">
  <header><a class="brand" href="./"><span class="logo">⌖</span> STREAMER<span class="brand-light"> / FPS 主播模拟器</span></a><div class="header-right"><span class="saved">● 本地自动存档</span><button class="quiet" @click="restart">重新开始</button></div></header>
  <main>
   <div class="heading"><div><div class="eyebrow">YOUR ROAD TO THE SPOTLIGHT</div><h1>{{ live ? '好戏，正在发生。' : s.phase==='report' ? (ended?'七天之后，你被看见。':'下播了，今天打得不错。') : '从一张桌子，到整个舞台。' }}</h1><p>{{live?'保持专注。每一次选择，都可能成为下一个名场面。': '练好每一枪，回应每一条弹幕。你的主播生涯，由你来打。'}}</p></div><div class="day"><small>生涯进度</small><strong>DAY {{String(s.day).padStart(2,'0')}}<em> / 07</em></strong><div class="day-track"><i v-for="d in 7" :key="d" :class="{done:d<=s.day}"></i></div></div></div>
   <div class="layout">
    <section class="workspace">
     <div class="window-bar"><span><b class="dot"></b>{{live?'LIVE STUDIO':s.phase==='report'?'STREAM REPORT':'MY DESKTOP'}} <small>/ {{live?'正在直播':s.phase==='report'?'直播结算':'主播工作台'}}</small></span><span class="window-icons">—　□　×</span></div>
     <template v-if="s.phase==='desk' || live">
      <div class="game" :class="{desktop:!live}"><div class="game-top"><span class="map">▧ DUST TERMINAL <small>竞技模式 · 训练基地</small></span><span class="live-badge" v-if="live">● LIVE · {{viewers}} 人观看</span><span class="offline" v-else>待机中</span></div>
       <div class="arena"><div class="sun"></div><div class="wall back"></div><div class="wall left"></div><div class="wall right"></div><div class="crate one"></div><div class="crate two"></div><div class="floor"></div><div class="crosshair">＋</div><button v-if="live && hits<6" class="target" :style="{left:(24+(hits*19)%52)+'%',top:(30+(hits*13)%28)+'%'}" @click="aim" aria-label="射击训练靶">◎</button><div class="weapon"><span></span></div><div class="game-caption"><span>{{live?'ROUND 0'+round+' / 03':'准备好，下一场就是你的主场。'}}</span><small>{{live?'点击靶心射击 · 每回合最多 6 次命中':'竞技射击 / 直播经营 / 7 天挑战'}}</small></div><div class="hud">100 <small>HP</small><span>{{live?kills:0}} <small>ELIMS</small></span></div></div>
      </div>
      <div v-if="!live" class="desk-actions"><div class="section-title"><span>今天的安排</span><small>练枪可选 · 每天一场直播</small></div><div class="action-grid"><button class="action" :disabled="s.trained || s.energy<20" @click="train"><span class="action-icon">⌖</span><span><b>{{s.trained?'训练已完成':'练枪训练'}}</b><small>枪法 +8 · 体力 -20</small></span><span>↗</span></button><button class="action primary" @click="start"><span class="action-icon">▷</span><span><b>开始直播</b><small>打出操作，让大家记住你</small></span><span>→</span></button></div><div class="secondary-actions"><button :disabled="s.edited || s.energy<15" @click="edit">✂ {{s.edited?'已剪辑':'剪视频'}}<small>粉丝 +25 · 体力 -15</small></button><button :disabled="s.rested" @click="rest">☾ {{s.rested?'已休息':'休息'}}<small>恢复 20 体力</small></button><button :disabled="(s.gear||0)>=3 || s.money<150*((s.gear||0)+1)" @click="upgrade">▣ 升级设备<small>Lv.{{(s.gear||0)+1}} · {{(s.gear||0)>=3?'已满级':'¥'+150*((s.gear||0)+1)}}</small></button></div></div>
      <div v-else class="event-panel"><div class="section-title"><span>✦ 直播事件 · 0{{eventIndex+1}}</span><small>射击命中 {{hits}} / 6</small></div><h2>{{event.title}}</h2><p>{{event.text}}</p><div class="choices"><button v-for="(c,i) in event.choices" :key="c" :disabled="chosen" @click="choose(i)">{{i===0?'A':'B'}}　{{c}}</button></div><button v-if="chosen" class="continue" @click="next">{{eventIndex===2?'结束直播，查看战报':'进入下一回合'}} →</button><small v-else class="hint">先点击场景中的靶心练习射击，再选择你的应对方式。</small></div>
     </template>
     <div v-else class="report"><div class="report-icon">✦</div><div class="eyebrow">{{ended?'SEASON COMPLETE':'STREAM COMPLETE'}}</div><h2>{{ended?'你的第一季，圆满收官':'每一点成长，都算数。'}}</h2><p>{{ended?`7 天积累了 ${s.fans} 位粉丝。下一位人气主播，也许就是你。`:'这一场的努力，变成了新的关注与认可。'}}</p><div class="results"><div><small>新增粉丝</small><strong>+{{s.report?.fans}}</strong></div><div><small>段位积分</small><strong>{{(s.report?.rank||0)>0?'+':''}}{{s.report?.rank}}</strong></div><div><small>直播收入</small><strong>¥{{s.report?.money}}</strong></div><div><small>本场击杀</small><strong>{{s.report?.kills}}</strong></div></div><div class="promotion"><span><b>把名场面，带给更多人。</b><small>发布精彩切片 · 花费 ¥80 · 本场新增粉丝再提升 50%</small></span><button :disabled="s.report?.promoted || s.money<80" @click="promote">{{s.report?.promoted?'已推广 ✓':s.money<80?'余额不足':'推广切片 ↗'}}</button></div><button class="next-day" @click="ended?restart():nextDay()">{{ended?'开启新的主播生涯':'休息一下，迎接第 '+(s.day+1)+' 天'}} →</button></div>
    </section>
    <aside><section class="profile"><div class="profile-label">主播档案 <span>ROOKIE / 新人主播</span></div><div class="identity"><div class="avatar">⌐■_■</div><div><h2>无名之辈</h2><small>每个传奇，都从 0 开始。</small></div><span class="status-light"></span></div><div class="stats"><div><small>关注粉丝</small><strong>{{s.fans.toLocaleString()}}<em> 人</em></strong></div><div><small>钱包余额</small><strong><em>¥ </em>{{s.money.toLocaleString()}}</strong></div></div><div class="rank"><span>◇</span><div><small>当前段位</small><b>{{tier}}</b></div><small>{{s.rank}} RP</small></div><div class="meter-label"><span>枪法水平</span><b>{{s.skill}} / 100</b></div><div class="meter"><i :style="{width:s.skill+'%'}"></i></div><div class="meter-label"><span>今日体力</span><b>{{s.energy}} / 100</b></div><div class="meter energy"><i :style="{width:s.energy+'%'}"></i></div></section>
     <section class="chat"><div class="section-title"><span>◌ 直播弹幕</span><small>{{live?'实时连线':'等待开播'}}</small></div><div v-if="live" class="messages"><p v-for="(line,i) in feed" :key="i"><span>{{line.split('：')[0]}}</span> {{line.split('：')[1]}}</p></div><div v-else class="chat-empty"><span>☏</span><p>有人在等你开播。</p><small>开始直播后，弹幕将在这里出现</small></div><div class="chat-input">{{live?'水友们正在热聊中…':'直播间还没有开启…'}}<span>↵</span></div></section><button class="data-button" @click="showData=true">▥ 数据中心 · 查看成长记录 →</button><div class="tip"><span>↗</span><p><b>今日主播小贴士</b><br>枪法决定下限，节目效果决定上限。<br>试着找到属于你的直播风格。</p></div></aside>
   </div><p v-if="notice" class="notice" role="status">{{notice}}</p><footer><span>FPS STREAMER SIMULATOR</span><span>7 天，从无人问津到小有名气。 <b>GLHF ↗</b></span></footer>
  </main><div v-if="showData" class="modal-backdrop" @click.self="showData=false"><section class="data-modal" role="dialog" aria-modal="true" aria-label="数据中心"><button class="close" autofocus @click="showData=false">关闭 ×</button><div class="eyebrow">CAREER OVERVIEW</div><h2>数据中心</h2><p>{{s.fans}} 位粉丝 · {{tier}} · 设备 Lv.{{(s.gear||0)+1}}</p><p v-if="!s.history?.length">完成第一场直播后，这里会记录你的成长。</p><div v-for="h in s.history" :key="h.day" class="history-row"><b>第 {{h.day}} 天</b><span>{{h.fans}} 粉丝</span><span>收入 ¥{{h.money}}</span></div><p class="hint">记录包含当场推广；日常剪辑增长计入下一场记录。</p></section></div>
 </div>
</template>
