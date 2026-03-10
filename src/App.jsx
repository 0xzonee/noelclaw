import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TAKEOVER_URL = "https://example.com";
const LOGO = "/logo.png";

/* ── DATA ── */
const visitData = [
  {d:"1 Mar",v:320,u:210},{d:"2 Mar",v:480,u:310},{d:"3 Mar",v:390,u:260},
  {d:"4 Mar",v:610,u:420},{d:"5 Mar",v:740,u:510},{d:"6 Mar",v:580,u:390},
  {d:"7 Mar",v:920,u:640},{d:"8 Mar",v:860,u:580},{d:"9 Mar",v:1100,u:780},
];
const articleViews = [
  {name:"NoelClaw: AI OS",views:3240},{name:"AGI Horizon",views:1840},
  {name:"AI Agents Prod.",views:1320},{name:"Reasoning Models",views:1180},
  {name:"MCP Protocol",views:960},{name:"Context Windows",views:820},
];
const trafficSources = [
  {name:"X / Twitter",value:42,color:"#3b82f6"},{name:"Direct",value:28,color:"#6366f1"},
  {name:"Google",value:18,color:"#0ea5e9"},{name:"Other",value:12,color:"#1e2a4a"},
];
const monthlyData = [
  {m:"Oct",v:340},{m:"Nov",v:620},{m:"Dec",v:890},
  {m:"Jan",v:1480},{m:"Feb",v:2640},{m:"Mar",v:4200},
];
const recentActivity = [
  {time:"1m ago",event:"NoelClaw: AI OS — 12 new reads",type:"view",name:"Alex"},
  {time:"4m ago",event:"NoelClaw: AI OS shared on X",type:"share",name:"Maya"},
  {time:"9m ago",event:"New reader from Singapore",type:"visit",name:"Ryan"},
  {time:"22m ago",event:"NoelClaw: AI OS read (full)",type:"read",name:"Zara"},
  {time:"45m ago",event:"New follower @noelclawfun",type:"follow",name:"Kai"},
  {time:"1h ago",event:"AGI Horizon — 84 new views",type:"view",name:"Lena"},
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #05070e;
  --bg2:      #08091a;
  --surface:  rgba(255,255,255,0.04);
  --surface2: rgba(255,255,255,0.07);
  --border:   rgba(255,255,255,0.08);
  --border2:  rgba(255,255,255,0.13);
  --blue:     #1a4fff;
  --blue2:    #2563eb;
  --blue-hi:  #4d85ff;
  --blue-glo: rgba(26,79,255,0.3);
  --text:     #dde4ff;
  --text2:    #6b78a8;
  --text3:    #2d3558;
  --white:    #ffffff;
  --green:    #22d3a5;
  --orange:   #f97316;
  --purple:   #a78bfa;
}




/* article reader */

html { scroll-behavior: smooth; }
body { background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-weight:300;letter-spacing:.01em;overflow-x:hidden;cursor:none; }

#cr  { width:8px;height:8px;border-radius:50%;background:#fff;position:fixed;top:0;left:0;z-index:9999;pointer-events:none;transform:translate(-50%,-50%);transition:width .18s,height .18s;mix-blend-mode:difference; }
#crr { width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.28);position:fixed;top:0;left:0;z-index:9998;pointer-events:none;transform:translate(-50%,-50%);transition:left .12s cubic-bezier(.23,1,.32,1),top .12s cubic-bezier(.23,1,.32,1),width .25s,height .25s; }
body:has(a:hover) #cr,body:has(button:hover) #cr { width:14px;height:14px; }
body:has(a:hover) #crr,body:has(button:hover) #crr { width:46px;height:46px;border-color:rgba(255,255,255,0.14); }

::-webkit-scrollbar { width:3px; }
::-webkit-scrollbar-thumb { background:var(--text3);border-radius:2px; }

.grain { position:fixed;inset:0;z-index:9990;pointer-events:none;opacity:.0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;animation:gr .6s steps(1) infinite; }
@keyframes gr{0%{transform:translate(0,0)}16%{transform:translate(-4%,-2%)}33%{transform:translate(2%,4%)}50%{transform:translate(-2%,0)}66%{transform:translate(4%,-4%)}83%{transform:translate(-3%,2%)}100%{transform:translate(0,0)}}

.app { position:relative;z-index:1;min-height:100vh;width:100%;display:flex;flex-direction:column;overflow-x:hidden; }

