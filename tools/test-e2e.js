// End-to-end browser test of IcyMath. Serve the repo root first (see tools/README.md).
//   BASE  – game URL            (default http://127.0.0.1:8000/mathtower.html)
//   CHROME – Chromium binary    (default: Playwright's own, or /opt/pw-browsers/chromium if present)
const {chromium}=require('playwright-core');
const fs=require('fs');
const OUT=__dirname+'/shots'; fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.BASE||'http://127.0.0.1:8000/mathtower.html';
const CHROME=process.env.CHROME||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const log=(...a)=>console.log(...a);
let fails=0; const ok=(c,msg)=>{log((c?'PASS ':'FAIL ')+msg);if(!c)fails++;};

// Hook that records every question shown (text + answer order) and the platform layout
const HOOK=()=>{window.QLOG=[];const _s=showQ;showQ=function(){_s();if(GS)QLOG.push(GS.curQ.q+' | '+GS.curQ.ans.join(','));};};
async function drown(pg){await pg.evaluate(()=>{GS.freezeUntil=0;});await pg.waitForFunction(()=>GS&&GS.onGround&&!GS.jumping&&!GS.jumpPending&&!GS.rocketPending,null,{timeout:8000});await pg.evaluate(()=>{GS.plats.forEach(p=>p.sy+=GS.WATER_TOP);});await pg.waitForSelector('#sOver:not(.off)',{timeout:8000});}
async function answerCorrect(pg,n){
  for(let i=0;i<n;i++){
    await pg.waitForFunction(()=>GS&&(GS.answering||GS.bonusActive),null,{timeout:5000});
    await pg.waitForFunction(()=>GS&&GS.answering&&(!GS.bonusActive||GS.bonusStage===1),null,{timeout:8000});
    const ci=await pg.evaluate(()=>GS.curQ.ci);
    await pg.click(`#aGrid .abtn >> nth=${ci}`);
    await pg.waitForTimeout(150);
  }
}

