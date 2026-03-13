import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { usePrivy, useWallets } from "@privy-io/react-auth";

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
const RANDOM_NAMES = ["Alex","Maya","Ryan","Zara","Kai","Lena","Omar","Noa","Jin","Sasha","Felix","Aria","Remi","Yuki","Dani","Theo","Ines","Cole","Mia","Ezra"];
const RANDOM_CITIES = ["Singapore","Tokyo","Berlin","London","NYC","Sydney","Seoul","Amsterdam","São Paulo","Toronto"];
const ACT_TEMPLATES = [
  {tmpl:(n,c)=>`${n} from ${c} just read an article`,type:"read"},
  {tmpl:(n)=>`${n} opened a chat with Noel`,type:"chat"},
  {tmpl:(n)=>`${n} shared NoelClaw: AI OS on X`,type:"share"},
  {tmpl:(n)=>`${n} grabbed $NOELCLAW on Base`,type:"token"},
  {tmpl:(n,c)=>`New visitor from ${c}`,type:"visit"},
  {tmpl:(n)=>`${n} completed AGI Horizon`,type:"read"},
  {tmpl:(n)=>`${n} followed @noelclawfun`,type:"follow"},
  {tmpl:(n,c)=>`${n} in ${c} — first session`,type:"visit"},
  {tmpl:(n)=>`${n} sent 8 messages to Noel`,type:"chat"},
  {tmpl:(n)=>`${n} bookmarked Reasoning Models`,type:"read"},
];
function genActivity() {
  return Array.from({length:8},(_,i)=>{
    const name = RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)];
    const city = RANDOM_CITIES[Math.floor(Math.random()*RANDOM_CITIES.length)];
    const tpl = ACT_TEMPLATES[Math.floor(Math.random()*ACT_TEMPLATES.length)];
    const mins = [1,3,7,14,22,38,55,72][i];
    return {name,event:tpl.tmpl(name,city),type:tpl.type,time:mins<60?`${mins}m ago`:`${Math.floor(mins/60)}h ago`};
  });
}

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

html { scroll-behavior: smooth; }
body { background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-weight:300;letter-spacing:.01em;overflow-x:hidden;cursor:none; }

a, button { transition:color .18s,background .18s,border-color .18s,opacity .18s,transform .18s; }

#cr  { width:8px;height:8px;border-radius:50%;background:#fff;position:fixed;top:0;left:0;z-index:9999;pointer-events:none;transform:translate(-50%,-50%);transition:width .18s,height .18s;mix-blend-mode:difference; }
#crr { width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.28);position:fixed;top:0;left:0;z-index:9998;pointer-events:none;transform:translate(-50%,-50%);transition:left .12s cubic-bezier(.23,1,.32,1),top .12s cubic-bezier(.23,1,.32,1),width .25s,height .25s; }
body:has(a:hover) #cr,body:has(button:hover) #cr { width:14px;height:14px; }
body:has(a:hover) #crr,body:has(button:hover) #crr { width:46px;height:46px;border-color:rgba(255,255,255,.14); }

::-webkit-scrollbar { width:3px; }
::-webkit-scrollbar-thumb { background:var(--text3);border-radius:2px; }
.sidebar-zone{position:fixed;left:0;top:0;bottom:0;width:20px;z-index:200;}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:230px;z-index:199;background:rgba(5,7,14,0.97);border-right:1px solid var(--border);backdrop-filter:blur(20px);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;padding:0;}
.sidebar.open{transform:translateX(0);}
.sb-logo{padding:1.4rem 1.5rem;border-bottom:1px solid var(--border);}
.sb-logo-name{font-size:1rem;font-weight:200;color:var(--white);letter-spacing:.02em;}
.sb-logo-name em{color:var(--blue-hi);font-style:normal;}
.sb-logo-sub{font-size:.55rem;color:var(--text3);letter-spacing:.1em;margin-top:.2rem;}
.sb-section{padding:.6rem 0;}
.sb-label{font-size:.48rem;font-weight:600;color:var(--text3);letter-spacing:.22em;text-transform:uppercase;padding:.4rem 1.5rem .3rem;display:block;}
.sb-item{display:flex;align-items:center;gap:.7rem;padding:.55rem 1.5rem;width:100%;background:none;border:none;color:var(--text2);font-size:.78rem;font-family:"Inter",sans-serif;font-weight:300;letter-spacing:.03em;cursor:pointer;transition:color .18s,background .18s;text-align:left;text-decoration:none;}
.sb-item:hover{color:var(--white);background:rgba(255,255,255,.04);}
.sb-item.active{color:var(--white);background:rgba(26,79,255,.08);}
.sb-icon{font-size:.9rem;width:18px;text-align:center;flex-shrink:0;}
.sb-divider{height:1px;background:var(--border);margin:.4rem 1.2rem;}
.sb-footer{margin-top:auto;padding:.9rem 1.5rem;border-top:1px solid var(--border);font-size:.62rem;color:var(--text3);}
@media(max-width:768px){.sidebar,.sidebar-zone{display:none;}}

/* ── WALLET CONNECT ── */
.wallet-btn { display:flex;align-items:center;gap:.4rem;background:rgba(26,79,255,.12);border:1px solid rgba(77,133,255,.3);border-radius:7px;padding:.38rem .85rem;color:var(--blue-hi);font-size:.72rem;font-family:inherit;cursor:pointer;letter-spacing:.06em;font-weight:400;transition:all .2s;white-space:nowrap; }
.wallet-btn:hover { background:rgba(26,79,255,.2);border-color:rgba(77,133,255,.6); }
.wallet-premium { font-size:.62rem;color:var(--green);background:rgba(34,211,165,.1);border:1px solid rgba(34,211,165,.2);border-radius:5px;padding:.25rem .6rem;letter-spacing:.08em;font-weight:500; }

.grain { position:fixed;inset:0;z-index:9990;pointer-events:none;opacity:.0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;animation:gr .6s steps(1) infinite; }
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 6px var(--blue-hi)}50%{opacity:.4;box-shadow:0 0 12px var(--blue-hi)}}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes gr{0%{transform:translate(0,0)}16%{transform:translate(-4%,-2%)}33%{transform:translate(2%,4%)}50%{transform:translate(-2%,0)}66%{transform:translate(4%,-4%)}83%{transform:translate(-3%,2%)}100%{transform:translate(0,0)}}

.app { position:relative;z-index:1;min-height:100vh;width:100%;display:flex;flex-direction:column;overflow-x:hidden; }

/* ── CA BAR ── */
.ca-bar {
  width:100%;background:#03050c;border-bottom:1px solid rgba(255,255,255,0.07);
  padding:.45rem 0;display:flex;align-items:center;
  font-size:.75rem;font-weight:300;letter-spacing:.08em;color:var(--text2);
  position:sticky;top:0;z-index:201;overflow:hidden;
}
.ca-bar-inner {
  display:flex;align-items:center;gap:2.5rem;
  white-space:nowrap;
  animation:ca-scroll 35s linear infinite;
  will-change:transform;
}
.ca-bar:hover .ca-bar-inner { animation-play-state:paused; }
@keyframes ca-scroll {
  from { transform:translateX(100vw); }
  to { transform:translateX(-100%); }
}
.ca-label { color:var(--blue-hi);font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:.72rem; }
.ca-addr {
  font-family:'Courier New',monospace;color:var(--text2);font-size:.68rem;
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
  position:fixed;top:88px;left:0;right:0;z-index:199;
  background:rgba(5,7,14,0.99);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
  display:flex;flex-direction:column;padding:.5rem 0;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
}
.mob-overlay {
  position:fixed;inset:0;z-index:198;background:rgba(0,0,0,0.5);
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
.hero-content { position:relative;z-index:3;padding:0 3.5rem;max-width:820px; }
.hero-eyebrow { font-family:'Inter',sans-serif;font-size:.65rem;font-weight:200;color:var(--text2);letter-spacing:.35em;text-transform:uppercase;margin-bottom:1.4rem;animation:pin .6s .1s both; }
.hero-h1 { font-family:'Inter',sans-serif;font-size:clamp(3.5rem,7vw,6.5rem);font-weight:100;line-height:.95;letter-spacing:-.02em;color:var(--white);margin-bottom:1.2rem;animation:pin .6s .2s both; }
.hero-h1 em { font-style:normal;font-weight:100;color:rgba(255,255,255,0.72); }

/* NEW: hero sub-tagline */
.hero-tagline {
  font-size:.95rem;font-weight:300;color:var(--text2);letter-spacing:.04em;
  margin-bottom:2rem;line-height:1.6;max-width:520px;
  animation:pin .6s .28s both;
}
.hero-tagline strong { color:var(--text);font-weight:400; }

.hero-bottom { display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;flex-wrap:wrap;animation:pin .6s .35s both; }
.hero-desc { font-size:.85rem;color:var(--text2);line-height:1.85;max-width:340px;font-weight:200;letter-spacing:.03em; }
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
@media(max-width:768px){ .stats-row { grid-template-columns:1fr; } .stat-box { border-right:none;border-bottom:1px solid var(--border); } }
.stat-box { padding:1.8rem 3.5rem;border-right:1px solid var(--border);position:relative;overflow:hidden;cursor:default;transition:background .22s; }
.stat-box:hover { background:var(--surface); }
.stat-box:last-child { border-right:none; }
.stat-box::after { content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,var(--blue2),transparent);transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.34,1.56,.64,1); }
.stat-box:hover::after { transform:scaleX(1); }
.stat-n { font-family:'Inter',sans-serif;font-size:2.8rem;font-weight:100;line-height:1;color:var(--white);letter-spacing:-.02em;margin-bottom:.4rem; }
.stat-l { font-size:.6rem;color:var(--text3);font-weight:300;letter-spacing:.22em;text-transform:uppercase; }

/* ══════════════════════════════
   NEW: ARCHITECTURE DIAGRAM SECTION
══════════════════════════════ */
.arch-section {
  padding:4rem 3.5rem;
  border-bottom:1px solid var(--border);
  background:linear-gradient(180deg, rgba(26,79,255,0.03) 0%, transparent 100%);
  overflow:hidden;
}
.arch-header { margin-bottom:3rem; }
.arch-tag { font-size:.6rem;font-weight:300;color:var(--text2);letter-spacing:.28em;text-transform:uppercase;display:flex;align-items:center;gap:.6rem;margin-bottom:1rem; }
.arch-tag-ln { width:22px;height:1px;background:rgba(255,255,255,.2); }
.arch-title { font-family:'Inter',sans-serif;font-size:clamp(1.6rem,3vw,2.4rem);font-weight:100;color:var(--white);line-height:1.1;letter-spacing:-.02em;margin-bottom:.8rem; }
.arch-subtitle { font-size:.88rem;color:var(--text2);font-weight:200;max-width:520px;line-height:1.75; }

.arch-diagram {
  display:flex;align-items:center;justify-content:center;
  gap:0;flex-wrap:wrap;
  margin-bottom:3rem;
}
.arch-node {
  display:flex;flex-direction:column;align-items:center;gap:.5rem;
  min-width:120px;
}
.arch-node-box {
  border:1px solid var(--border2);
  border-radius:10px;
  padding:.9rem 1.4rem;
  background:var(--surface);
  text-align:center;
  transition:border-color .25s, background .25s, transform .22s;
  position:relative;
  overflow:hidden;
  width:140px;
  min-height:88px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
}
.arch-node-box::before {
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--blue-hi),transparent);
  opacity:0;transition:opacity .3s;
}
.arch-node-box:hover { border-color:rgba(77,133,255,.4);background:rgba(26,79,255,.08);transform:translateY(-2px); }
.arch-node-box:hover::before { opacity:1; }
.arch-node-icon { font-size:1.2rem;margin-bottom:.3rem; }
.arch-node-label { font-size:.72rem;font-weight:400;color:var(--white);letter-spacing:.06em; }
.arch-node-sub { font-size:.58rem;color:var(--text3);letter-spacing:.06em; }

.arch-arrow {
  display:flex;flex-direction:column;align-items:center;
  padding:0 .5rem;
  color:var(--text3);
  font-size:.75rem;
  flex-shrink:0;
}
.arch-arrow-line {
  width:36px;height:1px;
  background:linear-gradient(90deg, var(--text3), rgba(77,133,255,.5));
  position:relative;
}
.arch-arrow-line::after {
  content:'';position:absolute;right:-1px;top:-3px;
  width:0;height:0;
  border-left:5px solid rgba(77,133,255,.5);
  border-top:3px solid transparent;
  border-bottom:3px solid transparent;
}

/* equation style */
.arch-equation {
  display:flex;align-items:center;justify-content:center;gap:1.2rem;
  flex-wrap:wrap;
  padding:2rem 2.5rem;
  border:1px solid var(--border);
  border-radius:14px;
  background:rgba(255,255,255,.02);
  margin-top:2rem;
}
.arch-eq-item {
  display:flex;flex-direction:column;align-items:center;gap:.35rem;
  padding:.8rem 1.2rem;
  border-radius:8px;
  border:1px solid var(--border);
  background:var(--surface);
  width:100px;min-width:100px;text-align:center;
  transition:border-color .22s, background .22s;
}
.arch-eq-item:hover { border-color:rgba(77,133,255,.3);background:rgba(26,79,255,.06); }
.arch-eq-icon { font-size:1.1rem; }
.arch-eq-label { font-size:.68rem;font-weight:400;color:var(--text);letter-spacing:.06em; }
.arch-eq-sub { font-size:.56rem;color:var(--text3);letter-spacing:.08em; }
.arch-eq-op { font-size:1.2rem;color:var(--text3);font-weight:100; }
.arch-eq-result {
  display:flex;flex-direction:column;align-items:center;gap:.35rem;
  padding:.8rem 1.2rem;
  border-radius:8px;
  border:1px solid rgba(77,133,255,.3);
  background:rgba(26,79,255,.1);
  width:100px;min-width:100px;text-align:center;
}
.arch-eq-result-label { font-size:.78rem;font-weight:400;color:var(--blue-hi);letter-spacing:.06em; }
.arch-eq-result-sub { font-size:.58rem;color:var(--text2);letter-spacing:.08em; }

/* ══════════════════════════════
   NEW: AGENT CAPABILITIES SECTION
══════════════════════════════ */
.caps-section {
  padding:4rem 3.5rem;
  border-bottom:1px solid var(--border);
}
.caps-header { display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:2.5rem;flex-wrap:wrap;gap:1rem; }
.caps-title { font-family:'Inter',sans-serif;font-size:clamp(1.4rem,2.5vw,2rem);font-weight:100;color:var(--white);letter-spacing:-.01em;line-height:1.1; }
.caps-subtitle { font-size:.82rem;color:var(--text2);font-weight:200;margin-top:.5rem;max-width:400px;line-height:1.6; }
.caps-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:1px;
  background:var(--border);
  border:1px solid var(--border);
  border-radius:12px;
  overflow:hidden;
}
.cap-item {
  padding:1.8rem 2rem;
  background:var(--bg);
  transition:background .22s;
  cursor:default;
  position:relative;
}
.cap-item::after {
  content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--blue2),transparent);
  transform:scaleX(0);transform-origin:center;
  transition:transform .4s cubic-bezier(.34,1.56,.64,1);
}
.cap-item:hover { background:rgba(26,79,255,.04); }
.cap-item:hover::after { transform:scaleX(1); }
.cap-icon { font-size:1.4rem;margin-bottom:.9rem; }
.cap-title { font-size:.85rem;font-weight:400;color:var(--white);margin-bottom:.45rem;letter-spacing:.02em; }
.cap-desc { font-size:.75rem;color:var(--text2);line-height:1.7;font-weight:200; }

/* ══════════════════════════════
   NEW: PERSONAL AI NODE SECTION
══════════════════════════════ */
.node-section {
  padding:5rem 3.5rem;
  border-bottom:1px solid var(--border);
  position:relative;
  overflow:hidden;
}
.node-section::before {
  content:'';position:absolute;top:-80px;right:-80px;
  width:400px;height:400px;
  border-radius:50%;
  background:radial-gradient(circle, rgba(26,79,255,0.07) 0%, transparent 70%);
  pointer-events:none;
}
.node-inner {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:4rem;
  align-items:center;
  position:relative;z-index:1;
}
.node-left {}
.node-eyebrow { font-size:.6rem;font-weight:300;color:var(--blue-hi);letter-spacing:.3em;text-transform:uppercase;margin-bottom:1rem; }
.node-title { font-family:'Inter',sans-serif;font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:100;color:var(--white);line-height:1.05;letter-spacing:-.02em;margin-bottom:1.2rem; }
.node-desc { font-size:.9rem;color:var(--text2);line-height:1.9;font-weight:200;margin-bottom:2rem; }
.node-pills { display:flex;flex-direction:column;gap:.6rem; }
.node-pill { display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);transition:border-color .22s,background .22s; }
.node-pill:hover { border-color:rgba(77,133,255,.25);background:rgba(26,79,255,.05); }
.node-pill-dot { width:6px;height:6px;border-radius:50%;background:var(--blue-hi);flex-shrink:0; }
.node-pill-text { font-size:.78rem;color:var(--text);font-weight:300; }

.node-right {
  display:flex;flex-direction:column;gap:1px;
  border:1px solid var(--border);border-radius:14px;overflow:hidden;
}
.node-card {
  padding:1.4rem 1.6rem;
  background:var(--bg);
  border-bottom:1px solid var(--border);
  transition:background .22s;
}
.node-card:last-child { border-bottom:none; }
.node-card:hover { background:rgba(26,79,255,.04); }
.node-card-title { font-size:.78rem;font-weight:400;color:var(--white);margin-bottom:.35rem;letter-spacing:.04em; }
.node-card-desc { font-size:.72rem;color:var(--text2);line-height:1.65;font-weight:200; }
.node-card-tag { display:inline-block;font-size:.52rem;font-weight:600;padding:.1rem .45rem;border-radius:3px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem;background:rgba(77,133,255,.1);color:var(--blue-hi); }

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
.reader { padding:3.5rem 3.5rem;max-width:860px;margin:0 auto;width:100%; }
.reader-layout { display:grid;grid-template-columns:1fr 240px;gap:3rem;align-items:start;max-width:1100px;margin:0 auto;padding:3.5rem 3.5rem;width:100%; }
.reader-main { min-width:0; }
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

