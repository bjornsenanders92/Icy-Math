// Balance simulator for IcyMath's core loop (pixel-accurate to the game's mechanics).
// Usage: node tools/balance-sim.js '<candidate JSON>'  – prints floors/time/bonus stats for 3 player profiles.
// The values in mathtower.html (T_BASE, T_MIN, SCROLL_*, PEN_MIN, BONUS_PEN_MIN, FAST_SEC) came from:
//   {"tbase":{"1":10,"3":13},"tmin":{"1":5,"3":7},"decay":0.1,"s0":5,"g":0.8,"cap":60,"penK":1,"penMin":80,"bonusMult":3.5,"bonusPenMin":210,"fast":{"1":2.5,"3":4},"bonusP":0.1}
const GAP=110, H0=240, HMAX=370;
function lognorm(med,sig){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return med*Math.exp(sig*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v));}
function words(){return Math.random()<.45;} // share of questions with >4 words

function play(P,cfg,tier){
  let h=H0,i=0,floor=0,score=0,bonusWins=0,bonusTries=0,t=0;
  const T=i=>Math.max(cfg.tmin[tier],cfg.tbase[tier]-i*cfg.decay)+(words()?1.5:0);
  const spd=i=>Math.min(cfg.cap,cfg.s0+i*cfg.g);
  const pen=(i,mult)=>Math.max(cfg.penMin*mult/3,mult*spd(i)*cfg.penK);
  for(;i<400;i++){
    const Ti=T(i),s=spd(i);
    let used=0;
    // bonus overlaps the main question; main timer keeps running
    if(i>=2&&Math.random()<cfg.bonusP){
      bonusTries++;
      const decide=1.0;
      if(Math.random()<P.accept){
        const b=Math.min(8,lognorm(P.med*1.35,.45));
        used=decide+b;
        h-=s*used; t+=used; if(h<=0)break;
        if(b<8&&Math.random()<P.acc-.08){h=Math.min(HMAX,h+5*GAP);floor+=5;bonusWins++;}
        else{h-=Math.max(cfg.bonusPenMin||0,pen(i,cfg.bonusMult));if(h<=0)break;}
      } else {used=decide;h-=s*used;t+=used;if(h<=0)break;}
    }
    const rem=Ti-used;
    const a=lognorm(P.med,.45);
    if(rem<=0||a>rem){h-=s*Math.max(0,rem);t+=Math.max(0,rem);if(h<=0)break;h-=pen(i,3);if(h<=0)break;h-=s*.9;t+=.9;continue;}
    h-=s*a;t+=a;if(h<=0)break;
    if(Math.random()<P.acc){
      const fast=a<=cfg.fast[tier];
      const up=fast?2:1;h=Math.min(HMAX,h+up*GAP);floor+=up;
      h-=s*(fast?.9:.7);t+=fast?.9:.7;
    } else {h-=pen(i,3);h-=s*.9;t+=.9;}
    if(h<=0)break;
  }
  return{q:i,floor,t,bonusWins,bonusTries};
}
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(p*(s.length-1))];};
function report(name,cfg){
  const players={svak:{med:5,acc:.75,accept:.6},snitt:{med:3.5,acc:.85,accept:.7},sterk:{med:2.3,acc:.93,accept:.85}};
  console.log('\n== '+name+' ==');
  for(const tier of [1,3]){
    for(const [pn,P] of Object.entries(players)){
      const runs=Array.from({length:3000},()=>play(P,cfg,tier));
      const fl=runs.map(r=>r.floor),tt=runs.map(r=>r.t),bt=runs.map(r=>r.bonusTries);
      const noBonus=runs.filter(r=>r.bonusTries===0).length/runs.length;
      console.log(`tier${tier} ${pn.padEnd(5)} etasje p25/p50/p90: ${pct(fl,.25)}/${pct(fl,.5)}/${pct(fl,.9)}  tid median ${pct(tt,.5).toFixed(0)}s  bonus/spill ${(bt.reduce((a,b)=>a+b)/bt.length).toFixed(1)}  spill uten bonus ${(noBonus*100).toFixed(0)}%`);
    }
  }
}
const OLD={tbase:{1:10,3:5},tmin:{1:1,3:1},decay:0.5,s0:18,g:4,cap:200,penK:1,penMin:0,bonusMult:3.5,fast:{1:2,3:2},bonusP:.1};
report('NÅVÆRENDE',OLD);
const NEW=JSON.parse(process.argv[2]||'null');
if(NEW)report('KANDIDAT',NEW);