/* ── CA BAR ── */
.ca-bar {
  width:100%;background:#03050c;border-bottom:1px solid rgba(255,255,255,0.07);
  padding:.4rem 0;display:flex;align-items:center;
  font-size:.62rem;font-weight:300;letter-spacing:.08em;color:var(--text2);
  position:sticky;top:0;z-index:201;overflow:hidden;
}
.ca-bar-inner {
  display:flex;align-items:center;gap:2rem;
  white-space:nowrap;
  animation:ca-scroll 30s linear infinite;
  will-change:transform;
}
.ca-bar:hover .ca-bar-inner { animation-play-state:paused; }
@keyframes ca-scroll {
  from { transform:translateX(0); }
  to { transform:translateX(-50%); }
}
.ca-label { color:var(--blue-hi);font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:.6rem; }
.ca-addr {
  font-family:'Courier New',monospace;color:var(--text2);font-size:.59rem;
  cursor:pointer;transition:color .2s;letter-spacing:.03em;
}
.ca-addr:hover { color:#fff; }
.ca-sep { color:var(--text3); }
.ca-dot { width:3px;height:3px;border-radius:50%;background:var(--blue-hi);flex-shrink:0;display:inline-block; }

/* ── NAV ── */
.nav {
  display:flex;align-items:center;justify-content:space-between;
  padding:0 2.5rem;height:62px;
  position:sticky;top:0;z-index:200;
  background:rgba(5,7,14,0.8);
  backdrop-filter:blur(20px) saturate(1.5);
  border-bottom:1px solid var(--border);
}
.nav-logo {
  font-family:'Inter',sans-serif;font-weight:200;font-size:1.15rem;
  cursor:none;transition:opacity .2s;letter-spacing:.18em;text-transform:uppercase;color:var(--white);
}
.nav-logo:hover { opacity:.7; }
.logo-n { color:var(--blue-hi); }

.nav-links { display:flex;gap:.1rem; }
.nav-item {
  position:relative;font-size:.75rem;font-weight:300;color:var(--text2);
  padding:.38rem .85rem;border-radius:7px;background:none;border:none;
  cursor:none;font-family:'Inter',sans-serif;letter-spacing:.08em;transition:color .22s;
  outline:none;-webkit-tap-highlight-color:transparent;
}
.nav-item:focus,.nav-item:focus-visible { outline:none;box-shadow:none; }
.nav-item::after { content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:0;height:1px;background:var(--white);transition:width .28s cubic-bezier(.34,1.56,.64,1); }
.nav-item:hover { color:var(--text); }
.nav-item.active { color:var(--white); }
.nav-item.active::after { width:50%; }

.nav-right { display:flex;align-items:center;gap:.5rem; }
.nav-burger {
  display:none;flex-direction:column;gap:5px;justify-content:center;align-items:center;
  width:36px;height:36px;background:none;border:1px solid var(--border);border-radius:8px;
  cursor:pointer;padding:0;
}
.nav-burger span { width:16px;height:1px;background:var(--text2);display:block;transition:all .2s; }
.mob-menu {
  position:fixed;top:54px;left:0;right:0;z-index:199;
  background:rgba(5,7,14,0.99);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
  display:flex;flex-direction:column;padding:.5rem 0;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
}
.mob-item {
  padding:.85rem 1.4rem;font-size:.9rem;font-weight:300;color:var(--text2);
  background:none;border:none;text-align:left;font-family:"Inter",sans-serif;
  letter-spacing:.06em;cursor:pointer;transition:color .18s,background .18s;
}
.mob-item:hover,.mob-item.active { color:var(--white);background:var(--surface); }
@media(max-width:600px){
  .nav-links { display:none; }
  .nav-burger { display:flex; }
}

/* ── PAGE TRANSITION ── */
.page { animation:pin .45s cubic-bezier(.23,1,.32,1) both; width:100%; }
@keyframes pin { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

/* ── MAIN (full width now, no right panel) ── */
.main { flex:1; width:100%; }

/* ══════════════════════════════
   HERO
══════════════════════════════ */
.hero {
  position:relative;overflow:hidden;
  min-height:92vh;width:100%;display:flex;flex-direction:column;justify-content:flex-end;
  padding:0 0 4rem 0;border-bottom:1px solid var(--border);
}
.hero-bg {
  position:absolute;inset:0;z-index:0;
  background-image:url('/bg-blue.png');
  background-size:cover;background-position:left center;
  background-repeat:no-repeat;
  width:100%;height:100%;
  filter:brightness(.85) saturate(1.3);
}
.hero-curve-left {
  position:absolute;z-index:1;pointer-events:none;
  left:-5%;bottom:-10%;width:55%;height:85%;
  background:#05070e;border-radius:0 60% 0 0;
}
.hero-vignette {
  position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(to top, rgba(5,7,14,1) 0%, rgba(5,7,14,0.4) 35%, transparent 70%);
}
.hero-content { position:relative;z-index:3;padding:0 3.5rem;max-width:780px; }
.hero-eyebrow { font-family:'Inter',sans-serif;font-size:.65rem;font-weight:200;color:var(--text2);letter-spacing:.35em;text-transform:uppercase;margin-bottom:1.4rem;animation:pin .6s .1s both; }
.hero-h1 { font-family:'Inter',sans-serif;font-size:clamp(3.5rem,7vw,6.5rem);font-weight:100;line-height:.95;letter-spacing:-.02em;color:var(--white);margin-bottom:2rem;animation:pin .6s .2s both; }
.hero-h1 em { font-style:italic;font-weight:200;color:rgba(255,255,255,0.65); }
.hero-bottom { display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;flex-wrap:wrap;animation:pin .6s .35s both; }
.hero-desc { font-size:.88rem;color:var(--text2);line-height:1.85;max-width:340px;font-weight:200;letter-spacing:.03em; }
.hero-ctas { display:flex;gap:.75rem;align-items:center;flex-shrink:0; }
.cta-solid { display:inline-flex;align-items:center;gap:.45rem;background:var(--white);color:var(--bg);padding:.7rem 1.6rem;border-radius:6px;font-size:.78rem;font-weight:400;letter-spacing:.08em;border:none;cursor:none;font-family:'Inter',sans-serif;transition:background .2s,transform .18s,box-shadow .25s; }
.cta-solid:hover { background:rgba(255,255,255,.88);transform:translateY(-2px);box-shadow:0 10px 35px rgba(255,255,255,.1); }
.cta-outline { display:inline-flex;align-items:center;gap:.45rem;background:transparent;color:var(--white);padding:.7rem 1.6rem;border-radius:6px;font-size:.78rem;font-weight:300;letter-spacing:.08em;border:1px solid rgba(255,255,255,.25);cursor:none;font-family:'Inter',sans-serif;text-decoration:none;transition:background .2s,border-color .2s; }
.cta-outline:hover { background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.5); }
.hero-scroll { position:absolute;bottom:2.5rem;right:3.5rem;z-index:3;display:flex;flex-direction:column;align-items:center;gap:.5rem;font-size:.6rem;color:var(--text2);letter-spacing:.14em;text-transform:uppercase;animation:pin .6s .6s both; }
.scroll-line { width:1px;height:40px;background:linear-gradient(to bottom,rgba(255,255,255,.22),transparent);animation:sl 2s ease infinite; }
@keyframes sl{0%,100%{opacity:.4;transform:scaleY(.6)}50%{opacity:1;transform:scaleY(1)}}

/* ── STATS ── */
.stats-row { display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--border); }
.stat-box { padding:1.8rem 3.5rem;border-right:1px solid var(--border);position:relative;overflow:hidden;cursor:default;transition:background .22s; }
.stat-box:hover { background:var(--surface); }
.stat-box:last-child { border-right:none; }
.stat-box::after { content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,var(--blue2),transparent);transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.34,1.56,.64,1); }
.stat-box:hover::after { transform:scaleX(1); }
.stat-n { font-family:'Inter',sans-serif;font-size:2.8rem;font-weight:100;line-height:1;color:var(--white);letter-spacing:-.02em;margin-bottom:.4rem; }
.stat-l { font-size:.6rem;color:var(--text3);font-weight:300;letter-spacing:.22em;text-transform:uppercase; }

/* ── CONTENT SECTION ── */
.section { padding:3rem 3.5rem;border-bottom:1px solid var(--border); }
.sec-hd { display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem; }
.sec-tag { font-size:.6rem;font-weight:300;color:var(--text2);letter-spacing:.28em;text-transform:uppercase;display:flex;align-items:center;gap:.6rem; }
.sec-ln { width:22px;height:1px;background:rgba(255,255,255,.2); }
.sec-more { font-size:.7rem;color:var(--text2);background:none;border:none;cursor:none;font-family:'Inter',sans-serif;font-weight:300;letter-spacing:.06em;display:flex;align-items:center;gap:.3rem;transition:color .2s,gap .2s; }
.sec-more:hover { color:var(--white);gap:.6rem; }

