// Stress-test the question engine extracted from mathtower.html (no browser needed): node tools/test-questions.js
const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','mathtower.html'),'utf8');
const a=html.indexOf('//  PROCEDURAL QUESTION ENGINE'), b=html.indexOf('//  GAME CONSTANTS');
const src=html.slice(html.lastIndexOf('\n',a),html.lastIndexOf('\n',b));
const api=new Function(src+'\nreturn {genQ,GEN,BONUS_GEN,mulberry32,setQ:f=>{qRand=f},fmt,frac};')();
const {genQ,GEN,BONUS_GEN}=api;
let bad=0,total=0;const uniq={},negGiveaway=[],fixedText=[];
const check=(q,tag)=>{
  total++;
  if(q.ans.length!==4||new Set(q.ans).size!==4||q.ci<0||q.ci>3){bad++;if(bad<6)console.log('BAD',tag,JSON.stringify(q));}
  if(q.ans.some(x=>/NaN|undefined|Infinity|null/.test(x))){bad++;if(bad<6)console.log('NaN',tag,JSON.stringify(q));}
  const neg=q.ans.filter(x=>x.startsWith('−'));
  if(neg.length===1&&q.ans[q.ci]===neg[0])negGiveaway.push(q.q);
};
for(const cat of Object.keys(GEN))for(const tier of [1,2,3]){
  const s=new Set();
  for(let i=0;i<4000;i++){const q=genQ(tier,cat);check(q,cat+tier);s.add(q.q);}
  uniq[cat+tier]=s.size;
  const sb=new Set();
  for(let i=0;i<1500;i++){const q=genQ(tier,cat,true);check(q,'BONUS '+cat+tier);sb.add(q.q);}
  uniq['bonus:'+cat+tier]=sb.size;
}
console.log('total',total,'bad',bad,'negative-giveaways',negGiveaway.length,negGiveaway.slice(0,3));
const low=Object.entries(uniq).filter(([k,v])=>v<40);
console.log('pools with <40 unique questions:',low.length?low:'none');
console.log('min unique normal:',Math.min(...Object.entries(uniq).filter(([k])=>!k.startsWith('bonus')).map(([,v])=>v)));

// Correctness spot-checks of new probability questions
api.setQ(Math.random);
const want={'sum 7?':'1/6','sum 2?':'1/36','sum 12?':'1/36','sum 6?':'5/36','sum 10?':'1/12'};
let probOk=0,probN=0;
for(let i=0;i<3000;i++){const q=genQ(3,'stat');for(const[k,v]of Object.entries(want))if(q.q.endsWith(k)){probN++;if(q.ans[q.ci]===v)probOk++;else console.log('WRONG',q.q,q.ans[q.ci]);}}
console.log('dice-sum answers correct:',probOk+'/'+probN);
for(let i=0;i<2000;i++){const q=genQ(3,'stat');if(/kort av 52/.test(q.q)){const m={'et ess':'1/13','et billedkort (J, Q, K)':'3/13','en hjerter':'1/4','et rødt ess':'1/26','en svart konge':'1/26'};const key=q.q.match(/Sjanse for (.*)\?/)[1];if(q.ans[q.ci]!==m[key])console.log('CARD WRONG',q.q,q.ans[q.ci]);}}

// Difficulty sanity: bonus vs normal numbers (median magnitude of numeric answers)
const mag=(tier,bonus)=>{const v=[];for(let i=0;i<3000;i++){const q=genQ(tier,'mult',bonus);v.push(+q.ans[q.ci].replace(/\s/g,'').replace(',','.'));}v.sort((x,y)=>x-y);return v[1500];};
console.log('mult median answer  normal vs bonus:',[1,2,3].map(t=>`T${t}: ${mag(t,false)} vs ${mag(t,true)}`).join(' | '));

// Determinism: same seed → identical first 60 questions incl. shuffled answer order
const seq=seed=>{api.setQ(api.mulberry32(seed));const r=[];for(let i=0;i<60;i++){const q=genQ(2);r.push(q.q+'|'+q.ans.join(','));}return r.join('\n');};
console.log('same seed identical:',seq(12345)===seq(12345),' different seed differs:',seq(12345)!==seq(54321));
api.setQ(Math.random);
console.log('samples:');[1,2,3].forEach(t=>{for(let i=0;i<3;i++){const q=genQ(t,'mix',true);console.log(`  bonus T${t}: ${q.q} → ${q.ans[q.ci]}   [${q.ans.join(' | ')}]`);}});
['stat'].forEach(c=>[1,2,3].forEach(t=>{const q=genQ(t,c);console.log(`  ${c}${t}: ${q.q} → ${q.ans[q.ci]}   [${q.ans.join(' | ')}]`);}));
