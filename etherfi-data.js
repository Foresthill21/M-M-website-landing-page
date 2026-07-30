// Sky Ecosystem dashboard — data layer. Mock generators (deterministic) + live fetchers (DeFiLlama, CoinGecko).
export const END = Date.parse('2026-07-15');
const DAY = 86400000;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function genDaily(anchors,o={}){
  const r=mulberry32(o.seed||1),vol=o.vol??0.015,step=!!o.step;
  const t0=Date.parse(anchors[0][0]),t1=o.end||END,pts=[];let ai=0,n=0;
  for(let t=t0;t<=t1;t+=DAY){
    while(ai<anchors.length-1&&Date.parse(anchors[ai+1][0])<=t)ai++;
    const a=anchors[ai],b=anchors[ai+1];let base;
    if(!b)base=a[1];else{const ta=Date.parse(a[0]),tb=Date.parse(b[0]);base=step?a[1]:a[1]+(b[1]-a[1])*((t-ta)/(tb-ta));}
    n=n*0.96+(r()-0.5)*vol;
    pts.push([t,Math.max(o.floor??0,base*(1+n))]);
  }
  return pts;
}
function genFlow(anchors,o={}){ // daily flow whose weekly run-rate follows anchors
  const r=mulberry32(o.seed||7),t0=Date.parse(anchors[0][0]),pts=[];let ai=0;
  for(let t=t0;t<=END;t+=DAY){
    while(ai<anchors.length-1&&Date.parse(anchors[ai+1][0])<=t)ai++;
    const a=anchors[ai],b=anchors[ai+1];let wk;
    if(!b)wk=a[1];else{const ta=Date.parse(a[0]),tb=Date.parse(b[0]);wk=a[1]+(b[1]-a[1])*((t-ta)/(tb-ta));}
    pts.push([t,Math.max(0,wk/7*(0.55+r()*0.9))]);
  }
  return pts;
}
export function mergeSum(list){ // sum series onto union grid, forward-filling each via valueAt
  const s=(list||[]).filter(p=>p&&p.length);
  if(!s.length)return[];
  if(s.length===1)return s[0];
  const ts=new Set();for(const pts of s)for(const[t]of pts)ts.add(t);
  const uts=[...ts].sort((a,b)=>a-b);
  return uts.map(t=>{let v=0;for(const pts of s)v+=valueAt(pts,t)||0;return[t,v];});
}
export function valueAt(pts,t){ // nearest-or-before lookup, binary search
  if(!pts||!pts.length)return null;let lo=0,hi=pts.length-1;
  if(t<pts[0][0])return null;if(t>=pts[hi][0])return pts[hi][1];
  while(lo<hi){const mid=(lo+hi+1)>>1;if(pts[mid][0]<=t)lo=mid;else hi=mid-1;}
  return pts[lo][1];
}
export function ratioSeries(a,b,mult=100){
  const out=[];for(const[t,v]of a){const bv=valueAt(b,t);if(bv)out.push([t,v/bv*mult]);}return out;
}
const M=1e6,B=1e9;
const mm=x=>x*M;
function scaleAnchors(an,f){return an.map(([d,v])=>[d,v*f]);}
function fakeAddr(name){
  let h=0;for(let i=0;i<name.length;i++)h=Math.imul(h^name.charCodeAt(i),2654435761);
  const r=mulberry32(h),hex='0123456789abcdef';let s='0x';
  for(let i=0;i<40;i++)s+=hex[(r()*16)|0];return s;
}