/* ── ARTICLES ── */
.arts { display:flex;flex-direction:column; }
.arow { display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1.5rem;padding:1.5rem 0;border-bottom:1px solid var(--border);cursor:none;position:relative;transition:padding-left .3s cubic-bezier(.34,1.56,.64,1); }
.arow::before { content:'';position:absolute;left:-3.5rem;top:50%;transform:translateY(-50%);width:2px;height:0;background:var(--white);transition:height .3s cubic-bezier(.34,1.56,.64,1);border-radius:1px; }
.arow:hover { padding-left:.7rem; }
.arow:hover::before { height:55%; }
.arow:last-child { border-bottom:none; }
.anum { font-family:'Cormorant Garamond',serif;font-size:.9rem;font-weight:400;color:var(--text3);min-width:26px; }
.abody { min-width:0; }
.atags { display:flex;gap:.4rem;margin-bottom:.5rem; }
.atag { font-size:.57rem;font-weight:700;padding:.12rem .48rem;border-radius:3px;text-transform:uppercase;letter-spacing:.08em; }
.t-ai{background:rgba(38,99,255,.12);color:#7da9ff}.t-ar{background:rgba(139,92,246,.12);color:#b4a1ff}
.t-es{background:rgba(20,184,166,.12);color:#4fd6c8}.t-dv{background:rgba(251,146,60,.12);color:#ffb07a}.t-ft{background:rgba(255,255,255,.06);color:rgba(255,255,255,.35)}
.atitle { font-family:'Inter',sans-serif;font-size:1rem;font-weight:300;color:var(--text);line-height:1.35;margin-bottom:.4rem;transition:color .2s;letter-spacing:.01em; }
.arow:hover .atitle { color:var(--white); }
.adesc { font-size:.74rem;color:var(--text2);line-height:1.7;font-weight:200;letter-spacing:.01em; }
.ameta { text-align:right;flex-shrink:0; }
.adate { font-size:.63rem;color:var(--text3);display:block;margin-bottom:.2rem; }
.aread { font-size:.6rem;color:var(--text3); }
.aarr { color:var(--text3);font-size:.8rem;transition:transform .2s,color .2s;margin-top:.4rem;display:block; }
.arow:hover .aarr { transform:translateX(5px);color:var(--white); }

/* ── READER ── */
.reader { padding:3.5rem 3.5rem;max-width:800px; }
.rback { display:inline-flex;align-items:center;gap:.45rem;font-size:.75rem;color:var(--text2);background:none;border:none;cursor:none;font-family:'DM Sans',sans-serif;margin-bottom:2.5rem;transition:color .2s,gap .2s;padding:0; }
.rback:hover { color:var(--white);gap:.7rem; }
.rtags { display:flex;gap:.35rem;margin-bottom:1.2rem; }
.rtitle { font-family:'Inter',sans-serif;font-size:clamp(1.8rem,4vw,3rem);font-weight:200;color:var(--white);line-height:1.05;letter-spacing:-.01em;margin-bottom:1rem; }
.rmeta { display:flex;align-items:center;gap:1rem;margin-bottom:3rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border); }
.rdate,.rmin { font-size:.68rem;color:var(--text3);font-weight:300;letter-spacing:.1em; }
.rsep { width:1px;height:10px;background:var(--border); }
.rbody { font-size:.9rem;color:var(--text2);line-height:2.1;font-weight:200;max-width:600px;letter-spacing:.015em; }
.rbody p { margin-bottom:1.5rem; }
.rbody h2 { font-family:'Inter',sans-serif;font-size:1.3rem;font-weight:300;color:var(--white);margin-bottom:.8rem;margin-top:2.5rem;line-height:1.2;letter-spacing:-.01em; }
.rbody h3 { font-family:'Inter',sans-serif;font-size:.88rem;font-weight:400;color:var(--text);margin-bottom:.6rem;margin-top:2rem;letter-spacing:.04em;text-transform:uppercase; }
.rbody strong { color:var(--text);font-weight:400; }
.rbody blockquote { border-left:1px solid rgba(255,255,255,.15);padding-left:1.5rem;margin:2rem 0;color:var(--text);font-family:'Inter',sans-serif;font-size:1rem;font-style:italic;font-weight:200;line-height:1.7;letter-spacing:.01em; }
.rfooter { margin-top:4rem;padding-top:2rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.8rem; }
.rfooter-t { font-size:.75rem;color:var(--text3); }
.rfooter-x { display:inline-flex;align-items:center;gap:.38rem;font-size:.75rem;color:var(--blue-hi);text-decoration:none;transition:color .2s; }
.rfooter-x:hover { color:var(--white); }

/* ── DASHBOARD ── */
.dash { padding:2.5rem 3.5rem;animation:pin .4s cubic-bezier(.23,1,.32,1) both; }
.pg-title { font-family:'Inter',sans-serif;font-size:2rem;font-weight:200;color:var(--white);margin-bottom:.3rem;line-height:1;letter-spacing:-.01em; }
.pg-sub { font-size:.7rem;color:var(--text2);margin-bottom:2rem;font-weight:200;letter-spacing:.1em; }

.kpi-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem;margin-bottom:1.8rem; }
.kpi { background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.3rem 1.5rem;position:relative;overflow:hidden;transition:border-color .22s,transform .2s; }
.kpi:hover { border-color:var(--border2);transform:translateY(-2px); }
.kpi::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;border-radius:8px 8px 0 0; }
.kpi.kblue::before{background:linear-gradient(90deg,var(--blue2),var(--blue-hi))}
.kpi.kgreen::before{background:linear-gradient(90deg,var(--green),#34d399)}
.kpi.korange::before{background:linear-gradient(90deg,var(--orange),#fb923c)}
.kpi.kpurple::before{background:linear-gradient(90deg,var(--purple),#c4b5fd)}
.kpi-lbl { font-size:.58rem;font-weight:300;color:var(--text3);letter-spacing:.18em;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem; }
.kpi-ico { font-size:.88rem; }
.kpi-val { font-family:'Inter',sans-serif;font-size:2.2rem;font-weight:200;color:var(--white);line-height:1;letter-spacing:-.02em;margin-bottom:.4rem; }
.kpi-chg { font-size:.64rem;font-weight:300;display:flex;align-items:center;gap:.3rem;letter-spacing:.04em; }
.kpi-chg.up { color:var(--green); }
.kpi-chg span { color:var(--text3);font-weight:200; }

.chart-card { background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.4rem 1.5rem;margin-bottom:.85rem;transition:border-color .22s; }
.chart-card:hover { border-color:var(--border2); }
.chart-hd { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.3rem; }
.chart-title { font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:500;color:var(--white); }
.cbadge { font-size:.58rem;font-weight:700;padding:.14rem .5rem;border-radius:3px;text-transform:uppercase;letter-spacing:.08em; }
.cbadge-b { background:rgba(38,99,255,.14);color:var(--blue-hi); }
.cbadge-g { background:rgba(34,211,165,.1);color:var(--green); }
.two-col { display:grid;grid-template-columns:1fr 1fr;gap:.85rem; }

.act-list { display:flex;flex-direction:column;gap:.55rem; }
.act-item { display:flex;align-items:center;gap:.85rem;padding:.65rem .9rem;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:7px;transition:border-color .2s; }
.act-item:hover { border-color:var(--border2); }
.act-ico { width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0;overflow:hidden;border:1px solid var(--border); }
.act-ico img { width:100%;height:100%;object-fit:cover;border-radius:50%; }
.act-badge { position:relative; }
.act-badge::after { content:'';position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;border:1.5px solid var(--bg);background:var(--green); }
.ico-v{background:rgba(38,99,255,.12);color:var(--blue-hi)}.ico-s{background:rgba(34,211,165,.1);color:var(--green)}
.ico-c{background:rgba(167,139,250,.1);color:var(--purple)}.ico-r{background:rgba(249,115,22,.1);color:var(--orange)}
.act-ev { font-size:.76rem;color:var(--text);font-weight:400; }
.act-time { font-size:.63rem;color:var(--text3);margin-top:.1rem; }

/* ── ANALYTICS ── */
.analytics { padding:2.5rem 3.5rem;animation:pin .4s cubic-bezier(.23,1,.32,1) both; }
.an-hd { display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem; }
.range-btns { display:flex;gap:.28rem; }
.rbtn { font-size:.66rem;font-weight:500;padding:.28rem .68rem;border-radius:5px;background:none;border:1px solid var(--border);color:var(--text2);cursor:none;font-family:'DM Sans',sans-serif;transition:all .2s; }
.rbtn.on,.rbtn:hover { background:rgba(38,99,255,.12);border-color:rgba(38,99,255,.3);color:var(--blue-hi); }
.an-kpis { display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.4rem; }
.an-kpi { background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.1rem 1.2rem;transition:border-color .2s,transform .2s; }
.an-kpi:hover { border-color:var(--border2);transform:translateY(-2px); }
.an-kpi-l { font-size:.58rem;font-weight:600;color:var(--text3);letter-spacing:.14em;text-transform:uppercase;margin-bottom:.55rem; }
.an-kpi-v { font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:500;color:var(--white);line-height:1;margin-bottom:.3rem; }
.an-kpi-d { font-size:.62rem;font-weight:600; }
.an-kpi-d.up { color:var(--green); }
.big-chart { background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.4rem 1.5rem;margin-bottom:.85rem;transition:border-color .2s; }
.big-chart:hover { border-color:var(--border2); }
.bc-hd { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.4rem; }
.bc-title { font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:500;color:var(--white); }
.bc-leg { display:flex;gap:.9rem; }
.leg-item { display:flex;align-items:center;gap:.32rem;font-size:.63rem;color:var(--text2); }
.leg-dot { width:6px;height:6px;border-radius:50%; }
.three-col { display:grid;grid-template-columns:1fr 1fr 1fr;gap:.85rem;margin-bottom:.85rem; }
.src-list { display:flex;flex-direction:column;gap:.6rem;margin-top:.8rem; }
.src-item { display:flex;align-items:center;gap:.7rem; }
.src-nm { font-size:.72rem;color:var(--text2);min-width:72px; }
.src-bw { flex:1;background:rgba(255,255,255,.04);border-radius:2px;height:3px;overflow:hidden; }
.src-b { height:3px;border-radius:2px;transition:width .6s; }
.src-p { font-size:.62rem;color:var(--text3);min-width:26px;text-align:right; }
.top-art-list { display:flex;flex-direction:column;gap:.5rem;margin-top:.8rem; }
.top-art-item { display:flex;align-items:center;gap:.65rem;padding:.5rem .65rem;background:rgba(255,255,255,.02);border-radius:5px;transition:background .18s; }
.top-art-item:hover { background:rgba(255,255,255,.045); }
.tar-rank { font-family:'Cormorant Garamond',serif;font-size:.78rem;color:var(--text3);min-width:18px; }
.tar-nm { flex:1;font-size:.72rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.tar-v { font-size:.65rem;color:var(--blue-hi);font-weight:600; }

/* ── ABOUT ── */
.about { padding:4rem 3.5rem; }
.abt-top { display:flex;align-items:center;gap:2rem;margin-bottom:3rem; }
.abt-wrap { position:relative;width:76px;height:76px;flex-shrink:0; }
.abt-logo { width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 0 18px rgba(26,79,255,.6));animation:fl 4s ease-in-out infinite; }
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.abt-ring { position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(255,255,255,.1);animation:sp 9s linear infinite; }
.abt-ring::before { content:'';position:absolute;top:-2px;left:50%;width:4px;height:4px;border-radius:50%;background:var(--blue-hi);transform:translateX(-50%); }
@keyframes sp{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.abt-name { font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:500;color:var(--white);line-height:1; }
.abt-name em { color:var(--blue-hi);font-style:italic; }
.abt-handle { font-size:.76rem;color:var(--text2);margin-top:.4rem; }
.abt-body { font-size:1rem;color:var(--text2);line-height:1.95;font-weight:300;max-width:520px;margin-bottom:3rem; }
.abt-body strong { color:var(--text);font-weight:500; }
.abt-body a { color:var(--blue-hi);text-decoration:none; }
.abt-body a:hover { text-decoration:underline; }
.stk-hd { font-size:.6rem;font-weight:600;color:var(--text3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:.9rem; }
.chips { display:flex;flex-wrap:wrap;gap:.5rem; }
.chip { font-size:.7rem;padding:.3rem .75rem;border-radius:5px;background:var(--surface);border:1px solid var(--border);color:var(--text2);transition:color .2s,border-color .2s; }
.chip:hover { color:var(--text);border-color:var(--border2); }

/* ══════════════════════════════
   FOOTER — like ACTO screenshot
══════════════════════════════ */
.footer {
  border-top:1px solid var(--border);
  background:rgba(5,7,14,0.95);
}
.footer-main {
  display:grid;
  grid-template-columns:1fr 1fr 1fr 1fr;
  gap:2rem;
  padding:3.5rem 3.5rem 2.5rem;
}
.footer-brand {}
.footer-logo {
  display:flex;align-items:center;gap:.6rem;
  font-family:'Inter',sans-serif;font-weight:200;font-size:1rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--white);margin-bottom:1rem;
  text-decoration:none;cursor:none;
}
.footer-logo-icon { width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(26,79,255,.5)); }
.footer-desc { font-size:.76rem;color:var(--text2);line-height:1.8;font-weight:200;letter-spacing:.02em;max-width:220px;margin-bottom:1.2rem; }
.footer-socials { display:flex;gap:.7rem; }
.footer-social-btn {
  width:30px;height:30px;border-radius:6px;
  border:1px solid var(--border);background:none;
  display:flex;align-items:center;justify-content:center;
  color:var(--text2);font-size:.85rem;cursor:none;
  transition:color .2s,border-color .2s,background .2s;
  text-decoration:none;
}
.footer-social-btn:hover { color:var(--white);border-color:var(--border2);background:var(--surface); }

.footer-col-title { font-family:'Inter',sans-serif;font-size:.6rem;font-weight:400;color:var(--text2);letter-spacing:.22em;text-transform:uppercase;margin-bottom:1.2rem; }
.footer-links { display:flex;flex-direction:column;gap:.65rem; }
.footer-link {
  font-family:'Inter',sans-serif;font-size:.8rem;font-weight:200;
  color:var(--text2);text-decoration:none;cursor:none;letter-spacing:.02em;
  transition:color .2s;width:fit-content;
}
.footer-link:hover { color:var(--white); }
.footer-link.btn-style {
  background:none;border:none;font-family:'Inter',sans-serif;
  padding:0;text-align:left;
}

.footer-bottom {
  border-top:1px solid var(--border);
  padding:1.4rem 3.5rem;
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:.8rem;
}
.footer-copy { font-family:'Inter',sans-serif;font-size:.7rem;font-weight:200;color:var(--text3);letter-spacing:.04em; }
.footer-ca { font-size:.66rem;color:var(--text3);font-family:'Inter',monospace;font-weight:200;margin-top:.18rem;letter-spacing:.04em; }
.footer-ca span { color:var(--text2); }
.footer-legal { display:flex;gap:1.4rem; }
.footer-legal a { font-family:'Inter',sans-serif;font-size:.7rem;font-weight:200;color:var(--text3);text-decoration:none;cursor:none;letter-spacing:.04em;transition:color .2s; }
.footer-legal a:hover { color:var(--text2); }

/* ══════════════════════════════
   FLOATING CHAT
══════════════════════════════ */
.chat-fab {
  position:fixed;bottom:1.25rem;right:1.25rem;z-index:500;
  width:56px;height:56px;border-radius:50%;
  background:rgba(8,9,26,0.95);
  border:1px solid rgba(77,133,255,0.3);
  cursor:none;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 32px rgba(0,0,0,0.5), 0 0 0 0 rgba(26,79,255,0.3);
  transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .28s,border-color .22s;
  animation:fabIn .5s .4s cubic-bezier(.34,1.56,.64,1) both;
  backdrop-filter:blur(12px);
}
@media(max-width:768px){
  .chat-fab{bottom:1rem;right:1rem;width:52px;height:52px;}
}
.chat-fab:hover {
  transform:translateY(-3px) scale(1.08);
  box-shadow:0 16px 44px rgba(0,0,0,0.55), 0 0 0 8px rgba(26,79,255,0.1);
  border-color:rgba(77,133,255,0.6);
}
.chat-fab:active { transform:scale(.95); }
@keyframes fabIn{from{opacity:0;transform:scale(0) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.chat-fab-img { width:28px;height:28px;object-fit:contain;transition:opacity .2s; }
.chat-fab:hover .chat-fab-img { opacity:.85; }
.chat-fab-close { font-size:.82rem;color:var(--text2);font-weight:300;letter-spacing:.02em; }
.chat-fab-badge {
  position:absolute;top:1px;right:1px;
  width:12px;height:12px;border-radius:50%;
  background:var(--green);border:2px solid var(--bg);
  animation:bdg 2.5s infinite;
}
@keyframes bdg{0%,100%{box-shadow:0 0 0 0 rgba(34,211,165,.5)}60%{box-shadow:0 0 0 5px rgba(34,211,165,0)}}

/* CHAT POPUP */
.chat-popup {
  position:fixed;bottom:6rem;right:2rem;z-index:500;
  width:360px;height:520px;
  background:rgba(8,9,26,0.97);
  border:1px solid var(--border);
  border-radius:16px;
  display:flex;flex-direction:column;
  box-shadow:0 24px 64px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,.04);
  backdrop-filter:blur(20px);
  overflow:hidden;
  transform-origin:bottom right;
  animation:popIn .3s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes popIn{from{opacity:0;transform:scale(0.85) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
.chat-popup.closing { animation:popOut .22s ease both; }
@keyframes popOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.85) translateY(10px)}}

.cp-head {
  padding:.9rem 1.2rem;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  flex-shrink:0;
  background:rgba(255,255,255,.025);
}
.cp-id { display:flex;align-items:center;gap:.65rem; }
.cp-ava {
  width:32px;height:32px;border-radius:50%;
  border:1px solid var(--border);
  background:radial-gradient(circle at 40% 40%,rgba(26,79,255,.3),var(--bg2));
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.cp-avi { width:26px;height:26px;object-fit:contain;filter:drop-shadow(0 0 5px rgba(26,79,255,.6)); }
.cp-name { font-family:'Inter',sans-serif;font-size:.85rem;font-weight:300;color:var(--white);letter-spacing:.06em; }
.cp-status { font-size:.58rem;color:var(--green);letter-spacing:.08em;display:flex;align-items:center;gap:.32rem; }
.cp-sdot { width:4px;height:4px;border-radius:50%;background:var(--green);animation:bdg 2s infinite; }
.cp-actions { display:flex;gap:.4rem; }
.cp-btn { width:26px;height:26px;border-radius:6px;background:none;border:1px solid var(--border);color:var(--text2);cursor:none;font-size:.75rem;display:flex;align-items:center;justify-content:center;transition:all .18s; }
.cp-btn:hover { color:var(--white);border-color:var(--border2);background:var(--surface); }

.cp-msgs { flex:1;overflow-y:auto;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.8rem; }
.bub { max-width:88%;font-size:.8rem;line-height:1.75;animation:bi .22s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes bi{from{opacity:0;transform:scale(.88) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.bub.u { align-self:flex-end;background:var(--blue2);color:white;padding:.6rem .9rem;border-radius:13px 13px 3px 13px;box-shadow:0 4px 14px rgba(26,79,255,.22);border:none;outline:none; }
.bub.a { align-self:flex-start;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:.6rem .9rem;border-radius:3px 13px 13px 13px; }
.blbl { font-size:.56rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.28rem;color:var(--blue-hi); }
.typdots { display:flex;gap:4px;padding:.28rem 0;align-items:center; }
.typdots span { width:4px;height:4px;border-radius:50%;background:var(--text2);animation:ty 1.1s ease infinite; }
.typdots span:nth-child(2){animation-delay:.15s}.typdots span:nth-child(3){animation-delay:.3s}
@keyframes ty{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-5px);opacity:1}}

.cp-suggs { padding:0 1rem .55rem;display:flex;flex-wrap:wrap;gap:.35rem;flex-shrink:0; }
.sug { font-size:.63rem;padding:.24rem .6rem;border-radius:20px;background:none;border:1px solid var(--border);color:var(--text2);cursor:none;font-family:'Inter',sans-serif;font-weight:300;letter-spacing:.04em;transition:all .18s; }
.sug:hover { color:var(--white);border-color:var(--border2);background:var(--surface); }

.cp-form { padding:.7rem 1rem;border-top:1px solid var(--border);display:flex;gap:.45rem;align-items:flex-end;flex-shrink:0; }
.cp-inp { flex:1;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--text);padding:.6rem .8rem;border-radius:8px;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:300;resize:none;outline:none;line-height:1.5;max-height:80px;transition:border-color .22s,background .22s; }
.cp-inp:focus { border-color:rgba(26,79,255,.4);background:rgba(26,79,255,.04); }
.cp-inp::placeholder { color:var(--text3); }
.cp-send { background:var(--blue2);color:white;border:none;border-radius:8px;padding:.6rem .95rem;cursor:none;font-weight:400;font-size:.72rem;font-family:'Inter',sans-serif;letter-spacing:.06em;transition:background .18s,transform .14s;white-space:nowrap; }
.cp-send:hover:not(:disabled) { background:var(--blue-hi); }
.cp-send:active { transform:scale(.96); }
.cp-send:disabled { opacity:.32;cursor:not-allowed; }

/* TOOLTIP */
.tt { background:#0c0e1f;border:1px solid var(--border);border-radius:7px;padding:.52rem .78rem;font-family:'Inter',sans-serif; }
.tt-lbl { font-size:.6rem;color:var(--text3);font-weight:300;letter-spacing:.08em;margin-bottom:.26rem; }
.tt-val { font-size:.78rem;color:var(--white);font-weight:400; }

@media(max-width:900px){
  .nav { padding:0 1.4rem; }
  .hero-content { padding:0 1.8rem; }
  .section,.reader,.dash,.analytics,.about,.footer-main { padding-left:1.5rem;padding-right:1.5rem; }
  .stats-row .stat-box { padding-left:1.5rem;padding-right:1.5rem; }
  .footer-main { grid-template-columns:1fr 1fr; }
  .footer-bottom { padding-left:1.5rem;padding-right:1.5rem; }
  .an-kpis,.kpi-grid { grid-template-columns:repeat(2,1fr); }
  .three-col { grid-template-columns:1fr; }
  .chat-popup { width:calc(100vw - 2.5rem);right:1.25rem;bottom:5.5rem; }
}
@media(max-width:600px){
  html,body { overflow-x:hidden;width:100%; }
  .app { overflow-x:hidden; }
  #cr,#crr { display:none; }
  body { cursor:auto; }
  .nav { padding:0 1rem;height:54px; }
  .nav-links { gap:0; }
  .nav-item { padding:.32rem .5rem;font-size:.68rem; }
  .hero { min-height:75vh;padding-bottom:3rem; }
  .hero-content { padding:0 1.2rem;max-width:100%; }
  .hero-h1 { font-size:clamp(2.4rem,10vw,3.5rem); }
  .hero-bottom { flex-direction:column;align-items:flex-start;gap:1rem; }
  .hero-desc { max-width:100%;font-size:.82rem; }
  .hero-ctas { flex-wrap:wrap;gap:.6rem;width:100%; }
  .cta-solid,.cta-outline { flex:1;justify-content:center;min-width:130px; }
  .hero-scroll { display:none; }
  .stats-row { grid-template-columns:1fr; }
  .stat-box { border-right:none;border-bottom:1px solid var(--border);padding:1.4rem 1.2rem; }
  .stat-box:last-child { border-bottom:none; }
  .section,.reader,.dash,.analytics,.about { padding-left:1.2rem;padding-right:1.2rem; }
  .arow { flex-direction:column;gap:.5rem;padding:1.2rem 1rem; }
  .ameta { flex-direction:row;gap:1rem; }
  .anum { display:none; }
  .footer-main { grid-template-columns:1fr;padding:2rem 1.2rem;gap:2rem; }
  .footer-bottom { flex-direction:column;gap:.8rem;padding:1rem 1.2rem; }
  .an-kpis,.kpi-grid { grid-template-columns:1fr 1fr; }
  .chat-fab { bottom:.85rem;right:.85rem;width:50px;height:50px;cursor:auto; }
  .chat-popup { position:fixed;bottom:0;left:0;right:0;width:100%;height:75vh;border-radius:20px 20px 0 0;border-bottom:none; }
  .sug,.cp-btn,.cp-send,.nav-item,.nav-logo,.cta-solid,.cta-outline { cursor:auto; }
}
`;

// Articles now fetched from Convex
const ACT_ICONS = {visit:"👁",share:"↗",chat:"💬",read:"📖",follow:"✦",view:"📊"};
const ACT_CLS   = {visit:"ico-v",share:"ico-s",chat:"ico-c",read:"ico-r",follow:"ico-s",view:"ico-v"};
const SUGGESTIONS = ["What is Noelclaw?","Latest article?","How does this work?","Tech stack?"];
const SYS = `You are Noel, the AI assistant embedded in Noelclaw — a personal AI operating system and blog. The site documents building composable AI agents, architecture decisions, and the journey of thinking with AI. Creator's X: @noelclawfun. Be sharp, warm, concise — max 3-4 sentences. Confident, slightly witty. Never generic.`;
const INIT = [{ r:"a", t:"Hey — I'm Noel 🦕. Ask me anything about this site or AI systems." }];

const TT = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return <div className="tt"><div className="tt-lbl">{label}</div>{payload.map((p,i)=><div key={i} className="tt-val" style={{color:p.color}}>{p.name}: {p.value?.toLocaleString()}</div>)}</div>;
};

function renderBody(body){
  return body.map((b,i)=>{
    if(b.type==="h2") return <h2 key={i}>{b.text}</h2>;
    if(b.type==="h3") return <h3 key={i}>{b.text}</h3>;
    if(b.type==="bq") return <blockquote key={i}>{b.text}</blockquote>;
    return <p key={i}>{b.text}</p>;
  });
}

function ARow({a,onClick}){
  return(
    <div className="arow" onClick={onClick}>
      <div className="anum">{a.n}</div>
      <div className="abody">
        <div className="atags">{a.tags.map(t=><span key={t.k} className={`atag ${t.c}`}>{t.k}</span>)}</div>
        <div className="atitle">{a.title}</div>
        <div className="adesc">{a.desc}</div>
      </div>
      <div className="ameta">
        <span className="adate">{a.date}</span>
        <span className="aread">{a.read} read</span>
        <span className="aarr">→</span>
      </div>
    </div>
  );
}

export default function App(){
  const [page,setPage]     = useState("home");
  const [art,setArt]       = useState(null);
  const [chatOpen,setChatOpen] = useState(false);
  const [msgs,setMsgs]     = useState(INIT);
  const [val,setVal]       = useState("");
  const [busy,setBusy]     = useState(false);
  const [range,setRange]   = useState("7d");
  const [menuOpen,setMenuOpen] = useState(false);
  const convexArticles = useQuery(api.articles.list);
  const sendMessage = useAction(api.chat.chat);
  const postToMoltbook = useAction(api.moltbook.postArticle);
  const getTokenPrice = useAction(api.bankr.getTokenPrice);
  const [tokenData, setTokenData] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  const fetchTokenPrice = async () => {
    setTokenLoading(true);
    try {
      const res = await getTokenPrice({});
      setTokenData(res);
    } catch(e) {
      setTokenData("Error: " + e.message);
    }
    setTokenLoading(false);
  };
  const [moltPosting, setMoltPosting] = useState(false);
  const [moltStatus, setMoltStatus] = useState("");

  const handleMoltPost = async () => {
    if (!art) return;
    setMoltPosting(true);
    setMoltStatus("");
    try {
      await postToMoltbook({
        title: art.title,
        url: `https://noelclaw.fun`,
        description: art.desc || "",
      });
      setMoltStatus("Posted to Moltbook! 🦞");
    } catch(e) {
      setMoltStatus("Failed: " + e.message);
    }
    setMoltPosting(false);
  };
  const ARTICLES = convexArticles ?? [];
  const articlesLoading = convexArticles === undefined;
  const endRef=useRef(null), crRef=useRef(null), crrRef=useRef(null);

  useEffect(()=>{
    const mv=e=>{
      if(crRef.current){crRef.current.style.left=e.clientX+"px";crRef.current.style.top=e.clientY+"px";}
      if(crrRef.current){crrRef.current.style.left=e.clientX+"px";crrRef.current.style.top=e.clientY+"px";}
    };
    window.addEventListener("mousemove",mv);
    return()=>window.removeEventListener("mousemove",mv);
  },[]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,busy]);

  const navTo=p=>{setPage(p);setArt(null);window.scrollTo({top:0,behavior:"instant"});setMenuOpen(false);if(p==="dashboard")fetchTokenPrice();};
  useEffect(()=>{
    const handler=()=>{ if(menuOpen) setMenuOpen(false); };
    window.addEventListener('scroll',handler,{passive:true});
    return()=>window.removeEventListener('scroll',handler);
  },[menuOpen]);

  const send=useCallback(async(text)=>{
    const q=text??val.trim();
    if(!q||busy)return;
    setVal("");
    const next=[...msgs,{r:"u",t:q}];
    setMsgs(next);setBusy(true);
    try{
      const h=next.map(m=>({role:m.r==="a"?"assistant":"user",content:m.t}));
      const reply=await sendMessage({messages:h});
      setMsgs(p=>[...p,{r:"a",t:reply}]);
    }catch{setMsgs(p=>[...p,{r:"a",t:"Can't connect right now. Try again?"}]);}
    finally{setBusy(false);}
  },[msgs,val,busy]);

  return(
    <>
      <style>{CSS}</style>
      <div id="cr" ref={crRef}/><div id="crr" ref={crrRef}/>
      <div className="grain"/>

      <div className="app">

        {/* ── NAV ── */}
        <div style={{width:"100%",background:"#03050c",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:".35rem 0",display:"flex",alignItems:"center",overflow:"hidden",position:"sticky",top:0,zIndex:201}}>
          <div style={{display:"flex",alignItems:"center",gap:"1.8rem",animation:"ca-scroll 28s linear infinite",whiteSpace:"nowrap",willChange:"transform",fontSize:".75rem",letterSpacing:".07em",color:"rgba(180,190,220,0.8)"}}>
            {[0,1].map(i=>(
              <span key={i} style={{display:"flex",alignItems:"center",gap:"1.8rem"}}>
                <span style={{color:"#4d85ff",fontWeight:600,letterSpacing:".14em"}}>$NOELCLAW</span>
                <span style={{width:3,height:3,borderRadius:"50%",background:"#4d85ff",display:"inline-block",opacity:.7,flexShrink:0}}/>
                <span style={{fontFamily:"monospace",cursor:"pointer"}} onClick={()=>navigator.clipboard.writeText("0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3")} title="Copy CA">
                  CA: 0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3
                </span>
                <span style={{opacity:.4}}>·</span>
                <a href="https://takeover.fun/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" style={{color:"#22d3a5",textDecoration:"none"}}>Mint Tiles ↗</a>
                <span style={{opacity:.4}}>·</span>
                <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer" style={{color:"rgba(180,190,220,0.7)",textDecoration:"none"}}>@noelclawfun</a>
                <span style={{opacity:.4}}>·</span>
              </span>
            ))}
          </div>
        </div>
        <nav className="nav">
          <div className="nav-logo" onClick={()=>{navTo("home");setMenuOpen(false);}}>
            <span><span className="logo-n">Noel</span>Claw</span>
          </div>
          <div className="nav-right">
            <div className="nav-links">
              {["home","articles","dashboard","analytics","about"].map(p=>(
                <button key={p} className={`nav-item${page===p&&!art?" active":""}`} onClick={()=>navTo(p)}>
                  {p[0].toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
<button className="nav-burger" onClick={()=>setMenuOpen(o=>!o)}>
              <span/><span/><span/>
            </button>
          </div>
        </nav>
        {menuOpen&&(
          <div className="mob-menu">
            {["home","articles","dashboard","analytics","about"].map(p=>(
              <button key={p} className={`mob-item${page===p&&!art?" active":""}`} onClick={()=>{navTo(p);setMenuOpen(false);}}>
                {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="main">

          {/* READER */}
          {art&&(
            <div className="reader">
              <button className="rback" onClick={()=>setArt(null)}>← Back</button>
              <div className="rtags">{art.tags.map(t=><span key={t.k} className={`atag ${t.c}`}>{t.k}</span>)}</div>
              <h1 className="rtitle">{art.title}</h1>
              <div className="rmeta">
                <span className="rdate">{art.date}</span><div className="rsep"/>
                <span className="rmin">{art.read} read</span>
              </div>
              <div className="rbody">{renderBody(art.body)}</div>
              <div className="rfooter">
                <span className="rfooter-t">Thanks for reading — NoelClaw</span>
                <div style={{display:"flex",alignItems:"center",gap:".8rem",flexWrap:"wrap"}}>
                  {moltStatus && <span style={{fontSize:".72rem",color:"var(--green)"}}>{moltStatus}</span>}
                  <button onClick={handleMoltPost} disabled={moltPosting} style={{
                    display:"inline-flex",alignItems:"center",gap:".4rem",
                    background:"none",border:"1px solid var(--border)",borderRadius:"6px",
                    padding:".4rem .9rem",fontSize:".72rem",color:"var(--text2)",
                    cursor:"pointer",transition:"all .2s",fontFamily:"inherit",
                  }}
                  onMouseEnter={e=>{e.target.style.borderColor="var(--border2)";e.target.style.color="var(--white)";}}
                  onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--text2)";}}>
                    {moltPosting ? "Posting..." : "🦞 Post to Moltbook"}
                  </button>
                  <a className="rfooter-x" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">𝕏 @noelclawfun →</a>
                </div>
              </div>
            </div>
          )}

          {/* HOME */}
          {!art&&page==="home"&&(
            <div className="page">
              <section className="hero">
                <div className="hero-bg"/>
                <div className="hero-curve-left"/>
                
                <div className="hero-vignette"/>
                <div className="hero-content">
                  <div className="hero-eyebrow">NoelClaw</div>
                  <h1 className="hero-h1">
                    New systems<br/>
                    call for <em>new</em><br/>
                    thinking.
                  </h1>
                  <div className="hero-bottom">
                    <p className="hero-desc">A personal AI operating system. Building composable agents, documenting every decision, shipping in public.</p>
                    <div className="hero-ctas">
                      <button className="cta-solid" onClick={()=>navTo("articles")}>Read Articles ↗</button>
                      <a className="cta-outline" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">𝕏 Follow</a>
                      <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" className="cta-outline" style={{boxShadow:"0 0 20px rgba(26,79,255,.2)"}}>
                        Buy $NOELCLAW ↗
                      </a>
                    </div>
                  </div>
                </div>
                <div className="hero-scroll"><span>Scroll</span><div className="scroll-line"/></div>
              </section>

              <div className="stats-row">
                {[["12+","Articles Published"],["3","AI Systems Built"],["Live","Deployment Status"]].map(([n,l])=>(
                  <div className="stat-box" key={l}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
                ))}
              </div>

              <div className="section">
                <div className="sec-hd">
                  <div className="sec-tag"><span className="sec-ln"/>Latest Writing</div>
                  <button className="sec-more" onClick={()=>navTo("articles")}>All articles →</button>
                </div>
                <div className="arts">
                  {ARTICLES.slice(0,4).map((a,i)=><ARow key={i} a={a} onClick={()=>{setArt(a);window.scrollTo({top:0,behavior:'instant'});}}/>)}
                </div>
              </div>
            </div>
          )}

          {/* ARTICLES */}
          {!art&&page==="articles"&&(
            <div className="page">
              <div className="section">
                <div className="sec-hd"><div className="sec-tag"><span className="sec-ln"/>All Articles</div></div>
                {articlesLoading
                  ? <div style={{color:"var(--text2)",fontSize:".85rem",padding:"2rem 0",letterSpacing:".08em"}}>Loading articles…</div>
                  : ARTICLES.length===0
                    ? <div style={{color:"var(--text2)",fontSize:".85rem",padding:"2rem 0",letterSpacing:".08em"}}>No articles published yet.</div>
                    : <div className="arts">{ARTICLES.map((a,i)=><ARow key={i} a={a} onClick={()=>{setArt(a);window.scrollTo({top:0,behavior:'instant'});}}/>)}</div>
                }
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {!art&&page==="dashboard"&&(
            <div className="dash">
              <div className="pg-title">Dashboard</div>
              <div className="pg-sub">Overview · last 7 days</div>
              <div className="kpi-grid">
                <div className="kpi kblue"><div className="kpi-lbl">Total Visitors<span className="kpi-ico">👁</span></div><div className="kpi-val">4.2K</div><div className="kpi-chg up">↑ +38% <span>vs last week</span></div></div>
                <div className="kpi kgreen"><div className="kpi-lbl">Article Reads<span className="kpi-ico">📖</span></div><div className="kpi-val">2.8K</div><div className="kpi-chg up">↑ +22% <span>vs last week</span></div></div>
                <div className="kpi korange"><div className="kpi-lbl">Chat Sessions<span className="kpi-ico">💬</span></div><div className="kpi-val">184</div><div className="kpi-chg up">↑ +29% <span>vs last week</span></div></div>
                <div className="kpi kpurple"><div className="kpi-lbl">X Followers<span className="kpi-ico">✦</span></div><div className="kpi-val">50</div><div className="kpi-chg up">↑ +63 <span>this week</span></div></div>
              </div>

              {/* $NOELCLAW Price Widget */}
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1.2rem 1.5rem",marginBottom:"1.5rem"}}>
                {/* Top row: logo + name */}
                <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:".9rem"}}>
                  <img src="/logo.png" alt="NOELCLAW" style={{width:"32px",height:"32px",borderRadius:"50%",objectFit:"cover"}}/>
                  <div>
                    <div style={{fontSize:".8rem",fontWeight:600,color:"var(--white)"}}>$NOELCLAW</div>
                    <div style={{fontSize:".65rem",color:"var(--text3)"}}>Base Chain · DexScreener</div>
                  </div>
                </div>
                {/* Price + change */}
                {tokenData && !tokenLoading && typeof tokenData === "object" && tokenData.price && (
                  <>
                    <div style={{display:"flex",alignItems:"baseline",gap:".5rem",marginBottom:".8rem"}}>
                      <div style={{fontSize:"1.4rem",fontWeight:700,color:"var(--white)",fontFamily:"'DM Mono',monospace"}}>${parseFloat(tokenData.price||0).toFixed(8)}</div>
                      <div style={{fontSize:".75rem",fontWeight:600,color:parseFloat(tokenData.priceChange24h||0)>=0?"#22d3a5":"#ff4d4d"}}>
                        {parseFloat(tokenData.priceChange24h||0)>=0?"▲":"▼"} {Math.abs(parseFloat(tokenData.priceChange24h||0)).toFixed(2)}% 24h
                      </div>
                    </div>
                    {/* Stats grid 2x2 */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:".5rem",marginBottom:".8rem"}}>
                      {[
                        {label:"VOL 24H", val:"$"+parseFloat(tokenData.volume24h||0).toLocaleString()},
                        {label:"LIQUIDITY", val:"$"+parseFloat(tokenData.liquidity||0).toLocaleString()},
                        {label:"MKT CAP", val:"$"+parseFloat(tokenData.marketCap||0).toLocaleString()},
                        {label:"FDV", val:"$"+parseFloat(tokenData.marketCap||0).toLocaleString()},
                      ].map(({label,val})=>(
                        <div key={label} style={{background:"#0d1117",borderRadius:"8px",padding:".5rem .7rem"}}>
                          <div style={{fontSize:".6rem",color:"var(--text3)",letterSpacing:".06em",marginBottom:".2rem"}}>{label}</div>
                          <div style={{fontSize:".78rem",fontWeight:600,color:"var(--white)",fontFamily:"'DM Mono',monospace"}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {tokenLoading && <div style={{fontSize:".75rem",color:"var(--text2)",marginBottom:".8rem"}}>Fetching live data...</div>}
                {!tokenData && !tokenLoading && <div style={{fontSize:".72rem",color:"var(--text3)",marginBottom:".8rem"}}>Click refresh to load price</div>}
                {/* Refresh button centered below */}
                <div style={{display:"flex",justifyContent:"center",marginTop:".2rem"}}>
                  <button onClick={fetchTokenPrice} disabled={tokenLoading} style={{
                    background:"#0d1117",border:"1px solid var(--border)",borderRadius:"8px",
                    padding:".4rem .8rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".4rem",
                    opacity:tokenLoading?.5:1,transition:"opacity .2s",
                  }}>
                    <img src="/refresh.png" alt="Refresh" style={{width:"14px",height:"14px",objectFit:"contain",filter:"invert(1)",opacity:.8,animation:tokenLoading?"spin 1s linear infinite":"none"}}/>
                    <span style={{fontSize:".7rem",color:"var(--text2)",fontFamily:"inherit"}}>{tokenLoading?"Loading...":"Refresh"}</span>
                  </button>
                </div>
              </div>

              {/* DexScreener Chart */}
              <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"12px",marginBottom:"1.5rem",overflow:"hidden"}}>
                <div style={{padding:".8rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:".78rem",fontWeight:600,color:"var(--white)"}}>$NOELCLAW Chart</div>
                  <a href="https://dexscreener.com/base/0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7" target="_blank" rel="noopener noreferrer" style={{fontSize:".68rem",color:"var(--blue-hi)",textDecoration:"none"}}>DexScreener ↗</a>
                </div>
                <iframe
                  src="https://dexscreener.com/base/0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7?embed=1&theme=dark&trades=0&info=0"
                  style={{width:"100%",height:"400px",border:"none"}}
                  title="NOELCLAW Chart"
                />
              </div>

              <div className="two-col">
                <div className="chart-card" style={{margin:0}}>
                  <div className="chart-hd"><div className="chart-title">Visitors · 9 Days</div><span className="cbadge cbadge-b">Live</span></div>
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={visitData} margin={{top:4,right:4,bottom:0,left:-20}}>
                      <defs>
                        <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a4fff" stopOpacity={0.22}/><stop offset="95%" stopColor="#1a4fff" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3a5" stopOpacity={0.16}/><stop offset="95%" stopColor="#22d3a5" stopOpacity={0}/></linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{fontSize:9,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:9,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<TT/>}/>
                      <Area type="monotone" dataKey="v" name="Visits" stroke="#4d85ff" strokeWidth={1.8} fill="url(#gb)" dot={false}/>
                      <Area type="monotone" dataKey="u" name="Unique" stroke="#22d3a5" strokeWidth={1.4} fill="url(#gg)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card" style={{margin:0}}>
                  <div className="chart-hd"><div className="chart-title">Top Articles</div><span className="cbadge cbadge-g">Month</span></div>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={articleViews} layout="vertical" margin={{top:0,right:4,bottom:0,left:0}}>
                      <XAxis type="number" tick={{fontSize:9,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:"#6b78a8"}} axisLine={false} tickLine={false} width={82}/>
                      <Tooltip content={<TT/>}/>
                      <Bar dataKey="views" name="Views" fill="#1a4fff" radius={[0,4,4,0]} opacity={0.8}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-hd"><div className="chart-title">Recent Activity</div></div>
                <div className="act-list">
                  {recentActivity.map((a,i)=>(
                    <div className="act-item" key={i}>
                      <div className="act-ico act-badge">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.name}&backgroundColor=1a1a2e,16213e,0f3460,533483`}
                          alt={a.name}
                        />
                      </div>
                      <div style={{flex:1}}>
                        <div className="act-ev">{a.event}</div>
                        <div className="act-time">{a.name} · {a.time}</div>
                      </div>
                      <div style={{fontSize:".7rem",color:"var(--text3)"}}>{ACT_ICONS[a.type]||"·"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {!art&&page==="analytics"&&(
            <div className="analytics">
              <div className="an-hd">
                <div><div className="pg-title">Analytics</div><div className="pg-sub">Traffic, content performance & audience</div></div>
                <div className="range-btns">{["7d","30d","90d"].map(r=><button key={r} className={`rbtn${range===r?" on":""}`} onClick={()=>setRange(r)}>{r}</button>)}</div>
              </div>
              <div className="an-kpis">
                {[{l:"Page Views",v:"4.2K",d:"↑ +38%"},{l:"Unique Users",v:"2.6K",d:"↑ +31%"},{l:"Avg. Session",v:"3m 48s",d:"↑ +12%"},{l:"Bounce Rate",v:"44%",d:"↓ -3%"}].map((k,i)=>(
                  <div className="an-kpi" key={i}><div className="an-kpi-l">{k.l}</div><div className="an-kpi-v">{k.v}</div><div className="an-kpi-d up">{k.d} vs prev.</div></div>
                ))}
              </div>
              <div className="big-chart">
                <div className="bc-hd">
                  <div className="bc-title">Traffic Over Time</div>
                  <div className="bc-leg">
                    <div className="leg-item"><div className="leg-dot" style={{background:"#4d85ff"}}/> Views</div>
                    <div className="leg-item"><div className="leg-dot" style={{background:"#22d3a5"}}/> Users</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={visitData} margin={{top:4,right:4,bottom:0,left:-20}}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a4fff" stopOpacity={0.2}/><stop offset="95%" stopColor="#1a4fff" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3a5" stopOpacity={0.14}/><stop offset="95%" stopColor="#22d3a5" stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{fontSize:9,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:9,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<TT/>}/>
                    <Area type="monotone" dataKey="v" name="Views" stroke="#4d85ff" strokeWidth={2} fill="url(#g1)" dot={false}/>
                    <Area type="monotone" dataKey="u" name="Users" stroke="#22d3a5" strokeWidth={1.6} fill="url(#g2)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="three-col">
                <div className="chart-card" style={{margin:0}}>
                  <div className="chart-hd"><div className="chart-title">Traffic Sources</div></div>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart><Pie data={trafficSources} cx="50%" cy="50%" innerRadius={30} outerRadius={46} paddingAngle={3} dataKey="value">
                      {trafficSources.map((s,i)=><Cell key={i} fill={s.color}/>)}
                    </Pie><Tooltip content={<TT/>}/></PieChart>
                  </ResponsiveContainer>
                  <div className="src-list">
                    {trafficSources.map((s,i)=>(
                      <div className="src-item" key={i}>
                        <span className="src-nm">{s.name}</span>
                        <div className="src-bw"><div className="src-b" style={{width:s.value+"%",background:s.color}}/></div>
                        <span className="src-p">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-card" style={{margin:0}}>
                  <div className="chart-hd"><div className="chart-title">Top Articles</div></div>
                  <div className="top-art-list">
                    {articleViews.map((a,i)=>(
                      <div className="top-art-item" key={i}>
                        <span className="tar-rank">0{i+1}</span>
                        <span className="tar-nm">{a.name}</span>
                        <span className="tar-v">{a.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-card" style={{margin:0}}>
                  <div className="chart-hd"><div className="chart-title">Engagement</div></div>
                  <div style={{display:"flex",flexDirection:"column",gap:".75rem",marginTop:".5rem"}}>
                    {[{l:"Avg. Read Time",v:"3m 48s",p:72,c:"#4d85ff"},{l:"Articles Completed",v:"68%",p:68,c:"#22d3a5"},{l:"Chat Engagement",v:"41%",p:41,c:"#a78bfa"},{l:"Return Visitors",v:"54%",p:54,c:"#f97316"}].map((e,i)=>(
                      <div key={i}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:".28rem"}}>
                          <span style={{fontSize:".66rem",color:"var(--text2)"}}>{e.l}</span>
                          <span style={{fontSize:".66rem",color:"var(--white)",fontWeight:600}}>{e.v}</span>
                        </div>
                        <div style={{background:"rgba(255,255,255,.04)",borderRadius:2,height:3,overflow:"hidden"}}>
                          <div style={{width:e.p+"%",height:3,background:e.c,borderRadius:2}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {!art&&page==="about"&&(
            <div className="page">
              <div className="about">
                <div className="abt-top">
                  <div className="abt-wrap">
                    <img src={LOGO} className="abt-logo" alt="NoelClaw"/>
                    <div className="abt-ring"/>
                  </div>
                  <div>
                    <div className="abt-name"><em>Noel</em>Claw</div>
                    <div className="abt-handle">@noelclawfun · Personal AI OS</div>
                  </div>
                </div>
                <p className="abt-body">
                  <strong>NoelClaw</strong> is a personal AI operating system — a space where building, thinking, and documenting happen in public.<br/><br/>
                  Every architecture decision gets logged. Every experiment gets written about. The AI you can chat with on this site? <strong>Part of what's being built here.</strong><br/><br/>
                  Follow the journey on <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">𝕏 @noelclawfun</a>.
                </p>
                <div className="stk-hd">Stack</div>
                <div className="chips">
                  {["Next.js","TypeScript","Turborepo","Claude API","MDX","Vercel","Tailwind CSS","pnpm","Bun"].map(s=>(
                    <span className="chip" key={s}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ══════════════════════════════
            FOOTER — ACTO style
        ══════════════════════════════ */}
        <footer className="footer">
          <div className="footer-main">
            {/* Brand col */}
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={LOGO} className="footer-logo-icon" alt=""/>
                <span><span style={{color:"var(--blue-hi)"}}>Noel</span>Claw</span>
              </div>
              <p className="footer-desc">Personal AI operating system — blog, architecture decisions, and the journey from zero to a composable agent system.</p>
              <div className="footer-socials">
                <a className="footer-social-btn" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer" title="X / Twitter">
                  <img src="/x-logo.jpg" alt="X" style={{width:"14px",height:"14px",objectFit:"contain",filter:"invert(1)",opacity:.8}}/>
                </a>
                <a className="footer-social-btn" href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" title="GitHub">
                  <img src="/github-logo.png" alt="GitHub" style={{width:"14px",height:"14px",objectFit:"contain",filter:"invert(1)",opacity:.8}}/>
                </a>
              </div>
            </div>

            {/* Product col */}
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                {["Dashboard","Analytics","Articles","About"].map(l=>(
                  <button key={l} className="footer-link btn-style" onClick={()=>navTo(l.toLowerCase())}>{l}</button>
                ))}
              </div>
            </div>

            {/* Resources col */}
            <div>
              <div className="footer-col-title">Resources</div>
              <div className="footer-links">
                {["Getting Started","AI Agent Guide","Architecture Docs","Build in Public"].map(l=>(
                  <span key={l} className="footer-link" style={{cursor:"default",opacity:.4}}>{l}</span>
                ))}
              </div>
            </div>

            {/* Company col */}
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                <button className="footer-link btn-style" onClick={()=>navTo("about")}>About</button>
                <a className="footer-link" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
                <a className="footer-link" href="https://takeover.fun/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer">Takeover</a>
                <a className="footer-link" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">Contact</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              <div className="footer-copy">© 2026 NoelClaw. All rights reserved.</div>
              <div className="footer-ca">CA: <span style={{fontFamily:"monospace",fontSize:".58rem",opacity:.7}}>0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3</span></div>
            </div>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </footer>

      </div>{/* end .app */}

      {/* ══════════════════════════════
          FLOATING CHAT
      ══════════════════════════════ */}

      {/* Chat popup */}
      {chatOpen&&(
        <div className="chat-popup">
          <div className="cp-head">
            <div className="cp-id">
              <div className="cp-ava"><img src={LOGO} className="cp-avi" alt=""/></div>
              <div>
                <div className="cp-name">Ask Noel</div>
                <div className="cp-status"><span className="cp-sdot"/> Online</div>
              </div>
            </div>
            <div className="cp-actions">
              <button className="cp-btn" onClick={()=>setMsgs(INIT)} title="Clear">↺</button>
              <button className="cp-btn" onClick={()=>setChatOpen(false)} title="Close">✕</button>
            </div>
          </div>

          <div className="cp-msgs">
            {msgs.map((m,i)=>(
              <div key={i} className={`bub ${m.r}`}>
                {m.r==="a"&&<div className="blbl">Noel</div>}
                {m.t}
              </div>
            ))}
            {busy&&<div className="bub a"><div className="blbl">Noel</div><div className="typdots"><span/><span/><span/></div></div>}
            <div ref={endRef}/>
          </div>

          <div className="cp-suggs">
            {SUGGESTIONS.map(s=><button key={s} className="sug" onClick={()=>send(s)}>{s}</button>)}
          </div>

          <div className="cp-form">
            <textarea className="cp-inp" rows={1} placeholder="Ask anything..." value={val}
              onChange={e=>setVal(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            />
            <button className="cp-send" onClick={()=>send()} disabled={!val.trim()||busy}>Send →</button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button className="chat-fab" onClick={()=>setChatOpen(o=>!o)} title="Chat with Noel">
        {chatOpen
          ? <span className="chat-fab-close">✕</span>
          : <>
              <img
                src="/chat-icon.png"
                className="chat-fab-img"
                alt="Chat"
              />
              <span className="chat-fab-badge"/>
            </>
        }
      </button>

    </>
  );
}