(async()=>{
  const br=await chromium.launch({executablePath:CHROME});
  const ctx=await br.newContext({viewport:{width:430,height:860},permissions:['clipboard-read','clipboard-write']});
  const errs=[];
  const pg=await ctx.newPage();
  pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
  await pg.goto(BASE);await pg.waitForTimeout(700);
  await pg.screenshot({path:OUT+'/1-home.png'});

  // ── 1. Balance values on Lett
  await pg.click('text=Spill nå');await pg.click('.dc-e');await pg.click('text=Start!');await pg.waitForTimeout(400);
  const b0=await pg.evaluate(()=>({t:GS.timerMax,spd:getScrollPx()}));
  ok(b0.t>=10&&b0.spd===5,`start timer ${b0.t}s (≥10) and scroll ${b0.spd}px/s (5)`);
  await answerCorrect(pg,4);
  await pg.waitForFunction(()=>GS.answering&&GS.timerLeft>GS.timerMax-0.5);
  // ── 2. Bonus offer shows live risk read-out; main timer keeps running under it
  await pg.evaluate(()=>showBonusChallenge(genQ(1,'mix',true)));await pg.waitForTimeout(600);
  const st=await pg.evaluate(()=>({main:document.getElementById('bsMainV').textContent,water:document.getElementById('bsWaterV').textContent,cat:document.getElementById('bCat').textContent,t:GS.timerLeft}));
  await pg.waitForTimeout(1000);
  const t2=await pg.evaluate(()=>GS.timerLeft);
  ok(/s$/.test(st.main)&&/etg$/.test(st.water),`risk read-out: main=${st.main} water=${st.water} cat="${st.cat}"`);
  ok(st.t-t2>0.8,`main timer keeps running while popup open (${st.t.toFixed(1)}→${t2.toFixed(1)})`);
  await pg.screenshot({path:OUT+'/2-bonus-offer.png'});
  // ── 3. Offer auto-declines after ~6s
  await pg.waitForTimeout(5200);
  ok(await pg.evaluate(()=>!GS.bonusActive&&!document.getElementById('bonusModal').classList.contains('show')),'offer auto-declined after 6s');
  // ── 4. Accept + correct → rocket +5 floors
  await answerCorrect(pg,1);
  await pg.evaluate(()=>showBonusChallenge(genQ(1,'mix',true)));await pg.waitForTimeout(300);
  await pg.click('text=Ja! 💪');await pg.waitForTimeout(250);
  await pg.screenshot({path:OUT+'/3-bonus-question.png'});
  await pg.waitForFunction(()=>GS.onGround&&!GS.jumping);
  const s0=await pg.evaluate(()=>GS.curSlot);
  await pg.click(`#bonusGrid .abtn >> nth=${await pg.evaluate(()=>GS.bonusCurQ.ci)}`);
  await pg.waitForTimeout(2300);
  const s1=await pg.evaluate(()=>GS.curSlot);
  ok(s1-s0===5,`rocket: floor ${s0+1} → ${s1+1} (+5)`);
  // ── 5. Accept + wrong → fall ≥ 210px (~2 floors)
  await pg.evaluate(()=>{GS.freezeUntil=Date.now()+60000;});   // stop scrolling so we measure only the penalty
  await pg.evaluate(()=>showBonusChallenge(genQ(1,'mix',true)));await pg.waitForTimeout(300);
  await pg.click('text=Ja! 💪');await pg.waitForTimeout(200);
  const y0=await pg.evaluate(()=>GS.plats.find(p=>p.slot===GS.curSlot).sy);
  await pg.click(`#bonusGrid .abtn >> nth=${await pg.evaluate(()=>(GS.bonusCurQ.ci+1)%4)}`);
  await pg.waitForTimeout(1100);
  const y1=await pg.evaluate(()=>GS.plats.find(p=>p.slot===GS.curSlot)?.sy??null);
  ok(y1!==null&&y1-y0>=209,`bonus miss fall: ${(y1-y0).toFixed(0)}px (≥210 ≈ 2 floors)`);
  await pg.screenshot({path:OUT+'/4-after-bonus-miss.png'});
  // ── 6. End game, share challenge link via clipboard
  await drown(pg);await pg.waitForTimeout(500);
  await pg.screenshot({path:OUT+'/5-gameover.png'});
  await pg.click('text=Utfordre en venn');await pg.waitForTimeout(300);
  const clip=await pg.evaluate(()=>navigator.clipboard.readText());
  const link=(clip.match(/https?:\S+/)||[])[0];
  ok(!!link&&/\?c=[0-9a-z]+-e-\d+$/.test(link),'challenge link: '+link);

  // ── 7. Determinism: a clean game vs. a friend replaying the same link
  await pg.evaluate(HOOK);
  await pg.evaluate(()=>{go('sDiff');});await pg.click('.dc-m');await pg.click('text=Start!');
  await answerCorrect(pg,8);
  const A=await pg.evaluate(()=>({q:QLOG.slice(0,8),plats:GS.plats.filter(p=>p.slot<12).sort((a,b)=>a.slot-b.slot).map(p=>p.x.toFixed(2)+'/'+p.w.toFixed(2)),seed:GS.seed}));
  const url=BASE+'?c='+A.seed.toString(36)+'-m-999';
  const pg2=await ctx.newPage();pg2.on('pageerror',e=>errs.push('P2 '+e.message));pg2.on('dialog',d=>d.accept());
  await pg2.goto(url);await pg2.waitForTimeout(600);
  ok(await pg2.isVisible('#sChal .chal-score'),'friend sees challenge invite screen');
  await pg2.screenshot({path:OUT+'/6-challenge-invite.png'});
  await pg2.evaluate(HOOK);
  await pg2.click('text=Ta utfordringen');
  await answerCorrect(pg2,8);
  const B=await pg2.evaluate(()=>({q:QLOG.slice(0,8),plats:GS.plats.filter(p=>p.slot<12).sort((a,b)=>a.slot-b.slot).map(p=>p.x.toFixed(2)+'/'+p.w.toFixed(2)),diff:selD}));
  ok(B.diff==='med','friend plays the same difficulty (med)');
  ok(JSON.stringify(A.q)===JSON.stringify(B.q),'friend gets identical questions + answer order (8/8)');
  ok(JSON.stringify(A.plats)===JSON.stringify(B.plats),'friend gets identical ice blocks (12 platforms)');
  if(JSON.stringify(A.q)!==JSON.stringify(B.q)){log(A.q,B.q);}
  // friend ends game → result banner vs target 999
  await drown(pg2);await pg2.waitForTimeout(400);
  const res=await pg2.evaluate(()=>document.getElementById('goResult').textContent);
  ok(/Vennen din vant|slo vennen|Uavgjort/.test(res),'challenge result banner: '+res);
  await pg2.screenshot({path:OUT+'/7-challenge-result.png'});

  // ── 8. Daily challenge: same questions on replay, streak recorded
  if(await pg.evaluate(()=>!!GS))await drown(pg);
  await pg.evaluate(()=>go('sHome'));await pg.click('text=Dagens utfordring');
  ok(await pg.evaluate(()=>document.getElementById('diffTitle').textContent.includes('Dagens')),'daily mode title on difficulty screen');
  await pg.click('.dc-h');await pg.click('text=Start!');
  await answerCorrect(pg,3);
  const D1=await pg.evaluate(()=>QLOG.slice(-3));
  await drown(pg);
  await pg.evaluate(()=>{QLOG.length=0;});
  await pg.click('text=Prøv igjen');await answerCorrect(pg,3);
  const D2=await pg.evaluate(()=>QLOG.slice(0,3));
  ok(JSON.stringify(D1)===JSON.stringify(D2),'daily replay gives the same questions');
  await drown(pg);await pg.waitForTimeout(300);
  const prof=await pg.evaluate(()=>JSON.parse(localStorage.getItem('icy_prof')));
  ok(prof.lastDaily===await pg.evaluate(()=>dayKey())&&prof.dailyStreak===1,`daily streak recorded (${prof.dailyStreak}, ${prof.lastDaily})`);
  await pg.screenshot({path:OUT+'/8-daily-over.png'});
  await pg.evaluate(()=>go('sHome'));await pg.waitForTimeout(400);
  await pg.screenshot({path:OUT+'/9-home-after.png'});
  ok((await pg.textContent('#dailySub')).includes('Spilt i dag'),'home shows daily done: '+await pg.textContent('#dailySub'));
  await pg.click('#muteBtn');ok(await pg.evaluate(()=>MUTED&&localStorage.getItem('icy_mute')==='1'),'mute toggles and persists');

  // ── 9. Small phone layout
  const ph=await br.newPage({viewport:{width:360,height:740}});ph.on('pageerror',e=>errs.push('PH '+e.message));
  await ph.goto(BASE);await ph.waitForTimeout(500);await ph.screenshot({path:OUT+'/10-phone-home.png'});
  await ph.click('text=Spill nå');await ph.click('text=Start!');await ph.waitForTimeout(400);
  await ph.evaluate(()=>showBonusChallenge(genQ(1,'mix',true)));await ph.waitForTimeout(500);
  await ph.screenshot({path:OUT+'/11-phone-bonus.png'});
  const fits=await ph.evaluate(()=>{const r=document.querySelector('.bcard').getBoundingClientRect();return r.right<=360&&r.left>=0&&r.bottom<=740;});
  ok(fits,'bonus card fits a 360×740 phone');

  // ── 10. Nothing may cover the answer buttons (regression: bonus popup used to block them)
  const onTop=p=>p.evaluate(()=>[...document.querySelectorAll('#aGrid .abtn')].every(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}));
  for(const [w,h] of [[430,860],[390,844],[375,667],[360,640],[375,560]]){
    const lp=await br.newPage({viewport:{width:w,height:h}});lp.on('pageerror',e=>errs.push(`L${w}x${h} `+e.message));
    await lp.goto(BASE);await lp.waitForTimeout(300);await lp.click('text=Spill nå');await lp.click('text=Start!');await lp.waitForTimeout(300);
    const ph=async q=>lp.evaluate(q=>{const t=document.getElementById('qText');t.textContent=q;t.classList.toggle('long',q.length>30);return document.getElementById('qpanel').offsetHeight;},q);
    const fit=await lp.evaluate(()=>Math.abs(document.getElementById('qpanel').getBoundingClientRect().top-(GS.gH))<=6);
    ok(fit,`${w}x${h}: game area ends at the answer panel on the first game (water line visible)`);
    const h1=await ph('7 × 8'),h2=await ph('Snitt av 4 tall er 14. Tre av dem: 16, 10, 13. Det fjerde?');
    await lp.evaluate(()=>{const t=document.getElementById('qText');t.textContent=GS.curQ.q;t.classList.toggle('long',GS.curQ.q.length>30);});
    await lp.evaluate(()=>showBonusChallenge(genQ(1,'mix',true)));await lp.waitForTimeout(250);
    const offerFree=await onTop(lp);
    const gap=()=>lp.evaluate(()=>document.getElementById('qpanel').getBoundingClientRect().top-document.querySelector('.bcard').getBoundingClientRect().bottom);
    const g1=await gap();
    await lp.click('text=Ja! 💪');await lp.waitForTimeout(150);
    const g2=await gap();
    const btnsReachable=await lp.evaluate(()=>{const c=document.querySelector('.bcard');const cr=c.getBoundingClientRect();return c.scrollHeight<=c.clientHeight+1&&[...document.querySelectorAll('#bonusGrid .abtn')].every(b=>{const r=b.getBoundingClientRect();return r.top>=cr.top&&r.bottom<=cr.bottom;});});
    const locked=await lp.evaluate(()=>document.getElementById('qpanel').classList.contains('locked'));
    ok(h1===h2&&offerFree&&g1>=0&&g2>=0&&btnsReachable&&locked,`${w}x${h}: panel fixed (${h1}/${h2}px), answers free during offer=${offerFree}, card above panel (gap ${g1.toFixed(0)}/${g2.toFixed(0)}px), panel locked while bonus answered=${locked}, all bonus answers visible=${btnsReachable}`);
    if(w===375&&h===560)await lp.screenshot({path:OUT+'/12-short-phone-bonus.png'});
    await lp.close();
  }
  // Answering the main question while the offer shows = "Nei takk", and the answer counts
  const dp=await br.newPage({viewport:{width:390,height:844}});dp.on('pageerror',e=>errs.push('D '+e.message));
  await dp.goto(BASE);await dp.waitForTimeout(300);await dp.click('text=Spill nå');await dp.click('text=Start!');await dp.waitForTimeout(300);
  await dp.evaluate(()=>showBonusChallenge(genQ(1,'mix',true)));await dp.waitForTimeout(250);
  await dp.screenshot({path:OUT+'/13-offer-answers-free.png'});
  const c0=await dp.evaluate(()=>GS.correct);
  await dp.click(`#aGrid .abtn >> nth=${await dp.evaluate(()=>GS.curQ.ci)}`);await dp.waitForTimeout(200);
  ok(await dp.evaluate(c0=>!GS.bonusActive&&GS.correct===c0+1,c0),'answering the main question during the offer declines it and the answer counts');
  await dp.close();

  ok(errs.length===0,'no page errors'+(errs.length?': '+errs.join(' | '):''));
  log(fails?`\n${fails} FAILED`:'\nALL PASSED');
  await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('E2E CRASH',e.message);process.exit(2);});