/* ── LIKE / COMMENT ── */
.like-bar { display:flex;align-items:center;gap:.8rem;padding:1rem 0;margin:1.5rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border); }
.like-btn { display:inline-flex;align-items:center;gap:.4rem;background:none;border:1px solid var(--border);border-radius:20px;padding:.4rem .9rem;font-size:.75rem;color:var(--text2);cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s; }
.like-btn:hover,.like-btn.liked { color:var(--white);border-color:rgba(255,100,100,.4);background:rgba(255,100,100,.06); }
.like-btn.liked .like-icon { filter:none; }
.like-icon { font-size:.9rem;transition:transform .2s; }
.like-btn:hover .like-icon,.like-btn.liked .like-icon { transform:scale(1.2); }
.like-count { font-size:.72rem;color:var(--text2); }
.comment-section { margin-top:2rem; }
.comment-title { font-size:.6rem;font-weight:600;color:var(--text3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:1.2rem; }
.comment-input-wrap { display:flex;gap:.6rem;margin-bottom:1.5rem; }
.comment-inp { flex:1;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--text);padding:.65rem .9rem;border-radius:8px;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:300;resize:none;outline:none;transition:border-color .22s; }
.comment-inp:focus { border-color:rgba(26,79,255,.4); }
.comment-inp::placeholder { color:var(--text3); }
.comment-submit { background:var(--blue2);color:#fff;border:none;border-radius:8px;padding:.65rem 1rem;font-size:.72rem;font-family:'Inter',sans-serif;cursor:pointer;font-weight:400;transition:background .18s;white-space:nowrap;align-self:flex-end; }
.comment-submit:hover { background:var(--blue-hi); }
.comment-list { display:flex;flex-direction:column;gap:1rem; }
.comment-item { background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.9rem 1rem; }
.comment-meta { display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem; }
.comment-avatar { width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--blue2),var(--purple));display:flex;align-items:center;justify-content:center;font-size:.62rem;color:#fff;font-weight:600;flex-shrink:0; }
.comment-name { font-size:.72rem;color:var(--text);font-weight:400; }
.comment-time { font-size:.62rem;color:var(--text3); }
.comment-text { font-size:.78rem;color:var(--text2);line-height:1.65; }

/* ── READER RIGHT SIDEBAR ── */
.reader-sidebar { position:sticky;top:5rem;display:flex;flex-direction:column;gap:1rem; }
.rsb-card { background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1rem 1.2rem; }
.rsb-title { font-size:.58rem;font-weight:600;color:var(--text3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:.9rem; }
.cat-list { display:flex;flex-direction:column;gap:.35rem; }
.cat-btn { display:flex;align-items:center;justify-content:space-between;padding:.42rem .7rem;border-radius:6px;background:none;border:1px solid transparent;color:var(--text2);font-size:.75rem;font-family:'Inter',sans-serif;cursor:pointer;transition:all .18s;text-align:left; }
.cat-btn:hover,.cat-btn.active { color:var(--white);background:var(--surface2);border-color:var(--border); }
.cat-btn.active { border-color:rgba(26,79,255,.3);background:rgba(26,79,255,.07);color:var(--blue-hi); }
.cat-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }

/* ── RECOMMENDATIONS ── */
.rec-section { margin-top:3rem;padding-top:2.5rem;border-top:1px solid var(--border); }
.rec-title { font-size:.6rem;font-weight:600;color:var(--text3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:1.5rem; }
.rec-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:1rem; }
.rec-card { background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.1rem 1.2rem;cursor:pointer;transition:border-color .2s,transform .2s; }
.rec-card:hover { border-color:var(--border2);transform:translateY(-2px); }
.rec-tags { display:flex;gap:.3rem;margin-bottom:.6rem;flex-wrap:wrap; }
.rec-card-title { font-size:.85rem;color:var(--text);font-weight:300;line-height:1.35;margin-bottom:.4rem; }
.rec-card-desc { font-size:.72rem;color:var(--text2);line-height:1.6; }
.rec-card-meta { font-size:.62rem;color:var(--text3);margin-top:.6rem; }

/* ── DASHBOARD ── */
.dash { padding:0;animation:pin .4s cubic-bezier(.23,1,.32,1) both; }
.pg-hd { padding:2.5rem 3.5rem 2rem;border-bottom:1px solid var(--border);display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap; }
.pg-title { font-family:'Inter',sans-serif;font-size:1.5rem;font-weight:200;color:var(--white);margin-bottom:.2rem;line-height:1;letter-spacing:-.02em; }
.pg-sub { font-size:.6rem;color:var(--text3);font-weight:300;letter-spacing:.18em;text-transform:uppercase; }