const k=x=>x*1e3;
export function buildMock(){
  const d={};
  // ===== prices =====
  d.ethPrice=genDaily([['2023-11-01',1850],['2024-01-01',2300],['2024-03-01',3500],['2024-04-01',3900],['2024-06-01',3450],['2024-08-01',2600],['2024-10-01',2450],['2024-12-01',3450],['2025-02-01',2700],['2025-05-01',2500],['2025-08-01',3050],['2025-11-01',3600],['2026-02-01',3300],['2026-05-01',3400],['2026-07-15',3250]],{seed:1,vol:0.03});
  d.btcPrice=genDaily([['2023-11-01',35000],['2024-01-01',43000],['2024-03-01',68000],['2024-06-01',66000],['2024-11-01',88000],['2025-01-01',102000],['2025-05-01',96000],['2025-10-01',118000],['2026-02-01',109000],['2026-05-01',114000],['2026-07-15',116000]],{seed:2,vol:0.025});
  d.ethfiPrice=genDaily([['2024-03-18',4.2],['2024-03-27',8.0],['2024-05-01',4.4],['2024-07-01',3.1],['2024-09-01',1.9],['2024-11-01',1.6],['2025-01-01',2.7],['2025-03-01',1.5],['2025-05-01',1.15],['2025-08-01',1.6],['2025-11-01',2.15],['2026-01-01',1.8],['2026-03-01',1.45],['2026-05-01',1.5],['2026-07-15',1.38]],{seed:3,vol:0.055});
  // ===== eETH by platform (ETH units) =====
  d.eethPlatforms={
    EOAs:genDaily([['2023-11-15',14],['2024-02-01',330],['2024-04-01',650],['2024-06-01',900],['2024-09-01',760],['2024-12-01',815],['2025-04-01',920],['2025-10-01',1060],['2026-03-01',1130],['2026-07-15',1185]].map(([a,b])=>[a,k(b)]),{seed:11,vol:0.02}),
    Aave:genDaily([['2024-01-10',12],['2024-04-01',260],['2024-06-01',430],['2024-09-01',380],['2025-01-01',435],['2025-07-01',520],['2026-01-01',560],['2026-07-15',605]].map(([a,b])=>[a,k(b)]),{seed:12,vol:0.025}),
    Morpho:genDaily([['2024-03-01',8],['2024-06-01',175],['2024-12-01',205],['2025-06-01',255],['2026-01-01',290],['2026-07-15',325]].map(([a,b])=>[a,k(b)]),{seed:13,vol:0.03}),
    Spark:genDaily([['2024-05-01',6],['2024-09-01',120],['2025-03-01',160],['2025-10-01',185],['2026-07-15',215]].map(([a,b])=>[a,k(b)]),{seed:14,vol:0.03}),
    Others:genDaily([['2023-12-01',5],['2024-06-01',205],['2025-01-01',250],['2025-09-01',275],['2026-07-15',305]].map(([a,b])=>[a,k(b)]),{seed:15,vol:0.03})
  };
  // ===== eBTC by platform (BTC units) =====
  d.ebtcPlatforms={
    EOAs:genDaily([['2024-10-01',60],['2024-12-01',420],['2025-04-01',900],['2025-10-01',1400],['2026-03-01',1650],['2026-07-15',1860]],{seed:21,vol:0.03}),
    Aave:genDaily([['2024-11-01',18],['2025-03-01',300],['2025-10-01',620],['2026-03-01',780],['2026-07-15',905]],{seed:22,vol:0.03}),
    'ether.fi':genDaily([['2024-11-01',25],['2025-06-01',280],['2026-01-01',420],['2026-07-15',525]],{seed:23,vol:0.03}),
    Fluid:genDaily([['2025-01-01',12],['2025-08-01',220],['2026-02-01',340],['2026-07-15',425]],{seed:24,vol:0.035}),
    Others:genDaily([['2024-12-01',15],['2025-06-01',180],['2026-01-01',270],['2026-07-15',360]],{seed:25,vol:0.035})
  };
  // ===== Liquid vaults TVL (USD) by platform =====
  const mmm=arr=>arr.map(([a,b])=>[a,b*1e6]);
  d.liquidTvl={
    'ETH Vault':genDaily(mmm([['2024-02-01',20],['2024-06-01',260],['2024-12-01',420],['2025-06-01',560],['2026-01-01',630],['2026-07-15',685]]),{seed:31,vol:0.025}),
    'USD Vault':genDaily(mmm([['2024-04-01',15],['2024-10-01',180],['2025-04-01',360],['2025-12-01',470],['2026-07-15',545]]),{seed:32,vol:0.025}),
    'RWA Vault':genDaily(mmm([['2024-09-01',10],['2025-03-01',120],['2025-12-01',245],['2026-07-15',335]]),{seed:33,vol:0.03}),
    'BTC Vault':genDaily(mmm([['2024-11-01',8],['2025-06-01',92],['2026-01-01',140],['2026-07-15',185]]),{seed:34,vol:0.03}),
    'Euro Vault':genDaily(mmm([['2025-02-01',5],['2025-10-01',46],['2026-07-15',96]]),{seed:35,vol:0.035}),
    Others:genDaily(mmm([['2024-06-01',6],['2025-06-01',40],['2026-07-15',72]]),{seed:36,vol:0.035})
  };
  d.liquidDep={};for(const[n,pts]of Object.entries(d.liquidTvl))d.liquidDep[n]=pts.map(([t,v])=>[t,v*0.94]);
  // ===== APY / utilization / yield =====
  d['apy.eETH']=genDaily([['2023-11-15',4.0],['2024-03-01',3.4],['2024-09-01',3.0],['2025-03-01',3.05],['2025-10-01',3.2],['2026-07-15',3.35]],{seed:41,vol:0.006,step:true});
  d['apy.eBTC']=genDaily([['2024-10-01',1.6],['2025-03-01',1.2],['2025-10-01',1.05],['2026-07-15',1.25]],{seed:42,vol:0.01,step:true});
  d['apy.Liquid']=genDaily([['2024-03-01',11.5],['2024-09-01',8.5],['2025-03-01',7.2],['2025-10-01',9.0],['2026-07-15',8.2]],{seed:43,vol:0.02});
  d['util.eETH']=genDaily([['2023-11-15',30],['2024-06-01',62],['2024-12-01',55],['2025-06-01',67],['2026-01-01',60],['2026-07-15',64]],{seed:44,vol:0.02});
  d['util.eBTC']=genDaily([['2024-10-01',20],['2025-06-01',48],['2026-01-01',44],['2026-07-15',52]],{seed:45,vol:0.02});
  // yield paid ($/day) = supplyUSD * apy/100/365
  const eethTotEth=mergeSum(Object.values(d.eethPlatforms));
  const ebtcTotBtc=mergeSum(Object.values(d.ebtcPlatforms));
  d['yield.eETH']=eethTotEth.map(([t,v])=>{const a=valueAt(d['apy.eETH'],t),p=valueAt(d.ethPrice,t);return a==null||p==null?null:[t,v*p*a/100/365];}).filter(Boolean);
  d['yield.eBTC']=ebtcTotBtc.map(([t,v])=>{const a=valueAt(d['apy.eBTC'],t),p=valueAt(d.btcPrice,t);return a==null||p==null?null:[t,v*p*a/100/365];}).filter(Boolean);
  const liquidTot=mergeSum(Object.values(d.liquidTvl));
  d['yield.Liquid']=liquidTot.map(([t,v])=>{const a=valueAt(d['apy.Liquid'],t);return a==null?null:[t,v*a/100/365];}).filter(Boolean);
  // ===== holders =====
  d['holders.eETH']=genDaily([['2023-11-15',400],['2024-02-01',62000],['2024-06-01',182000],['2024-12-01',212000],['2025-06-01',236000],['2026-01-01',248000],['2026-07-15',259000]],{seed:51,vol:0.005});
  d['holders.eBTC']=genDaily([['2024-10-01',200],['2025-01-01',3900],['2025-07-01',9600],['2026-01-01',12400],['2026-07-15',15300]],{seed:52,vol:0.007});
  d['holders.ETHFI']=genDaily([['2024-03-18',16000],['2024-06-01',52000],['2024-12-01',78000],['2025-06-01',95000],['2026-01-01',108000],['2026-07-15',119000]],{seed:53,vol:0.005});
  d['holders.total']=genDaily([['2023-11-15',400],['2024-02-01',72000],['2024-06-01',205000],['2024-12-01',258000],['2025-06-01',292000],['2026-01-01',308000],['2026-07-15',324000]],{seed:54,vol:0.005});
  // ===== top holders =====
  const thE=(list,mult)=>list.map(([name,amt])=>({name,amt:amt*(mult||1),addr:fakeAddr(name)}));
  d.topHolders={
    eETH:thE([['Aave v3: weETH Market',232000],['Pendle: SY-weETH',148000],['EigenLayer: Strategy',96000],['Morpho: Gauntlet weETH',72000],['Zircuit: Restaking',54000],['Spark: SparkLend',41000],['Balancer: weETH/wETH',28000],['ether.fi: Liquid ETH',22000],['Gravita / Curve LP',15500],['Unlabeled whale · 0x9f',12800]]),
    eBTC:thE([['Aave v3: eBTC Market',905],['Fluid: eBTC Vault',425],['ether.fi: BTC Vault',360],['Pendle: SY-eBTC',300],['Morpho: eBTC',175],['Curve: eBTC/wBTC',120],['Coinbase Custody',95],['Unlabeled whale · 0x3d',72],['Unlabeled whale · 0x18',54],['Unlabeled whale · 0xa1',40]]),
    ETHFI:thE([['ether.fi: Ecosystem Reserve',148000000],['Binance',41000000],['ether.fi: DAO Treasury',33000000],['Staking / sETHFI',28500000],['Coinbase',14200000],['OKX',9600000],['Bybit',7300000],['Uniswap v3: ETHFI/WETH',5400000],['Unlabeled whale · 0x77',4100000],['Unlabeled whale · 0x2e',3200000]])
  };
  // ===== ETHFI supply (circulating tokens), buybacks =====
  d.ethfiSupply=genDaily([['2024-03-18',115],['2024-06-01',132],['2024-09-01',176],['2025-01-01',228],['2025-06-01',288],['2025-12-01',352],['2026-04-01',398],['2026-07-15',422]].map(([a,b])=>[a,b*1e6]),{seed:61,vol:0.004});
  d.ethfiMax=1e9;
  d.buybackUsd=genFlow([['2025-04-01',0.28],['2025-09-01',0.55],['2026-01-01',0.72],['2026-04-01',0.82],['2026-07-15',0.9]].map(([a,b])=>[a,b*1e6]),{seed:62});
  d.buybackEthfi=d.buybackUsd.map(([t,v])=>[t,v/(valueAt(d.ethfiPrice,t)||1.5)]);
  // ===== Cash =====
  d.cashSpend=genFlow([['2024-11-01',1.2],['2025-02-01',3.5],['2025-06-01',9],['2025-10-01',16],['2026-02-01',24],['2026-07-15',31]].map(([a,b])=>[a,b*1e6]),{seed:71});
  d.cashback=d.cashSpend.map(([t,v])=>[t,v*0.018]);
  d.cashShare=genDaily([['2025-01-01',5],['2025-06-01',13],['2025-12-01',21],['2026-04-01',25],['2026-07-15',27]],{seed:72,vol:0.02});
  d.spendByAmount={
    '< $10':genFlow([['2024-11-01',0.1],['2025-06-01',0.7],['2026-07-15',2.4]].map(([a,b])=>[a,b*1e6]),{seed:73}),
    '$10–$100':genFlow([['2024-11-01',0.4],['2025-06-01',3.0],['2026-07-15',9.5]].map(([a,b])=>[a,b*1e6]),{seed:74}),
    '$100–$1k':genFlow([['2024-11-01',0.5],['2025-06-01',3.6],['2026-07-15',11]].map(([a,b])=>[a,b*1e6]),{seed:75}),
    '$1k–$10k':genFlow([['2024-11-01',0.2],['2025-06-01',1.4],['2026-07-15',5.6]].map(([a,b])=>[a,b*1e6]),{seed:76}),
    '> $10k':genFlow([['2025-02-01',0.1],['2025-08-01',0.7],['2026-07-15',2.5]].map(([a,b])=>[a,b*1e6]),{seed:77})
  };
  d.cashTx=genFlow([['2024-11-01',2.5],['2025-02-01',8],['2025-06-01',22],['2025-12-01',48],['2026-07-15',78]].map(([a,b])=>[a,k(b)]),{seed:78});
  d.newCards=genFlow([['2024-11-01',0.6],['2025-02-01',1.8],['2025-08-01',4.5],['2026-02-01',6.5],['2026-07-15',7.8]].map(([a,b])=>[a,k(b)]),{seed:79});
  d.activeCards=genDaily([['2024-11-15',900],['2025-03-01',9000],['2025-08-01',26000],['2026-01-01',44000],['2026-04-01',58000],['2026-07-15',71000]],{seed:80,vol:0.01});
  d.txByAmount={
    '< $10':genFlow([['2024-11-01',0.9],['2025-06-01',7],['2026-07-15',26]].map(([a,b])=>[a,k(b)]),{seed:81}),
    '$10–$100':genFlow([['2024-11-01',1.1],['2025-06-01',9],['2026-07-15',34]].map(([a,b])=>[a,k(b)]),{seed:82}),
    '$100–$1k':genFlow([['2024-11-01',0.4],['2025-06-01',4],['2026-07-15',14]].map(([a,b])=>[a,k(b)]),{seed:83}),
    '$1k–$10k':genFlow([['2024-11-01',0.08],['2025-06-01',0.9],['2026-07-15',3.2]].map(([a,b])=>[a,k(b)]),{seed:84}),
    '> $10k':genFlow([['2025-02-01',0.02],['2025-08-01',0.2],['2026-07-15',0.7]].map(([a,b])=>[a,k(b)]),{seed:85})
  };
  d.onramp={
    USDC:genFlow([['2024-11-01',1.5],['2025-06-01',9],['2026-07-15',26]].map(([a,b])=>[a,b*1e6]),{seed:86}),
    EURC:genFlow([['2025-02-01',0.3],['2025-08-01',2.4],['2026-07-15',8.5]].map(([a,b])=>[a,b*1e6]),{seed:87})
  };
  d.offramp={
    USDC:genFlow([['2024-11-01',0.9],['2025-06-01',5.5],['2026-07-15',16]].map(([a,b])=>[a,b*1e6]),{seed:88}),
    EURC:genFlow([['2025-02-01',0.15],['2025-08-01',1.3],['2026-07-15',4.6]].map(([a,b])=>[a,b*1e6]),{seed:89})
  };
  d.userSafe={
    liquidUSD:genDaily([['2024-11-15',3],['2025-06-01',85],['2025-12-01',180],['2026-07-15',290]].map(([a,b])=>[a,b*1e6]),{seed:90,vol:0.02}),
    liquidETH:genDaily([['2024-11-15',2],['2025-06-01',48],['2025-12-01',96],['2026-07-15',150]].map(([a,b])=>[a,b*1e6]),{seed:91,vol:0.025}),
    Stables:genDaily([['2024-11-15',5],['2025-06-01',60],['2025-12-01',110],['2026-07-15',165]].map(([a,b])=>[a,b*1e6]),{seed:92,vol:0.02}),
    liquidRAW:genDaily([['2025-02-01',1],['2025-08-01',22],['2026-07-15',64]].map(([a,b])=>[a,b*1e6]),{seed:93,vol:0.03}),
    Others:genDaily([['2024-12-01',1],['2025-08-01',18],['2026-07-15',42]].map(([a,b])=>[a,b*1e6]),{seed:94,vol:0.03})
  };
  // active hours (share of transactions by hour, UTC 0..23)
  d.activeHoursUTC=[1.2,0.9,0.7,0.6,0.7,1.0,1.6,2.4,3.3,4.1,4.8,5.4,5.9,6.4,6.8,7.1,7.4,7.2,6.6,5.7,4.6,3.6,2.6,1.7];
  // ===== financials (quarterly) =====
  const qs=[];for(let y=2024;y<=2026;y++)for(let q=0;q<4;q++){const t=Date.parse(`${y}-${String(q*3+3).padStart(2,'0')}-28`);if(t<=END&&t>=Date.parse('2024-03-01'))qs.push(t);}
  const qSeries=(anchors,seed,vol=0.08)=>{const r=mulberry32(seed);return qs.map(t=>{if(t<Date.parse(anchors[0][0]))return null;let ai=0;while(ai<anchors.length-1&&Date.parse(anchors[ai+1][0])<=t)ai++;const a=anchors[ai],b=anchors[ai+1];let base;if(!b)base=a[1];else{const ta=Date.parse(a[0]),tb=Date.parse(b[0]);base=a[1]+(b[1]-a[1])*((t-ta)/(tb-ta));}return[t,base*(1+(r()-0.5)*vol)];}).filter(Boolean);};
  const mq=(an,seed,vol)=>qSeries(an.map(([a,b])=>[a,b*1e6]),seed,vol);
  d.revBy={
    Restaking:mq([['2024-03-01',3],['2024-09-01',8],['2025-03-01',10],['2025-09-01',12],['2026-06-28',14.5]],101),
    Cash:mq([['2025-03-01',0.5],['2025-09-01',2],['2026-03-01',3.2],['2026-06-28',4.3]],102),
    Liquid:mq([['2024-06-01',1],['2025-06-01',3],['2026-06-28',5.1]],103),
    Other:mq([['2024-03-01',0.6],['2025-06-01',1.6],['2026-06-28',2.3]],104)
  };
  d.revBy.Total=qs.map(t=>{let s=0,has=false;for(const key of['Restaking','Cash','Liquid','Other']){const v=valueAt(d.revBy[key],t);if(v!=null&&d.revBy[key][0][0]<=t){s+=v;has=true;}}return has?[t,s]:null;}).filter(Boolean);
  d.fin={Revenue:d.revBy.Total};
  d.fin['Net income']=qs.map(t=>{const r=valueAt(d.revBy.Total,t);if(r==null)return null;const marginAnchor=t<Date.parse('2025-01-01')?0.34:t<Date.parse('2026-01-01')?0.44:0.5;return[t,r*marginAnchor];}).filter(Boolean);
  d.fin.Fees=d.revBy.Total.map(([t,v])=>[t,v*1.85]); // gross protocol fees > net revenue
  d.activeLoans=genDaily([['2024-12-01',12],['2025-06-01',120],['2025-12-01',260],['2026-04-01',360],['2026-07-15',430]].map(([a,b])=>[a,b*1e6]),{seed:110,vol:0.02});
  return d;
}
// ---------- live fetchers ----------
const KEYS={dune:'gP73CWbm8J0j2GGpFkgpQdLSdlhFGV6W',etherscan:'G4W43INRXQUSCMN53898XEBQQQV4B4CEYI',cg:'CG-WSUZXPRpEbU2urT9ewUg6F6Y'};
const DUNE_PROXY='https://etherfi-dune.imdyer21.workers.dev';
async function j(url,ms=15000,headers){const c=new AbortController();const to=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,headers});if(!r.ok)throw new Error(r.status);return await r.json();}finally{clearTimeout(to);}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function rescaleChains(mockChains,livePts){const total=mergeSum(Object.values(mockChains)),out={};for(const[name,pts]of Object.entries(mockChains)){out[name]=pts.map(([t,v])=>{const lt=valueAt(livePts,t),mt=valueAt(total,t);return[t,lt&&mt?v*(lt/mt):v];});}return out;}
export async function fetchLive(update){
  const CGH={'x-cg-pro-api-key':KEYS.cg};
  // CoinGecko: ETHFI price + circulating supply history, ETH & BTC price
  (async()=>{
    const cg=async id=>{try{return await j(`https://pro-api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=max`,15000,CGH);}catch(e){return await j(`https://pro-api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=730`,15000,CGH);}};
    try{
      const r=await cg('ether-fi');
      if(r&&r.prices){
        const price=r.prices.filter(p=>p[1]>0);
        if(price.length>10){try{const sp=await j('https://pro-api.coingecko.com/api/v3/simple/price?ids=ether-fi&vs_currencies=usd',10000,CGH);if(sp['ether-fi']&&sp['ether-fi'].usd>0)price.push([Date.now(),sp['ether-fi'].usd]);}catch(e){}update('ethfiPrice',price,'CoinGecko');}
        if(r.market_caps){const circ=r.market_caps.map((m,i)=>{const p=r.prices[i];return p&&p[1]>0?[m[0],m[1]/p[1]]:null;}).filter(Boolean);if(circ.length>10)update('ethfiCirc',circ,'CoinGecko');}
      }
    }catch(e){}
    await sleep(1500);
    for(const[id,key]of[['ethereum','ethPrice'],['bitcoin','btcPrice']]){try{const r=await cg(id);if(r&&r.prices){const pts=r.prices.filter(p=>p[1]>0);if(pts.length>10)update(key,pts,'CoinGecko');}}catch(e){}await sleep(1500);}
  })();
  // DeFiLlama: ether.fi total TVL history
  (async()=>{for(const slug of['ether.fi','etherfi']){try{const r=await j('https://api.llama.fi/protocol/'+slug);const tvl=(r.tvl||[]).map(p=>[p.date*1000,p.totalLiquidityUSD]).filter(p=>p[1]>0);if(tvl.length>20){update('restakedTvl',tvl,'DeFiLlama');return;}}catch(e){}}})();
  // DeFiLlama: ether.fi Cash / fees
  (async()=>{for(const slug of['ether.fi','etherfi']){try{const r=await j('https://api.llama.fi/summary/fees/'+slug+'?dataType=dailyFees');const pts=(r.totalDataChart||[]).map(p=>[p[0]*1000,p[1]]).filter(p=>p[1]>0);if(pts.length>30){update('feesTotal',pts,'DeFiLlama');return;}}catch(e){}}})();
  // DeFiLlama yields: restaking APYs (weETH / eBTC / Liquid ETH)
  (async()=>{
    const pools=[['46bd2bdf-6d92-4066-b482-e885ee172264','apy.eETH'],['f6568026-ff92-463d-8712-b9e8f8ea1408','apy.eBTC'],['b86d4934-2e75-415a-bdd2-e28143d72491','apy.Liquid']];
    for(const[pool,key]of pools){try{const r=await j('https://yields.llama.fi/chart/'+pool);const pts=(r.data||[]).map(d=>[Date.parse(d.timestamp),d.apy]).filter(p=>p[0]&&p[1]!=null);if(pts.length>10)update(key,pts,'DeFiLlama');}catch(e){}await sleep(300);}
  })();
  // Blockscout: current holder counts (weETH→eETH, eBTC, ETHFI)
  (async()=>{const toks=[['eBTC','0x657e8C867D8B37dCC18fA4Caead9C45EB088C642'],['ETHFI','0xFe0c30065B384F05761f15d0CC899D4F9F9Cc0eB']];for(const[sym,addr]of toks){try{const r=await j('https://eth.blockscout.com/api/v2/tokens/'+addr);const h=Number(r.holders_count!=null?r.holders_count:r.holders);if(h>0)update('anchor.holders.'+sym,h,'Blockscout');}catch(e){}await sleep(350);}})();
  // Blockscout: ETHFI top holders (labels where available)
  (async()=>{
    try{
      const r=await j('https://eth.blockscout.com/api/v2/tokens/0xFe0c30065B384F05761f15d0CC899D4F9F9Cc0eB/holders?limit=15');
      const items=r.items||r.holders||[];
      const out=items.map(h=>{const a=h.address||{};const addr=String(a.hash||'').toLowerCase();const tag=a.metadata&&a.metadata.tags&&a.metadata.tags[0]&&a.metadata.tags[0].name;const name=a.name||a.ens_domain_name||tag||('Unlabeled \u00b7 '+addr.slice(0,6)+'\u2026');const dec=(h.token&&h.token.decimals)?+h.token.decimals:18;return{name,amt:Number(h.value)/Math.pow(10,dec),addr};}).filter(h=>h.amt>0).slice(0,10);
      if(out.length>=5)update('topHolders.ETHFI',out,'Blockscout');
    }catch(e){}
  })();
  // Dune (via Cloudflare proxy): Cash program, restaked-asset platform splits, holders, top holders
  (async()=>{
    const dp=async id=>{try{const r=await j(DUNE_PROXY+'/'+id+'?limit=100000',20000);return (r&&r.result&&r.result.rows)||[];}catch(e){return [];}};
    const ms=s=>Date.parse(String(s).slice(0,10));
    const clean=c=>/^z+$/i.test(String(c))?'Others':String(c);
    const ser=(rows,dcol,vcol)=>rows.map(r=>[ms(r[dcol]),+r[vcol]]).filter(p=>p[0]&&!isNaN(p[1])).sort((a,b)=>a[0]-b[0]);
    const pivot=(rows,dcol,kcol,vcol)=>{const o={};for(const r of rows){const k=clean(r[kcol]);(o[k]=o[k]||[]).push([ms(r[dcol]),+r[vcol]]);}for(const key of Object.keys(o))o[key]=o[key].filter(p=>p[0]&&!isNaN(p[1])).sort((a,b)=>a[0]-b[0]);return o;};
    const sub=(a,b)=>{const ts=new Set();for(const p of a)ts.add(p[0]);for(const p of b)ts.add(p[0]);return [...ts].sort((x,y)=>x-y).map(t=>[t,Math.max(0,(valueAt(a,t)||0)-(valueAt(b,t)||0))]);};
    const collapse=(platObj,totalPts,order)=>{const keep=order.filter(k=>k!=='EOAs'&&k!=='Others'),keepLc=keep.map(s=>s.toLowerCase());const out={},rest=[];let eoa=null;for(const[cat,pts]of Object.entries(platObj)){const lc=String(cat).toLowerCase(),ki=keepLc.indexOf(lc);if(ki>=0)out[keep[ki]]=pts;else if(lc==='eoas'||lc==='eoa'||lc.indexOf('eoa')===0||lc.indexOf('wallet')>=0)eoa=eoa?mergeSum([eoa,pts]):pts;else rest.push(pts);}const dataSum=mergeSum(Object.values(platObj));const remainder=(totalPts&&totalPts.length)?sub(totalPts,dataSum):[];const others=mergeSum(rest);const eoas=eoa?mergeSum([eoa,remainder]):remainder;const res={};for(const k of order)res[k]=k==='Others'?others:k==='EOAs'?eoas:(out[k]||[]);return res;};
    const cash=await dp('4455397');
    if(cash.length){update('cashSpend',ser(cash,'day','spend_usd'),'Dune');update('cashback',ser(cash,'day','cashback_usd'),'Dune');update('cashTx',ser(cash,'day','num_txns'),'Dune');update('newCards',ser(cash,'day','new_cards'),'Dune');update('activeCards',ser(cash,'day','cumulative_cards'),'Dune');}
    await sleep(250);
    const bk=await dp('4516067');
    if(bk.length){const num=s=>{const m=String(s).match(/\d[\d,]*/);return m?+m[0].replace(/,/g,''):0;};const ord=o=>{const n={};for(const key of Object.keys(o).sort((a,b)=>num(a)-num(b)))n[key]=o[key];return n;};update('spendByAmount',ord(pivot(bk,'day','tx_profile','spend_usd')),'Dune');update('txByAmount',ord(pivot(bk,'day','tx_profile','num_txns')),'Dune');}
    await sleep(250);
    const on=await dp('7803972');if(on.length)update('onramp',pivot(on,'day','token_symbol','volume_usd'),'Dune');
    await sleep(250);
    const off=await dp('7804217');if(off.length)update('offramp',pivot(off,'day','token_symbol','volume_usd'),'Dune');
    await sleep(250);
    const us=await dp('4532771');if(us.length)update('userSafe',pivot(us,'day','token_class','token_balance_usd'),'Dune');
    await sleep(250);
    const hr=await dp('4533951');
    if(hr.length){const arr=new Array(24).fill(0);let tot=0;for(const r of hr){const h=+r.hour_of_day,v=+r.hour_trait||+r.hour_volume||0;if(h>=0&&h<24){arr[h]=v;tot+=v;}}if(tot>0)update('activeHoursUTC',arr.map(v=>v/tot*100),'Dune');}
    await sleep(250);
    const es=await dp('3961816');const eethTot=es.length?ser(es,'day','token_supply_eth'):null;if(eethTot&&eethTot.length)update('eethSupplyTot',eethTot,'Dune');
    await sleep(250);
    const ep=await dp('3915815');if(ep.length)update('eethPlatforms',collapse(pivot(ep,'day','category','balance'),eethTot,['Aave','EOAs','Morpho','Spark','Others']),'Dune');
    await sleep(250);
    const ebs=await dp('4494068');let ebtcTot=null;
    if(ebs.length){const m=new Map();for(const r of ebs){const t=ms(r.day),vb=+r.token_supply_base_asset_type;if(t&&!isNaN(vb))m.set(t,Math.max(m.get(t)||0,vb));}ebtcTot=[...m].sort((a,b)=>a[0]-b[0]);if(ebtcTot.length)update('ebtcSupplyTot',ebtcTot,'Dune');}
    await sleep(250);
    const bp=await dp('4267621');if(bp.length)update('ebtcPlatforms',collapse(pivot(bp,'day','category','balance'),ebtcTot,['EOAs','Aave','ether.fi','Fluid','Others']),'Dune');
    await sleep(250);
    const eh=await dp('5153772');
    if(eh.length){const m=new Map();for(const r of eh){const t=ms(r.granularity_day),v=+r.total_unique_holders;if(t&&!isNaN(v))m.set(t,v);}const pts=[...m].sort((a,b)=>a[0]-b[0]);if(pts.length)update('holders.eETH',pts,'Dune');}
    await sleep(250);
    const tot=await dp('4436106');
    if(tot.length){const m=new Map();for(const r of tot){const t=ms(r.week),v=+r.unique_depositors;if(t&&!isNaN(v))m.set(t,v);}const pts=[...m].sort((a,b)=>a[0]-b[0]);if(pts.length)update('holders.total',pts,'Dune');}
    await sleep(250);
    const mkTop=rows=>rows.map(r=>({rank:+r.rank_,name:(r.label&&String(r.label).trim())?String(r.label).trim():('Unlabeled \u00b7 '+String(r.address||'').slice(0,6)+'\u2026'),amt:+r.deposits_base,addr:String(r.address||'')})).filter(h=>h.amt>0).sort((a,b)=>a.rank-b.rank).slice(0,10);
    const et=await dp('5153786');if(et.length)update('topHolders.eETH',mkTop(et),'Dune');
    await sleep(250);
    const bt=await dp('4494136');if(bt.length)update('topHolders.eBTC',mkTop(bt),'Dune');
    await sleep(250);
    const rv=await dp('5490119');
    if(rv.length){const cols=Object.keys(rv[0]);const dcol=cols.find(c=>/day|date|week|month|period|dt|time/i.test(c))||cols[0];const strc=cols.filter(c=>c!==dcol&&typeof rv[0][c]==='string');const numc=cols.filter(c=>c!==dcol&&typeof rv[0][c]==='number');const kcol=strc.find(c=>/source|category|segment|type|product|stream|name|label/i.test(c))||strc[0];const vcol=numc.find(c=>/rev|amount|usd|value|fee|total/i.test(c))||numc[0];if(dcol&&kcol&&vcol)update('revBy',pivot(rv,dcol,kcol,vcol),'Dune');}
    await sleep(250);
    const bb=await dp('5135676');
    if(bb.length){const dcol=bb[0].hour!=null?'hour':(Object.keys(bb[0]).find(c=>/day|date|week|month|time/i.test(c))||Object.keys(bb[0])[0]);const tcol=bb[0].ethfi_bought!=null?'ethfi_bought':Object.keys(bb[0]).find(c=>/ethfi|bought|token|amount/i.test(c)&&!/cum/i.test(c));if(dcol&&tcol)update('buybackEthfi',ser(bb,dcol,tcol),'Dune');if(dcol&&bb[0].cum_ethfi_bought!=null)update('buybackEthfiCum',ser(bb,dcol,'cum_ethfi_bought'),'Dune');}
    await sleep(250);
    const utilSer=rows=>{const m=new Map();for(const r of rows){const t=ms(r.day),v=+r.defi_share_cnt;if(t&&!isNaN(v))m.set(t,Math.min(100,Math.max(0,v)));}return [...m].sort((a,b)=>a[0]-b[0]);};
    const u1=await dp('3915746');if(u1.length){const s=utilSer(u1);if(s.length)update('util.eETH',s,'Dune');}
    await sleep(250);
    const u2=await dp('4267597');if(u2.length){const s=utilSer(u2);if(s.length)update('util.eBTC',s,'Dune');}
    await sleep(250);
    const lv=await dp('4656856');
    if(lv.length){const cls=t=>{t=String(t).toLowerCase();if(/eur/.test(t))return 'Euro Vault';if(/btc|bitcoin/.test(t))return 'BTC Vault';if(/rwa|real|treasur|bill|credit/.test(t))return 'RWA Vault';if(/usd|usual|stable|dollar|dai|frax|pyusd|gho|usde/.test(t))return 'USD Vault';if(/eth|ether|reth|steth/.test(t))return 'ETH Vault';return 'Others';};const acc={};for(const r of lv){const t=ms(r.day),v=+r.tvl_usd;if(!t||isNaN(v))continue;const cat=cls((r.enriched_symbol||'')+' '+(r.symbol||''));const mp=acc[cat]=acc[cat]||new Map();mp.set(t,(mp.get(t)||0)+v);}const order=['ETH Vault','USD Vault','RWA Vault','BTC Vault','Euro Vault','Others'];const outL={};for(const n of order)outL[n]=acc[n]?[...acc[n]].sort((a,b)=>a[0]-b[0]):[];update('liquidTvl',outL,'Dune');}
  })();
}