.kpi-grid { display:grid;grid-template-columns:repeat(5,1fr);border-bottom:1px solid var(--border); }
.kpi { padding:1.8rem 2rem;border-right:1px solid var(--border);position:relative;overflow:hidden;transition:background .22s;cursor:default; }
.kpi:last-child { border-right:none; }
.kpi:hover { background:rgba(255,255,255,.018); }
.kpi::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;opacity:0;transition:opacity .3s; }
.kpi:hover::before { opacity:1; }
.kpi.kblue::before{background:linear-gradient(90deg,transparent,var(--blue2),var(--blue-hi),transparent)}
.kpi.kgreen::before{background:linear-gradient(90deg,transparent,var(--green),#34d399,transparent)}
.kpi.korange::before{background:linear-gradient(90deg,transparent,var(--orange),#fb923c,transparent)}
.kpi.kpurple::before{background:linear-gradient(90deg,transparent,var(--purple),#c4b5fd,transparent)}
.kpi.ktoken::before{background:linear-gradient(90deg,transparent,#22d3a5,#3b82f6,transparent)}
.kpi-lbl { font-size:.54rem;font-weight:400;color:var(--text3);letter-spacing:.22em;text-transform:uppercase;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem; }
.kpi-ico { font-size:.8rem;opacity:.4; }
.kpi-val { font-family:'Inter',sans-serif;font-size:2.1rem;font-weight:100;color:var(--white);line-height:1;letter-spacing:-.04em;margin-bottom:.5rem; }
.kpi-chg { font-size:.6rem;font-weight:300;display:flex;align-items:center;gap:.3rem;letter-spacing:.04em; }
.kpi-chg.up { color:var(--blue-hi); }
.kpi-chg span { color:var(--text3);font-weight:200; }

.dash-body { padding:2rem 3.5rem;display:grid;grid-template-columns:1fr 340px;gap:2rem;align-items:start; }
.dash-left { display:flex;flex-direction:column;gap:1.2rem; }
.dash-right { display:flex;flex-direction:column;gap:1.2rem; }

.panel { border:1px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .22s; }
.panel:hover { border-color:var(--border2); }
.panel-hd { padding:.9rem 1.3rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.012); }
.panel-title { font-size:.62rem;font-weight:400;color:var(--text2);letter-spacing:.14em;text-transform:uppercase; }
.panel-tag { font-size:.54rem;font-weight:600;padding:.12rem .5rem;border-radius:3px;text-transform:uppercase;letter-spacing:.1em; }
.panel-tag.blue { background:rgba(77,133,255,.12);color:var(--blue-hi); }
.panel-tag.green { background:rgba(34,211,165,.09);color:var(--green); }
.panel-tag.purple { background:rgba(167,139,250,.1);color:var(--purple); }

.token-hero { padding:1.2rem 1.3rem;border-bottom:1px solid var(--border); }
.token-name-row { display:flex;align-items:center;gap:.6rem;margin-bottom:.9rem; }
.token-price-val { font-size:1.5rem;font-weight:200;color:var(--white);font-family:'Inter',sans-serif;letter-spacing:-.03em; }
.token-price-chg { font-size:.7rem;font-weight:600;margin-left:.3rem; }
.token-stats { display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border); }
.token-stat { background:var(--bg);padding:.65rem 1.3rem; }
.token-stat-l { font-size:.52rem;color:var(--text3);letter-spacing:.16em;text-transform:uppercase;margin-bottom:.25rem; }
.token-stat-v { font-size:.78rem;color:var(--white);font-weight:400;font-family:'DM Mono',monospace; }

.act-list { display:flex;flex-direction:column; }
.act-item { display:flex;align-items:center;gap:.75rem;padding:.75rem 1.3rem;border-bottom:1px solid var(--border);transition:background .18s; }
.act-item:last-child { border-bottom:none; }
.act-item:hover { background:rgba(255,255,255,.018); }
.act-badge { width:28px;height:28px;border-radius:50%;overflow:hidden;flex-shrink:0;border:1px solid var(--border); }
.act-badge img { width:100%;height:100%;object-fit:cover; }
.act-ev { font-size:.72rem;color:var(--text);font-weight:300;margin-bottom:.14rem; }
.act-time { font-size:.6rem;color:var(--text3); }

.chart-card { border:1px solid var(--border);border-radius:10px;padding:1.3rem 1.4rem;margin-bottom:1.2rem;transition:border-color .22s;overflow:hidden; }
.chart-card:hover { border-color:var(--border2); }
.chart-hd { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem; }
.chart-title { font-size:.62rem;font-weight:400;color:var(--text2);letter-spacing:.14em;text-transform:uppercase; }
.cbadge { font-size:.54rem;font-weight:600;padding:.12rem .5rem;border-radius:3px;text-transform:uppercase;letter-spacing:.1em; }
.cbadge-b { background:rgba(77,133,255,.12);color:var(--blue-hi); }
.cbadge-g { background:rgba(34,211,165,.09);color:var(--green); }
.two-col { display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-bottom:1.2rem;min-width:0; }

/* ── ANALYTICS ── */
.analytics { padding:0;animation:pin .4s cubic-bezier(.23,1,.32,1) both; }
.an-hd { padding:2.5rem 3.5rem 2rem;border-bottom:1px solid var(--border);display:flex;align-items:flex-end;justify-content:space-between;gap:1rem; }
.range-btns { display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden; }
.rbtn { font-size:.6rem;font-weight:400;padding:.32rem .75rem;background:none;border:none;border-right:1px solid var(--border);color:var(--text3);cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:.1em;transition:all .18s; }
.rbtn:last-child { border-right:none; }
.rbtn.on { background:rgba(255,255,255,.06);color:var(--white); }
.rbtn:hover:not(.on) { color:var(--text2);background:rgba(255,255,255,.03); }
.an-kpis { display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border); }
.an-kpi { padding:1.8rem 2rem;border-right:1px solid var(--border);cursor:default;transition:background .22s; }
.an-kpi:last-child { border-right:none; }
.an-kpi:hover { background:rgba(255,255,255,.018); }
.an-kpi-l { font-size:.54rem;font-weight:400;color:var(--text3);letter-spacing:.22em;text-transform:uppercase;margin-bottom:.9rem; }
.an-kpi-v { font-family:'Inter',sans-serif;font-size:2.1rem;font-weight:100;color:var(--white);line-height:1;letter-spacing:-.04em;margin-bottom:.4rem; }
.an-kpi-d { font-size:.6rem;font-weight:400;letter-spacing:.04em; }
.an-kpi-d.up { color:var(--blue-hi); }
.an-body { padding:2rem 3.5rem;display:flex;flex-direction:column;gap:1.2rem; }
.big-chart { border:1px solid var(--border);border-radius:10px;padding:1.4rem 1.5rem;transition:border-color .22s;overflow:hidden; }
.big-chart:hover { border-color:var(--border2); }
.bc-hd { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.4rem; }
.bc-title { font-size:.62rem;font-weight:400;color:var(--text2);letter-spacing:.14em;text-transform:uppercase; }
.bc-leg { display:flex;gap:.9rem; }
.leg-item { display:flex;align-items:center;gap:.32rem;font-size:.6rem;color:var(--text3); }
.leg-dot { width:5px;height:5px;border-radius:50%; }
.an-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.2rem; }
.src-list { display:flex;flex-direction:column;gap:.55rem;margin-top:.9rem; }
.src-item { display:flex;align-items:center;gap:.7rem; }
.src-nm { font-size:.68rem;color:var(--text2);min-width:70px; }
.src-bw { flex:1;background:rgba(255,255,255,.04);border-radius:2px;height:2px;overflow:hidden; }
.src-b { height:2px;border-radius:2px;transition:width .8s cubic-bezier(.34,1.56,.64,1); }
.src-p { font-size:.6rem;color:var(--text3);min-width:28px;text-align:right; }
.top-art-list { display:flex;flex-direction:column;gap:.2rem;margin-top:.8rem; }
.top-art-item { display:flex;align-items:center;gap:.6rem;padding:.55rem .65rem;border-radius:5px;transition:background .18s; }
.top-art-item:hover { background:rgba(255,255,255,.035); }
.tar-rank { font-size:.62rem;color:var(--text3);min-width:20px;font-weight:300;font-family:'DM Mono',monospace; }
.tar-nm { flex:1;font-size:.72rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:300; }
.tar-v { font-size:.64rem;color:var(--blue-hi);font-weight:500;font-family:'DM Mono',monospace; }

/* ── ABOUT ── */
.about { padding:4rem 3.5rem;display:grid;grid-template-columns:1fr 300px;gap:3rem;align-items:start; }
.abt-left {}
.abt-right { display:flex;flex-direction:column;gap:1.2rem;position:sticky;top:5rem; }
.abt-wrap { position:relative;width:76px;height:76px;flex-shrink:0; }
.abt-logo { width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 0 18px rgba(26,79,255,.6));animation:fl 4s ease-in-out infinite; }
@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.abt-ring { position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(255,255,255,.1);animation:sp 9s linear infinite; }
.abt-ring::before { content:'';position:absolute;top:-2px;left:50%;width:4px;height:4px;border-radius:50%;background:var(--blue-hi);transform:translateX(-50%); }
@keyframes sp{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.abt-name { font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:500;color:var(--white);line-height:1; }
.abt-name em { color:var(--blue-hi);font-style:italic; }
.abt-handle { font-size:.76rem;color:var(--text2);margin-top:.4rem; }
.abt-body { font-size:.9rem;color:var(--text2);line-height:1.95;font-weight:300;margin-bottom:2.5rem; }
.abt-body strong { color:var(--text);font-weight:500; }
.abt-body a { color:var(--blue-hi);text-decoration:none; }
.abt-body a:hover { text-decoration:underline; }
.stk-hd { font-size:.6rem;font-weight:600;color:var(--text3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:.9rem; }
.chips { display:flex;flex-wrap:wrap;gap:.5rem; }
.chip { font-size:.7rem;padding:.3rem .75rem;border-radius:5px;background:var(--surface);border:1px solid var(--border);color:var(--text2);transition:color .2s,border-color .2s; }
.chip:hover { color:var(--text);border-color:var(--border2); }
.abt-card { background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1.2rem 1.4rem; }
.abt-card-title { font-size:.58rem;font-weight:600;color:var(--text3);letter-spacing:.2em;text-transform:uppercase;margin-bottom:1rem; }
.abt-stat-row { display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid var(--border); }
.abt-stat-row:last-child { border-bottom:none; }
.abt-stat-label { font-size:.75rem;color:var(--text2); }
.abt-stat-val { font-size:.75rem;color:var(--white);font-weight:500; }
.abt-links { display:flex;flex-direction:column;gap:.55rem; }
.abt-link-btn { display:flex;align-items:center;gap:.7rem;padding:.65rem .9rem;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text2);text-decoration:none;font-size:.75rem;font-family:'Inter',sans-serif;transition:all .2s;cursor:none; }
.abt-link-btn:hover { color:var(--white);border-color:var(--border2);background:var(--surface2); }

/* ══════════════════════════════
   FOOTER
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

.chat-popup {
  position:fixed;bottom:6rem;right:2rem;z-index:500;
  width:360px;
  max-height:min(520px, calc(100vh - 7rem));
  height:min(520px, calc(100vh - 7rem));
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

.cp-msgs { flex:1;overflow-y:auto;overflow-x:hidden;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.8rem;min-height:0; }
.bub { max-width:88%;font-size:.8rem;line-height:1.75;animation:bi .22s cubic-bezier(.34,1.56,.64,1) both;word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap; }
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

.tt { background:#0c0e1f;border:1px solid var(--border);border-radius:7px;padding:.52rem .78rem;font-family:'Inter',sans-serif; }
.tt-lbl { font-size:.6rem;color:var(--text3);font-weight:300;letter-spacing:.08em;margin-bottom:.26rem; }
.tt-val { font-size:.78rem;color:var(--white);font-weight:400; }

@media(max-width:900px){
  .nav { padding:0 1.4rem; }
  .hero-content { padding:0 1.8rem; }
  .section,.reader,.dash,.analytics,.footer-main { padding-left:1.5rem;padding-right:1.5rem; }
  .stats-row .stat-box { padding-left:1.5rem;padding-right:1.5rem; }
  .footer-main { grid-template-columns:1fr 1fr; }
  .footer-bottom { padding-left:1.5rem;padding-right:1.5rem; }
  .an-kpis,.kpi-grid { grid-template-columns:repeat(2,1fr); }
  .three-col,.an-grid { grid-template-columns:1fr; }
  .dash-body { grid-template-columns:1fr;padding:1.5rem; }
  .pg-hd,.an-hd { padding:2rem 1.5rem 1.5rem; }
  .chat-popup { width:calc(100vw - 2.5rem);right:1.25rem;bottom:5.5rem;max-height:min(520px, calc(100vh - 7rem));height:min(520px, calc(100vh - 7rem)); }
  .reader-layout { grid-template-columns:1fr;padding:2rem 1.5rem; }
  .reader-sidebar { position:static; }
  .about { grid-template-columns:1fr;padding-left:1.5rem;padding-right:1.5rem; }
  .abt-right { position:static; }
  .rec-grid { grid-template-columns:1fr; }
  .abt-section-row { grid-template-columns:1fr !important;gap:1.2rem !important;padding-left:1.5rem !important;padding-right:1.5rem !important; }
  .abt-grid-cell { padding:2.5rem 1.5rem !important;border-right:none !important; }
  .abt-outer-grid { grid-template-columns:1fr !important; }
  .abt-inline-grid { grid-template-columns:1fr !important; }
  .arch-section,.caps-section,.node-section { padding-left:1.5rem;padding-right:1.5rem; }
  .caps-grid { grid-template-columns:1fr 1fr; }
  .node-inner { grid-template-columns:1fr; }
  .arch-diagram { gap:0; }
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
  .hero-curve-left { display:none; }
  .hero-content { padding:0 1.5rem;max-width:100%; }
  .hero-h1 { font-size:clamp(2.8rem,11vw,4rem); }
  .hero-eyebrow { font-size:.58rem;letter-spacing:.22em; }
  .hero-tagline { font-size:.88rem; }
  .hero-bottom { flex-direction:column;align-items:flex-start;gap:1rem; }
  .hero-desc { max-width:100%;font-size:.82rem; }
  .hero-ctas { flex-wrap:wrap;gap:.6rem;width:100%; }
  .cta-solid,.cta-outline { flex:1;justify-content:center;min-width:130px; }
  .hero-scroll { display:none; }
  .stats-row { grid-template-columns:1fr; }
  .stat-box { border-right:none;border-bottom:1px solid var(--border);padding:1.4rem 1.2rem; }
  .stat-box:last-child { border-bottom:none; }
  .section,.reader,.dash,.analytics,.about { padding-left:1.2rem;padding-right:1.2rem; }
  .reader-layout { padding:1.5rem 1.2rem; }
  .rec-grid { grid-template-columns:1fr; }
  .abt-section-row { grid-template-columns:1fr !important;gap:1rem !important;padding-left:1.2rem !important;padding-right:1.2rem !important; }
  .abt-section-label { position:static !important; }
  .abt-grid-cell { padding:2rem 1.2rem !important;border-right:none !important; }
  .abt-inline-grid { grid-template-columns:1fr !important; }
  .mob-menu { top:82px; }
  .arow { flex-direction:column;gap:.5rem;padding:1.2rem 1rem; }
  .ameta { flex-direction:row;gap:1rem; }
  .anum { display:none; }
  .footer-main { grid-template-columns:1fr;padding:2rem 1.2rem;gap:2rem; }
  .footer-bottom { flex-direction:column;gap:.8rem;padding:1rem 1.2rem; }
  .an-kpis,.kpi-grid { grid-template-columns:1fr 1fr; }
  .dash-body { padding:1rem; }
  .pg-hd,.an-hd { padding:1.5rem 1.2rem 1.2rem; }
  .an-body { padding:1rem 1.2rem; }
  .kpi { padding:1.3rem 1.2rem; }
  .an-kpi { padding:1.3rem 1.2rem; }
  .chat-fab { bottom:.85rem;right:.85rem;width:50px;height:50px;cursor:auto; }
  .chat-popup { position:fixed;bottom:0;left:0;right:0;width:100%;max-height:75vh;height:75vh;border-radius:20px 20px 0 0;border-bottom:none; }
  .sug,.cp-btn,.cp-send,.nav-item,.nav-logo,.cta-solid,.cta-outline { cursor:auto; }
  .arch-section,.caps-section,.node-section { padding-left:1.2rem;padding-right:1.2rem; }
  .caps-grid { grid-template-columns:1fr; }
  .arch-diagram { flex-direction:column;align-items:center; }
  .arch-diagram > div { flex-direction:column;align-items:center; }
  .arch-arrow { transform:rotate(90deg); }
  .arch-node-box { width:160px; }
  .arch-equation { flex-direction:column;gap:.8rem;padding:1.2rem; }
  /* Premium section mobile */
  .prem-section { padding:2.5rem 1.2rem !important; }
  .prem-cards { grid-template-columns:1fr !important; }
  .prem-cta { flex-direction:column;align-items:stretch !important; }
  /* Dashboard mobile */
  .dash-body { grid-template-columns:1fr !important; }
  .two-col { grid-template-columns:1fr !important; }
  .an-grid { grid-template-columns:1fr !important; }
  /* Reader mobile */
  .reader-layout { grid-template-columns:1fr !important;padding:1.2rem !important; }
  .reader-sidebar { display:none; }
  /* About mobile */
  .about { grid-template-columns:1fr !important;padding:2rem 1.2rem !important; }
  .abt-right { display:none; }
  /* Nav wallet btn */
  .nav-wallet-btn { display:none; }
  /* Section padding */
  .section { padding-left:1.2rem !important;padding-right:1.2rem !important; }
  /* Use case grid */
  .use-case-grid { grid-template-columns:1fr !important; }
  /* Kpi 2 col on mobile */
  .kpi-grid { grid-template-columns:repeat(2,1fr) !important; }
  .kpi:nth-child(5) { grid-column:1/-1; }
}

@media(max-width:768px){
  .prem-cards { grid-template-columns:1fr 1fr !important; }
  .two-col { grid-template-columns:1fr !important; }
  .an-grid { grid-template-columns:1fr 1fr !important; }
  .dash-body { grid-template-columns:1fr !important; }
  .reader-layout { gap:1.5rem !important; }
  .section { padding-left:1.5rem !important;padding-right:1.5rem !important; }
}
`;

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

/* ══════════════════════════════
   NEW: Architecture Diagram Component
══════════════════════════════ */
function ArchDiagram(){
  const nodes = [
    {icon:"👤", label:"You", sub:"Input"},
    {icon:"🌐", label:"NoelClaw Gateway", sub:"Interface Layer"},
    {icon:"🤖", label:"Agent System", sub:"Orchestration"},
    {icon:"⚡", label:"Tools / APIs", sub:"Execution"},
  ];
  return(
    <div className="arch-diagram">
      {nodes.map((node,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center"}}>
          <div className="arch-node">
            <div className="arch-node-box">
              <div className="arch-node-icon">{node.icon}</div>
              <div className="arch-node-label">{node.label}</div>
              <div className="arch-node-sub">{node.sub}</div>
            </div>
          </div>
          {i < nodes.length-1 && (
            <div className="arch-arrow">
              <div className="arch-arrow-line"/>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════
   NEW: Agent Capabilities Component
══════════════════════════════ */
function AgentCaps(){
  const caps = [
    {icon:"🔍", title:"Monitor Systems", desc:"Watch infrastructure, services, and data streams in real-time. Get notified when something needs attention."},
    {icon:"⚙️", title:"Run Workflows", desc:"Automate multi-step processes across tools and APIs. Chain actions that previously required manual effort."},
    {icon:"📊", title:"Analyze Data", desc:"Process, interpret, and summarize data from any source. Turn raw information into actionable insights."},
    {icon:"🗂️", title:"Manage Infrastructure", desc:"Interact with cloud services, databases, and dev tools directly through natural language commands."},
    {icon:"🌐", title:"Browse & Interact", desc:"Navigate websites, fill forms, extract content, and interact with web interfaces autonomously."},
    {icon:"🧠", title:"Learn & Adapt", desc:"Build context over time. Each session adds to a growing knowledge base specific to your systems."},
  ];
  return(
    <div className="caps-grid">
      {caps.map((c,i)=>(
        <div className="cap-item" key={i}>
          <div className="cap-icon">{c.icon}</div>
          <div className="cap-title">{c.title}</div>
          <div className="cap-desc">{c.desc}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════
   NEW: Real Use Case Showcase
══════════════════════════════ */
const USE_CASES = [
  {
    id:"monitor",
    label:"System Monitor",
    icon:"🔍",
    tag:"Infrastructure",
    tagColor:"#4d85ff",
    title:"AI that watches your infra 24/7",
    desc:"An agent continuously monitors your servers, APIs, and services. When something breaks, it doesn't just alert you — it diagnoses the issue, checks logs, and suggests a fix.",
    steps:[
      {step:"01", text:"Agent polls 12 health endpoints every 30s"},
      {step:"02", text:"Detects latency spike on /api/checkout"},
      {step:"03", text:"Reads last 500 log lines, isolates DB timeout"},
      {step:"04", text:"Sends Slack alert with root cause + fix suggestion"},
    ],
    result:"Incident detected & diagnosed in 47 seconds",
    resultColor:"#22d3a5",
  },
  {
    id:"research",
    label:"Research Agent",
    icon:"📊",
    tag:"Intelligence",
    tagColor:"#a78bfa",
    title:"Deep research on autopilot",
    desc:"Give the agent a topic. It searches the web, reads papers, cross-references sources, and returns a structured brief — complete with citations and confidence scores.",
    steps:[
      {step:"01", text:"Query: 'competitive landscape of AI agent frameworks'"},
      {step:"02", text:"Searches 40+ sources across web & papers"},
      {step:"03", text:"Extracts key data, removes noise & duplicates"},
      {step:"04", text:"Returns structured brief with 12 cited sources"},
    ],
    result:"Research brief ready in 3 minutes 22 seconds",
    resultColor:"#a78bfa",
  },
  {
    id:"workflow",
    label:"Workflow Automation",
    icon:"⚙️",
    tag:"Automation",
    tagColor:"#f97316",
    title:"Chain actions across your tools",
    desc:"Connect GitHub, Notion, Slack, and your database. The agent handles the handoffs — moving data between tools, triggering actions based on events, and keeping everything in sync.",
    steps:[
      {step:"01", text:"New PR merged on GitHub main branch"},
      {step:"02", text:"Agent reads diff, generates changelog entry"},
      {step:"03", text:"Updates Notion release doc automatically"},
      {step:"04", text:"Posts summary to #releases Slack channel"},
    ],
    result:"4-tool workflow completed in 8 seconds",
    resultColor:"#f97316",
  },
  {
    id:"alpha",
    label:"Alpha Research",
    icon:"📡",
    tag:"Crypto · Premium",
    tagColor:"#22d3a5",
    title:"On-chain signals before CT knows",
    desc:"Agent scans on-chain activity, social sentiment, and dev commits across AI infrastructure projects — surfacing early signals before they hit mainstream crypto Twitter.",
    steps:[
      {step:"01", text:"Monitors 200+ on-chain addresses & GitHub repos"},
      {step:"02", text:"Detects unusual accumulation in AI infra token"},
      {step:"03", text:"Cross-checks dev activity + social sentiment"},
      {step:"04", text:"Generates signal report with confidence score"},
    ],
    result:"Signal detected 6 hours before CT picked it up",
    resultColor:"#22d3a5",
    locked:true,
  },
];

function UseCaseShowcase({walletTier}){
  const [active, setActive] = useState(0);
  const uc = {...USE_CASES[active], locked: USE_CASES[active].locked && walletTier !== "premium"};
  return(
    <div>
      {/* Tabs */}
      <div style={{display:"flex",gap:".5rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
        {USE_CASES.map((u,i)=>(
          <button key={u.id} onClick={()=>setActive(i)} style={{
            display:"inline-flex",alignItems:"center",gap:".45rem",
            padding:".45rem 1rem",borderRadius:"7px",
            background: active===i ? "rgba(26,79,255,.12)" : "none",
            border: active===i ? "1px solid rgba(77,133,255,.35)" : "1px solid var(--border)",
            color: active===i ? "var(--blue-hi)" : "var(--text2)",
            fontSize:".73rem",fontFamily:"'Inter',sans-serif",cursor:"pointer",
            fontWeight: active===i ? 400 : 300,
            letterSpacing:".04em",transition:"all .18s",
            position:"relative",
          }}>
            <span>{u.icon}</span>
            {u.label}
            {u.locked && <span style={{fontSize:".5rem",marginLeft:".2rem"}}>🔒</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="use-case-grid" style={{
        display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",
        background:"var(--border)",border:"1px solid var(--border)",
        borderRadius:"14px",overflow:"hidden",
      }}>
        {/* Left: description */}
        <div style={{padding:"2rem 2.2rem",background:"var(--bg)",position:"relative"}}>
          {uc.locked && (
            <div style={{
              position:"absolute",inset:0,background:"rgba(5,7,14,0.7)",
              backdropFilter:"blur(4px)",display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:".8rem",zIndex:2,
            }}>
              <div style={{fontSize:"2rem"}}>🔒</div>
              <div style={{fontSize:".82rem",color:"var(--text2)",fontWeight:300,textAlign:"center",maxWidth:"200px",lineHeight:1.6}}>
                Hold 20M $NOELCLAW to unlock Alpha Research
              </div>
              <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"var(--blue2)",color:"#fff",padding:".5rem 1.1rem",borderRadius:"6px",fontSize:".72rem",fontWeight:400,textDecoration:"none",letterSpacing:".06em"}}>
                Buy $NOELCLAW
              </a>
            </div>
          )}
          <div style={{fontSize:".55rem",fontWeight:700,padding:".12rem .5rem",borderRadius:"3px",background:`${uc.tagColor}18`,color:uc.tagColor,letterSpacing:".12em",textTransform:"uppercase",display:"inline-block",marginBottom:"1rem"}}>{uc.tag}</div>
          <div style={{fontSize:"1.15rem",fontWeight:300,color:"var(--white)",lineHeight:1.25,marginBottom:".8rem",letterSpacing:"-.01em"}}>{uc.title}</div>
          <div style={{fontSize:".8rem",color:"var(--text2)",lineHeight:1.8,fontWeight:200,marginBottom:"1.5rem"}}>{uc.desc}</div>

          {/* Result badge */}
          <div style={{display:"inline-flex",alignItems:"center",gap:".5rem",padding:".5rem .9rem",borderRadius:"7px",background:`${uc.resultColor}10`,border:`1px solid ${uc.resultColor}30`}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:uc.resultColor,flexShrink:0,boxShadow:`0 0 6px ${uc.resultColor}`}}/>
            <span style={{fontSize:".7rem",color:uc.resultColor,fontWeight:400,letterSpacing:".04em"}}>{uc.result}</span>
          </div>
        </div>

        {/* Right: agent steps terminal */}
        <div style={{background:"#030408",padding:"1.5rem 1.8rem",fontFamily:"'Courier New',monospace",position:"relative"}}>
          {uc.locked && (
            <div style={{
              position:"absolute",inset:0,background:"rgba(5,7,14,0.7)",
              backdropFilter:"blur(4px)",zIndex:2,borderRadius:"inherit",
            }}/>
          )}
          {/* Terminal header */}
          <div style={{display:"flex",alignItems:"center",gap:".4rem",marginBottom:"1.2rem"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#ff5f57"}}/>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#febc2e"}}/>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#28c840"}}/>
            <span style={{marginLeft:".6rem",fontSize:".58rem",color:"rgba(255,255,255,.2)",letterSpacing:".1em"}}>noelclaw-agent — bash</span>
          </div>

          {/* Prompt line */}
          <div style={{fontSize:".68rem",color:"#22d3a5",marginBottom:"1rem",display:"flex",alignItems:"center",gap:".4rem"}}>
            <span style={{opacity:.5}}>$</span>
            <span>noel run --agent {uc.id}</span>
            <span style={{width:"6px",height:"12px",background:"rgba(255,255,255,.5)",animation:"cursor-blink 1s step-end infinite",display:"inline-block"}}/>
          </div>

          {/* Steps */}
          <div style={{display:"flex",flexDirection:"column",gap:".9rem"}}>
            {uc.steps.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:".8rem",alignItems:"flex-start"}}>
                <span style={{fontSize:".56rem",color:"rgba(255,255,255,.2)",fontWeight:400,minWidth:"20px",paddingTop:".1rem",letterSpacing:".04em"}}>{s.step}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:".4rem",marginBottom:".2rem"}}>
                    <div style={{width:"4px",height:"4px",borderRadius:"50%",background:uc.tagColor,flexShrink:0}}/>
                    <span style={{fontSize:".68rem",color:"rgba(255,255,255,.75)",fontWeight:300,lineHeight:1.5,fontFamily:"'Courier New',monospace"}}>{s.text}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Done line */}
          <div style={{marginTop:"1.2rem",paddingTop:"1rem",borderTop:"1px solid rgba(255,255,255,.06)"}}>
            <span style={{fontSize:".65rem",color:"#22d3a5",letterSpacing:".04em"}}>✓ Agent completed successfully</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes cursor-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
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
  const [sidebarOpen,setSidebarOpen] = useState(false);
  // Privy wallet
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets?.[0]?.address ?? null;
  const [walletTier, setWalletTier] = useState(null); // null | "free" | "premium"
  const [walletBalance, setWalletBalance] = useState(0);
  const [verifyingWallet, setVerifyingWallet] = useState(false);

  const convexArticles = useQuery(api.articles.list);
  const sendMessage = useAction(api.chat.chat);
  const postToMoltbook = useAction(api.moltbook.postArticle);
  const getTokenPrice = useAction(api.bankr.getTokenPrice);
  const getRecentTrades = useAction(api.bankr.getRecentTrades);
  const getTrendingBase = useAction(api.bankr.getTrendingBase);
  const getCryptoNews = useAction(api.news.getCryptoNews);
  const getMessariMetrics = useAction(api.news.getMessariMetrics);
  const getTrendingAI = useAction(api.coingecko.getTrendingAI);
  const getTokenMarket = useAction(api.coingecko.getTokenMarket);
  const getTokenHolders = useAction(api.moralis.getTokenHolders);
  const verifyHolder = useAction(api.privy.verifyHolder);
  const postArticleToX = useAction(api.twitter.postArticleToX);
  const generateTweetDraft = useAction(api.twitter.generateTweetDraft);

  const [tokenData, setTokenData] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState(()=>genActivity());
  const [moltPosting, setMoltPosting] = useState(false);
  const [moltStatus, setMoltStatus] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(2);
  const [comments, setComments] = useState([]);
  const [commentVal, setCommentVal] = useState("");
  // Alpha Feed & Token Intel
  const [aiTokens, setAiTokens] = useState([]);
  const [aiTokensLoading, setAiTokensLoading] = useState(false);
  const [holdersData, setHoldersData] = useState(null);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [marketData, setMarketData] = useState(null);

  // New premium
  const [trendingBase, setTrendingBase] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [tradeStats, setTradeStats] = useState(null);
  const [cryptoNews, setCryptoNews] = useState([]);
  const [risingNews, setRisingNews] = useState([]);
  const [messariGlobal, setMessariGlobal] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [marketBrief, setMarketBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefGenerated, setBriefGenerated] = useState(false);
  // X auto-post
  const [tweetDraft, setTweetDraft] = useState("");
  const [tweetPosting, setTweetPosting] = useState(false);
  const [tweetStatus, setTweetStatus] = useState("");
  const [tweetStyle, setTweetStyle] = useState("casual");

  useEffect(()=>{
    const id = setInterval(()=>{
      setActivityFeed(prev=>{
        const name = RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)];
        const city = RANDOM_CITIES[Math.floor(Math.random()*RANDOM_CITIES.length)];
        const tpl = ACT_TEMPLATES[Math.floor(Math.random()*ACT_TEMPLATES.length)];
        const newItem = {name,event:tpl.tmpl(name,city),type:tpl.type,time:"just now"};
        return [newItem,...prev.slice(0,7)];
      });
    },18000);
    return ()=>clearInterval(id);
  },[]);

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

  const fetchAlphaFeed = async () => {
    setAiTokensLoading(true);
    try {
      const trendBase = await getTrendingBase({});
      if (trendBase?.boosted) setTrendingBase(trendBase.boosted.slice(0,6));
    } catch(e) { console.error("TrendingBase:", e.message); }
    try {
      const [trendRes, mktRes] = await Promise.all([getTrendingAI({}), getTokenMarket({})]);
      if (trendRes?.aiTokens) setAiTokens(trendRes.aiTokens.slice(0, 10));
      if (mktRes) setMarketData(mktRes);
    } catch(e) { console.error("CoinGecko:", e.message); }
    setAiTokensLoading(false);
  };

  const fetchRecentTrades = async () => {
    try {
      const res = await getRecentTrades({});
      if (res?.trades) setRecentTrades(res.trades.slice(0,15));
      setTradeStats({ buys5m: res.buys5m, sells5m: res.sells5m, buys1h: res.buys1h, sells1h: res.sells1h, buys24h: res.buys24h, sells24h: res.sells24h, volume24h: res.volume24h });
    } catch(e) { console.error("Trades:", e.message); }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const [newsRes, messariRes] = await Promise.all([
        getCryptoNews({}),
        getMessariMetrics({}),
      ]);
      if (newsRes?.hot) setCryptoNews(newsRes.hot.slice(0,6));
      if (newsRes?.rising) setRisingNews(newsRes.rising.slice(0,4));
      if (messariRes?.global) setMessariGlobal(messariRes.global);
    } catch(e) { console.error("News:", e.message); }
    setNewsLoading(false);
  };

  const generateMarketBrief = async () => {
    if (briefLoading) return;
    setBriefLoading(true);
    setBriefGenerated(false);
    try {
      const cgCtx = aiTokens.slice(0,4).map(t=>`${t.symbol} ${t.priceChange24h>=0?"+":""}${t.priceChange24h?.toFixed(1)}%`).join(", ");
      const topH = holdersData?.topHolders?.[0];
      const newsCtx = cryptoNews.slice(0,3).map(n=>n.title).join(" | ");
      const tradeCtx = tradeStats ? `Buys 24h: ${tradeStats.buys24h}, Sells 24h: ${tradeStats.sells24h}, Vol: $${(tradeStats.volume24h||0).toLocaleString()}` : "";
      const prompt = `You are NoelClaw AI, a personal AI OS on Base chain. Write a sharp daily market brief for $NOELCLAW holders.

Live data:
- AI tokens: ${cgCtx||"loading"}
- $NOELCLAW trades: ${tradeCtx}
- Top holder: ${topH?.address?.slice(0,8)||"—"} (${parseFloat(topH?.balance||0).toFixed(0)}M tokens)
- Breaking news: ${newsCtx||"no data"}
- Date: ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}

3 tight paragraphs: macro AI crypto conditions, $NOELCLAW on-chain observations, one forward-looking take. Direct, opinionated, no fluff.`;

      const res = await sendMessage({ messages:[{ role:"user", content:prompt }] });
      setMarketBrief(res);
      setBriefGenerated(true);
    } catch(e) {
      setMarketBrief("Error: " + e.message);
      setBriefGenerated(true);
    }
    setBriefLoading(false);
  };

  const fetchHolders = async () => {
    setHoldersLoading(true);
    try {
      const res = await getTokenHolders({});
      setHoldersData(res);
    } catch(e) { console.error("Holders:", e.message); }
    setHoldersLoading(false);
  };



  const verifyWalletHolder = async (address) => {
    if (!address) return;
    setVerifyingWallet(true);
    try {
      const res = await verifyHolder({ walletAddress: address });
      setWalletTier(res.tier);
      setWalletBalance(res.balance);
    } catch(e) {
      setWalletTier("free");
    }
    setVerifyingWallet(false);
  };

  // Auto-verify when wallet connects
  useEffect(() => {
    if (authenticated && walletAddress) {
      verifyWalletHolder(walletAddress);
    } else if (!authenticated) {
      setWalletTier(null);
      setWalletBalance(0);
    }
  }, [authenticated, walletAddress]);

  useEffect(() => {
    if (walletTier === "premium") {
      fetchAlphaFeed();
      fetchHolders();
      fetchRecentTrades();
      fetchNews();
    }
  }, [walletTier]);

  // Auto-refresh realtime: trades 15s, price 30s, alpha 60s, news 3min
  useEffect(() => {
    if (walletTier !== "premium") return;
    const tradesId = setInterval(() => { fetchRecentTrades(); }, 15000);
    const priceId  = setInterval(() => { fetchTokenPrice();   }, 30000);
    const alphaId  = setInterval(() => { fetchAlphaFeed();    }, 60000);
    const newsId   = setInterval(() => { fetchNews();         }, 180000);
    return () => { clearInterval(tradesId); clearInterval(priceId); clearInterval(alphaId); clearInterval(newsId); };
  }, [walletTier]);

  const handleGenerateTweet = async () => {
    if (!art) return;
    setTweetPosting(true);
    setTweetStatus("");
    try {
      const res = await generateTweetDraft({ title: art.title, desc: art.desc, style: tweetStyle });
      setTweetDraft(res.draft.replace("[URL]", "https://noelclaw.fun"));
    } catch(e) {
      setTweetStatus("Draft failed: " + e.message);
    }
    setTweetPosting(false);
  };

  const handlePostToX = async () => {
    if (!art || !tweetDraft) return;
    setTweetPosting(true);
    setTweetStatus("");
    try {
      const res = await postArticleToX({
        title: art.title,
        desc: tweetDraft,
        url: "https://noelclaw.fun",
        tags: art.tags,
      });
      setTweetStatus(`Posted! 𝕏 View → ${res.url}`);
      setTweetDraft("");
    } catch(e) {
      setTweetStatus("Failed: " + e.message);
    }
    setTweetPosting(false);
  };

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

  const navTo=p=>{setPage(p);setArt(null);window.scrollTo({top:0,behavior:"instant"});setMenuOpen(false);if(p==="dashboard"){fetchTokenPrice();fetchAlphaFeed();fetchHolders();fetchRecentTrades();fetchNews();}};
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
        {/* SIDEBAR */}
        <div className="sidebar-zone" onMouseEnter={()=>setSidebarOpen(true)}/>
        <div className={`sidebar${sidebarOpen?" open":""}`} onMouseLeave={()=>setSidebarOpen(false)}>
          <div className="sb-logo" style={{cursor:"pointer"}} onClick={()=>{navTo("home");setSidebarOpen(false);}}>
            <div className="sb-logo-name"><em>Noel</em>Claw</div>
            <div className="sb-logo-sub">Personal AI OS</div>
          </div>
          <div className="sb-section">
            <span className="sb-label">Navigate</span>
            {[["home","⌂","Home"],["articles","✦","Articles"],["dashboard","⚡","Dashboard"],["analytics","📊","Analytics"],["about","◎","About"]].map(([p,icon,label])=>(
              <button key={p} className={`sb-item${page===p&&!art?" active":""}`} onClick={()=>{navTo(p);setSidebarOpen(false);}}>
                <span className="sb-icon">{icon}</span>{label}
              </button>
            ))}
          </div>
          <div className="sb-divider"/>
          <div className="sb-section">
            <span className="sb-label">External</span>
            <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer" className="sb-item" onClick={()=>setSidebarOpen(false)}>
              <span className="sb-icon">𝕏</span>@noelclawfun
            </a>
            <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" className="sb-item" onClick={()=>setSidebarOpen(false)}>
              <span className="sb-icon">🦕</span>Buy $NOELCLAW
            </a>
          </div>
          <div className="sb-footer">
            {walletTier==="premium"?<span style={{color:"var(--green)"}}>✦ Premium Holder</span>
            :authenticated?<span>{walletAddress?.slice(0,6)}…{walletAddress?.slice(-4)}</span>
            :<button onClick={()=>{login();setSidebarOpen(false);}} style={{background:"none",border:"none",color:"var(--blue-hi)",cursor:"pointer",fontSize:".62rem",fontFamily:"inherit",padding:0}}>🔗 Connect Wallet</button>}
          </div>
        </div>

        {/* ── TICKER BAR ── */}
        <div style={{width:"100%",background:"#03050c",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:".35rem 0",display:"flex",alignItems:"center",overflow:"hidden",position:"sticky",top:0,zIndex:201}}>
          <div style={{display:"flex",alignItems:"center",gap:"1.8rem",animation:"ca-scroll 28s linear infinite",whiteSpace:"nowrap",willChange:"transform",fontSize:".75rem",letterSpacing:".07em",color:"rgba(180,190,220,0.8)"}}>
            {[0,1].map(i=>(
              <span key={i} style={{display:"flex",alignItems:"center",gap:"1.8rem"}}>
                <span style={{display:"flex",alignItems:"center",gap:".45rem"}}>
                  <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"var(--green)",display:"inline-block",flexShrink:0}}/>
                  <span style={{color:"#4d85ff",fontWeight:600,letterSpacing:".14em"}}>$NOELCLAW</span>
                </span>
                <span style={{width:3,height:3,borderRadius:"50%",background:"#4d85ff",display:"inline-block",opacity:.4,flexShrink:0}}/>
                <span style={{fontFamily:"monospace",cursor:"pointer"}} onClick={()=>navigator.clipboard.writeText("0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3")} title="Copy CA">
                  CA: 0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3
                </span>
                <span style={{opacity:.4}}>·</span>
                <a href="https://takeover.fun/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" style={{color:"#22d3a5",textDecoration:"none"}}>Mint Tiles ↗</a>
                <span style={{opacity:.4}}>·</span>
                <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:".35rem",color:"rgba(180,190,220,0.7)",textDecoration:"none"}}>
                  <svg width="11" height="11" viewBox="0 0 1200 1227" fill="currentColor"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/></svg>
                  @noelclawfun
                </a>
                <span style={{opacity:.4}}>·</span>
                <a href="https://dexscreener.com/base/0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:".35rem",color:"rgba(180,190,220,0.7)",textDecoration:"none"}}>
                  <img src="https://dexscreener.com/favicon.ico" style={{width:"11px",height:"11px",borderRadius:"2px",objectFit:"cover",flexShrink:0}} alt=""/>
                  DexScreener
                </a>
                <span style={{opacity:.4}}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── NAV ── */}
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
            {/* Wallet Connect */}
            {ready && (
              !authenticated ? (
                <button onClick={login} style={{display:"flex",alignItems:"center",gap:".4rem",background:"rgba(26,79,255,.12)",border:"1px solid rgba(77,133,255,.3)",borderRadius:"7px",padding:".38rem .85rem",color:"var(--blue-hi)",fontSize:".72rem",fontFamily:"inherit",cursor:"pointer",letterSpacing:".06em",fontWeight:400,transition:"all .2s",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(26,79,255,.2)";e.currentTarget.style.borderColor="rgba(77,133,255,.6)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,79,255,.12)";e.currentTarget.style.borderColor="rgba(77,133,255,.3)";}}
                >
                  🔗 Connect
                </button>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                  {verifyingWallet ? (
                    <span style={{fontSize:".6rem",color:"var(--text3)",letterSpacing:".08em"}}>Verifying…</span>
                  ) : walletTier === "premium" ? (
                    <span style={{display:"flex",alignItems:"center",gap:".3rem",fontSize:".62rem",color:"var(--green)",background:"rgba(34,211,165,.1)",border:"1px solid rgba(34,211,165,.2)",borderRadius:"5px",padding:".25rem .6rem",letterSpacing:".08em",fontWeight:500}}>
                      ✦ Premium
                    </span>
                  ) : (
                    <span style={{fontSize:".62rem",color:"var(--text3)",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"5px",padding:".25rem .6rem",letterSpacing:".06em"}}>
                      {walletAddress?.slice(0,4)}…{walletAddress?.slice(-4)}
                    </span>
                  )}
                  <button onClick={logout} style={{background:"none",border:"1px solid var(--border)",borderRadius:"5px",padding:".25rem .55rem",color:"var(--text3)",fontSize:".6rem",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",letterSpacing:".06em"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)";}}
                  >✕</button>
                </div>
              )
            )}
            <button className="nav-burger" onClick={()=>setMenuOpen(o=>!o)}>
              <span/><span/><span/>
            </button>
          </div>
        </nav>
        {menuOpen&&(
          <>
          <div className="mob-overlay" onClick={()=>setMenuOpen(false)}/>
          <div className="mob-menu">
            {["home","articles","dashboard","analytics","about"].map(p=>(
              <button key={p} className={`mob-item${page===p&&!art?" active":""}`} onClick={()=>{navTo(p);setMenuOpen(false);}}>
                {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
          </>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="main">

          {/* READER */}
          {art&&(
            <div className="reader-layout" style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:"2.5rem",padding:"2rem 3.5rem",maxWidth:"1200px",margin:"0 auto"}}>
              <div className="reader-main">
                <button className="rback" onClick={()=>setArt(null)}>← Back</button>
                <div className="rtags">{art.tags.map(t=><span key={t.k} className={`atag ${t.c}`}>{t.k}</span>)}</div>
                <h1 className="rtitle">{art.title}</h1>
                <div className="rmeta">
                  <span className="rdate">{art.date}</span><div className="rsep"/>
                  <span className="rmin">{art.read} read</span>
                </div>
                <div className="rbody">{renderBody(art.body)}</div>
                <div className="like-bar">
                  <button className={`like-btn${liked?" liked":""}`} onClick={()=>{setLiked(l=>!l);setLikeCount(c=>liked?c-1:c+1);}}>
                    <span className="like-icon">{liked?"❤️":"🤍"}</span> {liked?"Liked":"Like"}
                  </button>
                  <span className="like-count">{likeCount} likes</span>
                </div>
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--border)",borderRadius:"10px",padding:"1rem 1.2rem",margin:"1.5rem 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:".8rem"}}>
                  <div style={{fontSize:".78rem",color:"var(--text2)"}}>Share this article</div>
                  <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(art.title+" — "+art.desc+" noelclaw.fun @noelclawfun")}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:".35rem",background:"#000",border:"1px solid var(--border)",borderRadius:"6px",padding:".38rem .8rem",fontSize:".72rem",color:"var(--white)",textDecoration:"none"}}>𝕏 Share on X</a>
                    <button onClick={()=>navigator.clipboard.writeText("https://noelclaw.fun")} style={{display:"inline-flex",alignItems:"center",gap:".35rem",background:"none",border:"1px solid var(--border)",borderRadius:"6px",padding:".38rem .8rem",fontSize:".72rem",color:"var(--text2)",cursor:"pointer",fontFamily:"inherit"}}>🔗 Copy Link</button>
                  </div>
                </div>
                <div className="rfooter">
                  <span className="rfooter-t">Thanks for reading — NoelClaw</span>
                  <div style={{display:"flex",alignItems:"center",gap:".8rem",flexWrap:"wrap"}}>
                    {moltStatus && <span style={{fontSize:".72rem",color:"var(--green)"}}>{moltStatus}</span>}
                    <button onClick={handleMoltPost} disabled={moltPosting} style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"none",border:"1px solid var(--border)",borderRadius:"6px",padding:".4rem .9rem",fontSize:".72rem",color:"var(--text2)",cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}
                    onMouseEnter={e=>{e.target.style.borderColor="var(--border2)";e.target.style.color="var(--white)";}}
                    onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--text2)";}}>
                      {moltPosting ? "Posting..." : "🦞 Post to Moltbook"}
                    </button>
                    <a className="rfooter-x" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">𝕏 @noelclawfun →</a>
                  </div>
                </div>

                {/* ── AUTO-POST TO X ── */}
                <div style={{background:"rgba(0,0,0,.3)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1.2rem 1.4rem",margin:"1.5rem 0"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:".5rem"}}>
                    <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                      <svg width="14" height="14" viewBox="0 0 1200 1227" fill="var(--white)"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284Z"/></svg>
                      <span style={{fontSize:".62rem",fontWeight:600,color:"var(--white)",letterSpacing:".12em",textTransform:"uppercase"}}>Auto-post to X</span>
                    </div>
                    <div style={{display:"flex",gap:".3rem"}}>
                      {["casual","technical","hype"].map(s=>(
                        <button key={s} onClick={()=>setTweetStyle(s)} style={{fontSize:".55rem",padding:".18rem .5rem",borderRadius:"4px",background:tweetStyle===s?"rgba(26,79,255,.2)":"var(--surface)",border:tweetStyle===s?"1px solid rgba(77,133,255,.4)":"1px solid var(--border)",color:tweetStyle===s?"var(--blue-hi)":"var(--text3)",cursor:"pointer",fontFamily:"inherit",letterSpacing:".06em",textTransform:"uppercase",fontWeight:tweetStyle===s?500:300}}>{s}</button>
                      ))}
                    </div>
                  </div>
                  {!tweetDraft ? (
                    <button onClick={handleGenerateTweet} disabled={tweetPosting}
                      style={{display:"flex",alignItems:"center",gap:".45rem",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"7px",padding:".55rem 1rem",color:"var(--text2)",fontSize:".73rem",cursor:"pointer",fontFamily:"inherit",transition:"all .2s",width:"100%",justifyContent:"center"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text2)";}}
                    >
                      {tweetPosting ? "✦ Generating…" : "✦ Generate tweet draft"}
                    </button>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:".7rem"}}>
                      <textarea value={tweetDraft} onChange={e=>setTweetDraft(e.target.value)} rows={3}
                        style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid var(--border)",borderRadius:"8px",padding:".65rem .85rem",color:"var(--text)",fontSize:".78rem",fontFamily:"'Inter',sans-serif",fontWeight:300,resize:"vertical",outline:"none",lineHeight:1.65,transition:"border-color .2s"}}
                        onFocus={e=>e.target.style.borderColor="rgba(26,79,255,.4)"}
                        onBlur={e=>e.target.style.borderColor="var(--border)"}
                      />
                      <div style={{display:"flex",alignItems:"center",gap:".6rem",flexWrap:"wrap"}}>
                        <span style={{fontSize:".6rem",color:tweetDraft.length>280?"#ff4d4d":"var(--text3)"}}>{tweetDraft.length}/280</span>
                        <div style={{flex:1}}/>
                        <button onClick={()=>{setTweetDraft("");setTweetStatus("");}} style={{background:"none",border:"1px solid var(--border)",borderRadius:"6px",padding:".38rem .75rem",fontSize:".68rem",color:"var(--text3)",cursor:"pointer",fontFamily:"inherit"}}>Discard</button>
                        <button onClick={handleGenerateTweet} disabled={tweetPosting} style={{background:"none",border:"1px solid var(--border)",borderRadius:"6px",padding:".38rem .75rem",fontSize:".68rem",color:"var(--text2)",cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate</button>
                        <button onClick={handlePostToX} disabled={tweetPosting||tweetDraft.length>280}
                          style={{display:"flex",alignItems:"center",gap:".4rem",background:"#000",border:"1px solid rgba(255,255,255,.2)",borderRadius:"6px",padding:".38rem .9rem",fontSize:".72rem",color:"var(--white)",cursor:"pointer",fontFamily:"inherit",fontWeight:400,transition:"all .2s"}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.5)"}
                          onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.2)"}
                        >{tweetPosting?"Posting…":"𝕏 Post now"}</button>
                      </div>
                    </div>
                  )}
                  {tweetStatus && (
                    <div style={{marginTop:".6rem",fontSize:".7rem",color:tweetStatus.startsWith("Failed")?"#ff4d4d":"var(--green)",lineHeight:1.5}}>{tweetStatus}</div>
                  )}
                </div>

                <div className="comment-section">
                  <div className="comment-title">Comments ({comments.length})</div>
                  <div className="comment-input-wrap">
                    <textarea className="comment-inp" rows={2} placeholder="Share your thoughts..." value={commentVal} onChange={e=>setCommentVal(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&commentVal.trim()){e.preventDefault();setComments(c=>[...c,{id:Date.now(),name:"You",initial:"Y",text:commentVal.trim(),time:"just now",color:"#22d3a5"}]);setCommentVal("");}}}
                    />
                    <button className="comment-submit" onClick={()=>{if(commentVal.trim()){setComments(c=>[...c,{id:Date.now(),name:"You",initial:"Y",text:commentVal.trim(),time:"just now",color:"#22d3a5"}]);setCommentVal("");}}} disabled={!commentVal.trim()}>Post</button>
                  </div>
                  <div className="comment-list">
                    {comments.map(c=>(
                      <div key={c.id} className="comment-item">
                        <div className="comment-meta">
                          <div className="comment-avatar" style={{background:c.color}}>{c.initial}</div>
                          <span className="comment-name">{c.name}</span>
                          <span className="comment-time">{c.time}</span>
                        </div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {ARTICLES.filter(a2=>a2.title!==art.title).length>0&&(
                  <div className="rec-section">
                    <div className="rec-title">More to read</div>
                    <div className="rec-grid">
                      {ARTICLES.filter(a2=>a2.title!==art.title).slice(0,4).map((a2,i)=>(
                        <div key={i} className="rec-card" onClick={()=>{setArt(a2);window.scrollTo({top:0,behavior:'instant'});}}>
                          <div className="rec-tags">{a2.tags?.map(t=><span key={t.k} className={`atag ${t.c}`}>{t.k}</span>)}</div>
                          <div className="rec-card-title">{a2.title}</div>
                          <div className="rec-card-desc">{a2.desc}</div>
                          <div className="rec-card-meta">{a2.date} · {a2.read} read</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="reader-sidebar">
                <div className="rsb-card">
                  <div className="rsb-title">About this article</div>
                  <div style={{fontSize:".75rem",color:"var(--text2)",lineHeight:1.7,marginBottom:".8rem"}}>{art.desc}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:".3rem"}}>{art.tags?.map(t=><span key={t.k} className={`atag ${t.c}`}>{t.k}</span>)}</div>
                </div>
                <div className="rsb-card" style={{background:"linear-gradient(135deg,rgba(26,79,255,.08),rgba(77,133,255,.04))"}}>
                  <div className="rsb-title">Enjoying NoelClaw?</div>
                  <p style={{fontSize:".73rem",color:"var(--text2)",lineHeight:1.65,marginBottom:"1rem"}}>Follow on X for real-time updates as we build in public.</p>
                  <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"#000",border:"1px solid var(--border)",borderRadius:"6px",padding:".45rem .9rem",fontSize:".72rem",color:"var(--white)",textDecoration:"none"}}>
                    𝕏 Follow @noelclawfun
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* HOME */}
          {!art&&page==="home"&&(
            <div className="page">
              {/* HERO — updated with new tagline */}
              <section className="hero">
                <div className="hero-bg"/>
                <div className="hero-curve-left"/>
                <div className="hero-vignette"/>
                <div className="hero-content">
                  <div className="hero-eyebrow">Personal AI Operating System</div>
                  <h1 className="hero-h1">
                    Your AI.<br/>
                    Your system.<br/>
                    <em>Your data.</em>
                  </h1>
                  <p className="hero-tagline">
                    NoelClaw lets your personal AI <strong>operate real software systems</strong> — not just chat. An autonomous AI node that runs agents across your infrastructure.
                  </p>
                  <div className="hero-bottom">
                    <p className="hero-desc">Building composable agents, documenting every decision, shipping in public on Base.</p>
                    <div className="hero-ctas">
                      <button className="cta-solid" onClick={()=>navTo("articles")}>Read Articles</button>
                      <a className="cta-outline" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">𝕏 Follow</a>
                      <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" className="cta-outline" style={{boxShadow:"0 0 20px rgba(26,79,255,.2)"}}>
                        Buy $NOELCLAW
                      </a>
                    </div>
                  </div>
                </div>
                <div className="hero-scroll"><span>Scroll</span><div className="scroll-line"/></div>
              </section>

              {/* STATS */}
              <div className="stats-row">
                {[["12+","Articles Published"],["3","AI Systems Built"],["Live","Deployment Status"]].map(([n,l])=>(
                  <div className="stat-box" key={l}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
                ))}
              </div>

              {/* ── PREMIUM / TOKEN-GATED FEATURES ── */}
              <div className="prem-section" style={{padding:"4rem 3.5rem",borderBottom:"1px solid var(--border)",background:"linear-gradient(180deg,rgba(26,79,255,0.04) 0%,transparent 100%)",position:"relative",overflow:"hidden"}}>
                {/* BG glow */}
                <div style={{position:"absolute",top:"-60px",left:"50%",transform:"translateX(-50%)",width:"600px",height:"300px",background:"radial-gradient(ellipse,rgba(26,79,255,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>

                <div style={{position:"relative",zIndex:1}}>
                  {walletTier==="premium" ? (
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:".8rem",marginBottom:"1.5rem"}}>
                        <span style={{fontSize:".58rem",color:"var(--green)",letterSpacing:".18em",textTransform:"uppercase",fontWeight:500}}>✦ Premium Access Unlocked</span>
                        <span style={{fontSize:".52rem",color:"var(--text3)",letterSpacing:".06em"}}>{walletAddress?.slice(0,6)}…{walletAddress?.slice(-4)}</span>
                      </div>

                      {/* Row 1: Alpha Feed + Smart Money Wallets */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>

                        {/* Alpha Feed - 10 AI tokens + NOELCLAW */}
                        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden"}}>
                          <div style={{padding:".8rem 1rem",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.015)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                              <span style={{fontSize:".75rem",lineHeight:1}}>📡</span>
                              <span style={{fontSize:".68rem",color:"var(--white)",fontWeight:500}}>Alpha Feed</span>
                            </div>
                            <div style={{display:"flex",gap:".3rem"}}>
                              <span style={{fontSize:".4rem",background:"rgba(34,211,165,.1)",color:"var(--green)",border:"1px solid rgba(34,211,165,.2)",borderRadius:"20px",padding:".08rem .35rem",fontWeight:600,letterSpacing:".06em"}}>CG</span>
                              <span style={{fontSize:".4rem",background:"rgba(26,79,255,.12)",color:"var(--blue-hi)",border:"1px solid rgba(77,133,255,.25)",borderRadius:"20px",padding:".08rem .35rem",fontWeight:600,letterSpacing:".06em"}}>DEX</span>
                            </div>
                          </div>

                          {/* NOELCLAW row — always first */}
                          {tokenData&&(
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".45rem 1rem",borderBottom:"1px solid rgba(77,133,255,.15)",background:"rgba(26,79,255,.06)"}}>
                              <div style={{display:"flex",alignItems:"center",gap:".55rem"}}>
                                <img src="/logo.png" alt="NOELCLAW" style={{width:"20px",height:"20px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}
                                  onError={e=>{e.target.style.display="none";}}/>
                                <div>
                                  <div style={{fontSize:".68rem",color:"var(--blue-hi)",fontWeight:600,lineHeight:1,letterSpacing:".04em"}}>$NOELCLAW</div>
                                  <div style={{fontSize:".5rem",color:"var(--text3)",marginTop:".1rem"}}>
                                    {(()=>{
                                      const p = parseFloat(tokenData.price||0);
                                      if(p<=0) return "—";
                                      const s = p.toFixed(12);
                                      const m = s.match(/^0\.(0+)([1-9]\d*)/);
                                      if(m && m[1].length>=2) return "$0.0 "+m[2].slice(0,4);
                                      return "$"+p.toFixed(6);
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:".68rem",fontWeight:600,color:(parseFloat(tokenData.priceChange24h||0))>=0?"var(--green)":"#ff6b6b"}}>
                                  {(parseFloat(tokenData.priceChange24h||0))>=0?"+":""}{parseFloat(tokenData.priceChange24h||0).toFixed(1)}%
                                </div>
                                <div style={{fontSize:".48rem",color:"var(--text3)"}}>24h</div>
                              </div>
                            </div>
                          )}

                          {/* AI token rows */}
                          {aiTokens.slice(0,10).map((t,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".4rem 1rem",borderBottom:i<9?"1px solid rgba(255,255,255,.04)":"none",transition:"background .15s",cursor:"default"}}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.025)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                                {t.image ? (
                                  <img src={t.image} alt={t.symbol} style={{width:"18px",height:"18px",borderRadius:"50%",objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
                                ) : (
                                  <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(77,133,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".48rem",color:"var(--blue-hi)",fontWeight:700,flexShrink:0}}>{t.symbol?.slice(0,2)}</div>
                                )}
                                <div>
                                  <div style={{fontSize:".66rem",color:"var(--text)",fontWeight:500,lineHeight:1}}>{t.symbol}</div>
                                  <div style={{fontSize:".5rem",color:"var(--text3)",marginTop:".1rem"}}>
                                    {t.price ? "$"+parseFloat(t.price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) : <span style={{opacity:.4}}>—</span>}
                                  </div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:".66rem",fontWeight:500,color:(t.priceChange24h||0)>=0?"var(--green)":"#ff6b6b"}}>
                                  {(t.priceChange24h||0)>=0?"+":""}{(t.priceChange24h||0).toFixed(1)}%
                                </div>
                                <div style={{fontSize:".48rem",color:"var(--text3)",marginTop:".1rem"}}>
                                  ${((t.volume24h||0)/1e6).toFixed(1)}M vol
                                </div>
                              </div>
                            </div>
                          ))}
                          {aiTokens.length===0&&(
                            <div style={{padding:"1.5rem 1rem",display:"flex",alignItems:"center",gap:".5rem"}}>
                              <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--green)",animation:"pulse 1.5s infinite",display:"inline-block",flexShrink:0}}/>
                              <span style={{fontSize:".68rem",color:"var(--text3)"}}>Loading AI tokens…</span>
                            </div>
                          )}
                        </div>

                        {/* Smart Money Wallets */}
                        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden"}}>
                          <div style={{padding:".8rem 1rem",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.015)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                              <span style={{fontSize:".75rem",lineHeight:1}}>🧠</span>
                              <span style={{fontSize:".68rem",color:"var(--white)",fontWeight:500}}>Smart Money</span>
                            </div>
                            <span style={{fontSize:".44rem",background:"rgba(34,211,165,.08)",color:"var(--green)",border:"1px solid rgba(34,211,165,.2)",borderRadius:"20px",padding:".1rem .45rem",fontWeight:600,letterSpacing:".06em"}}>LIVE</span>
                          </div>

                          {/* Derived from recent trades — top unique wallets by volume */}
                          {(()=>{
                            // Build smart money from recentTrades tx hashes as proxy wallets
                            const walletMap = {};
                            recentTrades.forEach((t)=>{
                              const key = t.txHash ? t.txHash.slice(2,10).toUpperCase() : null;
                              if(!key) return;
                              if(!walletMap[key]) walletMap[key]={buys:0,sells:0,vol:0,lastType:t.type,lastTime:t.timestamp||0,txHash:t.txHash};
                              if(t.type==="buy") walletMap[key].buys++;
                              else walletMap[key].sells++;
                              walletMap[key].vol += parseFloat(t.amountUsd||0);
                              if((t.timestamp||0) > walletMap[key].lastTime){
                                walletMap[key].lastTime = t.timestamp||0;
                                walletMap[key].lastType = t.type;
                              }
                            });
                            const wallets = Object.entries(walletMap)
                              .map(([addr,d])=>({addr,...d}))
                              .sort((a,b)=>b.vol-a.vol)
                              .slice(0,8);

                            if(wallets.length===0) return (
                              <div style={{padding:"1.5rem 1rem",display:"flex",alignItems:"center",gap:".5rem"}}>
                                <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--blue-hi)",animation:"pulse 1.5s infinite",display:"inline-block",flexShrink:0}}/>
                                <span style={{fontSize:".68rem",color:"var(--text3)"}}>Loading wallet data…</span>
                              </div>
                            );

                            return wallets.map((w,i)=>{
                              const tier = w.vol > 500 ? {label:"🐋 WHALE",color:"#a78bfa"} : w.vol > 100 ? {label:"🦈 SHARK",color:"var(--blue-hi)"} : {label:"🐬 DOLPH",color:"var(--green)"};
                              const ago = w.lastTime ? (()=>{
                                const diff = Math.floor((Date.now()-w.lastTime)/1000);
                                if(diff<60) return diff+"s ago";
                                if(diff<3600) return Math.floor(diff/60)+"m ago";
                                return Math.floor(diff/3600)+"h ago";
                              })() : "—";
                              const winRate = w.buys+w.sells > 0 ? Math.round((w.buys/(w.buys+w.sells))*100) : 0;
                              return (
                                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:".5rem 1rem",borderBottom:i<7?"1px solid rgba(255,255,255,.04)":"none",transition:"background .15s"}}
                                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.025)"}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                  <div style={{display:"flex",alignItems:"center",gap:".55rem"}}>
                                    <div style={{width:"28px",height:"28px",borderRadius:"50%",background:`rgba(255,255,255,.06)`,border:`1px solid ${tier.color}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                      <span style={{fontSize:".7rem",lineHeight:1}}>{w.lastType==="buy"?"▲":"▼"}</span>
                                    </div>
                                    <div>
                                      <div style={{display:"flex",alignItems:"center",gap:".3rem"}}>
                                        <a href={`https://basescan.org/tx/${w.txHash}`} target="_blank" rel="noopener noreferrer"
                                          style={{fontSize:".62rem",color:"var(--text)",fontFamily:"monospace",fontWeight:500,textDecoration:"none",letterSpacing:".04em"}}
                                          onMouseEnter={e=>e.currentTarget.style.color="var(--blue-hi)"}
                                          onMouseLeave={e=>e.currentTarget.style.color="var(--text)"}
                                        >{w.addr}</a>
                                        <span style={{fontSize:".44rem",color:tier.color,background:tier.color+"18",border:`1px solid ${tier.color}33`,borderRadius:"3px",padding:".05rem .28rem",fontWeight:700,letterSpacing:".06em"}}>{tier.label.split(" ")[1]}</span>
                                      </div>
                                      <div style={{display:"flex",gap:".5rem",marginTop:".15rem"}}>
                                        <span style={{fontSize:".5rem",color:"var(--text3)"}}>{ago}</span>
                                        <span style={{fontSize:".5rem",color:"var(--green)"}}>B:{w.buys}</span>
                                        <span style={{fontSize:".5rem",color:"#ff6b6b"}}>S:{w.sells}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{textAlign:"right"}}>
                                    <div style={{fontSize:".65rem",color:"var(--white)",fontWeight:500,fontFamily:"monospace"}}>${w.vol.toFixed(0)}</div>
                                    <div style={{fontSize:".48rem",color:w.lastType==="buy"?"var(--green)":"#ff6b6b",marginTop:".15rem",fontWeight:600}}>{w.lastType==="buy"?"↑ BUY":"↓ SELL"}</div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Row 2: Recent Trades - DexScreener style */}
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden",marginBottom:"1rem"}}>
                        {/* Header */}
                        <div style={{padding:".9rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,.015)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                            <img src="/logo.png" alt="NOELCLAW" style={{width:"18px",height:"18px",borderRadius:"50%",objectFit:"cover"}}/>
                            <span style={{fontSize:".72rem",color:"var(--white)",fontWeight:500,letterSpacing:".04em"}}>$NOELCLAW Activity</span>
                            <span style={{display:"flex",alignItems:"center",gap:".3rem",fontSize:".52rem",color:"var(--green)",letterSpacing:".06em",background:"rgba(34,211,165,.08)",border:"1px solid rgba(34,211,165,.2)",borderRadius:"20px",padding:".1rem .45rem"}}>
                              <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--green)",display:"inline-block",animation:"pulse 2s ease-in-out infinite",flexShrink:0}}/>
                              LIVE
                            </span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                            {tradeStats&&(
                              <div style={{display:"flex",gap:".8rem"}}>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".1em"}}>5M</span>
                                  <div style={{display:"flex",gap:".3rem"}}>
                                    <span style={{fontSize:".58rem",color:"var(--green)",fontWeight:600}}>{tradeStats.buys5m}</span>
                                    <span style={{fontSize:".58rem",color:"#ff6b6b",fontWeight:600}}>{tradeStats.sells5m}</span>
                                  </div>
                                </div>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".1em"}}>1H</span>
                                  <div style={{display:"flex",gap:".3rem"}}>
                                    <span style={{fontSize:".58rem",color:"var(--green)",fontWeight:600}}>{tradeStats.buys1h}</span>
                                    <span style={{fontSize:".58rem",color:"#ff6b6b",fontWeight:600}}>{tradeStats.sells1h}</span>
                                  </div>
                                </div>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".1em"}}>24H</span>
                                  <div style={{display:"flex",gap:".3rem"}}>
                                    <span style={{fontSize:".58rem",color:"var(--green)",fontWeight:600}}>{tradeStats.buys24h}</span>
                                    <span style={{fontSize:".58rem",color:"#ff6b6b",fontWeight:600}}>{tradeStats.sells24h}</span>
                                  </div>
                                </div>
                                <div style={{width:"1px",background:"var(--border)",alignSelf:"stretch"}}/>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".1em"}}>VOL 24H</span>
                                  <span style={{fontSize:".58rem",color:"var(--text2)",fontWeight:500}}>${parseFloat(tradeStats.volume24h||0)>=1000 ? (parseFloat(tradeStats.volume24h||0)/1000).toFixed(1)+"k" : parseFloat(tradeStats.volume24h||0).toFixed(0)}</span>
                                </div>
                              </div>
                            )}
                            <button onClick={fetchRecentTrades}
                              style={{background:"none",border:"1px solid var(--border)",borderRadius:"5px",padding:".22rem .6rem",color:"var(--text3)",fontSize:".58rem",cursor:"pointer",fontFamily:"inherit",letterSpacing:".06em",display:"flex",alignItems:"center",gap:".3rem",transition:"all .18s"}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text)";}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)";}}>
                              ↻ Refresh
                            </button>
                          </div>
                        </div>

                        {/* Column headers */}
                        <div style={{display:"grid",gridTemplateColumns:"72px 68px 90px 110px 130px 80px 32px",gap:0,padding:".45rem 1.2rem",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.008)"}}>
                          {["DATE","TYPE","USD","NOELCLAW","PRICE","MAKER","TXN"].map(h=>(
                            <span key={h} style={{fontSize:".45rem",color:"var(--text3)",letterSpacing:".12em",fontWeight:700,textTransform:"uppercase"}}>{h}</span>
                          ))}
                        </div>

                        {/* Trade rows */}
                        {recentTrades.length>0 ? recentTrades.slice(0,15).map((t,i)=>{
                          const isBuy = t.type==="buy";
                          const price = parseFloat(t.priceUsd||0);
                          const amtUsd = parseFloat(t.amountUsd||0);
                          const noelclawAmt = price > 0 ? amtUsd / price : 0;
                          const ago = t.timestamp ? (() => {
                            const diff = Math.floor((Date.now()-t.timestamp)/1000);
                            if(diff<60) return diff+"s ago";
                            if(diff<3600) return Math.floor(diff/60)+"m ago";
                            return Math.floor(diff/3600)+"h ago";
                          })() : "—";
                          const priceStr = price > 0
                            ? "$0.0₆"+price.toFixed(10).replace(/^0\.0+/,"").slice(0,4)
                            : "—";
                          return (
                            <div key={i} style={{
                              display:"grid",gridTemplateColumns:"72px 68px 90px 110px 130px 80px 32px",
                              gap:0, padding:".5rem 1.2rem",
                              borderBottom:"1px solid rgba(255,255,255,.035)",
                              background: isBuy ? "rgba(26,79,255,.04)" : "rgba(255,107,107,.025)",
                              transition:"background .15s",
                              alignItems:"center",
                            }}
                              onMouseEnter={e=>e.currentTarget.style.background=isBuy?"rgba(26,79,255,.09)":"rgba(255,107,107,.07)"}
                              onMouseLeave={e=>e.currentTarget.style.background=isBuy?"rgba(26,79,255,.04)":"rgba(255,107,107,.025)"}
                            >
                              {/* DATE */}
                              <span style={{fontSize:".58rem",color:"var(--text3)",fontFamily:"monospace"}}>{ago}</span>

                              {/* TYPE — blue for buy, red for sell */}
                              <div style={{display:"flex",alignItems:"center",gap:".3rem"}}>
                                <span style={{
                                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                                  width:"14px",height:"14px",borderRadius:"3px",flexShrink:0,
                                  background: isBuy ? "rgba(26,79,255,.25)" : "rgba(255,107,107,.2)",
                                  border: `1px solid ${isBuy?"rgba(77,133,255,.4)":"rgba(255,107,107,.4)"}`,
                                  fontSize:".5rem",
                                  color: isBuy ? "var(--blue-hi)" : "#ff6b6b",
                                }}>{isBuy?"▲":"▼"}</span>
                                <span style={{fontSize:".65rem",fontWeight:600,color:isBuy?"var(--blue-hi)":"#ff6b6b"}}>{isBuy?"Buy":"Sell"}</span>
                              </div>

                              {/* USD */}
                              <span style={{fontSize:".65rem",color:"var(--white)",fontWeight:500,fontFamily:"monospace"}}>${amtUsd.toFixed(2)}</span>

                              {/* NOELCLAW amount */}
                              <span style={{fontSize:".62rem",color:"var(--text2)",fontFamily:"monospace"}}>
                                {noelclawAmt > 1e6
                                  ? (noelclawAmt/1e6).toFixed(2)+"M"
                                  : noelclawAmt > 1000
                                    ? (noelclawAmt/1000).toFixed(1)+"K"
                                    : noelclawAmt.toFixed(0)}
                              </span>

                              {/* PRICE — bigger, clearer, colored */}
                              <span style={{fontSize:".65rem",fontFamily:"monospace",color:isBuy?"rgba(120,160,255,.9)":"rgba(255,140,140,.9)",fontWeight:500}}>
                                {price > 0 ? (()=>{
                                  const s = price.toFixed(12);
                                  const m = s.match(/^0\.(0+)([1-9]\d*)/);
                                  if(m && m[1].length >= 2){
                                    return <span>$0.0<sub style={{fontSize:".5rem",verticalAlign:"baseline",lineHeight:1}}>{m[1].length}</sub>{m[2].slice(0,4)}</span>;
                                  }
                                  return <span>${price.toFixed(6)}</span>;
                                })() : "—"}
                              </span>

                              {/* MAKER — link to basescan */}
                              <span>
                                {t.txHash ? (
                                  <a href={`https://basescan.org/address/0x${t.txHash.slice(2,42)}`} target="_blank" rel="noopener noreferrer"
                                    style={{fontSize:".58rem",color:"var(--text3)",fontFamily:"monospace",textDecoration:"none",letterSpacing:".03em",transition:"color .15s"}}
                                    onMouseEnter={e=>e.currentTarget.style.color="var(--blue-hi)"}
                                    onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}
                                  >{t.txHash.slice(2,8).toUpperCase()}</a>
                                ) : <span style={{fontSize:".58rem",color:"var(--text3)",opacity:.4}}>—</span>}
                              </span>

                              {/* TXN — link to tx */}
                              <span style={{display:"flex",justifyContent:"center"}}>
                                {t.txHash ? (
                                  <a href={`https://basescan.org/tx/${t.txHash}`} target="_blank" rel="noopener noreferrer"
                                    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"18px",height:"18px",borderRadius:"4px",background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",color:"var(--text3)",fontSize:".6rem",textDecoration:"none",transition:"all .15s",flexShrink:0}}
                                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(77,133,255,.2)";e.currentTarget.style.borderColor="rgba(77,133,255,.4)";e.currentTarget.style.color="var(--blue-hi)";}}
                                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)";}}
                                  >↗</a>
                                ) : <span style={{opacity:.25,fontSize:".6rem",color:"var(--text3)"}}>—</span>}
                              </span>
                            </div>
                          );
                        }) : (
                          <div style={{padding:"1.5rem 1.2rem",display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",animation:"pulse 1.5s infinite",flexShrink:0}}/>
                            <span style={{fontSize:".72rem",color:"var(--text3)"}}>Loading trades from GeckoTerminal…</span>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Crypto News — Premium */}
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden",marginBottom:"1rem"}}>

                        {/* Header */}
                        <div style={{padding:".9rem 1.2rem",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.015)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{fontSize:"1rem",lineHeight:1}}>📰</span>
                            <span style={{fontSize:".72rem",color:"var(--white)",fontWeight:500,letterSpacing:".04em"}}>Crypto News</span>
                            <span style={{fontSize:".44rem",background:"rgba(255,165,0,.1)",color:"#ffa500",border:"1px solid rgba(255,165,0,.25)",borderRadius:"20px",padding:".1rem .45rem",letterSpacing:".08em",fontWeight:600}}>CRYPTOPANIC</span>
                            {messariGlobal&&<span style={{fontSize:".44rem",background:"rgba(26,79,255,.1)",color:"var(--blue-hi)",border:"1px solid rgba(77,133,255,.25)",borderRadius:"20px",padding:".1rem .45rem",letterSpacing:".08em",fontWeight:600}}>MESSARI</span>}
                          </div>
                          <button onClick={fetchNews}
                            style={{background:"none",border:"1px solid var(--border)",borderRadius:"5px",padding:".22rem .6rem",color:"var(--text3)",fontSize:".58rem",cursor:"pointer",fontFamily:"inherit",letterSpacing:".06em",transition:"all .18s"}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text)";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)";}}>
                            ↻ Refresh
                          </button>
                        </div>

                        {/* Market macro bar from Messari */}
                        {messariGlobal&&(
                          <div style={{display:"flex",gap:0,borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.008)"}}>
                            {[
                              {label:"TOTAL MCAP", val:"$"+((messariGlobal.totalMarketCapUsd||0)/1e12).toFixed(2)+"T"},
                              {label:"24H VOL", val:"$"+((messariGlobal.totalVolume24h||0)/1e9).toFixed(1)+"B"},
                              {label:"BTC DOM", val:(messariGlobal.btcDominance||0).toFixed(1)+"%"},
                              {label:"ETH DOM", val:(messariGlobal.ethDominance||0).toFixed(1)+"%"},
                              {label:"DEFI MCAP", val:"$"+((messariGlobal.defiMarketCapUsd||0)/1e9).toFixed(0)+"B"},
                              {label:"ASSETS", val:(messariGlobal.activeCurrencies||0).toLocaleString()},
                            ].map((m,i)=>(
                              <div key={i} style={{flex:1,padding:".55rem .8rem",borderRight:i<5?"1px solid var(--border)":"none",display:"flex",flexDirection:"column",gap:".18rem"}}>
                                <span style={{fontSize:".42rem",color:"var(--text3)",letterSpacing:".1em",fontWeight:600}}>{m.label}</span>
                                <span style={{fontSize:".65rem",color:"var(--white)",fontWeight:500,fontFamily:"monospace"}}>{m.val}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loading */}
                        {newsLoading&&(
                          <div style={{padding:"1.2rem",display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#ffa500",display:"inline-block",animation:"pulse 1.5s infinite",flexShrink:0}}/>
                            <span style={{fontSize:".72rem",color:"var(--text3)"}}>Fetching latest crypto news…</span>
                          </div>
                        )}

                        {/* HOT News */}
                        {cryptoNews.length>0&&(
                          <div>
                            <div style={{padding:".5rem 1.2rem",background:"rgba(255,255,255,.008)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:".5rem"}}>
                              <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#ff6b35",display:"inline-block",animation:"pulse 2s infinite",flexShrink:0}}/>
                              <span style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".12em",fontWeight:700}}>HOT</span>
                            </div>
                            {cryptoNews.slice(0,6).map((n,i)=>(
                              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                                style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",padding:".75rem 1.2rem",borderBottom:i<5?"1px solid rgba(255,255,255,.04)":"none",textDecoration:"none",background:"transparent",transition:"background .15s"}}
                                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.025)"}
                                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                              >
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:".72rem",color:"var(--text)",fontWeight:400,lineHeight:1.5,marginBottom:".3rem"}}>{n.title}</div>
                                  <div style={{display:"flex",alignItems:"center",gap:".6rem",flexWrap:"wrap"}}>
                                    <span style={{fontSize:".52rem",color:"var(--text3)",fontWeight:500}}>{n.source}</span>
                                    <span style={{color:"var(--border)",fontSize:".5rem"}}>·</span>
                                    <span style={{fontSize:".52rem",color:"var(--text3)"}}>{new Date(n.publishedAt).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                                    {(n.currencies||[]).slice(0,3).map((c,j)=>(
                                      <span key={j} style={{fontSize:".44rem",color:"var(--blue-hi)",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"3px",padding:".05rem .3rem",fontWeight:600}}>{c}</span>
                                    ))}
                                  </div>
                                </div>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:".4rem",flexShrink:0}}>
                                  <span style={{fontSize:".5rem",padding:".14rem .45rem",borderRadius:"20px",fontWeight:700,letterSpacing:".06em",whiteSpace:"nowrap",
                                    background:n.sentiment==="bullish"?"rgba(34,211,165,.12)":n.sentiment==="bearish"?"rgba(255,107,107,.12)":"rgba(255,255,255,.06)",
                                    color:n.sentiment==="bullish"?"var(--green)":n.sentiment==="bearish"?"#ff6b6b":"var(--text3)",
                                    border:`1px solid ${n.sentiment==="bullish"?"rgba(34,211,165,.25)":n.sentiment==="bearish"?"rgba(255,107,107,.25)":"var(--border)"}`}}>
                                    {n.sentiment==="bullish"?"↑ BULL":n.sentiment==="bearish"?"↓ BEAR":"– NEU"}
                                  </span>
                                  {(n.votes?.positive>0||n.votes?.negative>0)&&(
                                    <div style={{display:"flex",gap:".4rem"}}>
                                      <span style={{fontSize:".48rem",color:"var(--green)"}}>▲{n.votes?.positive||0}</span>
                                      <span style={{fontSize:".48rem",color:"#ff6b6b"}}>▼{n.votes?.negative||0}</span>
                                    </div>
                                  )}
                                </div>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* RISING section */}
                        {risingNews&&risingNews.length>0&&(
                          <div style={{borderTop:"1px solid var(--border)"}}>
                            <div style={{padding:".5rem 1.2rem",background:"rgba(255,255,255,.008)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:".5rem"}}>
                              <span style={{fontSize:".62rem",lineHeight:1}}>📈</span>
                              <span style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".12em",fontWeight:700}}>RISING</span>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                              {risingNews.slice(0,4).map((n,i)=>(
                                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                                  style={{display:"block",padding:".7rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,.04)",borderRight:i%2===0?"1px solid rgba(255,255,255,.04)":"none",textDecoration:"none",transition:"background .15s"}}
                                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.02)"}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                                >
                                  <div style={{fontSize:".68rem",color:"var(--text)",fontWeight:400,lineHeight:1.45,marginBottom:".3rem",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.title}</div>
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                    <span style={{fontSize:".5rem",color:"var(--text3)"}}>{n.source}</span>
                                    <span style={{fontSize:".48rem",padding:".1rem .3rem",borderRadius:"3px",fontWeight:600,
                                      background:n.sentiment==="bullish"?"rgba(34,211,165,.1)":n.sentiment==="bearish"?"rgba(255,107,107,.1)":"rgba(255,255,255,.05)",
                                      color:n.sentiment==="bullish"?"var(--green)":n.sentiment==="bearish"?"#ff6b6b":"var(--text3)"}}>
                                      {n.sentiment==="bullish"?"↑":"↓"} {n.sentiment?.toUpperCase()||"NEU"}
                                    </span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {cryptoNews.length===0&&!newsLoading&&(
                          <div style={{padding:"2rem 1.2rem",display:"flex",flexDirection:"column",alignItems:"center",gap:".6rem",opacity:.7}}>
                            <span style={{fontSize:"1.5rem"}}>📭</span>
                            <span style={{fontSize:".72rem",color:"var(--text3)"}}>No news loaded yet</span>
                            <span style={{fontSize:".6rem",color:"var(--text3)",opacity:.6}}>Make sure CRYPTOPANIC_API_KEY is set in Convex</span>
                          </div>
                        )}
                      </div>

                      {/* Row 4: AI Market Brief */}
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1.2rem",marginBottom:".5rem"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".8rem"}}>
                          <span style={{fontSize:".52rem",color:"var(--blue-hi)",letterSpacing:".14em",fontWeight:700,textTransform:"uppercase"}}>🧠 AI Market Brief</span>
                          <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                            <span style={{fontSize:".46rem",color:"var(--text3)"}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
                            <button onClick={generateMarketBrief} disabled={briefLoading}
                              style={{background:"rgba(26,79,255,.15)",border:"1px solid rgba(77,133,255,.3)",borderRadius:"5px",padding:".2rem .65rem",color:"var(--blue-hi)",fontSize:".6rem",fontFamily:"inherit",cursor:briefLoading?"not-allowed":"pointer",opacity:briefLoading?0.5:1,fontWeight:500}}>
                              {briefLoading?"Writing…":briefGenerated?"↻ Refresh":"▶ Generate"}
                            </button>
                          </div>
                        </div>
                        {!briefGenerated&&!briefLoading&&<div style={{fontSize:".72rem",color:"var(--text3)",lineHeight:1.65,fontStyle:"italic"}}>AI-generated daily market brief using live trades, news & on-chain data. Hit Generate.</div>}
                        {briefLoading&&<div style={{display:"flex",alignItems:"center",gap:".6rem",padding:".4rem 0"}}>
                          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--blue-hi)",animation:"pulse 1.2s infinite",flexShrink:0}}/>
                          <span style={{fontSize:".72rem",color:"var(--text3)"}}>NoelClaw AI is generating your brief…</span>
                        </div>}
                        {briefGenerated&&marketBrief&&<div style={{fontSize:".76rem",color:"var(--text2)",lineHeight:1.8,whiteSpace:"pre-wrap"}}>
                          {typeof marketBrief==="string"?marketBrief:marketBrief?.content?.[0]?.text||JSON.stringify(marketBrief)}
                        </div>}
                      </div>
                    </div>
                  ) : (
                  <>
                  <div style={{display:"flex",alignItems:"center",gap:".8rem",marginBottom:"1rem"}}>
                    <div style={{fontSize:".6rem",fontWeight:300,color:"var(--text2)",letterSpacing:".28em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:".6rem"}}>
                      <span style={{width:"22px",height:"1px",background:"rgba(255,255,255,.2)",display:"inline-block"}}/>
                      Holder-only access
                    </div>
                    <div style={{fontSize:".55rem",fontWeight:700,padding:".15rem .55rem",borderRadius:"20px",background:"linear-gradient(90deg,rgba(26,79,255,.3),rgba(77,133,255,.2))",border:"1px solid rgba(77,133,255,.3)",color:"var(--blue-hi)",letterSpacing:".1em",textTransform:"uppercase"}}>
                      🦕 20M $NOELCLAW Required
                    </div>
                  </div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:"clamp(1.4rem,2.5vw,2rem)",fontWeight:100,color:"var(--white)",letterSpacing:"-.01em",lineHeight:1.1,marginBottom:".7rem"}}>
                    Premium features.<br/><span style={{color:"var(--blue-hi)"}}>Token-gated access.</span>
                  </div>
                  <div style={{fontSize:".85rem",color:"var(--text2)",fontWeight:200,maxWidth:"520px",lineHeight:1.7,marginBottom:"2.5rem"}}>
                    Hold 20,000,000 $NOELCLAW on Base to unlock exclusive AI infrastructure tools. Connect your wallet to verify.
                  </div>

                  {/* Premium feature cards */}
                  <div className="prem-cards" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"1px",background:"var(--border)",border:"1px solid var(--border)",borderRadius:"14px",overflow:"hidden",marginBottom:"2rem"}}>
                    {[
                      {icon:"⚡",tag:"Agent Terminal",title:"Live Agent Runner",desc:"Spin up and execute real AI agents directly in the browser. Connect to your APIs, run workflows, monitor execution in real-time.",perks:["Real-time agent execution","Custom tool integration","Live logs & tracing"],hot:true,page:"dashboard",cta:"Open Agent Runner →"},
                      {icon:"📡",tag:"Alpha Feed",title:"AI Signals & Insights",desc:"Exclusive AI-curated alpha feed. On-chain signals, agent discoveries, early infrastructure plays — before they hit CT.",perks:["Daily AI-generated signals","On-chain agent activity","Early access research"],hot:true,page:"dashboard",cta:"View Alpha Feed →"},
                      {icon:"🔬",tag:"Token Analytics Pro",title:"Deep Token Intelligence",desc:"Advanced $NOELCLAW analytics. Holder distribution, wallet clustering, smart money tracking, and ecosystem health metrics.",perks:["Smart money tracking","Holder clustering","Ecosystem health score"],hot:false,page:"analytics",cta:"View Analytics →"},
                      {icon:"🧠",tag:"Research Agent",title:"Deep Research on Autopilot",desc:"Give the agent a topic. It searches, reads, cross-references sources, and returns a structured brief with confidence scores.",perks:["Multi-source synthesis","Structured briefs","Confidence scoring"],hot:false,page:"dashboard",cta:"Run Research →"},
                    ].map((f,i)=>(
                      <div key={i} style={{padding:"1.8rem 2rem",background:"var(--bg)",position:"relative",transition:"background .22s",cursor:walletTier==="premium"?"pointer":"default"}}
                        onClick={()=>{ if(walletTier==="premium") navTo(f.page); }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(26,79,255,0.04)"}
                        onMouseLeave={e=>e.currentTarget.style.background="var(--bg)"}
                      >
                        {f.hot && (
                          <div style={{position:"absolute",top:"1rem",right:"1rem",fontSize:".5rem",fontWeight:700,padding:".12rem .45rem",borderRadius:"3px",background:"rgba(34,211,165,.1)",border:"1px solid rgba(34,211,165,.2)",color:"var(--green)",letterSpacing:".1em",textTransform:"uppercase"}}>
                            HOT
                          </div>
                        )}
                        {/* Lock overlay - hidden if premium */}
                        {walletTier !== "premium" && (
                          <div style={{position:"absolute",inset:0,background:"rgba(5,7,14,0.6)",backdropFilter:"blur(3px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:".6rem",borderRadius:"inherit",zIndex:2,transition:"opacity .25s",cursor:"pointer"}}
                            onClick={!authenticated ? login : undefined}
                          >
                            <div style={{fontSize:"1.4rem"}}>{authenticated ? "⚡" : "🔒"}</div>
                            <div style={{fontSize:".68rem",color:"var(--text2)",fontWeight:300,letterSpacing:".06em",textAlign:"center",maxWidth:"160px",lineHeight:1.5}}>
                              {authenticated ? "Need 20M $NOELCLAW to unlock" : "Connect wallet to unlock"}
                            </div>
                            {!authenticated && (
                              <div style={{fontSize:".62rem",color:"var(--blue-hi)",background:"rgba(26,79,255,.12)",border:"1px solid rgba(77,133,255,.25)",borderRadius:"5px",padding:".2rem .6rem",letterSpacing:".08em",textTransform:"uppercase"}}>
                                Connect →
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{fontSize:"1.5rem",marginBottom:".8rem"}}>{f.icon}</div>
                        <div style={{fontSize:".55rem",fontWeight:700,color:"var(--blue-hi)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:".5rem"}}>{f.tag}</div>
                        <div style={{fontSize:".9rem",fontWeight:400,color:"var(--white)",marginBottom:".5rem",lineHeight:1.3}}>{f.title}</div>
                        <div style={{fontSize:".75rem",color:"var(--text2)",lineHeight:1.7,fontWeight:200,marginBottom:"1.2rem"}}>{f.desc}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:".35rem",marginBottom:"1.2rem"}}>
                          {f.perks.map((p,j)=>(
                            <div key={j} style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                              <div style={{width:"4px",height:"4px",borderRadius:"50%",background:"var(--green)",flexShrink:0}}/>
                              <span style={{fontSize:".68rem",color:"var(--text2)",fontWeight:300}}>{p}</span>
                            </div>
                          ))}
                        </div>
                        {walletTier === "premium" && (
                          <div style={{fontSize:".7rem",color:"var(--blue-hi)",fontWeight:500,letterSpacing:".04em",display:"flex",alignItems:"center",gap:".3rem",marginTop:"auto"}}>
                            {f.cta}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
                    {!authenticated ? (
                      <button onClick={login} style={{display:"inline-flex",alignItems:"center",gap:".55rem",background:"var(--white)",color:"var(--bg)",padding:".75rem 1.8rem",borderRadius:"7px",fontSize:".8rem",fontWeight:500,letterSpacing:".06em",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.88)"}
                        onMouseLeave={e=>e.currentTarget.style.background="var(--white)"}
                      >
                        🔗 Connect Wallet
                      </button>
                    ) : walletTier === "premium" ? (
                      <div style={{display:"inline-flex",alignItems:"center",gap:".6rem",background:"rgba(34,211,165,.1)",border:"1px solid rgba(34,211,165,.25)",borderRadius:"8px",padding:".65rem 1.2rem"}}>
                        <span style={{fontSize:"1rem"}}>✦</span>
                        <div>
                          <div style={{fontSize:".72rem",color:"var(--green)",fontWeight:600,letterSpacing:".06em"}}>Premium Unlocked</div>
                          <div style={{fontSize:".6rem",color:"var(--text3)",marginTop:".1rem"}}>{walletAddress?.slice(0,6)}…{walletAddress?.slice(-4)}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{display:"inline-flex",alignItems:"center",gap:".6rem",background:"rgba(255,255,255,.04)",border:"1px solid var(--border)",borderRadius:"8px",padding:".65rem 1.2rem"}}>
                        <span style={{fontSize:".75rem",color:"var(--text2)"}}>🔗 {walletAddress?.slice(0,6)}…{walletAddress?.slice(-4)}</span>
                        <span style={{fontSize:".62rem",color:"var(--orange)",background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.2)",borderRadius:"4px",padding:".12rem .45rem",letterSpacing:".08em"}}>Need 20M $NOELCLAW</span>
                      </div>
                    )}
                    <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:".5rem",background:"transparent",color:"var(--white)",padding:".75rem 1.6rem",borderRadius:"7px",fontSize:".78rem",fontWeight:300,letterSpacing:".08em",border:"1px solid rgba(255,255,255,.2)",textDecoration:"none",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.borderColor="rgba(255,255,255,.45)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(255,255,255,.2)";}}
                    >
                      <img src="/logo.png" style={{width:"14px",height:"14px",borderRadius:"50%",objectFit:"cover"}} alt=""/>
                      Buy $NOELCLAW
                    </a>
                    <div style={{fontSize:".72rem",color:"var(--text3)",fontWeight:200}}>
                      Currently: <span style={{color:"var(--text2)"}}>82 holders</span> · <span style={{color:"var(--blue-hi)"}}>Base Chain</span>
                    </div>
                  </div>
                  </>
                  )}
                </div>
              </div>

              {/* ARTICLES */}
              <div className="section">
                <div className="sec-hd">
                  <div className="sec-tag"><span className="sec-ln"/>Latest Writing</div>
                  <button className="sec-more" onClick={()=>navTo("articles")}>All articles →</button>
                </div>
                <div className="arts">
                  {ARTICLES.slice(0,4).map((a,i)=><ARow key={i} a={a} onClick={()=>{setArt(a);setMoltStatus("");window.scrollTo({top:0,behavior:'instant'});}}/>)}
                </div>
              </div>
            </div>
          )}

          {/* ARTICLES PAGE */}
          {!art&&page==="articles"&&(
            <div className="page">
              <div className="section">
                <div className="sec-hd"><div className="sec-tag"><span className="sec-ln"/>All Articles</div></div>
                {articlesLoading
                  ? <div style={{color:"var(--text2)",fontSize:".85rem",padding:"2rem 0",letterSpacing:".08em"}}>Loading articles…</div>
                  : ARTICLES.length===0
                    ? <div style={{color:"var(--text2)",fontSize:".85rem",padding:"2rem 0",letterSpacing:".08em"}}>No articles published yet.</div>
                    : <div className="arts">{ARTICLES.map((a,i)=><ARow key={i} a={a} onClick={()=>{setArt(a);setMoltStatus("");window.scrollTo({top:0,behavior:'instant'});}}/>)}</div>
                }
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {!art&&page==="dashboard"&&(
            <div className="dash">
              <div className="pg-hd">
                <div>
                  <div className="pg-title">Dashboard</div>
                  <div className="pg-sub">Overview · last 7 days</div>
                </div>
              </div>
              <div className="kpi-grid">
                <div className="kpi kblue"><div className="kpi-lbl">Total Visitors<span className="kpi-ico">👁</span></div><div className="kpi-val">4.2K</div><div className="kpi-chg up">↑ +38% <span>vs last week</span></div></div>
                <div className="kpi kgreen"><div className="kpi-lbl">Article Reads<span className="kpi-ico">📖</span></div><div className="kpi-val">2.8K</div><div className="kpi-chg up">↑ +22% <span>vs last week</span></div></div>
                <div className="kpi korange"><div className="kpi-lbl">Chat Sessions<span className="kpi-ico">💬</span></div><div className="kpi-val">184</div><div className="kpi-chg up">↑ +29% <span>vs last week</span></div></div>
                <div className="kpi kpurple"><div className="kpi-lbl">X Followers<span className="kpi-ico">✦</span></div><div className="kpi-val">50</div><div className="kpi-chg up">↑ +63 <span>this week</span></div></div>
                <div className="kpi ktoken"><div className="kpi-lbl">$NOELCLAW Holders<span className="kpi-ico">🦕</span></div><div className="kpi-val">82</div><div className="kpi-chg up">↑ Base Chain</div></div>
              </div>
              <div className="dash-body">
                <div className="dash-left">
                  <div className="two-col">
                    <div className="chart-card" style={{margin:0}}>
                      <div className="chart-hd"><div className="chart-title">Visitors · 9 Days</div><span className="cbadge cbadge-b">Live</span></div>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={visitData} margin={{top:4,right:4,bottom:0,left:-20}}>
                          <defs>
                            <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a4fff" stopOpacity={0.18}/><stop offset="95%" stopColor="#1a4fff" stopOpacity={0}/></linearGradient>
                            <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3a5" stopOpacity={0.12}/><stop offset="95%" stopColor="#22d3a5" stopOpacity={0}/></linearGradient>
                          </defs>
                          <XAxis dataKey="d" tick={{fontSize:8,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:8,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                          <Tooltip content={<TT/>}/>
                          <Area type="monotone" dataKey="v" name="Visits" stroke="#4d85ff" strokeWidth={1.5} fill="url(#gb)" dot={false}/>
                          <Area type="monotone" dataKey="u" name="Unique" stroke="#22d3a5" strokeWidth={1.2} fill="url(#gg)" dot={false}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-card" style={{margin:0}}>
                      <div className="chart-hd"><div className="chart-title">Top Articles</div><span className="cbadge cbadge-g">Month</span></div>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={articleViews} layout="vertical" margin={{top:0,right:4,bottom:0,left:0}}>
                          <XAxis type="number" tick={{fontSize:8,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                          <YAxis type="category" dataKey="name" tick={{fontSize:8,fill:"#6b78a8"}} axisLine={false} tickLine={false} width={80}/>
                          <Tooltip content={<TT/>}/>
                          <Bar dataKey="views" name="Views" fill="#1a4fff" radius={[0,3,3,0]} opacity={0.7}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-hd">
                      <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                        <img src="/logo.png" alt="NOELCLAW" style={{width:"18px",height:"18px",borderRadius:"50%",objectFit:"cover"}}/>
                        <span className="panel-title">$NOELCLAW</span>
                      </div>
                      <a href="https://dexscreener.com/base/0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7" target="_blank" rel="noopener noreferrer" style={{fontSize:".6rem",color:"var(--blue-hi)",textDecoration:"none",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".3rem"}}>
                        <img src="https://dexscreener.com/favicon.ico" style={{width:"11px",height:"11px",borderRadius:"2px",objectFit:"cover"}} alt=""/>
                        DexScreener ↗
                      </a>
                    </div>
                    <div className="token-hero">
                      {tokenData && !tokenLoading && typeof tokenData === "object" && tokenData.price ? (
                        <>
                          <div style={{display:"flex",alignItems:"baseline",gap:".5rem",marginBottom:".2rem"}}>
                            <span className="token-price-val">${parseFloat(tokenData.price||0).toFixed(8)}</span>
                            <span className="token-price-chg" style={{color:parseFloat(tokenData.priceChange24h||0)>=0?"var(--blue-hi)":"#ff4d4d"}}>
                              {parseFloat(tokenData.priceChange24h||0)>=0?"▲":"▼"} {Math.abs(parseFloat(tokenData.priceChange24h||0)).toFixed(2)}% 24h
                            </span>
                          </div>
                        </>
                      ) : tokenLoading ? (
                        <div style={{fontSize:".72rem",color:"var(--text3)",padding:".5rem 0"}}>Fetching live data…</div>
                      ) : (
                        <div style={{fontSize:".7rem",color:"var(--text3)",padding:".5rem 0"}}>Click refresh to load price</div>
                      )}
                    </div>
                    {tokenData && !tokenLoading && typeof tokenData === "object" && tokenData.price && (
                      <div className="token-stats">
                        {[
                          {label:"VOL 24H", val:"$"+parseFloat(tokenData.volume24h||0).toLocaleString()},
                          {label:"LIQUIDITY", val:"$"+parseFloat(tokenData.liquidity||0).toLocaleString()},
                          {label:"MKT CAP", val:"$"+parseFloat(tokenData.marketCap||0).toLocaleString()},
                          {label:"FDV", val:"$"+parseFloat(tokenData.marketCap||0).toLocaleString()},
                        ].map(({label,val})=>(
                          <div className="token-stat" key={label}>
                            <div className="token-stat-l">{label}</div>
                            <div className="token-stat-v">{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{padding:".75rem 1.3rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid var(--border)"}}>
                      <span style={{fontSize:".6rem",color:"var(--text3)",letterSpacing:".1em"}}>BASE CHAIN</span>
                      <button onClick={fetchTokenPrice} disabled={tokenLoading} style={{background:"none",border:"1px solid var(--border)",borderRadius:"5px",padding:".28rem .7rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".35rem",opacity:tokenLoading?.5:1,transition:"all .2s",color:"var(--text3)"}}>
                        <img src="/refresh.png" alt="" style={{width:"11px",height:"11px",filter:"invert(1)",opacity:.6,animation:tokenLoading?"spin 1s linear infinite":"none"}}/>
                        <span style={{fontSize:".6rem",fontFamily:"inherit",letterSpacing:".1em"}}>{tokenLoading?"LOADING…":"REFRESH"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-hd">
                      <span className="panel-title">Price Chart</span>
                      <span className="panel-tag green">Live</span>
                    </div>
                    <iframe src="https://dexscreener.com/base/0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7?embed=1&theme=dark&trades=0&info=0" style={{width:"100%",height:"380px",border:"none",display:"block"}} title="NOELCLAW Chart"/>
                  </div>
                </div>
                <div className="dash-right">
                  <div className="panel">
                    <div className="panel-hd">
                      <span className="panel-title">Live Activity</span>
                      <span style={{display:"flex",alignItems:"center",gap:".35rem",fontSize:".55rem",color:"var(--blue-hi)",letterSpacing:".1em"}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",boxShadow:"0 0 6px var(--blue-hi)",animation:"pulse 2s ease-in-out infinite"}}/>
                        LIVE
                      </span>
                    </div>
                    <div className="act-list">
                      {activityFeed.map((a,i)=>{
                        const SEEDS = ["pixel","shapes","lorelei","notionists","rings"];
                        const colors = ["0d1117","0f1722","101828","0a0e1a","080d17"];
                        return (
                          <div className="act-item" key={i} style={{opacity: i===0?1: 1-(i*0.07), animation: i===0?"fadeSlideIn .4s ease both":"none"}}>
                            <div className="act-badge">
                              <img src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${a.name}&backgroundColor=${colors[i%colors.length]}`} alt={a.name}/>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div className="act-ev">{a.event}</div>
                              <div className="act-time">{a.time}</div>
                            </div>
                            <div style={{fontSize:".65rem",opacity:.4}}>{ACT_ICONS[a.type]||"·"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-hd"><span className="panel-title">Quick Links</span></div>
                    <div style={{display:"flex",flexDirection:"column"}}>
                      {[
                        {label:"X / Twitter",sub:"@noelclawfun",logoType:"x",href:"https://x.com/noelclawfun",tag:"Follow"},
                        {label:"$NOELCLAW",sub:"Base Chain · Flaunch",logoType:"noelclaw",href:"https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3",tag:"Buy"},
                        {label:"DexScreener",sub:"Live chart",logoType:"dex",href:"https://dexscreener.com/base/0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7",tag:"Chart"},
                      ].map((l,i)=>(
                        <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:".75rem",padding:".75rem 1.3rem",borderBottom:i<2?"1px solid var(--border)":"none",textDecoration:"none",transition:"background .18s",cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.025)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                        >
                          <span style={{width:20,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text2)",flexShrink:0}}>
                            {l.logoType==="x" && <svg width="13" height="13" viewBox="0 0 1200 1227" fill="currentColor"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/></svg>}
                            {l.logoType==="noelclaw" && <img src="/logo.png" style={{width:14,height:14,borderRadius:"50%",objectFit:"cover"}} alt=""/>}
                            {l.logoType==="dex" && <img src="https://dexscreener.com/favicon.ico" style={{width:14,height:14,borderRadius:2,objectFit:"cover"}} alt=""/>}
                          </span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:".72rem",color:"var(--text)",fontWeight:400,marginBottom:".1rem"}}>{l.label}</div>
                            <div style={{fontSize:".6rem",color:"var(--text3)"}}>{l.sub}</div>
                          </div>
                          <span style={{fontSize:".55rem",padding:".15rem .45rem",borderRadius:3,background:"rgba(77,133,255,.1)",color:"var(--blue-hi)",letterSpacing:".1em"}}>{l.tag}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-hd"><span className="panel-title">Top Article</span><span className="panel-tag blue">Trending</span></div>
                    <div style={{padding:"1rem 1.3rem"}}>
                      <div style={{fontSize:".6rem",color:"var(--text3)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:".6rem"}}>Most read this week</div>
                      <div style={{fontSize:".9rem",fontWeight:300,color:"var(--white)",lineHeight:1.4,marginBottom:".6rem"}}>NoelClaw: AI OS</div>
                      <div style={{fontSize:".7rem",color:"var(--text2)",fontWeight:200,lineHeight:1.6,marginBottom:".9rem"}}>Documenting the build of a personal AI operating system — composable agents, architecture decisions, shipped in public.</div>
                      <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                        <span style={{fontSize:".6rem",color:"var(--text3)"}}>3,240 reads</span>
                        <span style={{opacity:.3}}>·</span>
                        <span style={{fontSize:".6rem",color:"var(--blue-hi)"}}>↑ +18% this week</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {!art&&page==="analytics"&&(
            <div className="analytics">
              <div className="an-hd">
                <div>
                  <div className="pg-title">Analytics</div>
                  <div className="pg-sub">Traffic, content performance & audience</div>
                </div>
                <div className="range-btns">{["7d","30d","90d"].map(r=><button key={r} className={`rbtn${range===r?" on":""}`} onClick={()=>setRange(r)}>{r}</button>)}</div>
              </div>
              <div className="an-kpis">
                {[
                  {l:"Page Views",v:"4.2K",d:"↑ +38%"},
                  {l:"Unique Users",v:"2.6K",d:"↑ +31%"},
                  {l:"Avg. Session",v:"3m 48s",d:"↑ +12%"},
                  {l:"Bounce Rate",v:"44%",d:"↓ -3%"},
                ].map((k,i)=>(
                  <div className="an-kpi" key={i}>
                    <div className="an-kpi-l">{k.l}</div>
                    <div className="an-kpi-v">{k.v}</div>
                    <div className="an-kpi-d up">{k.d} vs prev.</div>
                  </div>
                ))}
              </div>
              <div className="an-body">
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
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a4fff" stopOpacity={0.18}/><stop offset="95%" stopColor="#1a4fff" stopOpacity={0}/></linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3a5" stopOpacity={0.12}/><stop offset="95%" stopColor="#22d3a5" stopOpacity={0}/></linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{fontSize:8,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:8,fill:"#2d3558"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<TT/>}/>
                      <Area type="monotone" dataKey="v" name="Views" stroke="#4d85ff" strokeWidth={1.8} fill="url(#g1)" dot={false}/>
                      <Area type="monotone" dataKey="u" name="Users" stroke="#22d3a5" strokeWidth={1.4} fill="url(#g2)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="an-grid">
                  <div className="panel">
                    <div className="panel-hd"><span className="panel-title">Traffic Sources</span></div>
                    <div style={{padding:"1rem 1.3rem"}}>
                      <ResponsiveContainer width="100%" height={90}>
                        <PieChart>
                          <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={26} outerRadius={42} paddingAngle={3} dataKey="value">
                            {trafficSources.map((s,i)=><Cell key={i} fill={s.color}/>)}
                          </Pie>
                          <Tooltip content={<TT/>}/>
                        </PieChart>
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
                  </div>
                  <div className="panel">
                    <div className="panel-hd"><span className="panel-title">Top Articles</span></div>
                    <div style={{padding:".4rem 0"}}>
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
                  </div>
                  <div className="panel">
                    <div className="panel-hd"><span className="panel-title">Engagement</span></div>
                    <div style={{padding:"1rem 1.3rem",display:"flex",flexDirection:"column",gap:".9rem"}}>
                      {[
                        {l:"Avg. Read Time",v:"3m 48s",p:72,c:"#4d85ff"},
                        {l:"Articles Completed",v:"68%",p:68,c:"#22d3a5"},
                        {l:"Chat Engagement",v:"41%",p:41,c:"#a78bfa"},
                        {l:"Return Visitors",v:"54%",p:54,c:"#f97316"},
                      ].map((e,i)=>(
                        <div key={i}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:".3rem"}}>
                            <span style={{fontSize:".64rem",color:"var(--text3)",letterSpacing:".1em",textTransform:"uppercase"}}>{e.l}</span>
                            <span style={{fontSize:".64rem",color:"var(--white)",fontWeight:400,fontFamily:"'DM Mono',monospace"}}>{e.v}</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,.04)",borderRadius:2,height:2,overflow:"hidden"}}>
                            <div style={{width:e.p+"%",height:2,background:e.c,borderRadius:2}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {!art&&page==="about"&&(
            <div className="page">
              <div style={{padding:"4rem 3.5rem 3rem",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"1.5rem",marginBottom:"2rem"}}>
                  <div className="abt-wrap">
                    <img src={LOGO} className="abt-logo" alt="NoelClaw"/>
                    <div className="abt-ring"/>
                  </div>
                  <div>
                    <div className="abt-name"><em>Noel</em>Claw</div>
                    <div className="abt-handle">@noelclawfun · Personal AI OS</div>
                  </div>
                </div>
                <p style={{fontSize:"1.25rem",fontWeight:200,color:"var(--text)",lineHeight:1.6,maxWidth:"560px",letterSpacing:"-.01em"}}>
                  A personal AI operating system — built in public, one decision at a time.
                </p>
              </div>
              <div className="abt-inline-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid var(--border)"}}>
                {[
                  {
                    label:"01 — What is NoelClaw?",
                    content:<>NoelClaw is a composable AI system that reads, writes, researches, and acts on your behalf. Not a chatbot. Not a SaaS. Think of it as an OS layer for thinking — built on modern AI infrastructure and documented fully in public.</>
                  },
                  {
                    label:"02 — Why build this?",
                    content:<>Most AI tools are isolated. Every session starts from zero — no memory, no action, no context. NoelClaw started from one frustration: <strong>why don't your tools talk to each other?</strong> This is the answer.</>
                  },
                  {
                    label:"03 — Vision & Mission",
                    content:<><strong>Vision —</strong> Everyone has a personal AI that understands their context and grows with them.<br/><br/><strong>Mission —</strong> Build it in the open. Document every decision. Make the reasoning trail more valuable than the product.</>
                  },
                  {
                    label:"04 — Thank you 🦕",
                    content:<>Thanks for reading this far. Whether you found this through X, a friend, or a search — you're part of the story now. Follow <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer" style={{color:"var(--blue-hi)",textDecoration:"none"}}>@noelclawfun</a> or grab <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" style={{color:"var(--blue-hi)",textDecoration:"none"}}>$NOELCLAW</a>. See you on the other side.</>
                  },
                ].map((s,i)=>(
                  <div key={i} style={{
                    padding:"2.5rem 3rem",
                    borderRight: i%2===0 ? "1px solid var(--border)" : "none",
                    borderTop: i>=2 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{fontSize:".58rem",fontWeight:600,color:"var(--text3)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:"1.2rem"}}>{s.label}</div>
                    <p style={{fontSize:".88rem",color:"var(--text2)",lineHeight:1.9,fontWeight:200}}>{s.content}</p>
                  </div>
                ))}
              </div>
              {/* ── ARCHITECTURE ── */}
              <div className="arch-section">
                <div className="arch-header">
                  <div className="arch-tag"><span className="arch-tag-ln"/>How it works</div>
                  <div className="arch-title">The NoelClaw Architecture</div>
                  <div className="arch-subtitle">A composable agent system where every component is replaceable, every decision is documented, and every action is traceable.</div>
                </div>
                <ArchDiagram/>
                <div className="arch-equation">
                  <div className="arch-eq-item"><div className="arch-eq-icon">🧠</div><div className="arch-eq-label">Model</div><div className="arch-eq-sub">Claude / LLM</div></div>
                  <div className="arch-eq-op">+</div>
                  <div className="arch-eq-item"><div className="arch-eq-icon">🔧</div><div className="arch-eq-label">Harness</div><div className="arch-eq-sub">Agent Runtime</div></div>
                  <div className="arch-eq-op">+</div>
                  <div className="arch-eq-item"><div className="arch-eq-icon">📦</div><div className="arch-eq-label">Tool Catalog</div><div className="arch-eq-sub">APIs & Actions</div></div>
                  <div className="arch-eq-op">=</div>
                  <div className="arch-eq-result">
                    <div style={{fontSize:"1.1rem",marginBottom:".3rem"}}>🦕</div>
                    <div className="arch-eq-result-label">NoelClaw Agent</div>
                    <div className="arch-eq-result-sub">Autonomous · Composable</div>
                  </div>
                </div>
              </div>

              {/* ── AGENT CAPABILITIES ── */}
              <div className="caps-section">
                <div className="caps-header">
                  <div>
                    <div style={{fontSize:".6rem",fontWeight:300,color:"var(--text2)",letterSpacing:".28em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:".6rem",marginBottom:".8rem"}}>
                      <span style={{width:"22px",height:"1px",background:"rgba(255,255,255,.2)",display:"inline-block"}}/>
                      What agents can do
                    </div>
                    <div className="caps-title">NoelClaw agents<br/>operate software systems.</div>
                    <div className="caps-subtitle">Not prompts. Not chatbots. Real agents that take action across your tools, infrastructure, and data.</div>
                  </div>
                </div>
                <AgentCaps/>
              </div>

              {/* ── PERSONAL AI NODE ── */}
              <div className="node-section">
                <div className="node-inner">
                  <div className="node-left">
                    <div className="node-eyebrow">Personal AI Node</div>
                    <div className="node-title">Run your own<br/>AI node.</div>
                    <div className="node-desc">Instead of relying on centralized AI platforms that reset every session, NoelClaw lets you run agents on your own infrastructure — with persistent context, full control, and growing intelligence.</div>
                    <div className="node-pills">
                      {["Your AI grows with your systems","No vendor lock-in","Every decision documented publicly","Built on Base — open & permissionless"].map((t,i)=>(
                        <div className="node-pill" key={i}><div className="node-pill-dot"/><div className="node-pill-text">{t}</div></div>
                      ))}
                    </div>
                  </div>
                  <div className="node-right">
                    {[
                      {tag:"Infrastructure",title:"Agent Discovery (AAIO)",desc:"Agentic AI Optimization — making NoelClaw discoverable and interoperable with other AI systems on the emerging agent internet."},
                      {tag:"Token",title:"$NOELCLAW Utility",desc:"Access agent infrastructure, run automation workflows, and participate in the ecosystem. Token-gated features for holders on Base."},
                      {tag:"Philosophy",title:"Build in Public",desc:"Every architecture decision, every failure, every breakthrough — documented as it happens. The reasoning trail is more valuable than the product."},
                    ].map((nc,i)=>(
                      <div className="node-card" key={i}>
                        <div className="node-card-tag">{nc.tag}</div>
                        <div className="node-card-title">{nc.title}</div>
                        <div className="node-card-desc">{nc.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── USE CASES ── */}
              <div style={{padding:"4rem 3.5rem",borderBottom:"1px solid var(--border)"}}>
                <div style={{marginBottom:"2.5rem"}}>
                  <div style={{fontSize:".6rem",fontWeight:300,color:"var(--text2)",letterSpacing:".28em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:".6rem",marginBottom:"1rem"}}>
                    <span style={{width:"22px",height:"1px",background:"rgba(255,255,255,.2)",display:"inline-block"}}/>
                    Real use cases
                  </div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:"clamp(1.4rem,2.5vw,2rem)",fontWeight:100,color:"var(--white)",letterSpacing:"-.01em",lineHeight:1.1,marginBottom:".7rem"}}>What you can actually build.</div>
                  <div style={{fontSize:".85rem",color:"var(--text2)",fontWeight:200,maxWidth:"480px",lineHeight:1.7}}>Real agents solving real problems. Not demos — production workflows running on NoelClaw infrastructure.</div>
                </div>
                <UseCaseShowcase walletTier={walletTier}/>
              </div>

              <div style={{padding:"3rem 3.5rem"}}>
                <div style={{fontSize:".58rem",fontWeight:600,color:"var(--text3)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:"2rem"}}>Built with</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"1rem"}}>
                  {[
                    {name:"React",    logo:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"},
                    {name:"Vite",     logo:"https://vitejs.dev/logo.svg"},
                    {name:"TypeScript",logo:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg"},
                    {name:"Convex",   logo:"https://www.convex.dev/favicon.ico"},
                    {name:"Claude",   logo:"https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png"},
                    {name:"Vercel",   logo:"https://www.svgrepo.com/show/327408/logo-vercel.svg"},
                    {name:"Base",     logo:"https://avatars.githubusercontent.com/u/108554348"},
                  ].map(t=>(
                    <div key={t.name} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".55rem 1rem",borderRadius:"8px",background:"var(--surface)",border:"1px solid var(--border)",transition:"border-color .2s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border2)"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
                    >
                      <img src={t.logo} alt={t.name} style={{width:"18px",height:"18px",objectFit:"contain",borderRadius:"3px",filter:t.name==="Vercel"?"invert(1)":""}}
                        onError={e=>{e.target.style.display="none";}}
                      />
                      <span style={{fontSize:".78rem",color:"var(--text2)",fontWeight:300}}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-main">
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
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                {["Dashboard","Analytics","Articles","About"].map(l=>(
                  <button key={l} className="footer-link btn-style" onClick={()=>navTo(l.toLowerCase())}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Resources</div>
              <div className="footer-links">
                {["Getting Started","AI Agent Guide","Architecture Docs","Build in Public"].map(l=>(
                  <span key={l} className="footer-link" style={{cursor:"default",opacity:.4}}>{l}</span>
                ))}
              </div>
            </div>
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

      </div>

      {/* FLOATING CHAT */}
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

      <button className="chat-fab" onClick={()=>setChatOpen(o=>!o)} title="Chat with Noel">
        {chatOpen
          ? <span className="chat-fab-close">✕</span>
          : <>
              <img src="/chat-icon.png" className="chat-fab-img" alt="Chat"/>
              <span className="chat-fab-badge"/>
            </>
        }
      </button>
    </>
  );
}