export const MM_LOGO_TPL = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"633\" height=\"96\" viewBox=\"0 0 633 96\" fill=\"none\"> <path d=\"M 0.371 13.002 C -1.167 6.663 2.181 1.494 8.457 1.329 C 25.871 0.885 43.286 0.448 60.7 0.004 C 66.96 -0.161 73.857 4.951 75.46 11.57 C 81.296 35.483 81.296 60.517 75.46 84.43 C 73.857 91.041 66.96 96.161 60.7 95.996 C 43.286 95.56 25.871 95.115 8.457 94.679 C 2.181 94.514 -1.167 89.345 0.371 83.006 C 5.977 60.031 5.977 35.977 0.371 13.002 Z M 11.415 49.585 C 11.407 50.49 11.67 51.247 12.22 51.865 C 12.771 52.441 13.48 52.729 14.365 52.729 C 14.668 52.729 14.971 52.729 15.266 52.729 C 16.151 52.729 16.885 52.449 17.459 51.873 C 18.041 51.256 18.336 50.498 18.344 49.585 C 18.456 39.048 17.451 28.511 15.33 18.147 C 15.147 17.258 15.274 16.525 15.705 15.949 C 16.135 15.332 16.781 15.019 17.666 15.002 C 22.459 14.92 27.251 14.83 32.035 14.747 C 32.92 14.731 33.709 15.027 34.403 15.628 C 35.089 16.188 35.527 16.92 35.719 17.826 C 37.864 28.297 38.884 38.957 38.765 49.609 C 38.757 50.523 39.02 51.297 39.562 51.923 C 40.112 52.507 40.822 52.803 41.707 52.803 C 42.01 52.803 42.313 52.803 42.608 52.803 C 43.493 52.803 44.227 52.515 44.801 51.931 C 45.383 51.305 45.678 50.531 45.686 49.609 C 45.798 38.924 44.777 28.223 42.624 17.711 C 42.441 16.805 42.56 16.064 42.991 15.48 C 43.413 14.854 44.067 14.533 44.952 14.517 C 49.721 14.434 54.497 14.344 59.265 14.262 C 60.15 14.245 60.94 14.541 61.641 15.159 C 62.327 15.727 62.774 16.468 62.957 17.39 C 65.134 28.017 66.162 38.834 66.051 49.634 C 66.043 50.564 66.306 51.346 66.848 51.98 C 67.398 52.573 68.108 52.869 68.993 52.869 C 69.296 52.869 69.599 52.869 69.894 52.869 C 70.779 52.869 71.513 52.573 72.087 51.988 C 72.669 51.355 72.964 50.572 72.972 49.634 C 73.084 38.793 72.055 27.935 69.87 17.274 C 69.679 16.361 69.24 15.612 68.547 15.035 C 67.845 14.418 67.055 14.122 66.17 14.138 C 65.867 14.138 65.572 14.146 65.269 14.155 C 64.384 14.171 63.603 13.891 62.901 13.323 C 62.192 12.714 61.729 11.957 61.506 11.043 C 61.442 10.771 61.37 10.508 61.306 10.236 C 61.075 9.331 60.597 8.598 59.879 8.03 C 59.154 7.429 58.34 7.133 57.463 7.157 C 52.695 7.256 47.935 7.363 43.166 7.462 C 42.281 7.478 41.651 7.799 41.253 8.425 C 40.846 9.01 40.758 9.742 40.989 10.639 C 41.053 10.903 41.125 11.166 41.189 11.438 C 41.412 12.335 41.316 13.101 40.894 13.718 C 40.463 14.303 39.809 14.599 38.924 14.616 C 38.621 14.616 38.326 14.624 38.023 14.632 C 37.138 14.648 36.357 14.377 35.663 13.817 C 34.961 13.216 34.499 12.467 34.276 11.57 C 34.212 11.306 34.14 11.043 34.076 10.779 C 33.845 9.89 33.375 9.166 32.657 8.606 C 31.931 8.014 31.126 7.725 30.241 7.742 C 25.457 7.849 20.672 7.948 15.88 8.055 C 14.995 8.071 14.365 8.392 13.967 9.001 C 13.56 9.578 13.472 10.302 13.695 11.183 C 13.759 11.446 13.831 11.701 13.895 11.965 C 14.118 12.854 14.014 13.603 13.592 14.212 C 13.161 14.788 12.507 15.085 11.622 15.101 C 11.319 15.101 11.024 15.109 10.721 15.118 C 9.836 15.134 9.19 15.447 8.76 16.064 C 8.321 16.641 8.202 17.365 8.377 18.254 C 10.49 28.577 11.495 39.081 11.383 49.576 L 11.415 49.585 Z M 7.069 86.908 C 6.671 86.299 6.591 85.55 6.814 84.677 C 8.449 78.281 9.645 71.794 10.41 65.275 C 10.514 64.377 10.873 63.645 11.495 63.077 C 12.117 62.468 12.874 62.163 13.751 62.171 C 14.054 62.171 14.357 62.171 14.652 62.171 C 15.537 62.171 16.287 61.9 16.901 61.323 C 17.515 60.714 17.866 59.957 17.93 59.051 C 17.945 58.788 17.969 58.516 17.985 58.253 C 18.049 57.347 18.368 56.606 18.966 56.038 C 19.564 55.421 20.298 55.116 21.183 55.116 C 25.983 55.133 30.783 55.149 35.583 55.174 C 36.468 55.174 37.178 55.495 37.704 56.121 C 38.239 56.705 38.47 57.454 38.406 58.368 C 38.39 58.64 38.366 58.911 38.35 59.175 C 38.278 60.089 38.502 60.862 39.004 61.488 C 39.514 62.072 40.208 62.369 41.093 62.377 C 41.396 62.377 41.699 62.377 41.994 62.377 C 42.879 62.377 43.629 62.097 44.243 61.521 C 44.865 60.904 45.208 60.13 45.279 59.216 C 45.303 58.944 45.319 58.673 45.335 58.401 C 45.399 57.479 45.726 56.73 46.316 56.154 C 46.914 55.528 47.647 55.215 48.533 55.224 C 53.309 55.24 58.093 55.256 62.869 55.281 C 63.754 55.281 64.464 55.602 64.99 56.236 C 65.525 56.829 65.756 57.594 65.692 58.516 C 65.676 58.788 65.652 59.068 65.636 59.339 C 65.564 60.27 65.78 61.052 66.29 61.686 C 66.8 62.278 67.494 62.583 68.379 62.583 C 68.682 62.583 68.985 62.583 69.28 62.583 C 70.165 62.583 70.859 62.912 71.353 63.546 C 71.856 64.139 72.055 64.904 71.943 65.834 C 71.154 72.576 69.91 79.277 68.228 85.887 C 67.996 86.793 67.51 87.558 66.784 88.159 C 66.067 88.727 65.261 88.999 64.384 88.974 C 64.081 88.974 63.786 88.958 63.483 88.958 C 62.598 88.941 61.96 88.637 61.562 88.052 C 61.171 87.427 61.091 86.661 61.322 85.756 C 63.005 79.17 64.241 72.494 65.03 65.777 C 65.142 64.855 64.934 64.089 64.432 63.497 C 63.938 62.863 63.244 62.542 62.359 62.533 C 57.583 62.501 52.806 62.459 48.022 62.426 C 47.137 62.426 46.388 62.723 45.758 63.348 C 45.136 63.925 44.777 64.674 44.665 65.587 C 43.884 72.231 42.664 78.833 40.997 85.352 C 40.766 86.25 40.288 86.999 39.562 87.591 C 38.845 88.151 38.047 88.415 37.162 88.398 C 36.859 88.398 36.564 88.382 36.261 88.382 C 35.376 88.365 34.738 88.061 34.331 87.484 C 33.933 86.867 33.853 86.11 34.084 85.221 C 35.743 78.734 36.963 72.148 37.736 65.53 C 37.84 64.616 37.64 63.867 37.138 63.283 C 36.636 62.657 35.942 62.336 35.065 62.336 C 30.265 62.303 25.473 62.262 20.672 62.229 C 19.787 62.229 19.038 62.525 18.416 63.134 C 17.794 63.702 17.435 64.443 17.331 65.341 C 16.566 71.893 15.362 78.396 13.719 84.817 C 13.496 85.698 13.018 86.439 12.292 87.023 C 11.582 87.575 10.777 87.838 9.9 87.814 C 9.597 87.814 9.302 87.797 8.999 87.797 C 8.114 87.781 7.476 87.484 7.069 86.916 L 7.069 86.908 Z\" fill=\"__C__\" fill-rule=\"evenodd\"></path> <path d=\"M 114.348 69.323 L 114.348 25.371 L 123.223 25.371 L 136.26 55.058 C 136.75 56.196 137.199 57.314 137.607 58.411 C 138.015 59.508 138.3 60.301 138.464 60.788 L 138.708 61.581 C 139.157 59.833 139.953 57.659 141.096 55.058 L 154.133 25.371 L 162.702 25.371 L 162.702 69.323 L 155.602 69.323 L 155.602 43.964 L 155.847 36.953 C 155.194 38.701 154.317 40.875 153.215 43.476 L 141.952 69.323 L 135.22 69.323 L 123.835 43.476 L 121.203 36.953 C 121.325 38.782 121.386 41.119 121.386 43.964 L 121.386 69.323 L 114.348 69.323 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 178.238 69.81 C 175.015 69.81 172.383 68.977 170.343 67.311 C 168.302 65.604 167.282 63.41 167.282 60.727 C 167.282 58.005 168.221 55.81 170.098 54.144 C 172.016 52.437 174.709 51.36 178.177 50.913 L 184.971 49.999 C 186.808 49.755 187.726 48.881 187.726 47.377 C 187.726 45.955 187.114 44.797 185.889 43.903 C 184.706 42.968 183.094 42.501 181.054 42.501 C 179.095 42.501 177.484 42.988 176.219 43.964 C 174.954 44.898 174.24 46.239 174.076 47.987 L 167.527 47.987 C 167.894 44.655 169.282 42.033 171.689 40.123 C 174.097 38.173 177.218 37.197 181.054 37.197 C 185.135 37.197 188.379 38.274 190.786 40.428 C 193.194 42.541 194.397 45.366 194.397 48.901 L 194.397 61.459 C 194.397 63.125 195.091 63.958 196.479 63.958 L 197.519 63.836 L 197.519 69.323 C 196.458 69.567 195.418 69.689 194.397 69.689 C 190.725 69.689 188.766 68.022 188.521 64.69 C 187.746 66.275 186.44 67.535 184.604 68.469 C 182.768 69.363 180.646 69.81 178.238 69.81 Z M 179.279 64.629 C 181.972 64.629 184.074 63.796 185.583 62.13 C 187.134 60.423 187.909 58.188 187.909 55.424 L 187.909 54.266 L 179.279 55.668 C 175.729 56.237 173.954 57.842 173.954 60.484 C 173.954 61.703 174.444 62.698 175.423 63.471 C 176.402 64.243 177.688 64.629 179.279 64.629 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 214.664 69.81 C 210.012 69.81 206.238 68.307 203.341 65.299 C 200.443 62.292 198.995 58.35 198.995 53.473 C 198.995 48.637 200.443 44.716 203.341 41.708 C 206.238 38.701 210.012 37.197 214.664 37.197 C 218.541 37.197 221.764 38.234 224.335 40.306 C 226.906 42.338 228.456 45.264 228.987 49.084 L 222.438 49.084 C 222.111 47.296 221.234 45.833 219.806 44.695 C 218.418 43.557 216.745 42.988 214.786 42.988 C 212.053 42.988 209.869 43.943 208.237 45.853 C 206.605 47.763 205.789 50.303 205.789 53.473 C 205.789 56.643 206.605 59.204 208.237 61.154 C 209.91 63.064 212.093 64.019 214.786 64.019 C 216.786 64.019 218.459 63.471 219.806 62.373 C 221.193 61.235 222.07 59.671 222.438 57.68 L 228.987 57.68 C 228.375 61.662 226.783 64.69 224.213 66.762 C 221.683 68.794 218.5 69.81 214.664 69.81 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 232.898 69.323 L 232.898 24.883 L 239.57 24.883 L 239.57 43.049 C 242.018 39.148 245.527 37.197 250.097 37.197 C 253.525 37.197 256.28 38.234 258.361 40.306 C 260.482 42.338 261.543 45.061 261.543 48.475 L 261.543 69.323 L 254.933 69.323 L 254.933 49.938 C 254.933 47.946 254.321 46.321 253.097 45.061 C 251.913 43.801 250.322 43.171 248.322 43.171 C 245.588 43.171 243.446 44.268 241.896 46.463 C 240.345 48.617 239.57 51.604 239.57 55.424 L 239.57 69.323 L 232.898 69.323 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 267.299 69.323 L 267.299 37.685 L 273.971 37.685 L 273.971 69.323 L 267.299 69.323 Z M 266.993 24.883 L 274.399 24.883 L 274.399 32.381 L 266.993 32.381 L 266.993 24.883 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 280.002 69.323 L 280.002 37.685 L 286.674 37.685 L 286.674 43.049 C 289.081 39.148 292.59 37.197 297.201 37.197 C 300.588 37.197 303.343 38.234 305.465 40.306 C 307.587 42.379 308.647 45.102 308.647 48.475 L 308.647 69.323 L 301.976 69.323 L 301.976 49.938 C 301.976 47.946 301.384 46.321 300.201 45.061 C 299.017 43.801 297.426 43.171 295.426 43.171 C 292.693 43.171 290.55 44.268 289 46.463 C 287.449 48.617 286.674 51.604 286.674 55.424 L 286.674 69.323 L 280.002 69.323 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 316.792 65.056 C 313.976 61.845 312.568 57.984 312.568 53.473 C 312.568 48.962 313.915 45.122 316.608 41.952 C 319.342 38.782 323.116 37.197 327.931 37.197 C 332.624 37.197 336.297 38.681 338.949 41.647 C 341.642 44.614 342.968 48.19 342.927 52.376 L 342.805 55.058 L 319.179 55.058 C 319.464 57.944 320.423 60.179 322.055 61.764 C 323.728 63.349 325.85 64.141 328.421 64.141 C 330.421 64.141 332.114 63.694 333.501 62.8 C 334.93 61.906 335.827 60.667 336.195 59.082 L 342.744 59.082 C 342.213 62.455 340.622 65.096 337.97 67.006 C 335.358 68.876 332.114 69.81 328.237 69.81 C 323.422 69.81 319.607 68.225 316.792 65.056 Z M 319.485 49.816 L 335.766 49.816 C 335.603 47.621 334.828 45.853 333.44 44.512 C 332.094 43.131 330.257 42.44 327.931 42.44 C 325.728 42.44 323.892 43.09 322.423 44.39 C 320.954 45.691 319.974 47.499 319.485 49.816 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 358.573 69.81 C 354.656 69.81 351.453 68.774 348.964 66.701 C 346.474 64.588 345.148 61.886 344.985 58.594 L 351.534 58.594 C 351.616 60.057 352.31 61.337 353.615 62.434 C 354.921 63.532 356.574 64.08 358.573 64.08 C 360.287 64.08 361.695 63.714 362.797 62.983 C 363.898 62.251 364.449 61.337 364.449 60.24 C 364.449 58.37 363.143 57.131 360.532 56.521 L 355.268 55.302 C 349.351 54.002 346.393 50.933 346.393 46.097 C 346.393 43.578 347.454 41.464 349.576 39.757 C 351.738 38.051 354.534 37.197 357.961 37.197 C 361.389 37.197 364.245 38.091 366.53 39.879 C 368.856 41.627 370.223 44.004 370.631 47.012 L 364.082 47.012 C 363.919 45.671 363.246 44.614 362.062 43.842 C 360.879 43.029 359.512 42.623 357.961 42.623 C 356.492 42.623 355.309 42.948 354.411 43.598 C 353.513 44.208 353.065 45.041 353.065 46.097 C 353.065 47.723 354.309 48.84 356.798 49.45 L 362.062 50.608 C 365 51.258 367.265 52.274 368.856 53.656 C 370.448 54.997 371.243 57.131 371.243 60.057 C 371.243 62.861 370.06 65.198 367.693 67.067 C 365.367 68.896 362.327 69.81 358.573 69.81 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 401.717 69.291 C 397.433 69.291 393.944 68.153 391.251 65.877 C 388.557 63.601 387.211 60.634 387.211 56.977 C 387.211 53.929 387.986 51.45 389.537 49.54 C 391.087 47.589 393.209 45.943 395.903 44.602 L 396.27 44.419 C 394.678 42.469 393.536 40.782 392.842 39.36 C 392.189 37.937 391.863 36.474 391.863 34.971 C 391.863 31.76 392.883 29.2 394.923 27.29 C 396.963 25.339 399.657 24.364 403.003 24.364 C 406.349 24.364 409.021 25.339 411.021 27.29 C 413.02 29.2 414.02 31.76 414.02 34.971 C 414.02 39.482 411.613 43.038 406.798 45.638 L 406.063 46.004 L 413.837 54.843 C 414.816 53.218 416.06 50.881 417.57 47.833 L 424.915 47.833 C 422.63 52.791 420.365 56.753 418.121 59.72 L 426.078 68.803 L 417.509 68.803 L 413.775 64.536 C 410.103 67.706 406.083 69.291 401.717 69.291 Z M 394.25 56.672 C 394.25 58.46 394.984 59.984 396.453 61.244 C 397.963 62.463 399.82 63.073 402.023 63.073 C 404.757 63.073 407.328 62.016 409.736 59.903 L 400.31 49.113 L 399.697 49.418 C 396.066 51.328 394.25 53.746 394.25 56.672 Z M 398.167 34.971 C 398.167 36.393 399.473 38.587 402.085 41.554 L 403.309 40.945 C 406.328 39.36 407.838 37.368 407.838 34.971 C 407.838 33.589 407.369 32.471 406.43 31.618 C 405.533 30.724 404.39 30.277 403.003 30.277 C 401.574 30.277 400.412 30.724 399.514 31.618 C 398.616 32.471 398.167 33.589 398.167 34.971 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 438.791 68.803 L 438.791 24.851 L 447.667 24.851 L 460.704 54.538 C 461.194 55.676 461.642 56.794 462.05 57.891 C 462.458 58.989 462.744 59.781 462.907 60.269 L 463.152 61.061 C 463.601 59.314 464.397 57.139 465.539 54.538 L 478.577 24.851 L 487.146 24.851 L 487.146 68.803 L 480.046 68.803 L 480.046 43.444 L 480.291 36.434 C 479.638 38.181 478.76 40.355 477.659 42.956 L 466.396 68.803 L 459.663 68.803 L 448.279 42.956 L 445.647 36.434 C 445.769 38.262 445.83 40.599 445.83 43.444 L 445.83 68.803 L 438.791 68.803 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 507.522 69.291 C 502.87 69.291 499.034 67.767 496.015 64.719 C 493.036 61.63 491.547 57.708 491.547 52.954 C 491.547 48.239 493.036 44.358 496.015 41.31 C 499.034 38.222 502.87 36.677 507.522 36.677 C 512.133 36.677 515.948 38.222 518.968 41.31 C 521.988 44.358 523.497 48.239 523.497 52.954 C 523.497 57.708 521.988 61.63 518.968 64.719 C 515.948 67.767 512.133 69.291 507.522 69.291 Z M 507.522 63.499 C 510.215 63.499 512.398 62.524 514.071 60.573 C 515.785 58.582 516.642 56.042 516.642 52.954 C 516.642 49.865 515.785 47.345 514.071 45.395 C 512.357 43.444 510.174 42.469 507.522 42.469 C 504.747 42.469 502.523 43.444 500.85 45.395 C 499.177 47.345 498.341 49.865 498.341 52.954 C 498.341 56.042 499.177 58.582 500.85 60.573 C 502.523 62.524 504.747 63.499 507.522 63.499 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 527.723 68.803 L 527.723 37.165 L 534.394 37.165 L 534.394 42.53 C 536.802 38.628 540.311 36.677 544.922 36.677 C 548.309 36.677 551.063 37.714 553.185 39.786 C 555.307 41.859 556.368 44.582 556.368 47.955 L 556.368 68.803 L 549.696 68.803 L 549.696 49.418 C 549.696 47.427 549.105 45.801 547.921 44.541 C 546.738 43.281 545.147 42.651 543.147 42.651 C 540.413 42.651 538.271 43.749 536.72 45.943 C 535.17 48.097 534.394 51.084 534.394 54.904 L 534.394 68.803 L 527.723 68.803 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 564.512 64.536 C 561.697 61.325 560.289 57.465 560.289 52.954 C 560.289 48.443 561.635 44.602 564.329 41.432 C 567.063 38.262 570.837 36.677 575.652 36.677 C 580.345 36.677 584.017 38.161 586.67 41.127 C 589.363 44.094 590.689 47.67 590.648 51.856 L 590.526 54.538 L 566.899 54.538 C 567.185 57.424 568.144 59.659 569.776 61.244 C 571.449 62.829 573.571 63.621 576.142 63.621 C 578.141 63.621 579.835 63.174 581.222 62.28 C 582.65 61.386 583.548 60.147 583.915 58.562 L 590.464 58.562 C 589.934 61.935 588.343 64.576 585.69 66.486 C 583.079 68.356 579.835 69.291 575.958 69.291 C 571.143 69.291 567.328 67.706 564.512 64.536 Z M 567.205 49.296 L 583.487 49.296 C 583.323 47.101 582.548 45.334 581.161 43.993 C 579.814 42.611 577.978 41.92 575.652 41.92 C 573.449 41.92 571.612 42.57 570.143 43.871 C 568.674 45.171 567.695 46.98 567.205 49.296 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 614.828 37.165 L 621.561 37.165 L 608.462 71.058 C 607.279 74.106 605.769 76.464 603.933 78.13 C 602.137 79.837 599.709 80.69 596.649 80.69 C 595.261 80.69 593.915 80.487 592.609 80.08 L 592.609 74.35 C 593.67 74.716 594.792 74.899 595.976 74.899 C 597.608 74.899 598.893 74.432 599.832 73.497 C 600.811 72.562 601.75 70.916 602.647 68.559 L 602.831 68.071 L 590.406 37.165 L 597.751 37.165 L 606.197 59.354 L 614.828 37.165 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> <path d=\"M 631.708 67.529 C 630.858 68.378 629.832 68.803 628.628 68.803 C 627.424 68.803 626.392 68.378 625.53 67.529 C 624.681 66.667 624.256 65.635 624.256 64.431 C 624.256 63.239 624.681 62.219 625.53 61.369 C 626.392 60.519 627.424 60.094 628.628 60.094 C 629.832 60.094 630.858 60.519 631.708 61.369 C 632.569 62.219 633 63.239 633 64.431 C 633 65.635 632.569 66.667 631.708 67.529 Z M 628.628 68.042 C 629.607 68.042 630.439 67.694 631.124 66.998 C 631.808 66.29 632.15 65.434 632.15 64.431 C 632.15 63.428 631.808 62.584 631.124 61.9 C 630.439 61.204 629.607 60.856 628.628 60.856 C 627.637 60.856 626.793 61.204 626.097 61.9 C 625.412 62.584 625.07 63.428 625.07 64.431 C 625.07 65.434 625.412 66.29 626.097 66.998 C 626.793 67.694 627.637 68.042 628.628 68.042 Z M 626.929 66.626 L 626.929 62.077 L 628.947 62.077 C 629.395 62.077 629.755 62.207 630.026 62.466 C 630.298 62.714 630.433 63.05 630.433 63.475 C 630.433 63.971 630.227 64.348 629.814 64.608 C 630.097 64.761 630.274 65.015 630.345 65.369 L 630.504 66.059 C 630.54 66.284 630.605 66.472 630.699 66.626 L 629.548 66.626 C 629.478 66.508 629.43 66.372 629.407 66.219 L 629.301 65.564 C 629.23 65.104 628.917 64.874 628.362 64.874 L 627.902 64.874 L 627.902 66.626 L 626.929 66.626 Z M 628.787 63.989 C 629.212 63.989 629.424 63.817 629.424 63.475 C 629.424 63.121 629.212 62.944 628.787 62.944 L 627.902 62.944 L 627.902 63.989 L 628.787 63.989 Z\" fill=\"__C__\" fill-rule=\"nonzero\"></path> </svg>";
