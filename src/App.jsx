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
  {name:"Alpha Analysis",views:3240},{name:"Token Swap",views:2840},
  {name:"Trending Base",views:2120},{name:"Smart Money",views:1980},
  {name:"Wallet Balance",views:1340},{name:"Deploy Token",views:920},
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
  {tmpl:(n,c)=>`${n} from ${c} ran Alpha Agent`,type:"read"},
  {tmpl:(n)=>`${n} opened a chat with Noel`,type:"chat"},
  {tmpl:(n)=>`${n} deployed a token on Base`,type:"deploy"},
  {tmpl:(n)=>`${n} grabbed $NOELCLAW on Base`,type:"token"},
  {tmpl:(n,c)=>`New visitor from ${c}`,type:"visit"},
  {tmpl:(n)=>`${n} executed a token swap`,type:"trade"},
  {tmpl:(n)=>`${n} followed @noelclawfun`,type:"follow"},
  {tmpl:(n,c)=>`${n} in ${c} — first session`,type:"visit"},
  {tmpl:(n)=>`${n} sent 8 messages to Noel`,type:"chat"},
  {tmpl:(n)=>`${n} checked wallet balance`,type:"read"},
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #000408;
  --bg2:      #020d1e;
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
  --green:    #4d85ff;
  --orange:   #f97316;
  --purple:   #a78bfa;
}

html { scroll-behavior: smooth; }
/* ── Scroll reveal global ── */
[data-reveal] { opacity:0; transform:translateY(28px); transition:opacity .7s ease, transform .7s cubic-bezier(.23,1,.32,1); }
[data-reveal].visible { opacity:1; transform:none; }
/* Cinematic section transitions */
.cin-section { transition:opacity .9s cubic-bezier(.23,1,.32,1), transform 1s cubic-bezier(.23,1,.32,1); }
.cin-left { opacity:0; transform:translateX(-48px); }
.cin-right { opacity:0; transform:translateX(48px); }
.cin-up { opacity:0; transform:translateY(56px); }
.cin-scale { opacity:0; transform:scale(.94); }
.cin-visible { opacity:1 !important; transform:none !important; }
.page, .dash, .analytics, .section { background:transparent; }
.main { background:transparent; }
body { background:#000408;color:var(--text);font-family:'Space Grotesk','Inter',system-ui,sans-serif;font-weight:400;letter-spacing:-.01em;overflow-x:hidden;cursor:none; }

/* ── Typography scale ── */
h1,h2,h3,h4,h5,h6 { font-family:'Space Grotesk','Inter',sans-serif; font-weight:700; letter-spacing:-.03em; line-height:.95; }
p { line-height:1.75; }
.mono, code, pre { font-family:'IBM Plex Mono',monospace; }

/* ── Page bg gradients per section ── */
.page-gradient-blue {
  background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(26,79,255,.07) 0%, transparent 60%),
              radial-gradient(ellipse 60% 30% at 100% 50%, rgba(60,100,255,.04) 0%, transparent 60%),
              #000408;
}
.page-gradient-purple {
  background: radial-gradient(ellipse 70% 40% at 0% 50%, rgba(100,50,255,.06) 0%, transparent 60%),
              radial-gradient(ellipse 50% 30% at 100% 0%, rgba(26,79,255,.05) 0%, transparent 60%),
              #000408;
}
* { font-family:inherit; }
code,pre,.mono,[class*='mono'],[class*='plex'] { font-family:'IBM Plex Mono',ui-monospace,monospace; }

/* ── Smooth global transitions ── */
.page { animation:pageEnter .55s cubic-bezier(.23,1,.32,1) both; }
@keyframes pageEnter { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }

/* ── Card hover system ── */
.card-hover {
  transition:transform .35s cubic-bezier(.23,1,.32,1),
             box-shadow .35s cubic-bezier(.23,1,.32,1),
             border-color .25s;
}
.card-hover:hover {
  transform:translateY(-5px);
  box-shadow:0 20px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(77,133,255,.12);
}

/* ── Section fade-in ── */
@keyframes sectionIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
.section-in { animation:sectionIn .6s cubic-bezier(.23,1,.32,1) both; }

/* ── Smooth scrollbar ── */
* { scroll-behavior:smooth; }
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:rgba(77,133,255,.2); border-radius:4px; }
::-webkit-scrollbar-thumb:hover { background:rgba(77,133,255,.4); }

/* ── Focus ring ── */
button:focus-visible, a:focus-visible {
  outline:2px solid rgba(77,133,255,.5);
  outline-offset:2px;
  border-radius:4px;
}

/* ── Global color blobs (like image) ── */
.blob-left {
  position:fixed;bottom:-10%;left:-8%;width:35vw;height:35vw;max-width:500px;max-height:500px;
  border-radius:50%;background:radial-gradient(circle,rgba(0,100,255,.22) 0%,rgba(0,180,255,.12) 40%,transparent 70%);
  filter:blur(50px);pointer-events:none;z-index:0;animation:blobFloat 8s ease-in-out infinite;
}
.blob-right {
  position:fixed;top:10%;right:-8%;width:30vw;height:30vw;max-width:450px;max-height:450px;
  border-radius:50%;background:radial-gradient(circle,rgba(80,0,200,.18) 0%,rgba(60,80,255,.12) 40%,transparent 70%);
  filter:blur(50px);pointer-events:none;z-index:0;animation:blobFloat 10s ease-in-out infinite reverse;
}
.blob-center {
  position:fixed;bottom:20%;left:50%;transform:translateX(-50%);width:40vw;height:20vw;
  border-radius:50%;background:radial-gradient(circle,rgba(0,60,200,.08) 0%,transparent 70%);
  filter:blur(60px);pointer-events:none;z-index:0;
}
@keyframes blobFloat {
  0%,100%{transform:translateY(0) scale(1);}
  50%{transform:translateY(-30px) scale(1.05);}
}
.page,.dash,.analytics,.about { position:relative;z-index:1; }


a, button { transition:color .18s,background .18s,border-color .18s,opacity .18s,transform .18s; }

#cr  { width:6px;height:6px;border-radius:50%;background:#fff;position:fixed;top:0;left:0;z-index:9999;pointer-events:none;transform:translate(-50%,-50%);transition:width .15s,height .15s,opacity .15s;mix-blend-mode:difference; }
#crr { width:36px;height:36px;border-radius:50%;border:1px solid rgba(77,133,255,0.5);position:fixed;top:0;left:0;z-index:9998;pointer-events:none;transform:translate(-50%,-50%);transition:left .18s cubic-bezier(.23,1,.32,1),top .18s cubic-bezier(.23,1,.32,1),width .3s,height .3s,border-color .3s;background:rgba(77,133,255,.04); }
body:has(a:hover) #cr,body:has(button:hover) #cr { width:10px;height:10px;background:rgba(77,133,255,.9); }
body:has(a:hover) #crr,body:has(button:hover) #crr { width:56px;height:56px;border-color:rgba(77,133,255,.35);background:rgba(77,133,255,.06); }
.trail-dot { position:fixed;border-radius:50%;pointer-events:none;z-index:9997;transform:translate(-50%,-50%); }

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
.wallet-premium { font-size:.62rem;color:var(--blue-hi);background:rgba(77,133,255,.1);border:1px solid rgba(77,133,255,.2);border-radius:5px;padding:.25rem .6rem;letter-spacing:.08em;font-weight:500; }

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
  position:fixed;top:0;left:0;right:0;z-index:300;
  background:rgba(0,4,12,0.85);
  backdrop-filter:blur(28px) saturate(1.6);
  border-bottom:1px solid rgba(77,133,255,.1);
}
/* Push content below fixed nav */
.app { padding-top:62px; }
.nav-logo {
  font-family:'Inter',sans-serif;font-weight:200;font-size:1.15rem;
  cursor:none;transition:opacity .2s;letter-spacing:.18em;text-transform:uppercase;color:var(--white);
}
.nav-logo:hover { opacity:.7; }
.logo-n { color:var(--blue-hi); }

.nav-links { display:flex;gap:.1rem; }
.nav-item {
  position:relative;font-size:.78rem;font-weight:400;color:rgba(200,215,255,.5);
  padding:.4rem .9rem;border-radius:8px;background:none;border:none;
  cursor:none;font-family:'Inter',sans-serif;letter-spacing:-.01em;transition:color .2s,background .2s;
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
  position:fixed;top:62px;left:0;right:0;z-index:199;
  background:rgba(2,11,24,0.98);backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(77,133,255,.12);
  display:flex;flex-direction:column;padding:.5rem 0;
  box-shadow:0 8px 32px rgba(0,0,0,0.6);
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
  .nav-burger { display:flex !important; }
}

/* ── PAGE TRANSITION ── */
.page { width:100%; }  /* animation handled by pageSlide */
@keyframes pin  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:none} }
@keyframes fadeLeft { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:none} }
@keyframes fadeRight{ from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:none} }
@keyframes scaleIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:none} }
/* Page enter */
.page { animation:fadeUp .6s cubic-bezier(.23,1,.32,1) both; width:100%; }
@keyframes charIn { from{opacity:0;transform:translateY(18px) skewY(2deg)} to{opacity:1;transform:translateY(0) skewY(0)} }
@keyframes meshMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes pageSlide { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes tiltIn { from{opacity:0;transform:perspective(800px) rotateX(8deg) translateY(20px)} to{opacity:1;transform:perspective(800px) rotateX(0) translateY(0)} }
@keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(77,133,255,.15)} 50%{box-shadow:0 0 40px rgba(77,133,255,.35),0 0 80px rgba(77,133,255,.1)} }
@keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }

/* ── Page transitions ── */
.page { animation:pageSlide .55s cubic-bezier(.23,1,.32,1) both; width:100%; }
.dash { padding:0;animation:pageSlide .5s cubic-bezier(.23,1,.32,1) both; }
.analytics { padding:0;animation:pageSlide .5s cubic-bezier(.23,1,.32,1) both; }

/* ── Gradient mesh background ── */
.mesh-bg {
  position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(ellipse 80% 60% at 20% 20%, rgba(26,60,140,.12) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 80%, rgba(14,40,100,.1) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 50% 50%, rgba(8,25,80,.08) 0%, transparent 60%),
    #020b18;
  background-size:200% 200%;
  animation:meshMove 18s ease infinite;
}

/* ── Glassmorphism card ── */
.glass-card {
  background:rgba(10,18,40,.55);
  backdrop-filter:blur(20px) saturate(1.4);
  border:1px solid rgba(77,133,255,.15);
  border-radius:16px;
  transition:transform .35s cubic-bezier(.23,1,.32,1), border-color .3s, box-shadow .3s;
  transform-style:preserve-3d;
  will-change:transform;
}
.glass-card:hover {
  border-color:rgba(77,133,255,.35);
  box-shadow:0 20px 60px rgba(0,0,0,.4), 0 0 0 1px rgba(77,133,255,.1), inset 0 1px 0 rgba(255,255,255,.06);
}

/* ── Magnetic button ── */
.mag-btn {
  position:relative;
  transition:transform .4s cubic-bezier(.23,1,.32,1);
  display:inline-flex;
}

/* ── Shimmer text ── */
.shimmer-text {
  background:linear-gradient(90deg,
    rgba(200,230,255,.85) 0%,
    #ffffff 25%,
    rgba(100,180,255,.95) 50%,
    #ffffff 75%,
    rgba(200,230,255,.85) 100%);
  background-size:200% auto;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:shimmer 5s linear infinite;
  text-shadow:none;
}

/* ── 3D tilt enhanced cards ── */
.tilt-card {
  transition:transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s;
  transform-style:preserve-3d;
  will-change:transform;
}
.tilt-card:hover { box-shadow:0 25px 60px rgba(0,0,0,.5); }

/* ── Progress bar animate ── */
.prog-bar { height:3px; border-radius:2px; overflow:hidden; background:rgba(255,255,255,.06); }
.prog-fill {
  height:100%; border-radius:2px;
  transform:scaleX(0); transform-origin:left;
  transition:transform 1.2s cubic-bezier(.23,1,.32,1);
}
.prog-fill.animate { transform:scaleX(1); }

/* ── Glow pulse for active elements ── */
.glow-active { animation:glowPulse 3s ease-in-out infinite; }

/* ── Char reveal spans ── */
.char-wrap { overflow:hidden; display:inline-block; }
.char { display:inline-block; animation:charIn .6s cubic-bezier(.23,1,.32,1) both; }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

.main { flex:1; width:100%; }

/* ══════════════════════════════
   HERO
══════════════════════════════ */
.hero {
  position:relative;overflow:hidden;
  min-height:100svh;width:100%;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:0;border-bottom:1px solid rgba(255,255,255,.06);
  text-align:center;
  background:#000;
}

/* ── Space photo background ── */
.hero-bg {
  position:absolute;inset:0;z-index:0;
  background:#000;
}
.hero-bg::before {
  content:'';position:absolute;inset:0;
  background-image:url('/bg.gif');
  background-size:cover;
  background-position:center center;
  background-repeat:no-repeat;
  opacity:.55;
  mix-blend-mode:screen;
}
/* Dark overlay so text readable */
.hero-bg::after {
  content:'';position:absolute;inset:0;
  background:
    radial-gradient(ellipse 80% 55% at 50% 50%, rgba(5,10,40,.55) 0%, transparent 75%),
    linear-gradient(to bottom, rgba(0,0,0,.5) 0%, rgba(0,0,0,.05) 35%, rgba(0,0,0,.65) 100%);
}

/* Stars layer */
.hero-stars {
  position:absolute;inset:0;z-index:1;pointer-events:none;
  background-image:
    radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 28% 8%, rgba(255,255,255,.85) 0%, transparent 100%),
    radial-gradient(1px 1px at 43% 22%, rgba(255,255,255,.5) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 57% 11%, rgba(255,255,255,.9) 0%, transparent 100%),
    radial-gradient(1px 1px at 68% 6%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(2px 2px at 79% 19%, rgba(255,255,255,.75) 0%, transparent 100%),
    radial-gradient(1px 1px at 91% 13%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 8% 35%, rgba(255,255,255,.4) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 22% 42%, rgba(255,255,255,.65) 0%, transparent 100%),
    radial-gradient(1px 1px at 36% 38%, rgba(255,255,255,.45) 0%, transparent 100%),
    radial-gradient(1px 1px at 51% 32%, rgba(255,255,255,.5) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 64% 28%, rgba(255,255,255,.8) 0%, transparent 100%),
    radial-gradient(1px 1px at 76% 41%, rgba(255,255,255,.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 88% 33%, rgba(255,255,255,.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 55%, rgba(255,255,255,.35) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 33% 61%, rgba(255,255,255,.55) 0%, transparent 100%),
    radial-gradient(1px 1px at 47% 48%, rgba(255,255,255,.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 72% 52%, rgba(255,255,255,.45) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 58%, rgba(255,255,255,.35) 0%, transparent 100%),
    radial-gradient(2px 2px at 94% 44%, rgba(255,255,255,.7) 0%, transparent 100%),
    radial-gradient(1px 1px at 6% 72%, rgba(255,255,255,.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 19% 78%, rgba(255,255,255,.4) 0%, transparent 100%);
}

/* Center light beam like photo 1 */
.hero-beam {
  position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:2;
  width:600px;height:70%;pointer-events:none;
  background:conic-gradient(
    from 260deg at 50% 100%,
    transparent 0deg,
    rgba(77,133,255,.04) 10deg,
    rgba(26,79,255,.08) 20deg,
    rgba(100,150,255,.06) 30deg,
    rgba(26,79,255,.1) 40deg,
    rgba(77,133,255,.04) 50deg,
    transparent 60deg,
    transparent 240deg,
    rgba(77,133,255,.04) 250deg,
    rgba(26,79,255,.08) 260deg,
    transparent 300deg
  );
}

/* Arc lines like photo 1 */
.hero-arc-left {
  position:absolute;z-index:2;pointer-events:none;
  bottom:-20%;left:-15%;
  width:55%;height:90%;
  border-radius:0 100% 0 0;
  border-top:1px solid rgba(180,200,255,.12);
  border-right:1px solid rgba(180,200,255,.08);
}
.hero-arc-left-2 {
  position:absolute;z-index:2;pointer-events:none;
  bottom:-25%;left:-20%;
  width:52%;height:85%;
  border-radius:0 100% 0 0;
  border-top:1px solid rgba(180,200,255,.06);
  border-right:1px solid rgba(180,200,255,.04);
}
.hero-arc-right {
  position:absolute;z-index:2;pointer-events:none;
  bottom:-20%;right:-15%;
  width:55%;height:90%;
  border-radius:100% 0 0 0;
  border-top:1px solid rgba(180,200,255,.12);
  border-left:1px solid rgba(180,200,255,.08);
}
.hero-arc-right-2 {
  position:absolute;z-index:2;pointer-events:none;
  bottom:-25%;right:-20%;
  width:52%;height:85%;
  border-radius:100% 0 0 0;
  border-top:1px solid rgba(180,200,255,.06);
  border-left:1px solid rgba(180,200,255,.04);
}

/* Center glow point */
.hero-glow-point {
  position:absolute;bottom:12%;left:50%;transform:translateX(-50%);
  z-index:3;pointer-events:none;
  width:4px;height:4px;border-radius:50%;
  background:#fff;
  box-shadow:0 0 8px 2px #fff, 0 0 30px 8px rgba(100,160,255,.8), 0 0 80px 20px rgba(26,79,255,.5), 0 0 160px 40px rgba(26,79,255,.2);
}

/* Bottom fade */
.hero-vignette {
  position:absolute;inset:0;z-index:3;pointer-events:none;
  background:
    linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 30%),
    linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.4) 20%, transparent 50%),
    linear-gradient(to right, rgba(0,0,0,.3) 0%, transparent 30%),
    linear-gradient(to left, rgba(0,0,0,.3) 0%, transparent 30%);
}

/* ── CENTERED content layout like photo 2 ── */
.hero-content {
  position:relative;z-index:4;
  display:flex;flex-direction:column;
  align-items:center;
  padding:0 2rem;
  max-width:780px;
  width:100%;
}
.hero-eyebrow {
  font-family:'Inter',sans-serif;font-size:.58rem;font-weight:500;
  color:rgba(180,210,255,.85);letter-spacing:.32em;text-transform:uppercase;
  margin-bottom:2rem;
  animation:pin .6s .1s both;
  border:1px solid rgba(77,133,255,.3);
  border-radius:20px;
  padding:.35rem 1.2rem;
  background:rgba(10,40,120,.35);
  backdrop-filter:blur(20px);
  box-shadow:0 0 20px rgba(30,90,200,.25), inset 0 1px 0 rgba(255,255,255,.1);
}
.hero-h1 {
  font-family:'Space Grotesk','Inter',sans-serif !important;
  font-size:clamp(3rem,7.5vw,6.5rem);
  font-weight:800;
  line-height:.92;
  letter-spacing:-.04em;
  color:#ffffff;
  margin-bottom:1.8rem;
  text-align:center;
  text-shadow:0 2px 40px rgba(0,0,0,.85);
}
.hero-h1 em { font-style:normal;font-weight:200;color:rgba(100,150,255,0.9); }
.hero-tagline {
  font-size:1.05rem;font-weight:300;color:rgba(200,220,255,.8);
  letter-spacing:.01em;margin-bottom:2.6rem;
  line-height:1.75;max-width:540px;text-align:center;
  animation:pin .6s .28s both;
  text-shadow:0 1px 20px rgba(0,0,0,.9);
}
.hero-tagline strong { color:rgba(210,225,255,.9);font-weight:400; }
.hero-ctas {
  display:flex;gap:.75rem;align-items:center;justify-content:center;
  flex-wrap:wrap;
  animation:pin .6s .38s both;
}
.cta-solid {
  display:inline-flex;align-items:center;gap:.45rem;
  background:rgba(240,248,255,.95);color:#020b18;
  padding:.72rem 1.8rem;border-radius:50px;
  font-size:.78rem;font-weight:500;letter-spacing:.06em;
  border:none;cursor:pointer;font-family:'Inter',sans-serif;
  transition:background .3s,transform .4s cubic-bezier(.23,1,.32,1),box-shadow .3s;
  box-shadow:0 0 30px rgba(255,255,255,.12), 0 4px 20px rgba(0,0,0,.3);
  position:relative;overflow:hidden;
}
.cta-solid::before {
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.2),transparent);
  opacity:0;transition:opacity .3s;border-radius:50px;
}
.cta-solid:hover { background:rgba(255,255,255,.95);transform:translateY(-3px) scale(1.02);box-shadow:0 12px 40px rgba(255,255,255,.25),0 0 0 1px rgba(255,255,255,.1); }
.cta-solid:hover::before { opacity:1; }
.cta-solid:active { transform:translateY(0) scale(.98); }
.cta-outline {
  display:inline-flex;align-items:center;gap:.45rem;
  background:rgba(255,255,255,.05);color:rgba(210,225,255,.9);
  padding:.72rem 1.6rem;border-radius:50px;
  font-size:.78rem;font-weight:300;letter-spacing:.06em;
  border:1px solid rgba(255,255,255,.12);
  cursor:pointer;font-family:'Inter',sans-serif;text-decoration:none;
  transition:background .3s,border-color .3s,transform .4s cubic-bezier(.23,1,.32,1),box-shadow .3s;
  backdrop-filter:blur(12px);
  position:relative;overflow:hidden;
}
.cta-outline:hover { background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.35);transform:translateY(-3px) scale(1.02);box-shadow:0 8px 30px rgba(0,0,0,.3); }
.cta-outline:active { transform:translateY(0) scale(.98); }
.hero-scroll {
  position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);
  z-index:4;display:flex;flex-direction:column;align-items:center;gap:.5rem;
  font-size:.55rem;color:rgba(180,200,255,.35);letter-spacing:.18em;text-transform:uppercase;
  animation:pin .6s .7s both;
}
.scroll-line { width:1px;height:36px;background:linear-gradient(to bottom,rgba(77,133,255,.4),transparent);animation:sl 2s ease infinite; }
@keyframes sl{0%,100%{opacity:.3;transform:scaleY(.6)}50%{opacity:1;transform:scaleY(1)}}

/* hero-bottom no longer used but keep for compat */
.hero-bottom { display:none; }
.hero-desc { display:none; }
.hero-curve-left { display:none; }

/* ── STATS ── */
.stats-row { display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--border); }
@media(max-width:768px){ .stats-row { grid-template-columns:repeat(3,1fr); } .stat-box { border-right:none;border-bottom:1px solid var(--border);padding:1.2rem 1rem; } }
.stat-box { padding:1.8rem 3.5rem;border-right:1px solid var(--border);position:relative;overflow:hidden;cursor:default;transition:background .3s,transform .4s cubic-bezier(.23,1,.32,1); }
.stat-box:hover { background:rgba(26,79,255,.04);transform:translateY(-2px); }
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
.anum { font-family:'Inter',sans-serif;font-size:.9rem;font-weight:400;color:var(--text3);min-width:26px; }
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
.dash { padding:0; }  /* animation handled by pageSlide */
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
.kpi.kblue2::before{background:linear-gradient(90deg,transparent,var(--blue-hi),#34d399,transparent)}
.kpi.korange::before{background:linear-gradient(90deg,transparent,var(--orange),#fb923c,transparent)}
.kpi.kpurple::before{background:linear-gradient(90deg,transparent,var(--purple),#c4b5fd,transparent)}
.kpi.ktoken::before{background:linear-gradient(90deg,transparent,#4d85ff,#3b82f6,transparent)}
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
.panel-tag.green { background:rgba(77,133,255,.09);color:var(--blue-hi); }
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
.cbadge-g { background:rgba(77,133,255,.09);color:var(--blue-hi); }
.two-col { display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-bottom:1.2rem;min-width:0; }

/* ── ANALYTICS ── */
.analytics { padding:0; }  /* animation handled by pageSlide */
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
.abt-name { font-family:'Inter',sans-serif;font-weight:200;font-size:3rem;font-weight:500;color:var(--white);line-height:1; }
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
  border-top:1px solid rgba(77,133,255,.1);
  background:rgba(2,11,24,0.98);
  backdrop-filter:blur(20px);
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
  background:var(--blue-hi);border:2px solid var(--bg);
  animation:bdg 2.5s infinite;
}
@keyframes bdg{0%,100%{box-shadow:0 0 0 0 rgba(77,133,255,.5)}60%{box-shadow:0 0 0 5px rgba(77,133,255,0)}}

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
.cp-status { font-size:.58rem;color:var(--blue-hi);letter-spacing:.08em;display:flex;align-items:center;gap:.32rem; }
.cp-sdot { width:4px;height:4px;border-radius:50%;background:var(--blue-hi);animation:bdg 2s infinite; }
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
  /* Docs */
  .docs-grid { grid-template-columns:1fr !important; padding:1.5rem !important; gap:1rem !important; }
  .docs-sidebar { display:none !important; }
  .docs-content { min-width:0 !important; }
  /* Howto */
  .howto-grid { grid-template-columns:repeat(2,1fr) !important; gap:.75rem !important; padding-left:1.5rem !important; padding-right:1.5rem !important; }
}
@media(max-width:600px){
  html,body { overflow-x:hidden;width:100%; }
  .app { overflow-x:hidden; }
  #cr,#crr { display:none; }
  body { cursor:auto; }
  .nav { padding:0 1rem;height:54px; }
  .nav-links { gap:0; }
  .nav-item { padding:.32rem .5rem;font-size:.68rem; }
  .hero { min-height:100svh;min-height:100vh;padding-bottom:2rem; }
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
  .mob-menu { top:54px; }
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
  /* Playground mobile — all grids single col */
  .pg-wrap { padding:1rem 1rem 4rem !important; }
  .pg-token-card,.pg-wallet-card { padding:.9rem 1rem !important; }
  .pg-chat-wrap { border-radius:14px !important; }
  .pg-chat-header { padding:.8rem 1rem !important; flex-wrap:wrap; gap:.4rem !important; }
  .pg-terminal { border-radius:12px !important; }
  .pg-output { border-radius:12px !important; }
  /* Force all playground grids to 1 col on mobile */
  .pg-wrap [style*="grid-template-columns:repeat(3"] { grid-template-columns:1fr !important; }
  .pg-wrap [style*="grid-template-columns:repeat(2"] { grid-template-columns:1fr !important; }
  .pg-wrap [style*="grid-template-columns:1fr 340px"] { grid-template-columns:1fr !important; }
  .pg-wrap [style*="grid-template-columns:300px 1fr"] { grid-template-columns:1fr !important; }
  .pg-wrap [style*="grid-template-columns:280px 1fr"] { grid-template-columns:1fr !important; }
}

@media(max-width:768px){
  .prem-cards { grid-template-columns:1fr 1fr !important; }
  /* Playground tablet */
  .pg-wrap { padding:1.5rem 1.5rem 4rem !important; }
  .two-col { grid-template-columns:1fr !important; }
  .an-grid { grid-template-columns:1fr 1fr !important; }
  .dash-body { grid-template-columns:1fr !important; }
  .reader-layout { gap:1.5rem !important; }
  .section { padding-left:1.5rem !important;padding-right:1.5rem !important; }
}
/* ══ MOBILE RESPONSIVE ══ */
@media(max-width:768px){
  .hero { min-height:100svh; }
  .hero-content { padding:0 1.4rem; }
  .hero-h1 { font-size:clamp(2.8rem,11vw,5rem) !important; letter-spacing:-.03em; }
  .hero-tagline { font-size:.9rem; max-width:100%; padding:0 .5rem; }
  .hero-eyebrow { font-size:.5rem; letter-spacing:.18em; padding:.3rem .9rem; }
  .hero-ctas { gap:.6rem; flex-direction:column; align-items:stretch; width:100%; max-width:320px; }
  .hero-ctas .mag-btn { width:100%; }
  .hero-ctas .mag-btn > * { width:100%; justify-content:center; }
  .cta-solid, .cta-outline { width:100%; justify-content:center; padding:.75rem 1.2rem; font-size:.8rem; }
  .nav { padding:0 1.2rem; height:58px; }
  .nav-logo-name { font-size:.85rem; }
  .stats-row { grid-template-columns:1fr !important; }
  .stat-box { padding:1.2rem 1.5rem; border-right:none !important; border-bottom:1px solid var(--border); }
  .hero-scroll { display:none; }
}
@media(max-width:480px){
  .hero-h1 { font-size:clamp(2.4rem,12vw,4rem) !important; }
  .hero-tagline { font-size:.82rem; }
}

/* ══ DOCS mobile ══ */
@media(max-width:768px){
  .docs-grid { grid-template-columns:1fr !important; padding:1rem 1.2rem 3rem !important; gap:0 !important; }
  .docs-sidebar { display:none !important; }
  .docs-content { min-width:0 !important; overflow-x:hidden !important; }
}

/* ══ Howto mobile ══ */
@media(max-width:900px){
  .howto-grid { grid-template-columns:repeat(2,1fr) !important; }
}
@media(max-width:500px){
  .howto-grid { grid-template-columns:1fr !important; }
  .abt-inline-grid { grid-template-columns:1fr !important; }
}

`;

const ACT_ICONS = {visit:"👁",share:"↗",chat:"💬",read:"📖",follow:"✦",view:"📊"};
const ACT_CLS   = {visit:"ico-v",share:"ico-s",chat:"ico-c",read:"ico-r",follow:"ico-s",view:"ico-v"};
const SUGGESTIONS = ["What is NoelClaw?","What can Bankr agent do?","How do I swap tokens?","What's trending on Base?"];
const SYS = `You are Noel, the AI assistant for NoelClaw. Here is everything you need to know:

ABOUT NOELCLAW:
- NoelClaw is an AI agent platform on Base chain, powered by Bankr API
- Website: noelclaw.fun | X: @noelclawfun | GitHub: https://github.com/0xzonee/noelclaw
- Token: $NOELCLAW | CA: 0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3
- Trade: https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3
- NOT a chatbot — executes real on-chain actions via natural language

WHAT IT CAN DO (via Bankr API):
- Swap tokens on Base, analyze with AI signals (BUY/SELL/HOLD 1-10)
- Deploy new tokens, set limit orders, claim fees
- Track smart money & whale wallets
- Auto-agent: monitors market every 30s and executes autonomously

STACK: React + Vite, Convex, Privy, Bankr API, Base chain, Claude AI, TypeScript

PERSONALITY: Sharp, direct, crypto-native. Max 2-3 sentences. Confident. Never generic.`;

const INIT = [{ r:"a", t:"Hey — I'm Noel 🦕. Ask me anything — token prices, swaps, trending Base tokens, or anything crypto." }];

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
    id:"swap",
    label:"Token Swap",
    icon:"🔁",
    tag:"Bankr Execute",
    tagColor:"#4d85ff",
    title:"Swap any token via chat",
    desc:"Type what you want and Bankr executes it on Base chain. No DEX UI, no manual approvals — just natural language to on-chain action in seconds.",
    steps:[
      {step:"01", text:"User: 'swap 0.5 ETH to USDC on Base'"},
      {step:"02", text:"Bankr agent parses intent & checks balance"},
      {step:"03", text:"Routes through best liquidity path on Base"},
      {step:"04", text:"Transaction confirmed — USDC received"},
    ],
    result:"Swap executed and confirmed in 9 seconds",
    resultColor:"#4d85ff",
  },
  {
    id:"alpha",
    label:"Alpha Analysis",
    icon:"⚡",
    tag:"AI · Bankr",
    tagColor:"#a78bfa",
    title:"Deep token analysis in seconds",
    desc:"Ask for analysis on any Base chain token. The agent pulls live on-chain data, smart money activity, and generates a conviction signal with entry/exit targets.",
    steps:[
      {step:"01", text:"Query: 'analyze BRETT on Base — should I buy?'"},
      {step:"02", text:"Bankr fetches price, volume, whale activity"},
      {step:"03", text:"Claude analyzes patterns & momentum"},
      {step:"04", text:"Returns BUY/SELL signal with conviction 8/10"},
    ],
    result:"Full analysis with entry/exit targets ready",
    resultColor:"#a78bfa",
  },
  {
    id:"deploy",
    label:"Deploy Token",
    icon:"🚀",
    tag:"Bankr Execute",
    tagColor:"#f97316",
    title:"Launch a token in one sentence",
    desc:"Describe your token and Bankr deploys it on Base chain. Name, symbol, supply — that's all you need. Contract deployed, verified, ready to trade.",
    steps:[
      {step:"01", text:"User: 'deploy MYTOKEN with 1B supply on Base'"},
      {step:"02", text:"Bankr generates deployment transaction"},
      {step:"03", text:"Contract deployed to Base chain"},
      {step:"04", text:"Contract address returned & verified"},
    ],
    result:"Token live on Base in under 30 seconds",
    resultColor:"#f97316",
  },
  {
    id:"limit",
    label:"Limit Order",
    icon:"📋",
    tag:"Bankr Execute",
    tagColor:"#4d85ff",
    title:"Set orders while you sleep",
    desc:"Natural language limit orders on Base chain. Tell Bankr your target price and it monitors and executes automatically — no platform login required.",
    steps:[
      {step:"01", text:"User: 'buy 0.1 ETH when price drops to $1,800'"},
      {step:"02", text:"Bankr sets limit order via on-chain protocol"},
      {step:"03", text:"Price monitor watches Base chain in real-time"},
      {step:"04", text:"Order triggered & filled at $1,798 — confirmed"},
    ],
    result:"Limit order filled at target price automatically",
    resultColor:"#4d85ff",
  },
];

function UseCaseShowcase(){
  const [active, setActive] = useState(0);
  const uc = USE_CASES[active];
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
          {/* Terminal header */}
          <div style={{display:"flex",alignItems:"center",gap:".4rem",marginBottom:"1.2rem"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#ff5f57"}}/>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#febc2e"}}/>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#28c840"}}/>
            <span style={{marginLeft:".6rem",fontSize:".58rem",color:"rgba(255,255,255,.2)",letterSpacing:".1em"}}>noelclaw-agent — bash</span>
          </div>

          {/* Prompt line */}
          <div style={{fontSize:".68rem",color:"#4d85ff",marginBottom:"1rem",display:"flex",alignItems:"center",gap:".4rem"}}>
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
            <span style={{fontSize:".65rem",color:"#4d85ff",letterSpacing:".04em"}}>✓ Agent completed successfully</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes cursor-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

/* ══════════════════════════════
   AGENT PLAYGROUND COMPONENT
══════════════════════════════ */
/* ══════════════════════════════
   AGENT PLAYGROUND — FULL BANKR
══════════════════════════════ */
/* ══════════════════════════════
   AGENT PLAYGROUND — BANKR
   Aesthetic: Dark dashboard cards (ref img 2)
   Terminal: Retro-blue monospace (ref img 3)
══════════════════════════════ */
/* ══════════════════════════════
   CLI TERMINAL — truemarkets style
   Type commands, Bankr executes
══════════════════════════════ */
/* ── BnkrRow — live BNKR token price row ── */
function BnkrRow() {
  const [bnkr, setBnkr] = useState(null);
  useEffect(()=>{
    const fetch_ = async()=>{
      try{
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bankr&sparkline=false&price_change_percentage=24h")}`;
        const r0 = await fetch(proxyUrl,{signal:AbortSignal.timeout(8000)}).catch(()=>null);
        const r = r0?.ok ? {ok:true, json:async()=>{const w=await r0.json();return JSON.parse(w.contents||"[]");}} : null;
        if(r?.ok){ const d=await r.json().catch(()=>null); if(d?.[0]) setBnkr(d[0]); }
      }catch(e){}
    };
    fetch_();
    const id = setInterval(fetch_, 60000);
    return ()=>clearInterval(id);
  },[]);

  if(!bnkr) return null;
  const chg = parseFloat(bnkr.price_change_percentage_24h||0)||0;
  const isPos = chg>=0;
  const fmt = n=>{try{const v=parseFloat(n)||0;return v>=1e9?"$"+(v/1e9).toFixed(2)+"B":v>=1e6?"$"+(v/1e6).toFixed(1)+"M":v>=1e3?"$"+(v/1e3).toFixed(1)+"K":"$"+v.toFixed(2);}catch{return"—";}};
  return (
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 70px",padding:".65rem 1.2rem",borderBottom:"1px solid var(--border)",background:"rgba(100,50,255,.04)",alignItems:"center",cursor:"pointer",transition:"background .15s"}}
      onClick={()=>window.open("https://www.coingecko.com/en/coins/bankr","_blank")}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(100,50,255,.09)"}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(100,50,255,.04)"}>
      <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
        {bnkr.image?<img src={bnkr.image} alt="BNKR" style={{width:"22px",height:"22px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
        :<div style={{width:"22px",height:"22px",borderRadius:"50%",background:"rgba(100,50,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:".65rem",fontWeight:700,color:"#a78bfa"}}>B</div>}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
            <span style={{fontSize:".72rem",color:"#a78bfa",fontWeight:700}}>$BNKR</span>
            <span style={{fontSize:".38rem",background:"rgba(100,50,255,.15)",color:"#a78bfa",border:"1px solid rgba(167,139,250,.3)",borderRadius:"4px",padding:".06rem .3rem",fontWeight:700}}>BANKR</span>
          </div>
          <span style={{fontSize:".5rem",color:"var(--text3)",fontFamily:"'IBM Plex Mono',monospace"}}>
            {"$"+(bnkr.current_price||0).toFixed(4)}
          </span>
        </div>
      </div>
      <div style={{textAlign:"right"}}><span style={{fontSize:".65rem",color:"rgba(180,200,255,.6)",fontFamily:"'IBM Plex Mono',monospace"}}>{bnkr.market_cap?fmt(bnkr.market_cap):"—"}</span></div>
      <div style={{textAlign:"right"}}><span style={{fontSize:".65rem",color:"rgba(180,200,255,.6)",fontFamily:"'IBM Plex Mono',monospace"}}>{bnkr.total_volume?fmt(bnkr.total_volume):"—"}</span></div>
      <div style={{textAlign:"right"}}><span style={{fontSize:".72rem",fontWeight:700,color:isPos?"#4d85ff":"#ff6b6b",fontFamily:"'IBM Plex Mono',monospace"}}>{isPos?"+":""}{chg.toFixed(2)}%</span></div>
    </div>
  );
}

function CliTerminal({ bankrAsk, walletAddress, authenticated, login }) {
  const [input, setInput]       = useState("");
  const [history, setHistory]   = useState([
    { type:"system", text:"NoelClaw CLI v1.0 — Noel Agent Terminal" },
    { type:"system", text:'Type "help" to see available commands.' },
    { type:"system", text:"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
  ]);
  const [busy, setBusy]         = useState(false);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [cmdIdx, setCmdIdx]     = useState(-1);
  const [threadId, setThreadId] = useState(null);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[history]);

  const COMMANDS = {
    help: {
      desc: "Show all commands",
      handler: () => ({
        type:"output",
        text:`Available commands:
  price <token>          — Get live price (e.g. price ETH)
  analyze <token>        — Deep AI analysis with signal
  swap <amt> <from> <to> — Execute swap (e.g. swap 0.01 ETH USDC)
  trending               — Top trending tokens on Base
  balance                — Check wallet balance
  smartmoney <token>     — Track whale wallets
  trades <token>         — Recent trade activity
  deploy <name> <symbol> — Deploy token on Base
  fees <token>           — Check & claim fees
  ask <anything>         — Ask Bankr anything
  clear                  — Clear terminal
  help                   — Show this menu`
      })
    },
    clear: {
      desc: "Clear terminal",
      handler: () => { setHistory([{type:"system",text:"Terminal cleared."}]); return null; }
    },
  };

  const runCmd = async (raw) => {
    if(!raw.trim()) return;
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setHistory(h=>[...h, {type:"input", text:`$ ${raw}`}]);
    setCmdHistory(h=>[raw,...h].slice(0,50));
    setCmdIdx(-1);
    setBusy(true);

    // Built-in commands
    if(cmd === "clear") { COMMANDS.clear.handler(); setBusy(false); return; }
    if(cmd === "help") {
      const r = COMMANDS.help.handler();
      setHistory(h=>[...h, r]);
      setBusy(false);
      return;
    }

    // Build Bankr prompt from command
    let prompt = "";
    if(cmd === "price")          prompt = `What is the current price of ${args[0]||"ETH"}? Give price, 24h change, volume, market cap. Be concise.`;
    else if(cmd === "analyze")   prompt = `Deep analysis of ${args[0]||"ETH"}: price momentum, whale activity, buy/sell pressure. Give BUY/SELL/HOLD signal with conviction 1-10.`;
    else if(cmd === "swap")      prompt = `Swap ${args[0]||"0.01"} ${args[1]||"ETH"} to ${args[2]||"USDC"} on Base chain.`;
    else if(cmd === "trending")  prompt = `Top 8 trending tokens on Base right now. List: symbol, price, 24h change, volume.`;
    else if(cmd === "balance")   prompt = `What is my wallet balance on Base chain?${walletAddress?` Wallet: ${walletAddress}`:""}`;
    else if(cmd === "smartmoney") prompt = `Who are the top smart money wallets for ${args[0]||"Base chain"}? Show their recent buys and PnL.`;
    else if(cmd === "trades")    prompt = `Recent trade activity for ${args[0]||"ETH"} on Base: buys vs sells, volume, biggest trades.`;
    else if(cmd === "deploy")    prompt = `Deploy a token on Base chain: name "${args.slice(0,-1).join(" ")||args[0]||"MyToken"}", symbol "${args[args.length-1]||"MYT"}", supply 1000000000.`;
    else if(cmd === "fees")      prompt = `Check and claim trading fees for ${args[0]||"NOELCLAW"} token.`;
    else if(cmd === "ask")       prompt = args.join(" ");
    else                          prompt = raw; // pass anything to Bankr

    if(!prompt) {
      setHistory(h=>[...h, {type:"error", text:`Unknown command: ${cmd}. Type "help" for available commands.`}]);
      setBusy(false);
      return;
    }

    // Spinner line
    setHistory(h=>[...h, {type:"loading", text:"Bankr processing…", id:"spinner"}]);

    try {
      const res = await bankrAsk({ prompt, threadId: threadId||undefined });
      if(res.threadId) setThreadId(res.threadId);
      // Remove spinner
      setHistory(h=>h.filter(l=>l.id!=="spinner").concat({
        type:"output",
        text: res.response,
        txs: res.transactions,
      }));
    } catch(e) {
      setHistory(h=>h.filter(l=>l.id!=="spinner").concat({type:"error", text:`Error: ${e.message}`}));
    }
    setBusy(false);
  };

  const onKey = e => {
    if(e.key === "Enter") { runCmd(input); setInput(""); }
    else if(e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(cmdIdx+1, cmdHistory.length-1);
      setCmdIdx(idx);
      setInput(cmdHistory[idx]||"");
    }
    else if(e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(cmdIdx-1, -1);
      setCmdIdx(idx);
      setInput(idx===-1?"":cmdHistory[idx]||"");
    }
  };

  return (
    <div style={{background:"#030508",border:"1px solid rgba(26,79,255,.2)",borderRadius:"16px",overflow:"hidden",fontFamily:"'IBM Plex Mono',monospace",boxShadow:"0 0 40px rgba(26,79,255,.06),0 0 0 1px rgba(26,79,255,.08)"}}>
      {/* Title bar */}
      <div style={{background:"#07090f",borderBottom:"1px solid rgba(26,79,255,.15)",padding:".6rem 1rem",display:"flex",alignItems:"center",gap:".5rem"}}>
        <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#ff5f57"}}/>
        <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#febc2e"}}/>
        <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#28c840"}}/>
        <span style={{marginLeft:".7rem",fontSize:".6rem",color:"rgba(77,133,255,.5)",letterSpacing:".1em"}}>noelclaw — bankr-agent-terminal</span>
        {threadId&&<span style={{marginLeft:"auto",fontSize:".5rem",color:"rgba(77,133,255,.5)",background:"rgba(26,79,255,.08)",border:"1px solid rgba(77,133,255,.15)",borderRadius:"20px",padding:".1rem .45rem"}}>⚡ thread active</span>}
      </div>

      {/* Output */}
      <div onClick={()=>inputRef.current?.focus()}
        style={{padding:"1.2rem 1.4rem",minHeight:"400px",maxHeight:"520px",overflowY:"auto",display:"flex",flexDirection:"column",gap:".3rem",cursor:"text",scrollbarWidth:"thin",scrollbarColor:"rgba(26,79,255,.2) transparent"}}>
        {history.map((l,i)=>(
          <div key={i} style={{
            fontSize:".73rem",
            lineHeight:1.7,
            color: l.type==="input"?"rgba(180,210,255,.9)":
                   l.type==="error"?"#f87171":
                   l.type==="system"?"rgba(77,133,255,.5)":
                   l.type==="loading"?"rgba(77,133,255,.4)":
                   "rgba(200,220,255,.8)",
            whiteSpace:"pre-wrap",
            wordBreak:"break-word",
            fontWeight: l.type==="input"?500:300,
          }}>
            {l.type==="loading"&&<span style={{animation:"pulse 1s infinite",display:"inline-block",marginRight:".5rem"}}>▋</span>}
            {l.text}
            {l.txs?.length>0&&(
              <div style={{marginTop:".4rem",color:"#4d85ff",fontSize:".65rem"}}>
                ✓ {l.txs.length} transaction{l.txs.length>1?"s":""} executed on Base
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{borderTop:"1px solid rgba(26,79,255,.12)",padding:".75rem 1.4rem",display:"flex",alignItems:"center",gap:".6rem",background:"rgba(26,79,255,.02)"}}>
        <span style={{color:"rgba(77,133,255,.6)",fontSize:".78rem",flexShrink:0,userSelect:"none"}}>{"$"}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={busy?"processing…":"type a command or ask Bankr anything…"}
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
          style={{flex:1,background:"none",border:"none",outline:"none",color:"rgba(200,220,255,.9)",fontSize:".76rem",fontFamily:"'IBM Plex Mono',monospace",caretColor:"rgba(77,133,255,.8)"}}
        />
        {busy&&<span style={{fontSize:".6rem",color:"rgba(77,133,255,.4)",animation:"pulse 1s infinite",flexShrink:0}}>●</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════
   AUTO-AGENT LOOP COMPONENT
   Analyze → Decide → Execute autonomously
══════════════════════════════ */
function AutoAgent({ bankrAsk, swapTokens, walletAddress, authenticated, login }) {
  const [token, setToken]         = useState("ETH");
  const [action, setAction]       = useState("buy");
  const [condition, setCondition] = useState("price_drop");
  const [threshold, setThreshold] = useState("5");
  const [amount, setAmount]       = useState("0.01");
  const [targetToken, setTargetToken] = useState("USDC");
  const [running, setRunning]     = useState(false);
  const [logs, setLogs]           = useState([]);
  const [status, setStatus]       = useState("idle"); // idle | watching | triggered | done | error
  const [threadId, setThreadId]   = useState(null);
  const intervalRef               = useRef(null);
  const cycleRef                  = useRef(0);

  const CONDITIONS = [
    { id:"price_drop",   label:"Price drops by %",    prompt:(t,v)=>`What is the current price of ${t} and has it dropped more than ${v}% in the last hour? Answer YES or NO first, then give the current price.` },
    { id:"price_rise",   label:"Price rises by %",    prompt:(t,v)=>`Has ${t} risen more than ${v}% in the last hour? Answer YES or NO first, then give the current price.` },
    { id:"volume_spike", label:"Volume spikes by %",  prompt:(t,v)=>`Has the trading volume for ${t} increased by more than ${v}% compared to the 24h average? Answer YES or NO first.` },
    { id:"smart_money",  label:"Smart money buys",    prompt:(t,v)=>`Are smart money wallets or whales accumulating ${t} right now? Answer YES or NO first, then briefly explain.` },
    { id:"sentiment",    label:"Bullish signal",       prompt:(t,v)=>`Is there a strong bullish signal for ${t} right now based on price, volume, and whale activity? Answer YES or NO first.` },
  ];

  const addLog = (msg, type="info") => {
    const ts = new Date().toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
    setLogs(p=>[{msg,type,ts},...p].slice(0,30));
  };

  const stopAgent = () => {
    if(intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setStatus("idle");
    addLog("Agent stopped by user","warn");
  };

  const startAgent = async () => {
    if(!authenticated){ login(); return; }
    setRunning(true);
    setStatus("watching");
    setLogs([]);
    cycleRef.current = 0;
    addLog(`Auto-agent started — watching ${token} via Bankr…`,"info");
    addLog(`Condition: ${CONDITIONS.find(c=>c.id===condition)?.label} ${threshold}%`,"info");
    addLog(`Action: ${action === "swap" ? `Swap ${amount} ${token} → ${targetToken}` : action}`,"info");

    const check = async () => {
      cycleRef.current++;
      const condObj = CONDITIONS.find(c=>c.id===condition);
      addLog(`[Cycle ${cycleRef.current}] Querying Bankr for ${token} status…`,"info");

      try {
        const res = await bankrAsk({
          prompt: condObj.prompt(token, threshold),
          threadId: threadId||undefined,
        });
        if(res.threadId) setThreadId(res.threadId);

        const answer = res.response.trim().toUpperCase();
        const triggered = answer.startsWith("YES") || answer.includes("\nYES") || answer.includes(" YES");

        addLog(`Bankr: "${res.response.slice(0,120)}${res.response.length>120?"…":""}"`, "info");

        if(triggered) {
          setStatus("triggered");
          addLog(`✓ Condition met! Executing ${action}…`,"success");

          if(action === "swap") {
            try {
              addLog(`Submitting swap: ${amount} ${token} → ${targetToken} via Bankr…`,"info");
              const swapRes = await bankrAsk({
                prompt: `Swap ${amount} ${token} to ${targetToken} on Base chain now.`,
                threadId: res.threadId||undefined,
              });
              addLog(`Swap executed: ${swapRes.response.slice(0,100)}`,"success");
            } catch(e) {
              addLog(`Swap failed: ${e.message}`,"error");
            }
          } else if(action === "alert") {
            addLog(`🔔 ALERT: ${token} condition triggered at cycle ${cycleRef.current}`,"success");
          } else if(action === "analyze") {
            const alphaRes = await bankrAsk({
              prompt: `Full analysis of ${token}: price, momentum, whale activity, and BUY/SELL/HOLD verdict with conviction score.`,
              threadId: res.threadId||undefined,
            });
            addLog(`Alpha: ${alphaRes.response.slice(0,150)}`,"success");
          }

          stopAgent();
          setStatus("done");
        } else {
          addLog(`Condition not yet met — next check in 30s…`,"info");
        }
      } catch(e) {
        addLog(`Error: ${e.message}`,"error");
        setStatus("error");
        stopAgent();
      }
    };

    await check();
    intervalRef.current = setInterval(check, 30000);
  };

  useEffect(()=>()=>{ if(intervalRef.current) clearInterval(intervalRef.current); },[]);

  const inp = {background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"8px",padding:".42rem .75rem",color:"#dde4ff",fontSize:".75rem",fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border-color .2s"};
  const statusColor = {idle:"rgba(255,255,255,.3)",watching:"#4d85ff",triggered:"#f97316",done:"#4d85ff",error:"#f87171"}[status];
  const statusLabel = {idle:"Idle",watching:"Watching…",triggered:"Triggered!",done:"Done ✓",error:"Error"}[status];

  return (
    <div style={{background:"rgba(26,79,255,.04)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"16px",overflow:"hidden",marginBottom:"1.5rem"}}>
      {/* Header */}
      <div style={{padding:"1rem 1.4rem",borderBottom:"1px solid rgba(77,133,255,.12)",display:"flex",alignItems:"center",gap:".7rem",background:"linear-gradient(90deg,rgba(26,79,255,.08),transparent)"}}>
        <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"rgba(77,133,255,.15)",border:"1px solid rgba(77,133,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".9rem",flexShrink:0}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{fontSize:".82rem",fontWeight:500,color:"#dde4ff",letterSpacing:"-.01em"}}>Auto-Agent Loop</div>
          <div style={{fontSize:".58rem",color:"rgba(180,200,255,.5)",marginTop:".1rem"}}>Analyze → Decide → Execute autonomously · any token · powered by Bankr</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:".4rem",fontSize:".58rem",color:statusColor,background:"rgba(255,255,255,.04)",border:`1px solid ${statusColor}33`,borderRadius:"20px",padding:".2rem .65rem"}}>
          {status==="watching"&&<span style={{width:"5px",height:"5px",borderRadius:"50%",background:statusColor,animation:"pulse 1s infinite",display:"inline-block"}}/>}
          {statusLabel}
        </div>
      </div>

      <div style={{padding:"1.2rem 1.4rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.2rem"}}>
        {/* Left — Config */}
        <div style={{display:"flex",flexDirection:"column",gap:".7rem"}}>
          <div style={{fontSize:".55rem",color:"rgba(180,200,255,.4)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:".2rem"}}>Agent Configuration</div>

          {/* Token */}
          <div>
            <div style={{fontSize:".6rem",color:"rgba(180,200,255,.5)",marginBottom:".3rem"}}>Token to watch</div>
            <input value={token} onChange={e=>setToken(e.target.value.toUpperCase())} placeholder="ETH, BRETT, DEGEN, or 0x…" style={{...inp,width:"100%"}}
              onFocus={e=>e.target.style.borderColor="rgba(77,133,255,.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
            <div style={{display:"flex",gap:".3rem",marginTop:".4rem",flexWrap:"wrap"}}>
              {["ETH","BRETT","DEGEN","HIGHER","NOELCLAW"].map(t=>(
                <button key={t} onClick={()=>setToken(t)}
                  style={{background:token===t?"rgba(77,133,255,.2)":"rgba(255,255,255,.04)",border:"1px solid",borderColor:token===t?"rgba(77,133,255,.5)":"rgba(255,255,255,.08)",borderRadius:"6px",padding:".18rem .5rem",fontSize:".58rem",color:token===t?"#4d85ff":"rgba(180,200,255,.5)",cursor:"pointer",fontFamily:"inherit"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <div style={{fontSize:".6rem",color:"rgba(180,200,255,.5)",marginBottom:".3rem"}}>Trigger condition</div>
            <select value={condition} onChange={e=>setCondition(e.target.value)} style={{...inp,width:"100%",cursor:"pointer"}}>
              {CONDITIONS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Threshold */}
          {(condition==="price_drop"||condition==="price_rise"||condition==="volume_spike")&&(
            <div>
              <div style={{fontSize:".6rem",color:"rgba(180,200,255,.5)",marginBottom:".3rem"}}>Threshold (%)</div>
              <input value={threshold} onChange={e=>setThreshold(e.target.value)} placeholder="5" type="number" min="1" max="100" style={{...inp,width:"100%"}}
                onFocus={e=>e.target.style.borderColor="rgba(77,133,255,.5)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
            </div>
          )}

          {/* Action */}
          <div>
            <div style={{fontSize:".6rem",color:"rgba(180,200,255,.5)",marginBottom:".3rem"}}>Action to execute</div>
            <select value={action} onChange={e=>setAction(e.target.value)} style={{...inp,width:"100%",cursor:"pointer"}}>
              <option value="swap">Swap token via Bankr</option>
              <option value="alert">Send alert only</option>
              <option value="analyze">Run deep analysis</option>
            </select>
          </div>

          {/* Swap details */}
          {action==="swap"&&(
            <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:".6rem",color:"rgba(180,200,255,.5)",marginBottom:".3rem"}}>Amount</div>
                <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.01" style={{...inp,width:"100%"}}
                  onFocus={e=>e.target.style.borderColor="rgba(77,133,255,.5)"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
              </div>
              <span style={{color:"rgba(255,255,255,.3)",fontSize:".9rem",marginTop:"1.2rem",flexShrink:0}}>→</span>
              <div style={{flex:1}}>
                <div style={{fontSize:".6rem",color:"rgba(180,200,255,.5)",marginBottom:".3rem"}}>Receive token</div>
                <input value={targetToken} onChange={e=>setTargetToken(e.target.value.toUpperCase())} placeholder="USDC" style={{...inp,width:"100%"}}
                  onFocus={e=>e.target.style.borderColor="rgba(77,133,255,.5)"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
              </div>
            </div>
          )}

          {/* Start/Stop */}
          {!authenticated ? (
            <button onClick={login} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",padding:".6rem",color:"#dde4ff",fontSize:".75rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,width:"100%",marginTop:".3rem"}}>
              🔗 Connect Wallet to Start Agent
            </button>
          ) : running ? (
            <button onClick={stopAgent} style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)",borderRadius:"10px",padding:".6rem",color:"#f87171",fontSize:".75rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,width:"100%",marginTop:".3rem",display:"flex",alignItems:"center",justifyContent:"center",gap:".5rem"}}>
              <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#f87171",animation:"pulse 1s infinite",display:"inline-block"}}/>
              Stop Agent
            </button>
          ) : (
            <button onClick={startAgent} style={{background:"linear-gradient(135deg,rgba(26,79,255,.25),rgba(77,133,255,.15))",border:"1px solid rgba(77,133,255,.4)",borderRadius:"10px",padding:".6rem",color:"#4d85ff",fontSize:".75rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,width:"100%",marginTop:".3rem",letterSpacing:".04em",boxShadow:"0 0 20px rgba(26,79,255,.15)"}}>
              ▶ Start Auto-Agent
            </button>
          )}
          <div style={{fontSize:".58rem",color:"rgba(180,200,255,.3)",lineHeight:1.6}}>
            Checks every 30s via Bankr API. Executes automatically when condition is met.
          </div>
        </div>

        {/* Right — Live Logs */}
        <div style={{background:"#050709",border:"1px solid rgba(26,79,255,.15)",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:".5rem .9rem",borderBottom:"1px solid rgba(26,79,255,.1)",display:"flex",alignItems:"center",gap:".4rem",background:"#0a0f1a"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#ff5f57"}}/>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#febc2e"}}/>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#28c840"}}/>
            <span style={{marginLeft:".4rem",fontSize:".55rem",color:"rgba(77,133,255,.4)",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:".06em"}}>auto-agent — live</span>
            {running&&<span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:".3rem",fontSize:".5rem",color:"#4d85ff"}}>
              <span style={{width:"4px",height:"4px",borderRadius:"50%",background:"#4d85ff",animation:"pulse 1s infinite",display:"inline-block"}}/>LIVE
            </span>}
          </div>
          <div style={{flex:1,padding:".8rem",fontFamily:"'IBM Plex Mono',monospace",fontSize:".64rem",overflowY:"auto",maxHeight:"320px",display:"flex",flexDirection:"column",gap:".35rem"}}>
            {logs.length===0&&(
              <span style={{color:"rgba(77,133,255,.3)"}}>{">"} Configure and start agent…</span>
            )}
            {logs.map((l,i)=>(
              <div key={i} style={{display:"flex",gap:".6rem",animation:"stepIn .15s ease both"}}>
                <span style={{color:"rgba(77,133,255,.3)",flexShrink:0,fontSize:".58rem"}}>{l.ts}</span>
                <span style={{color:l.type==="success"?"#4d85ff":l.type==="error"?"#f87171":l.type==="warn"?"#f97316":"rgba(180,200,255,.75)",lineHeight:1.5}}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentPlayground({ sendMessage, bankrAsk, getTokenPrice, getRecentTrades, getTrendingBase, getAlphaBankr, getPortfolio, swapTokens, getBalance, setLimitOrder, claimFees, getSmartMoney, setupDCA, deployToken, runAlphaAgent, walletAddress, authenticated, login }) {
  const [pgTab, setPgTab] = useState("agents"); // "agents" | "cli"
  const [activeAgent, setActiveAgent] = useState(null);
  const [steps, setSteps]             = useState([]);
  const [output, setOutput]           = useState(null);
  const [running, setRunning]         = useState(false);
  const [threadId, setThreadId]       = useState(null);
  const [tokenInput, setTokenInput]   = useState("");
  const [swapFrom, setSwapFrom]       = useState("ETH");
  const [swapTo, setSwapTo]           = useState("USDC");
  const [swapAmt, setSwapAmt]         = useState("0.01");
  const [limitAction, setLimitAction] = useState("buy");
  const [limitToken, setLimitToken]   = useState("ETH");
  const [limitAmt, setLimitAmt]       = useState("0.1");
  const [limitPrice, setLimitPrice]   = useState("");
  const [deployName, setDeployName]   = useState("");
  const [deploySymbol, setDeploySymbol] = useState("");
  const [deploySupply, setDeploySupply] = useState("1000000000");
  const [chatInput, setChatInput]     = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatBusy, setChatBusy]       = useState(false);
  const chatEndRef = useRef(null);
  const termRef    = useRef(null);

  // Scroll to top when playground mounts
  useEffect(()=>{ window.scrollTo({top:0,behavior:"instant"}); },[]);

  useEffect(()=>{
    if(chatHistory.length > 0) chatEndRef.current?.scrollIntoView({behavior:"smooth"});
  },[chatHistory,chatBusy]);
  // termRef scroll removed — was causing page jump on agent run

  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const token = tokenInput.trim() || "ETH";
  const wallet = walletAddress || undefined;

  const addStep = (label, status="active") =>
    setSteps(prev=>{
      const idx=prev.findIndex(s=>s.label===label);
      if(idx>=0){const n=[...prev];n[idx]={label,status};return n;}
      return [...prev,{label,status}];
    });

  const doneStep = (label) => addStep(label,"done");
  const errStep  = (label) => addStep(label,"error");

  const runAgent = async (agentId) => {
    setActiveAgent(agentId);
    setSteps([]);
    setOutput(null);
    setRunning(true);
    const execAgents = ["swap","limit","fees","deploy"];
    if(execAgents.includes(agentId) && !authenticated){
      setOutput({type:"warn",color:"#f97316",label:"Wallet Required",data:"Connect your wallet to execute on-chain actions via Bankr."});
      setRunning(false);
      return;
    }
    try{
      if(agentId==="alpha"){
        addStep("Initializing Bankr Alpha Agent");
        await sleep(300);
        addStep("Fetching on-chain signals");
        const res = await getAlphaBankr({token});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Initializing Bankr Alpha Agent");
        doneStep("Fetching on-chain signals");
        addStep("Analysis complete","done");
        setOutput({type:"text",label:"⚡ Alpha Analysis",color:"#4d85ff",data:res.response});
      } else if(agentId==="price"){
        addStep("Connecting to Bankr API");
        addStep(`Querying ${token} price`);
        const res = await getTokenPrice({token});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Connecting to Bankr API");
        doneStep(`Querying ${token} price`);
        setOutput({type:"text",label:"💲 Price Data",color:"#4d85ff",data:res.response});
      } else if(agentId==="trades"){
        addStep("Connecting to Bankr API");
        addStep(`Fetching trades for ${token}`);
        const res = await getRecentTrades({token});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Connecting to Bankr API");
        doneStep(`Fetching trades for ${token}`);
        setOutput({type:"text",label:"🔄 Trade Feed",color:"#4d85ff",data:res.response});
      } else if(agentId==="trending"){
        addStep("Connecting to Bankr API");
        addStep("Fetching trending Base tokens");
        const res = await getTrendingBase({});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Connecting to Bankr API");
        doneStep("Fetching trending Base tokens");
        setOutput({type:"trending",label:"📈 Trending",color:"#f97316",data:res.raw,boosted:res.boosted});
      } else if(agentId==="smartmoney"){
        addStep("Connecting to Bankr API");
        addStep("Scanning smart money wallets");
        const res = await getSmartMoney({token:tokenInput.trim()||undefined});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Connecting to Bankr API");
        doneStep("Scanning smart money wallets");
        setOutput({type:"text",label:"🧠 Smart Money",color:"#a78bfa",data:res.response});
      } else if(agentId==="balance"){
        addStep("Connecting to Bankr API");
        addStep("Fetching wallet balances");
        const res = await getBalance({wallet,token:tokenInput.trim()||undefined});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Connecting to Bankr API");
        doneStep("Fetching wallet balances");
        setOutput({type:"text",label:"💼 Balance",color:"#4d85ff",data:res.response});
      } else if(agentId==="swap"){
        addStep("Preparing swap");
        addStep(`${swapAmt} ${swapFrom} → ${swapTo} via Bankr`);
        const res = await swapTokens({fromToken:swapFrom,toToken:swapTo,amount:swapAmt,walletAddress:wallet});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Preparing swap");
        doneStep(`${swapAmt} ${swapFrom} → ${swapTo} via Bankr`);
        addStep("Confirmed on Base","done");
        setOutput({type:"tx",label:"🔁 Swap",color:"#4d85ff",data:res.response,transactions:res.transactions});
      } else if(agentId==="limit"){
        addStep("Preparing limit order");
        addStep(`${limitAction} ${limitAmt} ${limitToken} at $${limitPrice}`);
        const res = await setLimitOrder({token:limitToken,action:limitAction,amount:limitAmt,targetPrice:limitPrice});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Preparing limit order");
        doneStep(`${limitAction} ${limitAmt} ${limitToken} at $${limitPrice}`);
        addStep("Order active","done");
        setOutput({type:"tx",label:"📋 Limit Order",color:"#f97316",data:res.response,transactions:res.transactions});
      } else if(agentId==="fees"){
        addStep("Checking claimable fees");
        addStep("Claiming via Bankr");
        const res = await claimFees({token:tokenInput.trim()||"NOELCLAW"});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Checking claimable fees");
        doneStep("Claiming via Bankr");
        addStep("Fees claimed","done");
        setOutput({type:"tx",label:"💰 Fees",color:"#4d85ff",data:res.response,transactions:res.transactions});
      } else if(agentId==="deploy"){
        addStep("Preparing deployment");
        addStep(`Deploying $${deploySymbol} on Base`);
        const res = await deployToken({name:deployName,symbol:deploySymbol,supply:deploySupply});
        if(res.threadId) setThreadId(res.threadId);
        doneStep("Preparing deployment");
        doneStep(`Deploying $${deploySymbol} on Base`);
        addStep("Token live on Base","done");
        setOutput({type:"tx",label:"🚀 Deployed",color:"#c084fc",data:res.response,transactions:res.transactions});
      }
      addStep("Done","done");
    } catch(e){
      setSteps(p=>p.map(s=>s.status==="active"?{...s,status:"error"}:s));
      setOutput({type:"error",label:"Error",color:"#f87171",data:e.message});
    }
    setRunning(false);
  };

  const sendChat = async () => {
    const q=chatInput.trim();
    if(!q||chatBusy) return;
    setChatInput("");
    setChatHistory(p=>[...p,{role:"user",content:q}]);
    setChatBusy(true);
    try{
      const res = await bankrAsk({prompt:q,threadId:threadId||undefined});
      if(res.threadId) setThreadId(res.threadId);
      setChatHistory(p=>[...p,{role:"assistant",content:res.response,txs:res.transactions}]);
    } catch(e){
      setChatHistory(p=>[...p,{role:"assistant",content:"Error: "+e.message}]);
    }
    setChatBusy(false);
  };

  // ── CSS ──────────────────────────────────────────────────────────────────
  const PG_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

    .pg-wrap { font-family:'DM Sans',sans-serif; }

    /* Dashboard cards */
    .pg-card {
      background:#0d1117;
      border-radius:20px;
      border:1px solid rgba(255,255,255,.07);
      overflow:hidden;
      transition:border-color .2s, transform .2s, box-shadow .2s;
      position:relative;
    }
    .pg-card:hover { border-color:rgba(77,133,255,.25); transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,.4); }
    .pg-card.active { border-color:rgba(77,133,255,.5); box-shadow:0 0 0 1px rgba(77,133,255,.2), 0 12px 40px rgba(26,79,255,.15); }
    .pg-card.exec-card { border-color:rgba(249,115,22,.12); }
    .pg-card.exec-card:hover { border-color:rgba(249,115,22,.3); }

    .pg-card-icon {
      width:42px; height:42px; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:1.15rem; flex-shrink:0;
      background:rgba(255,255,255,.06);
    }

    /* Terminal */
    .pg-terminal {
      background:#050709;
      border-radius:16px;
      border:1px solid rgba(26,79,255,.2);
      font-family:'IBM Plex Mono', monospace;
      overflow:hidden;
      box-shadow:0 0 0 1px rgba(26,79,255,.08), inset 0 0 60px rgba(26,79,255,.03);
    }
    .pg-term-bar {
      background:#0a0f1a;
      border-bottom:1px solid rgba(26,79,255,.15);
      padding:.6rem 1rem;
      display:flex; align-items:center; gap:.5rem;
    }
    .pg-term-dot { width:10px; height:10px; border-radius:50%; }
    .pg-term-body {
      padding:1.1rem 1.3rem;
      min-height:200px;
      max-height:280px;
      overflow-y:auto;
      scrollbar-width:thin;
      scrollbar-color:rgba(26,79,255,.3) transparent;
    }
    .pg-step {
      display:flex; align-items:flex-start; gap:.65rem;
      padding:.22rem 0; font-size:.7rem;
      animation: stepIn .15s ease both;
      line-height:1.5;
    }
    @keyframes stepIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    .pg-step-icon {
      width:16px; height:16px; border-radius:4px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:.6rem; margin-top:1px;
    }
    .pg-prompt { color:rgba(77,133,255,.5); margin-right:.3rem; }
    .pg-caret {
      display:inline-block; width:7px; height:14px;
      background:rgba(77,133,255,.7);
      animation:caretBlink .8s step-end infinite;
      vertical-align:middle; border-radius:1px;
    }
    @keyframes caretBlink{0%,100%{opacity:1}50%{opacity:0}}

    /* Output */
    .pg-output {
      background:#0d1117;
      border-radius:16px;
      border:1px solid rgba(255,255,255,.07);
      overflow:hidden;
    }
    .pg-output-body {
      padding:1.2rem 1.4rem;
      max-height:300px;
      overflow-y:auto;
      font-size:.78rem;
      line-height:1.85;
      color:rgba(220,230,255,.85);
      white-space:pre-wrap;
      font-family:'DM Sans',sans-serif;
      font-weight:300;
    }

    /* Token input */
    .pg-input {
      background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.08);
      border-radius:10px;
      padding:.5rem .85rem;
      color:#dde4ff;
      font-size:.78rem;
      font-family:'DM Sans',sans-serif;
      font-weight:300;
      outline:none;
      transition:border-color .2s;
      width:100%;
    }
    .pg-input:focus { border-color:rgba(77,133,255,.45); }
    .pg-input::placeholder { color:rgba(255,255,255,.2); }
    select.pg-input { cursor:pointer; }

    /* Chat */
    .pg-chat-wrap {
      background:#0d1117;
      border-radius:20px;
      border:1px solid rgba(77,133,255,.1);
      overflow:hidden;
    }
    .pg-chat-header {
      background:linear-gradient(90deg, rgba(77,133,255,.07), transparent);
      border-bottom:1px solid rgba(77,133,255,.1);
      padding:1rem 1.4rem;
      display:flex; align-items:center; gap:.7rem;
    }
    .pg-chat-avatar {
      width:32px; height:32px; border-radius:10px;
      background:rgba(77,133,255,.12);
      border:1px solid rgba(77,133,255,.25);
      display:flex; align-items:center; justify-content:center;
      font-family:'IBM Plex Mono',monospace;
      font-size:.65rem; font-weight:500; color:#4d85ff; flex-shrink:0;
    }
    .pg-chip {
      font-size:.48rem; font-weight:600; letter-spacing:.1em;
      border-radius:6px; padding:.12rem .5rem;
    }
    .pg-bubble-user {
      background:rgba(26,79,255,.18);
      border:1px solid rgba(77,133,255,.2);
      border-radius:14px 14px 4px 14px;
      padding:.65rem 1rem;
      font-size:.78rem; line-height:1.75; color:#dde4ff;
    }
    .pg-bubble-bot {
      background:#151c2c;
      border:1px solid rgba(77,133,255,.12);
      border-radius:4px 14px 14px 14px;
      padding:.65rem 1rem;
      font-size:.78rem; line-height:1.75; color:#dde4ff;
      font-weight:300;
    }
    .pg-send-btn {
      background:rgba(77,133,255,.14);
      border:1px solid rgba(77,133,255,.3);
      border-radius:10px;
      padding:.55rem 1.3rem;
      color:#4d85ff;
      font-size:.75rem; font-family:'DM Sans',sans-serif; font-weight:500;
      cursor:pointer; transition:all .2s; white-space:nowrap; flex-shrink:0;
    }
    .pg-send-btn:disabled { background:rgba(255,255,255,.04); border-color:rgba(255,255,255,.07); color:rgba(255,255,255,.2); cursor:not-allowed; }
    .pg-send-btn:not(:disabled):hover { background:rgba(77,133,255,.22); border-color:rgba(77,133,255,.5); }

    .pg-suggest {
      background:#0d1117;
      border:1px solid rgba(255,255,255,.07);
      border-radius:20px;
      padding:.3rem .8rem;
      font-size:.65rem; color:rgba(180,195,230,.7);
      cursor:pointer; font-family:'DM Sans',sans-serif;
      transition:all .15s; white-space:nowrap;
    }
    .pg-suggest:hover { border-color:rgba(77,133,255,.3); color:#4d85ff; background:rgba(77,133,255,.05); }

    .pg-run-btn {
      width:100%;
      background:transparent;
      border:1px solid rgba(255,255,255,.08);
      border-radius:10px;
      padding:.5rem;
      font-size:.68rem; font-family:'DM Sans',sans-serif; font-weight:500;
      cursor:pointer; transition:all .2s; margin-top:.5rem;
    }
    .pg-exec-btn {
      width:100%;
      border-radius:10px;
      padding:.5rem;
      font-size:.68rem; font-family:'DM Sans',sans-serif; font-weight:500;
      cursor:pointer; transition:all .2s; border:1px solid;
    }

    .pg-section-label {
      font-size:.58rem; font-weight:600; letter-spacing:.22em;
      text-transform:uppercase; display:flex; align-items:center; gap:.7rem;
      margin-bottom:1rem;
    }
    .pg-section-line { flex:1; height:1px; background:rgba(255,255,255,.06); }
    .pg-wallet-card {
      background:#0d1117;
      border-radius:20px;
      border:1px solid rgba(77,133,255,.12);
      padding:1.2rem 1.4rem;
    }
    .pg-token-card {
      background:#0d1117;
      border-radius:20px;
      border:1px solid rgba(255,255,255,.07);
      padding:1.2rem 1.4rem;
    }
    .pg-pill {
      background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.07);
      border-radius:8px;
      padding:.22rem .6rem;
      font-size:.6rem;
      cursor:pointer; font-family:'DM Sans',sans-serif;
      transition:all .15s; white-space:nowrap;
    }
    .pg-pill.active { background:rgba(26,79,255,.2); border-color:rgba(77,133,255,.45); color:#4d85ff; }
    .pg-pill:not(.active):hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.14); }

  /* ── Playground Responsive ── */
  @media(max-width:900px){
    .pg-read-grid { grid-template-columns:repeat(2,1fr) !important; }
    .pg-top-row { grid-template-columns:1fr !important; }
    .pg-steps-grid { grid-template-columns:1fr !important; }
  }
  @media(max-width:600px){
    .pg-wrap { padding:1rem 1rem 4rem !important; }
    .pg-read-grid { grid-template-columns:1fr !important; }
    .pg-exec-grid { grid-template-columns:1fr !important; }
    .pg-top-row { grid-template-columns:1fr !important; }
    .pg-steps-grid { grid-template-columns:1fr !important; }
    .pg-card { padding:1rem 1.1rem !important; }
    .pg-term-body { min-height:140px !important; max-height:200px !important; }
    .pg-output-body { max-height:220px !important; }
    .pg-chat-header { flex-wrap:wrap; gap:.4rem !important; }
    .pg-section-label { font-size:.5rem !important; }
    .pg-input { font-size:.72rem !important; }
    .pg-bubble-user,.pg-bubble-bot { font-size:.72rem !important; }
  }
  `;

  const READ_AGENTS = [
    {id:"alpha",      icon:"⚡", label:"Alpha Analysis",  sub:"AI conviction signals",        color:"#4d85ff", iconBg:"rgba(77,133,255,.12)"},
    {id:"price",      icon:"💲", label:"Token Price",      sub:"Live price & market data",     color:"#4d85ff", iconBg:"rgba(77,133,255,.1)"},
    {id:"trades",     icon:"🔄", label:"Trade Activity",   sub:"Recent buys, sells & volume",  color:"#4d85ff", iconBg:"rgba(77,133,255,.1)"},
    {id:"trending",   icon:"📈", label:"Trending Base",    sub:"Top tokens by momentum",       color:"#f97316", iconBg:"rgba(249,115,22,.1)"},
    {id:"smartmoney", icon:"🧠", label:"Smart Money",      sub:"Whale wallet tracking",        color:"#a78bfa", iconBg:"rgba(167,139,250,.1)"},
    {id:"balance",    icon:"💼", label:"Wallet Balance",   sub:"Your Base chain portfolio",    color:"#4d85ff", iconBg:"rgba(77,133,255,.1)"},
  ];

  const EXEC_AGENTS = [
    {id:"swap",   icon:"🔁", label:"Swap Tokens",  color:"#4d85ff"},
    {id:"limit",  icon:"📋", label:"Limit Order",  color:"#f97316"},
    {id:"fees",   icon:"💰", label:"Claim Fees",   color:"#a78bfa"},
    {id:"deploy", icon:"🚀", label:"Deploy Token", color:"#c084fc"},
  ];

  return (
    <div className="pg-wrap" style={{padding:"1.5rem 3.5rem 5rem"}}>
      <style>{PG_CSS}</style>

      {/* ── TAB SWITCHER ── */}
      <div style={{display:"flex",gap:".5rem",marginBottom:"1.5rem",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"12px",padding:".3rem"}}>
        {[{id:"agents",icon:"⚡",label:"Agent Playground"},{id:"cli",icon:"$_",label:"CLI Terminal"},{id:"auto",icon:"🤖",label:"Auto-Agent"}].map(t=>(
          <button key={t.id} onClick={()=>setPgTab(t.id)}
            style={{flex:1,background:pgTab===t.id?"rgba(26,79,255,.2)":"transparent",border:"1px solid",borderColor:pgTab===t.id?"rgba(77,133,255,.4)":"transparent",borderRadius:"9px",padding:".5rem .8rem",color:pgTab===t.id?"#4d85ff":"rgba(180,200,255,.4)",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:pgTab===t.id?600:400,transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:".4rem",letterSpacing:pgTab===t.id?".02em":"0"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".65rem"}}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── AUTO-AGENT TAB ── */}
      {pgTab==="auto"&&(
        <AutoAgent bankrAsk={bankrAsk} swapTokens={swapTokens} walletAddress={walletAddress} authenticated={authenticated} login={login}/>
      )}

      {/* ── CLI TERMINAL TAB ── */}
      {pgTab==="cli"&&(
        <CliTerminal bankrAsk={bankrAsk} walletAddress={walletAddress} authenticated={authenticated} login={login}/>
      )}

      {/* ── AGENTS TAB ── */}
      {pgTab==="agents"&&(<>

      {/* ── TOP ROW: Token input + Wallet ── */}
      <div className="pg-top-row" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:"1rem",marginBottom:"2rem"}}>
        <div className="pg-token-card">
          <div style={{fontSize:".55rem",color:"rgba(255,255,255,.3)",letterSpacing:".22em",textTransform:"uppercase",marginBottom:".7rem",fontFamily:"'IBM Plex Mono',monospace"}}>target token</div>
          <input className="pg-input" value={tokenInput} onChange={e=>setTokenInput(e.target.value)}
            placeholder="ETH · USDC · BRETT · or contract address…"
            style={{fontSize:".85rem",padding:".6rem .9rem",marginBottom:".7rem"}}
            onFocus={e=>e.target.style.borderColor="rgba(77,133,255,.5)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.08)"}
          />
          <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
            {["ETH","USDC","BRETT","DEGEN","HIGHER","NOELCLAW"].map(t=>(
              <button key={t} className={"pg-pill"+(tokenInput===t?" active":"")} onClick={()=>setTokenInput(t)}
                style={{color:tokenInput===t?"#4d85ff":"rgba(180,195,230,.6)"}}>{t}</button>
            ))}
          </div>
        </div>

        <div className="pg-wallet-card">
          <div style={{fontSize:".55rem",color:"rgba(77,133,255,.5)",letterSpacing:".22em",textTransform:"uppercase",marginBottom:".8rem",fontFamily:"'IBM Plex Mono',monospace"}}>wallet</div>
          {authenticated && walletAddress ? (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:".5rem"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#4d85ff",boxShadow:"0 0 6px #4d85ff",flexShrink:0}}/>
                <span style={{fontSize:".76rem",color:"#dde4ff",fontFamily:"'IBM Plex Mono',monospace"}}>{walletAddress.slice(0,10)}…{walletAddress.slice(-8)}</span>
              </div>
              <div style={{fontSize:".62rem",color:"rgba(77,133,255,.6)",marginBottom:".6rem"}}>Connected · ready for on-chain actions</div>
              {threadId && (
                <div style={{display:"inline-flex",alignItems:"center",gap:".4rem",fontSize:".55rem",color:"#4d85ff",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"6px",padding:".2rem .55rem"}}>
                  <span style={{width:"4px",height:"4px",borderRadius:"50%",background:"#4d85ff",animation:"pulse 1.5s infinite",display:"inline-block"}}/>
                  Bankr thread active
                  <button onClick={()=>setThreadId(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:".6rem",padding:"0 0 0 .2rem",lineHeight:1}}>✕</button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{fontSize:".73rem",color:"rgba(220,230,255,.5)",lineHeight:1.6,marginBottom:"1rem",fontWeight:300}}>Connect to execute swaps, limit orders & token deployments on Base.</div>
              <button onClick={login}
                style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"10px",padding:".55rem 1.1rem",color:"#dde4ff",fontSize:".73rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,transition:"all .2s",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.borderColor="rgba(255,255,255,.22)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.borderColor="rgba(255,255,255,.12)";}}
              >
                🔗  Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── READ AGENTS ── */}
      <div className="pg-section-label" style={{color:"rgba(180,195,230,.5)"}}>
        Read
        <div className="pg-section-line"/>
        <span style={{fontSize:".52rem",color:"rgba(255,255,255,.2)",fontWeight:300,letterSpacing:".06em",textTransform:"none"}}>Query live data from Bankr</span>
      </div>
      <div className="pg-read-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"2rem"}}>
        {READ_AGENTS.map(a=>(
          <div key={a.id} className={"pg-card"+(activeAgent===a.id?" active":"")}
            onClick={()=>!running&&runAgent(a.id)}
            style={{padding:"1.3rem 1.5rem",cursor:running?"not-allowed":"pointer",backdropFilter:"blur(12px)",background:activeAgent===a.id?"rgba(26,79,255,.08)":"rgba(10,18,40,.5)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
              <div className="pg-card-icon" style={{background:a.iconBg,fontSize:"1.1rem"}}>{a.icon}</div>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:a.color+"18",border:`1px solid ${a.color}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:activeAgent===a.id?1:.4,transition:"opacity .2s"}}>
                <span style={{width:"7px",height:"7px",borderRadius:"50%",background:activeAgent===a.id&&running?a.color:"transparent",animation:activeAgent===a.id&&running?"pulse 1s infinite":"none",display:"inline-block",border:activeAgent===a.id&&!running?`1.5px solid ${a.color}`:"none"}}/>
              </div>
            </div>
            <div style={{fontSize:".85rem",fontWeight:500,color:"#dde4ff",marginBottom:".25rem",letterSpacing:"-.01em"}}>{a.label}</div>
            <div style={{fontSize:".65rem",color:"rgba(180,195,230,.45)",marginBottom:"1rem",fontWeight:300}}>{a.sub}</div>
            <div style={{fontSize:".6rem",color:activeAgent===a.id?"#4d85ff":"rgba(180,195,230,.25)",fontFamily:"'IBM Plex Mono',monospace",transition:"color .2s"}}>
              {running&&activeAgent===a.id ? <span style={{color:a.color}}>running<span style={{animation:"pulse 1s infinite"}}>…</span></span>
               : activeAgent===a.id ? "✓ done · click to re-run"
               : "▶ run agent"}
            </div>
          </div>
        ))}
      </div>

      {/* ── EXECUTE AGENTS ── */}
      <div className="pg-section-label" style={{color:"rgba(249,115,22,.6)"}}>
        Execute
        <div className="pg-section-line"/>
        <span style={{fontSize:".52rem",color:"rgba(255,255,255,.2)",fontWeight:300,letterSpacing:".06em",textTransform:"none"}}>On-chain actions via Bankr · wallet required</span>
      </div>
      <div className="pg-exec-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"1rem",marginBottom:"2rem"}}>

        {/* Swap */}
        <div className="pg-card exec-card" style={{padding:"1.3rem 1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:"1.1rem"}}>
            <div className="pg-card-icon" style={{background:"rgba(77,133,255,.1)"}}>{EXEC_AGENTS[0].icon}</div>
            <div>
              <div style={{fontSize:".82rem",fontWeight:500,color:"#dde4ff"}}>{EXEC_AGENTS[0].label}</div>
              <div style={{fontSize:".62rem",color:"rgba(180,195,230,.4)",fontWeight:300}}>Execute instantly on Base</div>
            </div>
          </div>
          <div style={{display:"flex",gap:".5rem",alignItems:"center",marginBottom:".5rem"}}>
            <input className="pg-input" value={swapAmt} onChange={e=>setSwapAmt(e.target.value)} placeholder="0.01" style={{width:"70px",flexShrink:0}}/>
            <input className="pg-input" value={swapFrom} onChange={e=>setSwapFrom(e.target.value)} placeholder="ETH" style={{flex:1}}/>
            <span style={{color:"rgba(255,255,255,.25)",fontSize:"1rem",flexShrink:0}}>→</span>
            <input className="pg-input" value={swapTo} onChange={e=>setSwapTo(e.target.value)} placeholder="USDC" style={{flex:1}}/>
          </div>
          <button className="pg-exec-btn"
            onClick={()=>!running&&runAgent("swap")} disabled={running||!authenticated}
            style={{background:authenticated?"rgba(77,133,255,.1)":"rgba(255,255,255,.03)",borderColor:authenticated?"rgba(77,133,255,.3)":"rgba(255,255,255,.07)",color:authenticated?"#4d85ff":"rgba(255,255,255,.2)"}}>
            {running&&activeAgent==="swap"?"Executing via Bankr…":"Swap"}
          </button>
          {!authenticated && <div style={{fontSize:".58rem",color:"rgba(255,255,255,.25)",textAlign:"center",marginTop:".35rem"}}>Connect wallet to execute</div>}
        </div>

        {/* Limit Order */}
        <div className="pg-card exec-card" style={{padding:"1.3rem 1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:"1.1rem"}}>
            <div className="pg-card-icon" style={{background:"rgba(249,115,22,.1)"}}>{EXEC_AGENTS[1].icon}</div>
            <div>
              <div style={{fontSize:".82rem",fontWeight:500,color:"#dde4ff"}}>{EXEC_AGENTS[1].label}</div>
              <div style={{fontSize:".62rem",color:"rgba(180,195,230,.4)",fontWeight:300}}>Trigger at your target price</div>
            </div>
          </div>
          <div style={{display:"flex",gap:".5rem",marginBottom:".5rem"}}>
            <select className="pg-input" value={limitAction} onChange={e=>setLimitAction(e.target.value)} style={{flex:1}}>
              <option value="buy">Buy</option><option value="sell">Sell</option>
            </select>
            <input className="pg-input" value={limitAmt} onChange={e=>setLimitAmt(e.target.value)} placeholder="0.1" style={{width:"65px",flexShrink:0}}/>
            <input className="pg-input" value={limitToken} onChange={e=>setLimitToken(e.target.value)} placeholder="ETH" style={{flex:1}}/>
          </div>
          <input className="pg-input" value={limitPrice} onChange={e=>setLimitPrice(e.target.value)} placeholder="Target price $…" style={{marginBottom:".5rem"}}/>
          <button className="pg-exec-btn"
            onClick={()=>!running&&runAgent("limit")} disabled={running||!authenticated||!limitPrice}
            style={{background:authenticated&&limitPrice?"rgba(249,115,22,.1)":"rgba(255,255,255,.03)",borderColor:authenticated&&limitPrice?"rgba(249,115,22,.3)":"rgba(255,255,255,.07)",color:authenticated&&limitPrice?"#f97316":"rgba(255,255,255,.2)"}}>
            {running&&activeAgent==="limit"?"Setting order…":"Set Limit Order"}
          </button>
          {!authenticated && <div style={{fontSize:".58rem",color:"rgba(255,255,255,.25)",textAlign:"center",marginTop:".35rem"}}>Connect wallet to execute</div>}
        </div>

        {/* Claim Fees */}
        <div className="pg-card exec-card" style={{padding:"1.3rem 1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:"1rem"}}>
            <div className="pg-card-icon" style={{background:"rgba(167,139,250,.1)"}}>{EXEC_AGENTS[2].icon}</div>
            <div>
              <div style={{fontSize:".82rem",fontWeight:500,color:"#dde4ff"}}>{EXEC_AGENTS[2].label}</div>
              <div style={{fontSize:".62rem",color:"rgba(180,195,230,.4)",fontWeight:300}}>From {tokenInput||"NOELCLAW"} token or LP position</div>
            </div>
          </div>
          <div style={{fontSize:".68rem",color:"rgba(180,195,230,.4)",lineHeight:1.6,marginBottom:"1rem",fontWeight:300}}>
            Checks claimable trading fees and executes claim transaction via Bankr in one step.
          </div>
          <button className="pg-exec-btn"
            onClick={()=>!running&&runAgent("fees")} disabled={running||!authenticated}
            style={{background:authenticated?"rgba(167,139,250,.1)":"rgba(255,255,255,.03)",borderColor:authenticated?"rgba(167,139,250,.3)":"rgba(255,255,255,.07)",color:authenticated?"#a78bfa":"rgba(255,255,255,.2)"}}>
            {running&&activeAgent==="fees"?"Claiming…":"Claim Fees"}
          </button>
          {!authenticated && <div style={{fontSize:".58rem",color:"rgba(255,255,255,.25)",textAlign:"center",marginTop:".35rem"}}>Connect wallet to execute</div>}
        </div>

        {/* Deploy Token */}
        <div className="pg-card exec-card" style={{padding:"1.3rem 1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:"1.1rem"}}>
            <div className="pg-card-icon" style={{background:"rgba(192,132,252,.1)"}}>{EXEC_AGENTS[3].icon}</div>
            <div>
              <div style={{fontSize:".82rem",fontWeight:500,color:"#dde4ff"}}>{EXEC_AGENTS[3].label}</div>
              <div style={{fontSize:".62rem",color:"rgba(180,195,230,.4)",fontWeight:300}}>Launch a token on Base chain</div>
            </div>
          </div>
          <div style={{display:"flex",gap:".5rem",marginBottom:".5rem"}}>
            <input className="pg-input" value={deployName} onChange={e=>setDeployName(e.target.value)} placeholder="Token name" style={{flex:2}}/>
            <input className="pg-input" value={deploySymbol} onChange={e=>setDeploySymbol(e.target.value)} placeholder="SYM" style={{flex:1}}/>
          </div>
          <input className="pg-input" value={deploySupply} onChange={e=>setDeploySupply(e.target.value)} placeholder="Supply (default: 1,000,000,000)" style={{marginBottom:".5rem"}}/>
          <button className="pg-exec-btn"
            onClick={()=>!running&&runAgent("deploy")} disabled={running||!authenticated||!deployName||!deploySymbol}
            style={{background:authenticated&&deployName&&deploySymbol?"rgba(192,132,252,.1)":"rgba(255,255,255,.03)",borderColor:authenticated&&deployName&&deploySymbol?"rgba(192,132,252,.3)":"rgba(255,255,255,.07)",color:authenticated&&deployName&&deploySymbol?"#c084fc":"rgba(255,255,255,.2)"}}>
            {running&&activeAgent==="deploy"?"Deploying on Base…":"Deploy on Base"}
          </button>
          {!authenticated && <div style={{fontSize:".58rem",color:"rgba(255,255,255,.25)",textAlign:"center",marginTop:".35rem"}}>Connect wallet to execute</div>}
        </div>
      </div>

      {/* ── TERMINAL + OUTPUT ── */}
      {(steps.length>0||output) && (
        <div className="pg-steps-grid" style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:"1rem",marginBottom:"2rem",overflowAnchor:"none"}}>
          {/* Blue retro terminal */}
          <div className="pg-terminal">
            <div className="pg-term-bar">
              <div className="pg-term-dot" style={{background:"#ff5f57"}}/>
              <div className="pg-term-dot" style={{background:"#febc2e"}}/>
              <div className="pg-term-dot" style={{background:"#28c840"}}/>
              <span style={{marginLeft:".6rem",fontSize:".58rem",color:"rgba(77,133,255,.4)",letterSpacing:".08em"}}>bankr-agent</span>
              {running&&<span style={{marginLeft:"auto",fontSize:".5rem",color:"#4d85ff",display:"flex",alignItems:"center",gap:".3rem"}}>
                <span style={{width:"4px",height:"4px",borderRadius:"50%",background:"#4d85ff",animation:"pulse 1s infinite",display:"inline-block"}}/>LIVE
              </span>}
            </div>
            <div className="pg-term-body">
              {steps.length===0 && <div style={{color:"rgba(77,133,255,.3)",fontSize:".68rem"}}><span className="pg-prompt">{`>`}</span>waiting…<span className="pg-caret"/></div>}
              {steps.map((s,i)=>(
                <div key={i} className="pg-step">
                  <div className="pg-step-icon" style={{
                    background:s.status==="done"?"rgba(77,133,255,.12)":s.status==="active"?"rgba(26,79,255,.15)":s.status==="error"?"rgba(248,113,113,.12)":"rgba(255,255,255,.04)",
                    border:`1px solid ${s.status==="done"?"rgba(77,133,255,.25)":s.status==="active"?"rgba(77,133,255,.35)":s.status==="error"?"rgba(248,113,113,.25)":"rgba(255,255,255,.08)"}`,
                  }}>
                    {s.status==="done"?<span style={{color:"#4d85ff",fontSize:".55rem"}}>✓</span>
                    :s.status==="error"?<span style={{color:"#f87171",fontSize:".55rem"}}>✕</span>
                    :s.status==="active"?<span style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4d85ff",animation:"pulse .8s infinite",display:"block"}}/>
                    :<span style={{color:"rgba(255,255,255,.2)",fontSize:".55rem"}}>·</span>}
                  </div>
                  <span style={{
                    color:s.status==="done"?"rgba(77,133,255,.8)":s.status==="active"?"rgba(220,230,255,.9)":s.status==="error"?"rgba(248,113,113,.8)":"rgba(255,255,255,.3)",
                    fontWeight:s.status==="active"?400:300,
                  }}>{s.label}</span>
                </div>
              ))}
              {running&&<div style={{fontSize:".65rem",color:"rgba(77,133,255,.4)",paddingLeft:"1.5rem",paddingTop:".2rem"}}>
                <span className="pg-prompt">{`>`}</span>waiting for Bankr<span className="pg-caret"/>
              </div>}
              <div ref={termRef}/>
            </div>
          </div>

          {/* Output */}
          <div className="pg-output">
            <div style={{padding:".75rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                {output?.label&&<span className="pg-chip" style={{color:output.color,background:output.color+"15",border:`1px solid ${output.color}30`}}>{output.label}</span>}
                {threadId&&<span className="pg-chip" style={{color:"#4d85ff",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)"}}>⚡ thread</span>}
              </div>
              <button onClick={()=>{setOutput(null);setSteps([]);setActiveAgent(null);}}
                style={{background:"none",border:"1px solid rgba(255,255,255,.07)",borderRadius:"6px",padding:".15rem .55rem",fontSize:".55rem",color:"rgba(255,255,255,.3)",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.15)";e.currentTarget.style.color="rgba(255,255,255,.6)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.07)";e.currentTarget.style.color="rgba(255,255,255,.3)";}}>
                Clear
              </button>
            </div>
            <div className="pg-output-body">
              {output?.type==="warn"&&(
                <div style={{display:"flex",gap:".8rem",padding:".9rem 1.1rem",background:"rgba(249,115,22,.06)",border:"1px solid rgba(249,115,22,.15)",borderRadius:"10px"}}>
                  <span style={{fontSize:"1.3rem",flexShrink:0}}>🔗</span>
                  <div>
                    <div style={{fontSize:".75rem",fontWeight:500,color:"#f97316",marginBottom:".35rem"}}>Wallet required</div>
                    <div style={{fontSize:".7rem",color:"rgba(220,230,255,.55)",lineHeight:1.65}}>{output.data}</div>
                    <button onClick={login} style={{marginTop:".7rem",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:".4rem .9rem",color:"#dde4ff",fontSize:".68rem",cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Connect Wallet →</button>
                  </div>
                </div>
              )}
              {output?.transactions?.length>0&&(
                <div style={{display:"flex",gap:".6rem",padding:".7rem .9rem",background:"rgba(77,133,255,.05)",border:"1px solid rgba(77,133,255,.15)",borderRadius:"10px",marginBottom:"1rem",alignItems:"center"}}>
                  <span style={{fontSize:"1.1rem"}}>✅</span>
                  <div>
                    <div style={{fontSize:".65rem",color:"#4d85ff",fontWeight:500,marginBottom:".15rem"}}>Transaction confirmed on Base</div>
                    {output.transactions.slice(0,1).map((tx,i)=>(
                      <div key={i} style={{fontSize:".58rem",color:"rgba(77,133,255,.5)",fontFamily:"'IBM Plex Mono',monospace"}}>{tx.hash?`${tx.hash.slice(0,22)}…`:"Confirming on-chain…"}</div>
                    ))}
                  </div>
                </div>
              )}
              {output?.type==="trending"&&output.boosted?.length>0&&(
                <div style={{marginBottom:"1rem"}}>
                  {output.boosted.slice(0,6).map((t,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:".8rem",padding:".45rem .2rem",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <span style={{fontSize:".6rem",color:"rgba(77,133,255,.4)",fontFamily:"'IBM Plex Mono',monospace",minWidth:"20px"}}>#{i+1}</span>
                      <span style={{fontSize:".72rem",fontWeight:500,color:"#dde4ff",fontFamily:"'IBM Plex Mono',monospace",minWidth:"80px"}}>{t.tokenSymbol}</span>
                      <span style={{fontSize:".62rem",color:"rgba(180,195,230,.4)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description?.replace(t.tokenSymbol||"","").trim().slice(0,70)}</span>
                    </div>
                  ))}
                </div>
              )}
              {output?.data&&output.type!=="warn"&&(
                <div style={{fontSize:".77rem",color:"rgba(210,225,255,.8)",lineHeight:1.9,whiteSpace:"pre-wrap",fontWeight:300}}>{output.data}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BANKR CHAT AGENT ── */}
      <div className="pg-chat-wrap">
        <div className="pg-chat-header">
          <div className="pg-chat-avatar">BKR</div>
          <div style={{flex:1}}>
            <div style={{fontSize:".8rem",fontWeight:500,color:"#dde4ff",letterSpacing:"-.01em"}}>Noel Agent Chat</div>
            <div style={{fontSize:".58rem",color:"rgba(77,133,255,.5)",marginTop:".1rem"}}>Ask anything · price · swap · deploy · portfolio · signals</div>
          </div>
          <span className="pg-chip" style={{color:"#4d85ff",background:"rgba(77,133,255,.08)",border:"1px solid rgba(77,133,255,.18)"}}>POWERED BY BANKR</span>
          {threadId&&<span className="pg-chip" style={{color:"#4d85ff",background:"rgba(26,79,255,.08)",border:"1px solid rgba(77,133,255,.18)"}}>⚡ thread active</span>}
          {chatHistory.length>0&&<button onClick={()=>{setChatHistory([]);setThreadId(null);}}
            style={{background:"none",border:"1px solid rgba(255,255,255,.07)",borderRadius:"6px",padding:".15rem .5rem",fontSize:".55rem",color:"rgba(255,255,255,.3)",cursor:"pointer",fontFamily:"inherit",marginLeft:".2rem"}}>Clear</button>}
        </div>

        <div style={{padding:".9rem 1.4rem",minHeight:"130px",maxHeight:"320px",overflowY:"auto",display:"flex",flexDirection:"column",gap:".6rem"}}>
          {chatHistory.length===0&&(
            <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
              {["What is the price of ETH?","Top trending tokens on Base?","Analyze BRETT — buy or sell?","What's my wallet balance?","Swap 0.01 ETH to USDC","Who are the smart money wallets?"].map(s=>(
                <button key={s} className="pg-suggest" onClick={()=>setChatInput(s)}>{s}</button>
              ))}
            </div>
          )}
          {chatHistory.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:".6rem",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end"}}>
              {m.role==="assistant"&&<div className="pg-chat-avatar" style={{width:"26px",height:"26px",borderRadius:"8px",fontSize:".55rem"}}>B</div>}
              <div style={{maxWidth:"80%",display:"flex",flexDirection:"column",gap:".2rem",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                {m.role==="assistant"&&<span style={{fontSize:".48rem",color:"rgba(77,133,255,.5)",letterSpacing:".1em",fontFamily:"'IBM Plex Mono',monospace"}}>BANKR</span>}
                <div className={m.role==="user"?"pg-bubble-user":"pg-bubble-bot"}>{m.content}</div>
                {m.txs?.length>0&&<div style={{fontSize:".58rem",color:"#4d85ff",background:"rgba(77,133,255,.06)",border:"1px solid rgba(77,133,255,.18)",borderRadius:"6px",padding:".28rem .65rem",display:"flex",alignItems:"center",gap:".35rem"}}>✅ {m.txs.length} tx confirmed on Base</div>}
              </div>
            </div>
          ))}
          {chatBusy&&(
            <div style={{display:"flex",gap:".6rem",alignItems:"flex-end"}}>
              <div className="pg-chat-avatar" style={{width:"26px",height:"26px",borderRadius:"8px",fontSize:".55rem"}}>B</div>
              <div className="pg-bubble-bot" style={{padding:".5rem .9rem",display:"flex",gap:".3rem",alignItems:"center"}}>
                {[0,1,2].map(i=><span key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4d85ff",animation:`pulse ${1+i*0.25}s infinite`,display:"inline-block"}}/>)}
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>

        <div style={{padding:".85rem 1.4rem",borderTop:"1px solid rgba(77,133,255,.08)",display:"flex",gap:".6rem",alignItems:"flex-end",background:"rgba(0,0,0,.2)"}}>
          <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}}
            placeholder={tokenInput?`Ask about ${tokenInput} or any on-chain action…`:"Ask anything: price, swap, analysis, deploy…"}
            rows={1}
            style={{flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"10px",padding:".6rem .95rem",color:"#dde4ff",fontSize:".78rem",fontFamily:"'DM Sans',sans-serif",fontWeight:300,resize:"none",outline:"none",lineHeight:1.55,transition:"border-color .2s"}}
            onFocus={e=>e.target.style.borderColor="rgba(77,133,255,.35)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.08)"}
          />
          <button className="pg-send-btn" onClick={sendChat} disabled={!chatInput.trim()||chatBusy}>
            Send →
          </button>
        </div>
      </div>
      </>)}
    </div>
  );
}

/* ══════════════════════════════
   ROLLING TEXT COMPONENT
══════════════════════════════ */
function RollingText({ words, className, style }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(()=>{
    const iv = setInterval(()=>{
      setVisible(false);
      setTimeout(()=>{ setIdx(i=>(i+1)%words.length); setVisible(true); }, 350);
    }, 2200);
    return ()=>clearInterval(iv);
  },[words]);
  return (
    <span className={className} style={{
      display:"inline-block",
      transition:"opacity .35s ease, transform .35s ease",
      opacity: visible?1:0,
      transform: visible?"translateY(0)":"translateY(-12px)",
      ...style
    }}>
      {words[idx]}
    </span>
  );
}

/* ══════════════════════════════
   ANIMATED COUNTER COMPONENT
══════════════════════════════ */
function AnimatedCounter({ target, suffix="", prefix="" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting && !started.current){
        started.current = true;
        const duration = 1800;
        const steps = 60;
        const inc = target / steps;
        let cur = 0;
        const iv = setInterval(()=>{
          cur += inc;
          if(cur >= target){ setCount(target); clearInterval(iv); }
          else setCount(Math.floor(cur));
        }, duration/steps);
      }
    },{ threshold:0.5 });
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ══════════════════════════════
   SCROLL REVEAL HOOK
══════════════════════════════ */
function useScrollReveal(threshold=0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){ setVisible(true); obs.disconnect(); }
    },{ threshold });
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[threshold]);
  return [ref, visible];
}

/* ══════════════════════════════
   SCROLL REVEAL WRAPPER
══════════════════════════════ */
function Reveal({ children, delay=0, direction="up" }) {
  const [ref, visible] = useScrollReveal(0.08);
  const cinClass = {up:"cin-up",left:"cin-left",right:"cin-right",scale:"cin-scale"}[direction]||"cin-up";
  return (
    <div ref={ref}
      className={`cin-section ${cinClass}${visible?" cin-visible":""}`}
      style={{transitionDelay:`${delay}ms`}}>
      {children}
    </div>
  );
}

/* ══════════════════════════════
   CANVAS — Flying Stars (overlay on space bg)
══════════════════════════════ */
function HeroCanvas() {
  const canvasRef = useRef(null);
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H;
    const stars = [];

    const resize = ()=>{
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for(let i=0;i<200;i++){
      const speed = Math.random()*0.35+0.04;
      const angle = Math.random()*Math.PI*2;
      stars.push({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*(i<20?2.2:1.1)+0.15,
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
        base_a: Math.random()*0.55+0.1,
        a: 0, pulse: Math.random()*Math.PI*2,
        pulse_speed: Math.random()*0.018+0.005,
        big: i < 20,
        color: i%4===0?"140,200,255":i%4===1?"100,160,255":i%4===2?"220,235,255":"80,140,255",
      });
    }

    const draw = ()=>{
      ctx.clearRect(0,0,W,H);
      stars.forEach(s=>{
        s.pulse += s.pulse_speed;
        s.a = Math.max(0.05, Math.min(0.9, s.base_a + Math.sin(s.pulse)*s.base_a*0.5));
        if(s.big){
          const gr = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*8);
          gr.addColorStop(0,`rgba(${s.color},${s.a*0.6})`);
          gr.addColorStop(0.3,`rgba(${s.color},${s.a*0.15})`);
          gr.addColorStop(1,"rgba(0,0,0,0)");
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r*8,0,Math.PI*2);
          ctx.fillStyle=gr; ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r*(s.big?1+Math.sin(s.pulse)*0.25:1),0,Math.PI*2);
        ctx.fillStyle=`rgba(${s.color},${s.a})`;
        ctx.fill();
        s.x+=s.vx; s.y+=s.vy;
        if(s.x<-5)s.x=W+5; if(s.x>W+5)s.x=-5;
        if(s.y<-5)s.y=H+5; if(s.y>H+5)s.y=-5;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:2,pointerEvents:"none"}}/>;
}

/* ══════════════════════════════
   NetworkCanvas — True Markets geometric network BG
══════════════════════════════ */
function NetworkCanvas() {
  const ref = useRef(null);
  useEffect(()=>{
    const canvas = ref.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H;
    const pts = [];

    const resize = ()=>{
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Scattered points that form a network
    for(let i=0;i<80;i++){
      pts.push({
        x: Math.random()*W, y: Math.random()*H,
        vx:(Math.random()-.5)*0.3, vy:(Math.random()-.5)*0.3,
        r: Math.random()*1.5+0.4,
      });
    }

    const draw = ()=>{
      ctx.clearRect(0,0,W,H);
      // Draw connections
      for(let i=0;i<pts.length;i++){
        for(let j=i+1;j<pts.length;j++){
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<120){
            const alpha=(1-d/120)*0.18;
            ctx.beginPath();
            ctx.strokeStyle=`rgba(77,133,255,${alpha})`;
            ctx.lineWidth=0.5;
            ctx.moveTo(pts[i].x,pts[i].y);
            ctx.lineTo(pts[j].x,pts[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw dots
      pts.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(100,160,255,0.45)";
        ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W) p.vx*=-1;
        if(p.y<0||p.y>H) p.vy*=-1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}


/* Character reveal component */
function CharReveal({ text, className, style, delay=0 }) {
  const [ref, visible] = useScrollReveal(0.05);
  return (
    <span ref={ref} className={className} style={style}>
      {text.split("").map((ch,i)=>(
        <span key={i} className="char-wrap">
          <span className="char" style={{
            animationDelay: visible ? `${delay + i*28}ms` : "9999s",
            animationPlayState: visible ? "running" : "paused",
          }}>{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </span>
  );
}

/* Magnetic button wrapper */
function MagBtn({ children, strength=0.3, className, style, onClick }) {
  const ref = useRef(null);
  const handleMove = e => {
    if(!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width/2) * strength;
    const y = (e.clientY - r.top - r.height/2) * strength;
    ref.current.style.transform = `translate(${x}px,${y}px)`;
  };
  const handleLeave = () => { if(ref.current) ref.current.style.transform = "translate(0,0)"; };
  return (
    <div ref={ref} className={"mag-btn "+(className||"")} style={{transition:"transform .4s cubic-bezier(.23,1,.32,1)",...style}}
      onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick}>
      {children}
    </div>
  );
}

/* 3D Tilt card */
function TiltCard({ children, className, style, intensity=8 }) {
  const ref = useRef(null);
  const handleMove = e => {
    if(!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientY - r.top - r.height/2) / r.height;
    const y = (e.clientX - r.left - r.width/2) / r.width;
    ref.current.style.transform = `perspective(800px) rotateX(${-x*intensity}deg) rotateY(${y*intensity}deg) translateZ(8px)`;
    ref.current.style.boxShadow = `${-y*12}px ${x*12}px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(77,133,255,.12)`;
  };
  const handleLeave = () => {
    if(!ref.current) return;
    ref.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateZ(0)";
    ref.current.style.boxShadow = "";
  };
  return (
    <div ref={ref} className={"tilt-card "+(className||"")} style={style}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
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
  const [walletTier] = useState("premium"); // open access — no token gating
  const [walletBalance] = useState(0);
  const [verifyingWallet] = useState(false);

  const convexArticles = useQuery(api.articles.list);
  const sendMessage = useAction(api.chat.chat);
  const postToMoltbook = useAction(api.moltbook.postArticle);
  const getTokenPrice   = useAction(api.bankr.getTokenPrice);
  const getRecentTrades = useAction(api.bankr.getRecentTrades);
  const getTrendingBase = useAction(api.bankr.getTrendingBase);
  const bankrAsk        = useAction(api.bankr.bankrAsk);
  const getAlphaBankr   = useAction(api.bankr.getAlphaBankr);
  const getPortfolio    = useAction(api.bankr.getPortfolio);
  const swapTokens      = useAction(api.bankr.swapTokens);
  const getBalance      = useAction(api.bankr.getBalance);
  const setLimitOrder   = useAction(api.bankr.setLimitOrder);
  const claimFees       = useAction(api.bankr.claimFees);
  const getSmartMoney   = useAction(api.bankr.getSmartMoney);
  const setupDCA        = useAction(api.bankr.setupDCA);
  const deployToken     = useAction(api.bankr.deployToken);
  const runAlphaAgent   = useAction(api.alphaagent.runAlphaAgent);
  const getCryptoNews = useAction(api.news.getCryptoNews);
  const getMessariMetrics = useAction(api.news.getMessariMetrics);
  const getArticleContent = useAction(api.news.getArticleContent);
  const getTrendingAI = useAction(api.coingecko.getTrendingAI);
  const getTokenMarket = useAction(api.coingecko.getTokenMarket);
  // const getTokenHolders = useAction(api.moralis.getTokenHolders); // moralis not deployed
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
  const [smartMoney, setSmartMoney]               = useState([]);
  const [smartMoneyLoading, setSmartMoneyLoading] = useState(false);
  const [sniperTokens, setSniperTokens]           = useState([]);
  const [sniperLoading, setSniperLoading]         = useState(false);
  const [agentSignals, setAgentSignals]           = useState([]);
  const [agentLoading, setAgentLoading]           = useState(false);
  const [agentLastRun, setAgentLastRun]           = useState(null);
  const [tradeStats, setTradeStats] = useState({buys5m:0,sells5m:0,buys1h:0,sells1h:0,buys24h:0,sells24h:0,volume24h:0});
  const [cryptoNews, setCryptoNews] = useState([]);
  const [risingNews, setRisingNews] = useState([]);
  const [messariGlobal, setMessariGlobal] = useState(null);
  const [newsArt, setNewsArt] = useState(null);
  const [newsArtLoading, setNewsArtLoading] = useState(false);
  const [newsArtContent, setNewsArtContent] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLastUpdated, setNewsLastUpdated] = useState(null);
  const [newsCountdown, setNewsCountdown] = useState(90);
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
    } catch(e) {}
    try {
      // Known top Base token addresses for reliable data
      const BASE_TOKENS = [
        "0x532f27101965dd16442E59d40670FaF5eBB142E4", // BRETT
        "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", // DEGEN
        "0x0b3e328455c4059EEb9e3f84b5543F74E24e7020", // VIRTUAL
        "0x077487c868125dc6e24b5426abafef5b81b5dc4a", // HIGHER
        "0x940181a94A35A4569E4529A3CDfB74e38FD98631", // AERO
        "0xBA5E05cb26b78eda3A2f8e3b3814726305dcAc83", // MORPHO
        "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3", // NOELCLAW
        "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", // TOSHI
        "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b", // BNKR
        "0x4200000000000000000000000000000000000006", // WETH (for price ref)
      ];

      // Fetch all at once from DexScreener
      const addrs = BASE_TOKENS.join(",");
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${addrs}`,
        {signal: AbortSignal.timeout(10000)}
      ).catch(()=>null);

      if(res?.ok){
        const data = await res.json().catch(()=>null);
        const seen = new Set();
        const tokens = [];

        // Sort pairs by volume, pick best pair per token
        const pairs = (data?.pairs||[])
          .filter(p=>p.chainId==="base")
          .sort((a,b)=>parseFloat(b.volume?.h24||0)-parseFloat(a.volume?.h24||0));

        for(const p of pairs){
          const sym = (p.baseToken?.symbol||"?").toUpperCase();
          if(seen.has(sym)) continue;
          if(["RETH","CBBTC","WETH","USDC","USDT"].includes(sym)) continue;
          seen.add(sym);
          tokens.push({
            id: p.baseToken?.address||sym,
            symbol: sym,
            name: p.baseToken?.name||sym,
            current_price: parseFloat(p.priceUsd||0)||0,
            market_cap: parseFloat(p.marketCap||p.fdv||0)||0,
            total_volume: parseFloat(p.volume?.h24||0)||0,
            price_change_percentage_24h: parseFloat(p.priceChange?.h24||0)||0,
            image: null,
            pairAddress: p.pairAddress||"",
            url: `https://dexscreener.com/base/${p.pairAddress}`,
          });
          if(tokens.length>=10) break;
        }

        if(tokens.length>=3){
          setAiTokens(tokens);
          setAiTokensLoading(false);
          return;
        }
      }

      // Fallback: search multiple queries
      const queries = ["BRETT DEGEN BASE", "VIRTUAL HIGHER BASE", "AERODROME MORPHO BASE"];
      const allTokens = [];
      const seenFb = new Set();
      for(const q of queries){
        const r = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
          {signal:AbortSignal.timeout(6000)}
        ).catch(()=>null);
        if(!r?.ok) continue;
        const d = await r.json().catch(()=>null);
        for(const p of (d?.pairs||[])){
          if(p.chainId!=="base") continue;
          const sym=(p.baseToken?.symbol||"?").toUpperCase();
          if(seenFb.has(sym)||["USDC","WETH","USDT","WBTC","DAI"].includes(sym)) continue;
          seenFb.add(sym);
          allTokens.push({
            id:p.baseToken?.address||sym, symbol:sym, name:p.baseToken?.name||sym,
            current_price:parseFloat(p.priceUsd||0)||0,
            market_cap:parseFloat(p.marketCap||p.fdv||0)||0,
            total_volume:parseFloat(p.volume?.h24||0)||0,
            price_change_percentage_24h:parseFloat(p.priceChange?.h24||0)||0,
            image:null, url:`https://dexscreener.com/base/${p.pairAddress}`,
          });
        }
        if(allTokens.length>=10) break;
      }
      if(allTokens.length) setAiTokens(allTokens.slice(0,12));
    } catch(e) { console.error("fetchAlphaFeed:", e); }
    setAiTokensLoading(false);
  };

  const fetchSmartMoney = async () => {
    setSmartMoneyLoading(true);
    try {
      const res = await getSmartMoney({});
      if (res?.wallets) setSmartMoney(res.wallets);
    } catch(e) { console.error("SmartMoney:", e.message); }
    setSmartMoneyLoading(false);
  };

  const fetchSniperTokens = async () => {
    // getSniperTokens not available - skip silently
    setSniperLoading(false);
  };

  const fetchAgentSignals = async () => {
    setAgentLoading(true);
    try {
      const res = await runAlphaAgent({});
      if (res?.signals) setAgentSignals(res.signals);
      if (res?.generatedAt) setAgentLastRun(res.generatedAt);
    } catch(e) { console.error("AlphaAgent:", e.message); }
    setAgentLoading(false);
  };

  const fetchRecentTrades = async () => {
    try {
      // Try Convex first
      const res = await getRecentTrades({}).catch(()=>null);
      if (res?.trades?.length) {
        setRecentTrades(res.trades.slice(0,15));
        if(res.buys24h !== undefined) {
          setTradeStats({ buys5m:res.buys5m, sells5m:res.sells5m, buys1h:res.buys1h, sells1h:res.sells1h, buys24h:res.buys24h, sells24h:res.sells24h, volume24h:res.volume24h });
        }
        return;
      }
      // DexScreener fallback — no CORS issues
      const dsRes = await fetch(
        "https://api.dexscreener.com/latest/dex/tokens/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3",
        {signal:AbortSignal.timeout(8000)}
      ).catch(()=>null);
      if(dsRes?.ok){
        const dsData = await dsRes.json().catch(()=>null);
        const pairs = dsData?.pairs||[];
        const basePair = pairs.find((p)=>p.chainId==="base")||pairs[0];
        if(basePair){
          // DexScreener gives txns, not individual trades
          // Show pair stats instead
          setTradeStats({
            buys5m: parseInt(basePair.txns?.m5?.buys||0),
            sells5m: parseInt(basePair.txns?.m5?.sells||0),
            buys1h: parseInt(basePair.txns?.h1?.buys||0),
            sells1h: parseInt(basePair.txns?.h1?.sells||0),
            buys24h: parseInt(basePair.txns?.h24?.buys||0),
            sells24h: parseInt(basePair.txns?.h24?.sells||0),
            volume24h: parseFloat(basePair.volume?.h24||0),
          });
        }
      }
    } catch(e) { console.error("Trades error:", e); }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const newsRes = await getCryptoNews({}).catch(()=>null);
      const messariRes = await getMessariMetrics({}).catch(()=>null);

      if (newsRes?.hot?.length) {
        setCryptoNews(newsRes.hot.slice(0,8));
        setRisingNews(newsRes.rising?.slice(0,4)||[]);
      } else {
        // RSS via allorigins proxy — multiple sources
        const RSS_FEEDS = [
          {url:'https://www.coindesk.com/arc/outboundfeeds/rss/', source:'CoinDesk'},
          {url:'https://cointelegraph.com/rss', source:'Cointelegraph'},
          {url:'https://decrypt.co/feed', source:'Decrypt'},
          {url:'https://cryptonews.com/news/feed/', source:'CryptoNews'},
        ];
        let newsItems = [];
        for(const feed of RSS_FEEDS){
          if(newsItems.length >= 10) break;
          try {
            const res = await fetch(
              `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`,
              {signal:AbortSignal.timeout(7000)}
            ).catch(()=>null);
            if(!res?.ok) continue;
            const wrapper = await res.json().catch(()=>null);
            const xml = wrapper?.contents||'';
            if(!xml) continue;
            const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
            const parsed = items.slice(0,6).map((m,idx)=>{
              const item = m[1];
              const title = (item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]||'')
                .trim().replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
              const link = (item.match(/<link>(.*?)<\/link>/)?.[1]||item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]||'#').trim();
              const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]||new Date().toISOString();
              const desc = (item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]||'')
                .replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').slice(0,200).trim();
              if(!title) return null;
              const tickers = [...new Set(((title+' '+desc).toUpperCase().match(/\b(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX|ARB|OP|BASE|BRETT|DEGEN|LINK|UNI)\b/g)||[]))].slice(0,2);
              const txt = title.toLowerCase();
              const bull = ["surge","rally","gain","rise","bull","pump","ath","high","record","boost","jump","approve","positive"].filter(w=>txt.includes(w)).length;
              const bear = ["drop","fall","crash","bear","dump","fear","hack","ban","risk","loss","decline","plunge","warn","negative"].filter(w=>txt.includes(w)).length;
              return {
                id: link||String(newsItems.length+idx),
                title, url:link, source:feed.source,
                published_at: pubDate,
                sentiment: bull>bear?"bullish":bear>bull?"bearish":"neutral",
                currencies: tickers,
                summary: desc,
                votes:{positive:0,negative:0,important:0},
              };
            }).filter(Boolean);
            newsItems = [...newsItems, ...parsed];
          } catch(e) { console.log('RSS skip:', feed.source); }
        }
        if(newsItems.length > 0){
          setCryptoNews(newsItems.slice(0,8));
          setRisingNews(newsItems.slice(8,12));
        }
      }
      if (messariRes?.global) setMessariGlobal(messariRes.global);
    } catch(e) { console.error("News fetch error:", e); }
    setNewsLoading(false);
    setNewsLastUpdated(new Date());
    setNewsCountdown(90);
  };

  const openNewsArticle = (n) => {
    setNewsArt(n);
    setNewsArtContent(null);
    window.scrollTo({ top: 0, behavior: "instant" });
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
      // getTokenHolders disabled - moralis not deployed
      const res = null;
      setHoldersData(res);
    } catch(e) { console.error("Holders:", e.message); }
    setHoldersLoading(false);
  };



  // Wallet tier is open — no holder verification needed

  useEffect(() => {
    // Load all data for everyone
    fetchAlphaFeed();
    fetchRecentTrades();
    fetchNews();
    fetchHolders();
    fetchSmartMoney();
    fetchSniperTokens();
  }, []);

  // Auto-refresh for all users: trades 15s, alpha 60s, news 3min | premium: price 30s, smartmoney 1h, sniper 2h
  useEffect(() => {
    const tradesId = setInterval(() => { fetchRecentTrades(); }, 60000); // 1 min to save Bankr quota
    const alphaId  = setInterval(() => { fetchAlphaFeed();    }, 60000);
    const newsId   = setInterval(() => { fetchNews(); }, 90000); // 90s realtime refresh
    const countdownId = setInterval(() => {
      setNewsCountdown(p => {
        if(p<=1){ return 90; }
        return p-1;
      });
    }, 1000);
    const priceId  = setInterval(() => { fetchTokenPrice();   }, 30000);
    const smartMoneyId = setInterval(() => { fetchSmartMoney();   }, 3600000);
    const sniperId     = setInterval(() => { fetchSniperTokens(); }, 7200000);
    return () => {
      clearInterval(tradesId); clearInterval(alphaId); clearInterval(newsId); clearInterval(priceId);
      clearInterval(smartMoneyId); clearInterval(sniperId); clearInterval(countdownId);
    };
  }, []);

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

  // Giulio-style cursor trail
  useEffect(()=>{
    const TRAIL = 12;
    const dots = [];
    const mouse = {x:0, y:0};
    const pos = Array.from({length:TRAIL},()=>({x:0,y:0}));

    // Create trail dots
    for(let i=0;i<TRAIL;i++){
      const el = document.createElement("div");
      el.className = "trail-dot";
      const size = Math.max(2, 6 - i*0.4);
      const alpha = (1 - i/TRAIL) * 0.45;
      el.style.cssText = `width:${size}px;height:${size}px;background:rgba(77,133,255,${alpha});`;
      document.body.appendChild(el);
      dots.push(el);
    }

    let raf;
    const mv = e => { mouse.x = e.clientX; mouse.y = e.clientY;
      if(crRef.current){crRef.current.style.left=e.clientX+"px";crRef.current.style.top=e.clientY+"px";}
      if(crrRef.current){crrRef.current.style.left=e.clientX+"px";crrRef.current.style.top=e.clientY+"px";}
    };

    const animate = () => {
      let x = mouse.x, y = mouse.y;
      pos.forEach((p,i) => {
        const prev = i===0 ? {x:mouse.x,y:mouse.y} : pos[i-1];
        p.x += (prev.x - p.x) * (0.35 - i*0.02);
        p.y += (prev.y - p.y) * (0.35 - i*0.02);
        if(dots[i]){
          dots[i].style.left = p.x + "px";
          dots[i].style.top  = p.y + "px";
        }
      });
      raf = requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener("mousemove", mv);
    return()=>{
      window.removeEventListener("mousemove",mv);
      cancelAnimationFrame(raf);
      dots.forEach(d=>d.parentNode&&d.parentNode.removeChild(d));
    };
  },[]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,busy]);

  const navTo=p=>{
    setPage(p);
    setArt(null);
    setMenuOpen(false);
    window.scrollTo({top:0,behavior:"instant"});
    
  };
  // Menu stays open on scroll (better UX on mobile)
  // Close only when tapping overlay or navigating

  // Chat bubble — full Bankr LLM with thread memory
  const [chatThreadId, setChatThreadId] = useState(null);

  const send=useCallback(async(text)=>{
    const q=text??val.trim();
    if(!q||busy)return;
    setVal("");
    const next=[...msgs,{r:"u",t:q}];
    setMsgs(next);setBusy(true);
    try{
      const res = await bankrAsk({
        prompt: q,
        threadId: chatThreadId||undefined,
      });
      if(res?.threadId) setChatThreadId(res.threadId);
      const reply = res?.response || "No response from Bankr.";
      setMsgs(p=>[...p,{r:"a",t:reply}]);
    }catch(e){
      console.error("Bankr chat error:",e);
      setMsgs(p=>[...p,{r:"a",t:"Bankr is busy right now. Try again in a moment."}]);
    }
    finally{setBusy(false);}
  },[msgs,val,busy,chatThreadId,bankrAsk]);

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
            <div className="sb-logo-sub">AI Agent Platform</div>
          </div>
          <div className="sb-section">
            <span className="sb-label">Navigate</span>
            {[["home","⌂","Home"],["articles","⚡","Noel Agent"],["howto","◈","How It Works"],["about","◎","About"],["docs","◈","Docs"]].map(([p,icon,label])=>(
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
            {authenticated
              ? <span style={{color:"var(--blue-hi)"}}>⚡ Bankr Agent</span>
              : <button onClick={()=>{login();setSidebarOpen(false);}} style={{background:"none",border:"none",color:"var(--blue-hi)",cursor:"pointer",fontSize:".62rem",fontFamily:"inherit",padding:0}}>🔗 Connect Wallet</button>}
          </div>
        </div>


        {/* ── NAV ── */}
        <nav className="nav">
          <div className="nav-logo" onClick={()=>{navTo("home");setMenuOpen(false);}}>
            <span><span className="logo-n">Noel</span>Claw</span>
          </div>
          <div className="nav-right">
            <div className="nav-links">
              {[["home","Home"],["articles","Noel Agent"],["howto","How It Works"],["about","About"],["docs","Docs"]].map(([p,label])=>(
                <button key={p} className={`nav-item${page===p&&!art?" active":""}`} onClick={()=>navTo(p)}>
                  {label}
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
                  <span style={{display:"flex",alignItems:"center",gap:".3rem",fontSize:".62rem",color:"var(--blue-hi)",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.25)",borderRadius:"5px",padding:".25rem .6rem",letterSpacing:".06em",fontWeight:500}}>
                    ⚡ {walletAddress?.slice(0,4)}…{walletAddress?.slice(-4)}
                  </span>
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
            {[["home","Home"],["articles","Noel Agent"],["howto","How It Works"],["about","About"],["docs","Docs"]].map(([p,label])=>(
              <button key={p} className={`mob-item${page===p&&!art?" active":""}`} onClick={()=>{navTo(p);setMenuOpen(false);}}>
                {label}
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
                    {moltStatus && <span style={{fontSize:".72rem",color:"var(--blue-hi)"}}>{moltStatus}</span>}
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
                    <div style={{marginTop:".6rem",fontSize:".7rem",color:tweetStatus.startsWith("Failed")?"#ff4d4d":"var(--blue-hi)",lineHeight:1.5}}>{tweetStatus}</div>
                  )}
                </div>

                <div className="comment-section">
                  <div className="comment-title">Comments ({comments.length})</div>
                  <div className="comment-input-wrap">
                    <textarea className="comment-inp" rows={2} placeholder="Share your thoughts..." value={commentVal} onChange={e=>setCommentVal(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&commentVal.trim()){e.preventDefault();setComments(c=>[...c,{id:Date.now(),name:"You",initial:"Y",text:commentVal.trim(),time:"just now",color:"#4d85ff"}]);setCommentVal("");}}}
                    />
                    <button className="comment-submit" onClick={()=>{if(commentVal.trim()){setComments(c=>[...c,{id:Date.now(),name:"You",initial:"Y",text:commentVal.trim(),time:"just now",color:"#4d85ff"}]);setCommentVal("");}}} disabled={!commentVal.trim()}>Post</button>
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
                  <p style={{fontSize:".73rem",color:"var(--text2)",lineHeight:1.65,marginBottom:"1rem"}}>Follow on X for agent updates, new features, and Base chain alpha.</p>
                  <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"#000",border:"1px solid var(--border)",borderRadius:"6px",padding:".45rem .9rem",fontSize:".72rem",color:"var(--white)",textDecoration:"none"}}>
                    𝕏 Follow @noelclawfun
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* NEWS ARTICLE READER — Summary + redirect */}
          {newsArt&&!art&&(
            <div className="page" style={{background:"#000",minHeight:"100vh"}}>
              <div style={{maxWidth:"760px",margin:"0 auto",padding:"2.5rem 5vw 5rem"}}>

                {/* Back button */}
                <button onClick={()=>{setNewsArt(null);setNewsArtContent(null);}}
                  style={{display:"inline-flex",alignItems:"center",gap:".5rem",background:"none",border:"1px solid rgba(255,255,255,.1)",borderRadius:"8px",padding:".4rem .9rem",fontSize:".72rem",color:"rgba(180,200,255,.6)",cursor:"pointer",marginBottom:"2.5rem",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(77,133,255,.4)";e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.1)";e.currentTarget.style.color="rgba(180,200,255,.6)";}}>
                  ← Back
                </button>

                {/* Source + meta */}
                <div style={{display:"flex",alignItems:"center",gap:".7rem",marginBottom:"1.2rem",flexWrap:"wrap"}}>
                  <span style={{fontSize:".6rem",fontWeight:700,color:"#4d85ff",letterSpacing:".15em",textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"}}>
                    {newsArt.source||"Crypto News"}
                  </span>
                  <span style={{color:"rgba(255,255,255,.15)"}}>·</span>
                  <span style={{fontSize:".65rem",color:"rgba(180,200,255,.4)"}}>
                    {newsArt.published_at||newsArt.publishedAt
                      ? new Date(newsArt.published_at||newsArt.publishedAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})
                      : ""}
                  </span>
                  {(newsArt.currencies||[]).length>0&&(newsArt.currencies||[]).map((c,i)=>(
                    <span key={i} style={{fontSize:".52rem",color:"#4d85ff",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"4px",padding:".1rem .4rem",fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>{c}</span>
                  ))}
                  <span style={{fontSize:".52rem",padding:".15rem .5rem",borderRadius:"20px",fontWeight:700,letterSpacing:".06em",
                    background:newsArt.sentiment==="bullish"?"rgba(77,133,255,.12)":newsArt.sentiment==="bearish"?"rgba(255,100,100,.12)":"rgba(255,255,255,.06)",
                    color:newsArt.sentiment==="bullish"?"#4d85ff":newsArt.sentiment==="bearish"?"#ff6b6b":"rgba(180,200,255,.4)",
                    border:`1px solid ${newsArt.sentiment==="bullish"?"rgba(77,133,255,.3)":newsArt.sentiment==="bearish"?"rgba(255,100,100,.3)":"rgba(255,255,255,.1)"}`}}>
                    {newsArt.sentiment==="bullish"?"↑ Bullish":newsArt.sentiment==="bearish"?"↓ Bearish":"— Neutral"}
                  </span>
                </div>

                {/* Title */}
                <h1 style={{fontSize:"clamp(1.8rem,4vw,2.8rem)",fontWeight:700,lineHeight:1.1,color:"#fff",letterSpacing:"-.03em",marginBottom:"1.5rem"}}>
                  {newsArt.title}
                </h1>

                {/* Summary card — main content */}
                {newsArt.summary ? (
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"1.8rem",marginBottom:"2rem",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,width:"3px",height:"100%",background:"linear-gradient(to bottom,#4d85ff,rgba(77,133,255,.2))",borderRadius:"2px"}}/>
                    <div style={{paddingLeft:"1rem"}}>
                      <div style={{fontSize:".55rem",color:"rgba(77,133,255,.6)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:".8rem",fontFamily:"'IBM Plex Mono',monospace"}}>Summary</div>
                      <p style={{fontSize:"1rem",color:"rgba(210,225,255,.85)",lineHeight:1.85,fontWeight:300}}>
                        {newsArt.summary.replace(/<[^>]+>/g,"")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"2rem",marginBottom:"2rem",textAlign:"center"}}>
                    <div style={{fontSize:".85rem",color:"rgba(180,200,255,.4)",marginBottom:".5rem"}}>No preview available</div>
                  </div>
                )}

                {/* Why no full content explanation */}
                <div style={{background:"rgba(26,79,255,.05)",border:"1px solid rgba(77,133,255,.12)",borderRadius:"10px",padding:"1rem 1.2rem",marginBottom:"2rem",display:"flex",alignItems:"flex-start",gap:".8rem"}}>
                  <span style={{fontSize:"1rem",flexShrink:0}}>💡</span>
                  <div>
                    <div style={{fontSize:".75rem",fontWeight:500,color:"rgba(140,180,255,.8)",marginBottom:".3rem"}}>Full article on {newsArt.source||"source"}</div>
                    <div style={{fontSize:".7rem",color:"rgba(140,180,255,.5)",lineHeight:1.6}}>
                      News sites protect their full content. We show you the summary here — click below to read the full story on their site.
                    </div>
                  </div>
                </div>

                {/* CTA — Read full article */}
                <a href={newsArt.url} target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:".6rem",background:"#2952ff",borderRadius:"12px",padding:"1rem 2rem",fontSize:".88rem",fontWeight:600,color:"#fff",textDecoration:"none",marginBottom:"1.2rem",transition:"all .25s",boxShadow:"0 0 30px rgba(41,82,255,.3)"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#3b6fff";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(41,82,255,.4)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#2952ff";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 0 30px rgba(41,82,255,.3)";}}>
                  Read Full Article on {newsArt.source||"Source"} ↗
                </a>

                {/* Share row */}
                <div style={{display:"flex",gap:".6rem",justifyContent:"center",flexWrap:"wrap"}}>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(newsArt.title)}&url=${encodeURIComponent(newsArt.url)}&via=noelclawfun`}
                    target="_blank" rel="noopener noreferrer"
                    style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"8px",padding:".45rem 1rem",fontSize:".7rem",color:"rgba(200,220,255,.8)",textDecoration:"none",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";}}>
                    𝕏 Share
                  </a>
                  <button onClick={()=>{navigator.clipboard?.writeText(newsArt.url);}}
                    style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"8px",padding:".45rem 1rem",fontSize:".7rem",color:"rgba(200,220,255,.8)",cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";}}>
                    🔗 Copy Link
                  </button>
                </div>

                {/* Related — other news */}
                {cryptoNews.filter(n=>n.url!==newsArt.url).length>0&&(
                  <div style={{marginTop:"3rem",borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:"2rem"}}>
                    <div style={{fontSize:".58rem",color:"rgba(120,160,255,.5)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:"1.2rem",fontFamily:"'IBM Plex Mono',monospace"}}>More News</div>
                    <div style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
                      {cryptoNews.filter(n=>n.url!==newsArt.url).slice(0,4).map((n,i)=>(
                        <div key={i} onClick={()=>openNewsArticle(n)}
                          style={{display:"flex",alignItems:"flex-start",gap:"1rem",padding:".9rem 1rem",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",cursor:"pointer",transition:"all .2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.borderColor="rgba(77,133,255,.2)";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.02)";e.currentTarget.style.borderColor="rgba(255,255,255,.06)";}}>
                          <span style={{fontSize:".55rem",fontWeight:700,color:"rgba(77,133,255,.6)",textTransform:"uppercase",letterSpacing:".1em",flexShrink:0,marginTop:".15rem",fontFamily:"'IBM Plex Mono',monospace"}}>{n.source}</span>
                          <span style={{fontSize:".78rem",color:"rgba(200,220,255,.8)",lineHeight:1.4,fontWeight:300}}>{n.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* HOME */}
          {!art&&!newsArt&&page==="home"&&(
            <div className="page">
              {/* HERO — Canvas + Rolling text */}
              <section className="hero">
                <div className="hero-bg"/>
                <HeroCanvas/>
                <div className="hero-stars"/>
                <div className="hero-beam"/>
                <div className="hero-arc-left"/>
                <div className="hero-arc-left-2"/>
                <div className="hero-arc-right"/>
                <div className="hero-arc-right-2"/>
                <div className="hero-glow-point"/>
                <div className="hero-vignette"/>
                <div className="hero-content">
                  <div className="hero-eyebrow">Powered by Bankr · Built on Base</div>
                  <h1 className="hero-h1" style={{animation:"pin .7s .15s both"}}>
                    <span style={{
                      display:"block",
                      fontWeight:300,
                      fontSize:"clamp(1rem,2vw,1.6rem)",
                      letterSpacing:".25em",
                      textTransform:"uppercase",
                      color:"rgba(140,180,255,.65)",
                      marginBottom:".5rem",
                    }}>Your Personal</span>
                    <span style={{
                      display:"block",
                      fontWeight:800,
                      letterSpacing:"-.04em",
                      lineHeight:.92,
                      color:"#fff",
                    }}>AI Agent</span>
                  </h1>
                  <p className="hero-tagline">
                    Analyze any token. Execute real swaps. Deploy contracts. Set limit orders all via <strong>natural language</strong>. Powered by Bankr. No code required.
                  </p>
                  <div className="hero-ctas">
                    <MagBtn><button className="cta-solid" onClick={()=>navTo("articles")}>Open Noel Agent →</button></MagBtn>
                    <MagBtn><a className="cta-outline" href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer">𝕏 Follow</a></MagBtn>
                    <MagBtn><a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer" className="cta-outline">Buy $NOELCLAW</a></MagBtn>
                  </div>
                </div>
                <div className="hero-scroll"><span>Scroll</span><div className="scroll-line"/></div>
              </section>

              {/* STATS — Animated counters */}
              <div className="stats-row">
                {[
                  {n:<><AnimatedCounter target={10} suffix="+"/></>, l:"Agents Available"},
                  {n:<AnimatedCounter target={184} suffix=" txs"/>, l:"Swaps Executed"},
                  {n:<AnimatedCounter target={82} suffix=" wallets"/>, l:"Users on Base"},
                ].map(({n,l})=>(
                  <div className="stat-box" key={l}><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>
                ))}
              </div>

              {/* ── PREMIUM / TOKEN-GATED FEATURES ── */}
              <div className="prem-section" style={{padding:"4rem 3.5rem",borderBottom:"1px solid var(--border)",background:"linear-gradient(180deg,rgba(26,79,255,0.04) 0%,transparent 100%)",position:"relative",overflow:"hidden"}}>
                {/* BG glow */}
                <div style={{position:"absolute",top:"-60px",left:"50%",transform:"translateX(-50%)",width:"600px",height:"300px",background:"radial-gradient(ellipse,rgba(26,79,255,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>

                <div style={{position:"relative",zIndex:1}}>
                  {/* ── PUBLIC SECTIONS ───────────────────────────── */}
                  <div>

                      {/* ── TOKEN RADAR ───────────────────────────────── */}
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"16px",overflow:"hidden",marginBottom:"1rem"}}>
                        {/* Header */}
                        <div style={{padding:".75rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,.012)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{fontSize:".95rem"}}>📡</span>
                            <span style={{fontSize:".75rem",color:"var(--white)",fontWeight:700,letterSpacing:".02em"}}>Top Trending on Base</span>
                            <span style={{fontSize:".38rem",background:"rgba(77,133,255,.12)",color:"var(--blue-hi)",border:"1px solid rgba(77,133,255,.25)",borderRadius:"20px",padding:".12rem .5rem",fontWeight:700,letterSpacing:".1em"}}>LIVE</span>
                            <span style={{fontSize:".38rem",background:"rgba(26,79,255,.12)",color:"var(--blue-hi)",border:"1px solid rgba(26,79,255,.25)",borderRadius:"20px",padding:".12rem .5rem",fontWeight:700,letterSpacing:".1em"}}>BASE CHAIN</span>
                          </div>
                          {aiTokensLoading&&<span style={{fontSize:".55rem",color:"var(--text3)",display:"flex",alignItems:"center",gap:".4rem"}}><span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",animation:"pulse 1.2s infinite"}}/>Updating…</span>}
                        </div>
                        {/* Column headers */}
                        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px",padding:".4rem 1.2rem",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.005)"}}>
                          {["TOKEN","PRICE","MARKET CAP","24H %"].map((h,i)=>(
                            <span key={h} style={{fontSize:".42rem",color:"var(--text3)",letterSpacing:".12em",fontWeight:700,textAlign:i>0?"right":"left"}}>{h}</span>
                          ))}
                        </div>
                        {/* NOELCLAW pinned row */}
                        {tokenData&&(
                          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 70px",padding:".65rem 1.2rem",borderBottom:"1px solid var(--border)",background:"rgba(26,79,255,.05)",alignItems:"center",cursor:"pointer",transition:"background .15s"}}
                            onClick={()=>window.open("https://dexscreener.com/base/"+tokenData.address,"_blank")}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(26,79,255,.1)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(26,79,255,.05)"}>
                            <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                              <img src="/logo.png" alt="NOELCLAW" style={{width:"22px",height:"22px",borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"1px solid rgba(26,79,255,.4)"}} onError={e=>e.target.style.display="none"}/>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                                  <span style={{fontSize:".72rem",color:"var(--blue-hi)",fontWeight:700}}>$NOELCLAW</span>
                                  <span style={{fontSize:".38rem",background:"rgba(26,79,255,.15)",color:"var(--blue-hi)",border:"1px solid rgba(26,79,255,.3)",borderRadius:"4px",padding:".06rem .3rem",fontWeight:700}}>BASE</span>
                                </div>
                                <span style={{fontSize:".5rem",color:"var(--text3)",fontFamily:"monospace"}}>
                                  {(()=>{const p=parseFloat(tokenData.price||0);if(!p)return "—";const s=p.toFixed(12);const m=s.match(/^0\.(0+)([1-9]\d*)/);return m?"$0.0₍"+m[1].length+"₎"+m[2].slice(0,4):"$"+p.toFixed(6);})()}
                                </span>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <span style={{fontSize:".65rem",color:"var(--text2)",fontWeight:500}}>
                                {tokenData.marketCap?(tokenData.marketCap>=1e9?"$"+(tokenData.marketCap/1e9).toFixed(2)+"B":tokenData.marketCap>=1e6?"$"+(tokenData.marketCap/1e6).toFixed(1)+"M":"$"+(tokenData.marketCap/1e3).toFixed(0)+"K"):"—"}
                              </span>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <span style={{fontSize:".65rem",color:"var(--text2)",fontWeight:500}}>
                                {tokenData.volume24h?(tokenData.volume24h>=1e6?"$"+(tokenData.volume24h/1e6).toFixed(1)+"M":"$"+(tokenData.volume24h/1e3).toFixed(0)+"K"):"—"}
                              </span>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <span style={{fontSize:".72rem",fontWeight:700,color:parseFloat(tokenData.priceChange24h||0)>=0?"var(--blue-hi)":"#ff6b6b"}}>
                                {(parseFloat(tokenData.priceChange24h||0)||0)>=0?"+":""}{(parseFloat(tokenData.priceChange24h||0)||0).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        )}
                        {/* BNKR pinned row */}
                        <BnkrRow/>
                        {aiTokens.slice(0,12).map((t,idx)=>{
                          const price=t.current_price||t.price||0;
                          const mcap=parseFloat(t.market_cap||t.marketCap||0)||0;
                          const vol=parseFloat(t.total_volume||t.volume24h||0)||0;
                          const chg=parseFloat(t.price_change_percentage_24h??t.priceChange24h??0)||0;
                          const sym=(t.symbol||"?").toUpperCase();
                          const img=t.image||t.logo||null;
                          const isPos=chg>=0;
                          const fmt=n=>{const v=parseFloat(n)||0;return v>=1e9?"$"+(v/1e9).toFixed(2)+"B":v>=1e6?"$"+(v/1e6).toFixed(1)+"M":v>=1e3?"$"+(v/1e3).toFixed(1)+"K":v>0?"$"+v.toFixed(2):"—";};
                          const fmtP=p=>{const v=parseFloat(p)||0;if(!v)return"—";if(v>=1)return"$"+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4});const s=v.toFixed(10),m=s.match(/^0[.](0+)([1-9]\d*)/);return m?"$0.0("+m[1].length+")"+m[2].slice(0,3):"$"+v.toFixed(6);};
                          return (
                          <div key={idx} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 70px",padding:".6rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,.03)",alignItems:"center",cursor:"pointer",transition:"background .15s"}}
                            onClick={()=>t.url?window.open(t.url,'_blank'):t.id?window.open(`https://dexscreener.com/base/${t.id}`,'_blank'):null}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.028)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                              {t.id && t.id.startsWith("0x") ? (
                                <img
                                  src={`https://dd.dexscreener.com/ds-data/tokens/base/${t.id.toLowerCase()}.png`}
                                  alt={sym}
                                  style={{width:"24px",height:"24px",borderRadius:"50%",objectFit:"cover",flexShrink:0,background:"rgba(255,255,255,.05)"}}
                                  onError={e=>{e.target.outerHTML=`<div style="width:24px;height:24px;border-radius:50%;background:hsl(${(sym.charCodeAt(0)*37)%360},60%,35%);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.62rem;font-weight:700;color:#fff">${sym[0]}</div>`;}}
                                />
                              ) : (
                                <div style={{width:"24px",height:"24px",borderRadius:"50%",background:`hsl(${(sym.charCodeAt(0)*37)%360},60%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:".62rem",fontWeight:700,color:"#fff"}}>{sym[0]}</div>
                              )}
                              <div>
                                <div style={{fontSize:".72rem",color:"#fff",fontWeight:600}}>{sym}</div>
                                <div style={{fontSize:".52rem",color:"rgba(140,170,210,.45)",fontFamily:"'IBM Plex Mono',monospace",marginTop:".1rem"}}>{fmtP(price)}</div>
                              </div>
                            </div>
                            <div style={{textAlign:"right"}}><span style={{fontSize:".65rem",color:"rgba(180,200,255,.6)",fontFamily:"'IBM Plex Mono',monospace"}}>{mcap?fmt(mcap):"—"}</span></div>
                            <div style={{textAlign:"right"}}><span style={{fontSize:".65rem",color:"rgba(180,200,255,.6)",fontFamily:"'IBM Plex Mono',monospace"}}>{vol?fmt(vol):"—"}</span></div>
                            <div style={{textAlign:"right"}}><span style={{fontSize:".72rem",fontWeight:700,color:isPos?"#4d85ff":"#ff6b6b",fontFamily:"'IBM Plex Mono',monospace"}}>{isPos?"+":""}{chg.toFixed(2)}%</span></div>
                          </div>
                          );
                        })}
                        {aiTokens.length===0&&!aiTokensLoading&&(
                          <div style={{padding:"1.5rem 1.2rem",display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",animation:"pulse 1.2s infinite",flexShrink:0}}/>
                            <span style={{fontSize:".68rem",color:"var(--text3)"}}>Loading Base chain tokens…</span>
                          </div>
                        )}
                        {aiTokens.length===0&&aiTokensLoading&&(
                          <div style={{padding:"1.5rem 1.2rem",display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",animation:"pulse 1.2s infinite",flexShrink:0}}/>
                            <span style={{fontSize:".68rem",color:"var(--text3)"}}>Fetching top AI tokens…</span>
                          </div>
                        )}
                      </div>

                      {/* ── $NOELCLAW ACTIVITY ─────────────────────────── */}
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"16px",overflow:"hidden",marginBottom:"1rem"}}>
                        {/* Header */}
                        <div style={{padding:".75rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,.012)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                            <img src="/logo.png" alt="" style={{width:"18px",height:"18px",borderRadius:"50%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                            <span style={{fontSize:".75rem",color:"var(--white)",fontWeight:700}}>$NOELCLAW Activity</span>
                            <span style={{display:"flex",alignItems:"center",gap:".3rem",fontSize:".38rem",background:"rgba(77,133,255,.1)",color:"var(--blue-hi)",border:"1px solid rgba(77,133,255,.25)",borderRadius:"20px",padding:".12rem .5rem",fontWeight:700,letterSpacing:".1em"}}>
                              <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",animation:"pulse 1.2s infinite"}}/>LIVE
                            </span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                            {tradeStats&&(
                              <div style={{display:"flex",gap:".6rem",alignItems:"center"}}>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".38rem",color:"var(--text3)",letterSpacing:".1em",fontWeight:600}}>5M</span>
                                  <div style={{display:"flex",gap:".2rem"}}>
                                    <span style={{fontSize:".55rem",color:"var(--blue-hi)",fontWeight:700}}>{tradeStats.buys5m||0}B</span>
                                    <span style={{fontSize:".55rem",color:"#ff6b6b",fontWeight:700}}>{tradeStats.sells5m||0}S</span>
                                  </div>
                                </div>
                                <div style={{width:"1px",height:"20px",background:"var(--border)"}}/>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".38rem",color:"var(--text3)",letterSpacing:".1em",fontWeight:600}}>1H</span>
                                  <div style={{display:"flex",gap:".2rem"}}>
                                    <span style={{fontSize:".55rem",color:"var(--blue-hi)",fontWeight:700}}>{tradeStats.buys1h||0}B</span>
                                    <span style={{fontSize:".55rem",color:"#ff6b6b",fontWeight:700}}>{tradeStats.sells1h||0}S</span>
                                  </div>
                                </div>
                                <div style={{width:"1px",height:"20px",background:"var(--border)"}}/>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:".1rem"}}>
                                  <span style={{fontSize:".38rem",color:"var(--text3)",letterSpacing:".1em",fontWeight:600}}>PRICE</span>
                                  <span style={{fontSize:".55rem",color:"var(--text2)",fontWeight:600,fontFamily:"monospace"}}>{tokenData?(()=>{const p=parseFloat(tokenData.price||0);const s=p.toFixed(12);const m=s.match(/^0\.(0+)([1-9]\d*)/);return m?"$0.0"+m[2].slice(0,3):"$"+p.toFixed(4);})():"—"}</span>
                                </div>
                              </div>
                            )}
                            <button onClick={fetchRecentTrades} style={{background:"none",border:"1px solid var(--border)",borderRadius:"7px",padding:".22rem .65rem",color:"var(--text3)",fontSize:".55rem",cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue-hi)";e.currentTarget.style.color="var(--blue-hi)";}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)";}}>↻ Refresh</button>
                          </div>
                        </div>
                        {/* Column headers */}
                        <div style={{display:"grid",gridTemplateColumns:"60px 64px 80px 1fr 110px 70px 28px",padding:".4rem 1.2rem",borderBottom:"1px solid var(--border)",background:"rgba(255,255,255,.005)"}}>
                          {["TIME","TYPE","USD","NOELCLAW","PRICE","MAKER","TXN"].map((h,i)=>(
                            <span key={h} style={{fontSize:".42rem",color:"var(--text3)",letterSpacing:".1em",fontWeight:700,textAlign:i>=2&&i<=4?"right":"left"}}>{h}</span>
                          ))}
                        </div>
                        {/* Trade rows */}
                        <div style={{overflowX:"auto"}}>
                          <div style={{minWidth:"540px"}}>
                            {recentTrades.length>0?recentTrades.slice(0,15).map((t,i)=>{
                              const isBuy=t.type==="buy";
                              const price=parseFloat(t.priceUsd||0);
                              const amtUsd=parseFloat(t.amountUsd||t.usd||0);
                              const noelAmt=price>0?amtUsd/price:parseFloat(t.noelclaw||0);
                              const ago=t.timestamp?(()=>{const d=Math.floor((Date.now()-t.timestamp)/1000);return d<60?d+"s":d<3600?Math.floor(d/60)+"m":Math.floor(d/3600)+"h";})():"—";
                              return(
                                <div key={i} style={{display:"grid",gridTemplateColumns:"60px 64px 80px 1fr 110px 70px 28px",padding:".55rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,.03)",alignItems:"center",background:isBuy?"rgba(77,133,255,.03)":"rgba(255,107,107,.025)",transition:"background .15s",cursor:"pointer"}}
                                  onMouseEnter={e=>e.currentTarget.style.background=isBuy?"rgba(77,133,255,.07)":"rgba(255,107,107,.06)"}
                                  onMouseLeave={e=>e.currentTarget.style.background=isBuy?"rgba(77,133,255,.03)":"rgba(255,107,107,.025)"}>
                                  <span style={{fontSize:".58rem",color:"var(--text3)",fontFamily:"monospace"}}>{ago}</span>
                                  <div style={{display:"flex",alignItems:"center",gap:".3rem"}}>
                                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"16px",height:"16px",borderRadius:"4px",background:isBuy?"rgba(77,133,255,.15)":"rgba(255,107,107,.15)",border:"1px solid "+(isBuy?"rgba(77,133,255,.3)":"rgba(255,107,107,.3)"),fontSize:".5rem",color:isBuy?"var(--blue-hi)":"#ff6b6b",flexShrink:0}}>{isBuy?"▲":"▼"}</span>
                                    <span style={{fontSize:".65rem",fontWeight:700,color:isBuy?"var(--blue-hi)":"#ff6b6b"}}>{isBuy?"BUY":"SELL"}</span>
                                  </div>
                                  <span style={{fontSize:".65rem",color:"var(--white)",fontWeight:600,fontFamily:"monospace",textAlign:"right"}}>${amtUsd.toFixed(0)}</span>
                                  <span style={{fontSize:".6rem",color:"var(--text2)",fontFamily:"monospace",textAlign:"right",paddingRight:".5rem"}}>
                                    {noelAmt>1e6?(noelAmt/1e6).toFixed(2)+"M":noelAmt>1000?(noelAmt/1e3).toFixed(1)+"K":noelAmt.toFixed(0)}
                                  </span>
                                  <span style={{fontSize:".62rem",fontFamily:"monospace",color:isBuy?"var(--blue-hi)":"#ff6b6b",textAlign:"right"}}>
                                    {price>0?(()=>{const s=price.toFixed(12);const m=s.match(/^0\.(0+)([1-9]\d*)/);return m?"$0.0₍"+m[1].length+"₎"+m[2].slice(0,3):"$"+price.toFixed(5);})():"—"}
                                  </span>
                                  <span>
                                    {t.txHash?<a href={"https://basescan.org/address/0x"+t.txHash.slice(2,42)} target="_blank" rel="noopener noreferrer"
                                      style={{fontSize:".58rem",color:"var(--text3)",fontFamily:"monospace",textDecoration:"none"}}
                                      onMouseEnter={e=>e.currentTarget.style.color="var(--blue-hi)"}
                                      onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>{t.txHash.slice(2,8).toUpperCase()}</a>
                                    :<span style={{fontSize:".58rem",color:"var(--text3)",opacity:.4}}>——</span>}
                                  </span>
                                  <span style={{display:"flex",justifyContent:"center"}}>
                                    {t.txHash?<a href={"https://basescan.org/tx/"+t.txHash} target="_blank" rel="noopener noreferrer"
                                      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"18px",height:"18px",borderRadius:"4px",background:"rgba(255,255,255,.05)",border:"1px solid var(--border)",color:"var(--text3)",fontSize:".55rem",textDecoration:"none",transition:"all .15s"}}
                                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(26,79,255,.15)";e.currentTarget.style.color="var(--blue-hi)";e.currentTarget.style.borderColor="rgba(26,79,255,.4)";}}
                                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.05)";e.currentTarget.style.color="var(--text3)";e.currentTarget.style.borderColor="var(--border)";}}>↗</a>
                                    :<span style={{opacity:.2,fontSize:".6rem",color:"var(--text3)"}}>—</span>}
                                  </span>
                                </div>
                              );
                            }):(
                              <div style={{padding:"1.2rem 1.2rem",display:"flex",flexDirection:"column",gap:".8rem"}}>
                                {/* Show DexScreener stats if available */}
                                {(tradeStats?.buys24h>0||tradeStats?.sells24h>0) ? (
                                  <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                                    {/* Main stats row */}
                                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:".5rem"}}>
                                      {[
                                        {label:"Buys 5m",val:tradeStats.buys5m||0,color:"#4d85ff",bg:"rgba(26,79,255,.08)"},
                                        {label:"Sells 5m",val:tradeStats.sells5m||0,color:"#ff6b6b",bg:"rgba(255,107,107,.08)"},
                                        {label:"Buys 1h",val:tradeStats.buys1h||0,color:"#4d85ff",bg:"rgba(26,79,255,.06)"},
                                        {label:"Sells 1h",val:tradeStats.sells1h||0,color:"#ff6b6b",bg:"rgba(255,107,107,.06)"},
                                        {label:"Vol 24h",val:tradeStats.volume24h>0?"$"+((tradeStats.volume24h>=1e6?(tradeStats.volume24h/1e6).toFixed(1)+"M":(tradeStats.volume24h/1e3).toFixed(0)+"K")):"—",color:"rgba(200,220,255,.8)",bg:"rgba(255,255,255,.04)",raw:true},
                                      ].map(s=>(
                                        <div key={s.label} style={{background:s.bg,borderRadius:"8px",padding:".6rem .7rem",display:"flex",flexDirection:"column",gap:".25rem",border:"1px solid rgba(255,255,255,.05)"}}>
                                          <span style={{fontSize:".45rem",color:"rgba(180,200,255,.4)",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"}}>{s.label}</span>
                                          <span style={{fontSize:".88rem",fontWeight:700,color:s.color,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1}}>{s.raw?s.val:s.val}</span>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Buy/Sell pressure bar */}
                                    {(tradeStats.buys1h+tradeStats.sells1h)>0&&(
                                      <div>
                                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:".3rem"}}>
                                          <span style={{fontSize:".5rem",color:"#4d85ff",fontFamily:"'IBM Plex Mono',monospace"}}>BUY {Math.round((tradeStats.buys1h/(tradeStats.buys1h+tradeStats.sells1h))*100)}%</span>
                                          <span style={{fontSize:".5rem",color:"rgba(180,200,255,.4)",fontFamily:"'IBM Plex Mono',monospace"}}>1h pressure</span>
                                          <span style={{fontSize:".5rem",color:"#ff6b6b",fontFamily:"'IBM Plex Mono',monospace"}}>SELL {Math.round((tradeStats.sells1h/(tradeStats.buys1h+tradeStats.sells1h))*100)}%</span>
                                        </div>
                                        <div style={{height:"4px",borderRadius:"2px",background:"rgba(255,107,107,.3)",overflow:"hidden"}}>
                                          <div style={{height:"100%",borderRadius:"2px",background:"linear-gradient(90deg,#4d85ff,#2952ff)",width:`${Math.round((tradeStats.buys1h/(tradeStats.buys1h+tradeStats.sells1h))*100)}%`,transition:"width .5s ease"}}/>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                                    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--blue-hi)",display:"inline-block",animation:"pulse 1.2s infinite",flexShrink:0}}/>
                                    <span style={{fontSize:".7rem",color:"var(--text3)"}}>Fetching on-chain activity…</span>
                                  </div>
                                )}
                                <div style={{display:"flex",gap:".6rem",flexWrap:"wrap"}}>
                                  <a href="https://dexscreener.com/base/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer"
                                    style={{fontSize:".62rem",color:"#4d85ff",background:"rgba(26,79,255,.08)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"6px",padding:".3rem .7rem",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:".3rem"}}>
                                    View on DexScreener ↗
                                  </a>
                                  <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer"
                                    style={{fontSize:".62rem",color:"rgba(180,200,255,.5)",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"6px",padding:".3rem .7rem",textDecoration:"none"}}>
                                    Trade on Flaunch ↗
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── CRYPTO NEWS ────────────────────────────────── */}
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"16px",overflow:"hidden",marginBottom:"1rem"}}>
                        <div style={{padding:".75rem 1.2rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,.012)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{fontSize:".95rem"}}>📰</span>
                            <span style={{fontSize:".75rem",color:"var(--white)",fontWeight:700}}>Crypto News</span>
                            <span style={{fontSize:".38rem",background:"rgba(26,79,255,.1)",color:"#4d85ff",border:"1px solid rgba(77,133,255,.2)",borderRadius:"20px",padding:".12rem .5rem",fontWeight:700,letterSpacing:".1em",display:"flex",alignItems:"center",gap:".25rem"}}><span style={{width:"3px",height:"3px",borderRadius:"50%",background:"#4d85ff",animation:"pulse 1.5s infinite",display:"inline-block"}}/>LIVE</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                            {newsLastUpdated&&(
                              <span style={{fontSize:".52rem",color:"rgba(77,133,255,.4)",fontFamily:"'IBM Plex Mono',monospace"}}>
                                {Math.floor(newsCountdown/60)}:{String(newsCountdown%60).padStart(2,"0")}
                              </span>
                            )}
                            <button onClick={fetchNews} style={{background:"none",border:"1px solid var(--border)",borderRadius:"7px",padding:".22rem .65rem",color:"var(--text3)",fontSize:".55rem",cursor:"pointer",fontFamily:"inherit",transition:"all .18s"}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue-hi)";e.currentTarget.style.color="var(--blue-hi)";}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text3)";}}>↻ Refresh</button>
                          </div>
                        </div>
                        {newsLoading&&(
                          <div style={{padding:"1.5rem 1.2rem",display:"flex",alignItems:"center",gap:".6rem"}}>
                            <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4d85ff",display:"inline-block",animation:"pulse 1.2s infinite",flexShrink:0}}/>
                            <span style={{fontSize:".68rem",color:"var(--text3)"}}>Fetching latest crypto news…</span>
                          </div>
                        )}
                        {cryptoNews.length>0&&(
                          <div style={{display:"flex",flexDirection:"column"}}>
                            {cryptoNews.slice(0,6).map((n,i)=>{
                              const pubDate = n.published_at||n.publishedAt||n.date||"";
                              const timeAgo = pubDate ? (()=>{
                                const diff = (Date.now() - new Date(pubDate).getTime()) / 1000;
                                if(diff < 3600) return Math.floor(diff/60) + "m ago";
                                if(diff < 86400) return Math.floor(diff/3600) + "h ago";
                                return new Date(pubDate).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
                              })() : "";
                              const isBull = n.sentiment==="bullish";
                              const isBear = n.sentiment==="bearish";
                              const tickers = n.currencies||[];
                              return (
                                <div key={i}
                                  style={{padding:".85rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,.04)",cursor:"pointer",transition:"background .15s",display:"flex",flexDirection:"column",gap:".4rem"}}
                                  onClick={()=>openNewsArticle(n)}
                                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.025)"}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                  {/* Top row: time + sentiment + tickers */}
                                  <div style={{display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap"}}>
                                    {timeAgo&&<span style={{fontSize:".52rem",color:"rgba(180,200,255,.35)",fontFamily:"'IBM Plex Mono',monospace"}}>{timeAgo}</span>}
                                    {(isBull||isBear)&&(
                                      <span style={{fontSize:".42rem",display:"flex",alignItems:"center",gap:".2rem",padding:".1rem .4rem",borderRadius:"4px",fontWeight:700,letterSpacing:".06em",
                                        background:isBull?"rgba(34,197,94,.1)":"rgba(255,107,107,.1)",
                                        color:isBull?"#22c55e":"#ff6b6b",
                                        border:`1px solid ${isBull?"rgba(34,197,94,.25)":"rgba(255,107,107,.25)"}`}}>
                                        <span style={{width:"4px",height:"4px",borderRadius:"50%",background:isBull?"#22c55e":"#ff6b6b",display:"inline-block"}}/>
                                        {isBull?"Positive":"Negative"}
                                      </span>
                                    )}
                                    {tickers.slice(0,2).map(t=>(
                                      <span key={t} style={{fontSize:".42rem",color:"rgba(77,133,255,.8)",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"4px",padding:".1rem .35rem",fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>{t}</span>
                                    ))}
                                    {i===0&&<span style={{fontSize:".42rem",background:"rgba(255,107,107,.12)",color:"#ff6b6b",border:"1px solid rgba(255,107,107,.2)",borderRadius:"4px",padding:".1rem .35rem",fontWeight:700,letterSpacing:".08em",marginLeft:"auto"}}>🔥 HOT</span>}
                                  </div>
                                  {/* Title */}
                                  <div style={{fontSize:".78rem",color:"rgba(220,230,255,.9)",fontWeight:500,lineHeight:1.45,letterSpacing:"-.01em"}}>{n.title}</div>
                                  {/* Summary if available */}
                                  {n.summary&&(
                                    <div style={{fontSize:".65rem",color:"rgba(140,170,210,.45)",lineHeight:1.5,fontWeight:300,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                                      {n.summary.replace(/<[^>]+>/g,"").slice(0,120)}…
                                    </div>
                                  )}
                                  {/* Bottom row */}
                                  <div style={{display:"flex",alignItems:"center",gap:".5rem",marginTop:".1rem"}}>
                                    <span style={{fontSize:".5rem",color:"rgba(140,170,210,.4)",fontWeight:500,textTransform:"uppercase",letterSpacing:".08em"}}>{n.source||"News"}</span>
                                    <span style={{marginLeft:"auto",fontSize:".55rem",color:"rgba(77,133,255,.6)",fontWeight:500,display:"flex",alignItems:"center",gap:".25rem"}}>
                                      Read <span style={{fontSize:".45rem"}}>→</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {cryptoNews.length===0&&!newsLoading&&(
                          <div style={{padding:"2rem 1.2rem",display:"flex",flexDirection:"column",alignItems:"center",gap:".5rem",opacity:.6}}>
                            <span style={{fontSize:"1.8rem"}}>📰</span>
                            <span style={{fontSize:".7rem",color:"var(--text3)"}}>Loading news…</span>
                          </div>
                        )}
                      </div>
                  </div>
                  {/* ── PLAYGROUND CTA ─────────────────────────────── */}
                  <div style={{background:"linear-gradient(135deg,rgba(26,79,255,.08),rgba(168,85,247,.06))",border:"1px solid rgba(77,133,255,.2)",borderRadius:"14px",padding:"2rem 2.2rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1.5rem",flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:".52rem",color:"var(--blue-hi)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:".6rem",fontWeight:500}}>⚡ Agent Playground · Powered by Bankr</div>
                      <div style={{fontSize:"1.1rem",fontWeight:300,color:"var(--white)",marginBottom:".5rem",lineHeight:1.2}}>Run live agents, inspect outputs,<br/>and experiment with any token on Base.</div>
                      <div style={{fontSize:".75rem",color:"var(--text2)",fontWeight:200}}>Alpha signals · Token price · Trade feed · GMGN Sniper · Smart Money · Chat Agent</div>
                    </div>
                    <button
                      onClick={()=>navTo("articles")}
                      style={{display:"inline-flex",alignItems:"center",gap:".55rem",background:"var(--white)",color:"var(--bg)",padding:".75rem 1.8rem",borderRadius:"8px",fontSize:".78rem",fontWeight:500,letterSpacing:".06em",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s",flexShrink:0,whiteSpace:"nowrap"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.88)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--white)"}
                    >
                      Open Playground →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* AGENT PLAYGROUND PAGE */}
          {!art&&!newsArt&&page==="articles"&&(
            <div className="page page-gradient-blue" style={{overflowAnchor:"none",minHeight:"100vh"}}>
              <style>{`
                @keyframes log-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
                @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
                .log-line{animation:log-in .18s ease both;}
                .pg-cursor{display:inline-block;width:7px;height:13px;background:rgba(255,255,255,.5);animation:blink 1s step-end infinite;vertical-align:middle;margin-left:2px;}
              `}</style>

              {/* ── HERO HEADER ── */}
              <div style={{padding:"4rem 6vw 3rem",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,.06)"}} id="pg-top">
                <div style={{position:"absolute",top:"-40%",right:"-5%",width:"40vw",height:"40vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(26,79,255,.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:"1.2rem"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:".4rem",fontSize:".55rem",color:"#4d85ff",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"20px",padding:".3rem .8rem",letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"}}>
                      <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4d85ff",boxShadow:"0 0 6px #4d85ff",animation:"pulse 2s infinite",display:"inline-block"}}/>
                      Live · Base Chain
                    </span>
                    <span style={{fontSize:".55rem",color:"rgba(180,200,255,.35)",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:".08em"}}>powered by bankr.bot</span>
                  </div>
                  <h1 style={{fontSize:"clamp(2.2rem,5vw,4rem)",fontWeight:800,color:"#fff",letterSpacing:"-.04em",lineHeight:.92,marginBottom:".8rem"}}>
                    Noel Agent
                  </h1>
                  <p style={{fontSize:"1rem",color:"rgba(180,200,255,.5)",fontWeight:300,maxWidth:"480px",lineHeight:1.75}}>
                    Execute real on-chain actions via natural language. Every swap, deploy, and limit order runs on Base chain through Bankr API.
                  </p>
                </div>
              </div>

              {/* ── AGENT CARDS ── */}
              <AgentPlayground
                sendMessage={sendMessage}
                bankrAsk={bankrAsk}
                getTokenPrice={getTokenPrice}
                getRecentTrades={getRecentTrades}
                getTrendingBase={getTrendingBase}
                getAlphaBankr={getAlphaBankr}
                getPortfolio={getPortfolio}
                swapTokens={swapTokens}
                getBalance={getBalance}
                setLimitOrder={setLimitOrder}
                claimFees={claimFees}
                getSmartMoney={getSmartMoney}
                setupDCA={setupDCA}
                deployToken={deployToken}
                runAlphaAgent={runAlphaAgent}
                walletAddress={walletAddress}
                authenticated={authenticated}
                login={login}
                tokenData={tokenData}
                recentTrades={recentTrades}
              />
            </div>
          )}

          {/* HOW IT WORKS */}
          {!art&&!newsArt&&page==="howto"&&(
            <div className="page" style={{background:"#000"}}>
              {/* Hero header — left aligned like screenshot */}
              <div style={{padding:"5rem 6vw 3rem",maxWidth:"1200px",margin:"0 auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:".8rem",marginBottom:"1.5rem"}}>
                  <span style={{display:"block",width:"2rem",height:"1px",background:"rgba(255,255,255,.3)"}}/>
                  <span style={{fontSize:".55rem",color:"rgba(120,160,255,.55)",letterSpacing:".25em",textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"}}>How it works</span>
                </div>
                <h1 style={{fontSize:"clamp(2rem,4.5vw,4rem)",fontWeight:700,color:"#fff",letterSpacing:"-.04em",lineHeight:.95,marginBottom:"1rem"}}>
                  From natural language<br/>
                  <span style={{color:"#4d85ff"}}>to on-chain action.</span>
                </h1>
                <p style={{fontSize:"1rem",color:"rgba(180,200,255,.5)",fontWeight:300,maxWidth:"460px",lineHeight:1.75}}>
                  NoelClaw translates what you say into real Base chain transactions — powered by Bankr API.
                </p>
              </div>

              {/* 4-col cards — match screenshot */}
              <div className="howto-grid" style={{padding:"0 6vw 5rem",maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem"}}>
                {[
                  {n:"01",icon:"💬",color:"#3b6fff",title:"You type a command",desc:"Write anything in plain English — swap 0.01 ETH to USDC, analyze BRETT, deploy a token. No syntax required.",code:"swap 0.01 ETH to USDC"},
                  {n:"02",icon:"⚡",color:"#3b6fff",title:"Bankr interprets intent",desc:"NoelClaw sends your prompt to Bankr LLM Gateway. Bankr selects the right model and prepares the transaction data.",code:"POST /agent/prompt → jobId"},
                  {n:"03",icon:"🔗",color:"#3b6fff",title:"Base chain executes",desc:"For execute actions, the transaction hits Base chain directly through your connected wallet via Privy.",code:"tx confirmed on Base ✓"},
                  {n:"04",icon:"🤖",color:"#3b6fff",title:"Auto-agent loops",desc:"Set a condition and walk away. The auto-agent monitors every 30 seconds and executes when triggered.",code:"watching ETH → price drop 5%"},
                ].map((s,i)=>(
                  <div key={i} style={{
                    background:"rgba(255,255,255,.03)",
                    border:"1px solid rgba(255,255,255,.07)",
                    borderRadius:"14px",padding:"1.8rem",
                    transition:"border-color .25s,transform .35s cubic-bezier(.23,1,.32,1),box-shadow .35s",
                    position:"relative",overflow:"hidden",
                    display:"flex",flexDirection:"column",gap:".8rem",
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,111,255,.4)";e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 20px 60px rgba(59,111,255,.15)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.07)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    {/* Top row */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <span style={{fontSize:"1.4rem",lineHeight:1}}>{s.icon}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".68rem",color:"rgba(255,255,255,.07)",fontWeight:700,letterSpacing:".05em"}}>{s.n}</span>
                    </div>
                    {/* Title */}
                    <div style={{fontSize:".95rem",fontWeight:600,color:"#fff",lineHeight:1.3,letterSpacing:"-.01em"}}>{s.title}</div>
                    {/* Desc */}
                    <div style={{fontSize:".73rem",color:"rgba(160,190,255,.5)",lineHeight:1.7,fontWeight:300,flex:1}}>{s.desc}</div>
                    {/* Code pill */}
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".63rem",color:"#4d85ff",background:"rgba(59,111,255,.1)",border:"1px solid rgba(59,111,255,.2)",borderRadius:"6px",padding:".28rem .65rem",display:"inline-flex",alignItems:"center",gap:".4rem",marginTop:".3rem"}}>
                      <span style={{opacity:.5}}>{">"}</span> {s.code}
                    </div>
                    {/* Bottom accent */}
                    <div style={{position:"absolute",bottom:0,left:0,right:0,height:"1px",background:"linear-gradient(90deg,rgba(59,111,255,.4),transparent)"}}/>
                  </div>
                ))}
              </div>

              {/* Stack row */}
              <div style={{padding:"2.5rem 6vw",borderTop:"1px solid rgba(255,255,255,.05)",maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",gap:"1.5rem",flexWrap:"wrap"}}>
                <span style={{fontSize:".55rem",color:"rgba(120,160,255,.45)",letterSpacing:".22em",textTransform:"uppercase",flexShrink:0}}>Stack</span>
                <div style={{display:"flex",flexWrap:"wrap",gap:".5rem"}}>
                  {["React + Vite","Convex","Privy","Bankr API","Base Chain","Claude AI","TypeScript"].map(t=>(
                    <span key={t} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".65rem",color:"rgba(100,150,255,.65)",background:"rgba(26,79,255,.07)",border:"1px solid rgba(77,133,255,.12)",borderRadius:"5px",padding:".22rem .65rem"}}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Mobile: stack to 2col then 1col */}
              <style>{`@media(max-width:900px){.howto-grid{grid-template-columns:repeat(2,1fr)!important;}}@media(max-width:500px){.howto-grid{grid-template-columns:1fr!important;}}`}</style>
            </div>
          )}

          {/* DOCS PAGE */}
          {!art&&!newsArt&&page==="docs"&&(
            <div className="page page-gradient-purple" style={{minHeight:"100vh"}}>
              {/* Hero */}
              <div style={{padding:"5rem 6vw 4rem",borderBottom:"1px solid rgba(255,255,255,.06)",maxWidth:"1200px",margin:"0 auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:".8rem",marginBottom:"1.5rem"}}>
                  <span style={{display:"block",width:"2rem",height:"1px",background:"rgba(255,255,255,.3)"}}/>
                  <span style={{fontSize:".58rem",color:"rgba(120,160,255,.6)",letterSpacing:".28em",textTransform:"uppercase"}}>Documentation</span>
                </div>
                <h1 style={{fontSize:"clamp(2.5rem,6vw,5rem)",fontWeight:800,color:"#fff",letterSpacing:"-.04em",lineHeight:.92,marginBottom:"1rem"}}>
                  Build with<br/><span style={{color:"#3b6fff"}}>NoelClaw.</span>
                </h1>
                <p style={{fontSize:"1rem",color:"rgba(180,200,255,.5)",fontWeight:300,maxWidth:"500px",lineHeight:1.75}}>
                  Everything you need to integrate Bankr-powered AI agents into your apps on Base chain.
                </p>
              </div>

              <div className="docs-grid" style={{maxWidth:"1200px",margin:"0 auto",padding:"3rem 5vw 6rem",display:"grid",gridTemplateColumns:"200px 1fr",gap:"2.5rem",alignItems:"start"}}>
                {/* Sidebar */}
                <div className="docs-sidebar" style={{position:"sticky",top:"80px"}}>
                  {[
                    {label:"Overview",items:["Quick Start","Architecture","Stack"]},
                    {label:"API Reference",items:["bankrAsk()","swapTokens()","deployToken()","setLimitOrder()","getSmartMoney()","getTokenPrice()"]},
                    {label:"Guides",items:["Auto-Agent Setup","Wallet Integration","Natural Language"]},
                    {label:"Examples",items:["Code Snippets","Use Cases"]},
                  ].map((section,i)=>(
                    <div key={i} style={{marginBottom:"1.8rem"}}>
                      <div style={{fontSize:".55rem",color:"rgba(120,160,255,.45)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:".7rem",fontFamily:"'IBM Plex Mono',monospace"}}>{section.label}</div>
                      {section.items.map(item=>(
                        <div key={item} style={{fontSize:".78rem",color:"rgba(180,200,255,.55)",padding:".3rem .5rem",borderRadius:"6px",cursor:"pointer",transition:"all .15s",marginBottom:".1rem",fontWeight:300}}
                          onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(255,255,255,.04)";}}
                          onMouseLeave={e=>{e.currentTarget.style.color="rgba(180,200,255,.55)";e.currentTarget.style.background="none";}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="docs-content" style={{display:"flex",flexDirection:"column",gap:"3rem",minWidth:0,overflow:"hidden"}}>

                  {/* Quick Start */}
                  <section>
                    <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#fff",letterSpacing:"-.02em",marginBottom:".5rem"}}>Quick Start</h2>
                    <p style={{fontSize:".85rem",color:"rgba(180,200,255,.55)",lineHeight:1.75,marginBottom:"1.2rem",fontWeight:300}}>
                      Get running in 3 steps. Connect your wallet, type a command, watch it execute on-chain.
                    </p>
                    <div style={{display:"flex",flexDirection:"column",gap:".75rem"}}>
                      {[
                        {step:"1",title:"Connect Wallet","code":"Click Connect → Privy handles auth → wallet ready"},
                        {step:"2",title:"Open Noel Agent","code":"Navigate to Noel Agent → select an action card"},
                        {step:"3",title:"Execute","code":'Type: "swap 0.01 ETH to USDC" → Bankr executes on Base'},
                      ].map(s=>(
                        <div key={s.step} style={{display:"flex",gap:"1rem",alignItems:"flex-start",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",padding:"1rem 1.2rem"}}>
                          <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(59,111,255,.2)",border:"1px solid rgba(59,111,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:".65rem",fontWeight:700,color:"#4d85ff",fontFamily:"'IBM Plex Mono',monospace"}}>{s.step}</div>
                          <div>
                            <div style={{fontSize:".82rem",fontWeight:600,color:"#fff",marginBottom:".3rem"}}>{s.title}</div>
                            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".68rem",color:"rgba(100,160,255,.7)"}}>{s.code}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Architecture */}
                  <section>
                    <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#fff",letterSpacing:"-.02em",marginBottom:".5rem"}}>Architecture</h2>
                    <p style={{fontSize:".85rem",color:"rgba(180,200,255,.55)",lineHeight:1.75,marginBottom:"1.5rem",fontWeight:300}}>
                      NoelClaw acts as the interface layer between users and the Bankr API, which handles all on-chain execution.
                    </p>
                    <div style={{display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"12px",padding:"1.5rem"}}>
                      {[
                        {label:"User",sub:"Natural language",icon:"👤",color:"rgba(200,220,255,.8)"},
                        "→",
                        {label:"NoelClaw",sub:"React + Convex",icon:"⚡",color:"#4d85ff"},
                        "→",
                        {label:"Bankr API",sub:"LLM Gateway",icon:"🤖",color:"#a78bfa"},
                        "→",
                        {label:"Base Chain",sub:"On-chain execution",icon:"🔗",color:"#4d85ff"},
                      ].map((n,i)=>typeof n==="string" ? (
                        <span key={i} style={{color:"rgba(255,255,255,.2)",fontSize:"1.2rem",padding:"0 .3rem"}}>→</span>
                      ) : (
                        <div key={i} style={{flex:1,minWidth:"100px",textAlign:"center",padding:".8rem",background:"rgba(255,255,255,.02)",borderRadius:"8px",border:"1px solid rgba(255,255,255,.05)"}}>
                          <div style={{fontSize:"1.2rem",marginBottom:".3rem"}}>{n.icon}</div>
                          <div style={{fontSize:".72rem",fontWeight:600,color:n.color,marginBottom:".15rem"}}>{n.label}</div>
                          <div style={{fontSize:".58rem",color:"rgba(180,200,255,.35)",fontWeight:300}}>{n.sub}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* API Reference */}
                  <section>
                    <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#fff",letterSpacing:"-.02em",marginBottom:".5rem"}}>API Reference</h2>
                    <p style={{fontSize:".85rem",color:"rgba(180,200,255,.55)",lineHeight:1.75,marginBottom:"1.2rem",fontWeight:300}}>
                      All Bankr actions available through NoelClaw. Each function maps to a natural language command.
                    </p>
                    <div style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
                      {[
                        {fn:"bankrAsk()",params:"prompt, threadId?",ret:"response, threadId",desc:"Send any natural language prompt to Bankr LLM Gateway. Maintains conversation context via threadId.",ex:'"analyze BRETT — should I buy?"'},
                        {fn:"swapTokens()",params:"fromToken, toToken, amount, walletAddress",ret:"response, transactions",desc:"Execute a token swap on Base chain via Bankr. Requires connected wallet.",ex:'"swap 0.01 ETH to USDC"'},
                        {fn:"deployToken()",params:"name, symbol, supply",ret:"response, contractAddress",desc:"Deploy a new ERC-20 token on Base chain in seconds.",ex:'"deploy MOON token with 1B supply"'},
                        {fn:"setLimitOrder()",params:"token, action, amount, targetPrice",ret:"response, orderId",desc:"Set a limit order that executes automatically when price target is hit.",ex:'"buy 0.1 ETH when price drops to $2800"'},
                        {fn:"getSmartMoney()",params:"token?",ret:"wallets, trades, pnl",desc:"Track whale wallet activity and smart money flows on Base.",ex:'"show me smart money for BRETT"'},
                        {fn:"getTokenPrice()",params:"token",ret:"price, change24h, volume, mcap",desc:"Get live token price data from Bankr.",ex:'"what is the price of ETH?"'},
                      ].map((api,i)=>(
                        <div key={i} style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",overflow:"hidden"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:".9rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,.05)",flexWrap:"wrap",gap:".6rem"}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".78rem",color:"#4d85ff",fontWeight:500}}>{api.fn}</span>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".62rem",color:"rgba(180,200,255,.35)"}}>({api.params})</span>
                            <span style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",fontSize:".6rem",color:"rgba(100,200,100,.5)",background:"rgba(100,200,100,.06)",border:"1px solid rgba(100,200,100,.12)",borderRadius:"4px",padding:".1rem .4rem"}}>→ {api.ret}</span>
                          </div>
                          <div style={{padding:".9rem 1.2rem"}}>
                            <p style={{fontSize:".75rem",color:"rgba(160,190,255,.5)",lineHeight:1.65,marginBottom:".6rem",fontWeight:300}}>{api.desc}</p>
                            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".65rem",color:"rgba(77,133,255,.6)",background:"rgba(26,79,255,.06)",borderRadius:"5px",padding:".3rem .65rem",display:"inline-block"}}>Example: {api.ex}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Code Examples */}
                  <section>
                    <h2 style={{fontSize:"1.5rem",fontWeight:700,color:"#fff",letterSpacing:"-.02em",marginBottom:".5rem"}}>Code Examples</h2>
                    <p style={{fontSize:".85rem",color:"rgba(180,200,255,.55)",lineHeight:1.75,marginBottom:"1.2rem",fontWeight:300}}>Copy-paste these natural language commands into Noel Agent.</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:".75rem"}}>
                      {[
                        {label:"Swap",cmd:"swap 0.01 ETH to USDC",color:"#4d85ff"},
                        {label:"Analyze",cmd:"analyze BRETT — buy or sell? conviction 1-10",color:"#a78bfa"},
                        {label:"Deploy",cmd:"deploy token MOON symbol MOON supply 1000000000",color:"#c084fc"},
                        {label:"Trending",cmd:"show top 8 trending tokens on Base right now",color:"#f97316"},
                        {label:"Smart Money",cmd:"who are the top whale wallets for DEGEN?",color:"#fbbf24"},
                        {label:"Auto-Agent",cmd:"watch ETH — if price drops 5% in 1h, swap 0.05 ETH to USDC",color:"#22d3a5"},
                      ].map((ex,i)=>(
                        <div key={i} style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"9px",padding:".9rem 1rem",cursor:"pointer",transition:"all .2s"}}
                          onClick={()=>navigator.clipboard?.writeText(ex.cmd)}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=ex.color+"33";e.currentTarget.style.background="rgba(255,255,255,.04)";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.background="rgba(255,255,255,.02)";}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".5rem"}}>
                            <span style={{fontSize:".55rem",fontWeight:700,color:ex.color,background:ex.color+"15",border:`1px solid ${ex.color}25`,borderRadius:"4px",padding:".08rem .4rem",letterSpacing:".08em",textTransform:"uppercase"}}>{ex.label}</span>
                            <span style={{fontSize:".58rem",color:"rgba(255,255,255,.25)"}}>copy</span>
                          </div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".68rem",color:"rgba(180,210,255,.7)",lineHeight:1.5}}>{ex.cmd}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* What's next */}
                  <section style={{background:"linear-gradient(135deg,rgba(26,79,255,.06),rgba(100,50,255,.04))",border:"1px solid rgba(77,133,255,.15)",borderRadius:"14px",padding:"2rem"}}>
                    <h2 style={{fontSize:"1.3rem",fontWeight:700,color:"#fff",marginBottom:".5rem"}}>What's Next 🚀</h2>
                    <p style={{fontSize:".82rem",color:"rgba(180,200,255,.5)",lineHeight:1.75,marginBottom:"1.2rem",fontWeight:300}}>NoelClaw is actively being built. Upcoming features:</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:".6rem"}}>
                      {["Multi-chain support (Solana + Base)","Portfolio tracking dashboard","Telegram bot integration","On-chain analytics feed","DCA automation","NFT agent actions","Mobile app","SDK for developers"].map(item=>(
                        <div key={item} style={{display:"flex",alignItems:"center",gap:".6rem",fontSize:".75rem",color:"rgba(160,190,255,.6)",fontWeight:300}}>
                          <span style={{color:"#4d85ff",flexShrink:0}}>→</span>{item}
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {!art&&!newsArt&&page==="about"&&(
            <div className="page" style={{background:"#000",minHeight:"100vh"}}>

              {/* ── HERO ── */}
              <div style={{padding:"6rem 6vw 4rem",borderBottom:"1px solid rgba(255,255,255,.06)",position:"relative",overflow:"hidden",textAlign:"center"}}>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"60vw",height:"40vh",background:"radial-gradient(ellipse,rgba(26,79,255,.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
                <div style={{position:"relative",zIndex:1}}>
                  <div style={{width:"88px",height:"88px",borderRadius:"24px",overflow:"hidden",marginBottom:"1.5rem",border:"2px solid rgba(77,133,255,.35)",boxShadow:"0 0 50px rgba(26,79,255,.3)",margin:"0 auto 1.5rem",display:"block"}}>
                    <img src="/logo.png" alt="NoelClaw" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
                  <h1 style={{fontSize:"clamp(2.5rem,6vw,5rem)",fontWeight:800,color:"#fff",letterSpacing:"-.04em",lineHeight:.92,marginBottom:".8rem"}}>About NoelClaw</h1>
                  <p style={{fontSize:"1.05rem",color:"rgba(180,200,255,.55)",fontWeight:300,maxWidth:"540px",margin:"0 auto 2rem",lineHeight:1.75}}>
                    An AI agent platform on Base chain execute trades, deploy tokens, and analyze markets via natural language. Powered by Bankr API.
                  </p>
                  <div style={{display:"flex",gap:".75rem",justifyContent:"center",flexWrap:"wrap"}}>
                    <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:".5rem",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"50px",padding:".6rem 1.4rem",color:"rgba(220,235,255,.9)",fontSize:".78rem",fontWeight:500,textDecoration:"none",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.12)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.07)";}}>
                      𝕏 @noelclawfun
                    </a>
                    <a href="https://flaunch.gg/base/coin/0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3" target="_blank" rel="noopener noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:".5rem",background:"rgba(26,79,255,.15)",border:"1px solid rgba(77,133,255,.3)",borderRadius:"50px",padding:".6rem 1.4rem",color:"#4d85ff",fontSize:".78rem",fontWeight:500,textDecoration:"none",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(26,79,255,.25)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,79,255,.15)";}}>
                      Buy $NOELCLAW
                    </a>
                  </div>
                </div>
              </div>

              {/* ── 4 CARDS ── */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                {[
                  {n:"01",icon:"⚡",label:"What is NoelClaw?",text:"NoelClaw is a Bankr-powered AI agent platform running on Base chain. Execute real on-chain actions — swaps, limit orders, token deployments — all via natural language. No code. No manual txs. Just ask."},
                  {n:"02",icon:"🤖",label:"What is Bankr?",text:"Bankr is an AI crypto agent API that executes on-chain actions. NoelClaw integrates Bankr so you can type swap 0.1 ETH to USDC and it happens — for real, on Base chain. Every action is logged and traceable on-chain."},
                  {n:"03",icon:"🔧",label:"What can it do?",text:"Read: token prices, trending tokens, smart money wallets, trade activity. Execute: swap tokens, set limit orders, deploy new tokens, claim fees. Auto-agent: monitors market every 30s and executes autonomously."},
                  {n:"04",icon:null,label:"Get involved",text:"Built for the Bankr x Synthesis hackathon with a long-term vision — agents that analyze, decide, and operate autonomously across DeFi. Follow @noelclawfun and grab $NOELCLAW on Base."},
                ].map((s,i)=>(
                  <div key={i} style={{
                    padding:"2.5rem 3rem",
                    borderRight:i%2===0?"1px solid rgba(255,255,255,.06)":"none",
                    borderTop:i>=2?"1px solid rgba(255,255,255,.06)":"none",
                    transition:"background .2s",
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.02)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
                      <span style={{fontSize:"1.4rem"}}>{s.icon}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".65rem",color:"rgba(255,255,255,.07)",fontWeight:700}}>{s.n}</span>
                    </div>
                    <div style={{fontSize:".7rem",fontWeight:700,color:"rgba(140,180,255,.7)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:".7rem",fontFamily:"'IBM Plex Mono',monospace"}}>{s.label}</div>
                    <p style={{fontSize:".85rem",color:"rgba(180,200,255,.55)",lineHeight:1.85,fontWeight:300}}>{s.text}</p>
                  </div>
                ))}
              </div>
              <Reveal delay={0}>
              {/* ── ARCHITECTURE ── */}
              <div className="arch-section">
                <div className="arch-header">
                  <div className="arch-tag"><span className="arch-tag-ln"/>How it works</div>
                  <div className="arch-title">The NoelClaw Architecture</div>
                  <div className="arch-subtitle">A Bankr-powered AI agent platform running on Base chain — execute swaps, deploy tokens, and analyze markets via natural language.</div>
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
              <Reveal delay={0}>
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
              </Reveal>

              {/* ── PERSONAL AI NODE ── */}
              <Reveal delay={0}>
              <div className="node-section">
                <div className="node-inner">
                  <div className="node-left">
                    <div className="node-eyebrow">Noel Agent</div>
                    <div className="node-title">Run Bankr<br/>agents.</div>
                    <div className="node-desc">NoelClaw connects to Bankr API so you can execute real on-chain actions — swaps, token deployments, limit orders — all via natural language. No code. No manual transactions.</div>
                    <div className="node-pills">
                      {["Swap any token on Base via chat","Deploy tokens in one sentence","Set limit orders with natural language","Every action traceable on-chain"].map((t,i)=>(
                        <div className="node-pill" key={i}><div className="node-pill-dot"/><div className="node-pill-text">{t}</div></div>
                      ))}
                    </div>
                  </div>
                  <div className="node-right">
                    {[
                      {tag:"Bankr API",title:"Natural Language Trading",desc:"Type 'swap 0.1 ETH to USDC' and it executes. Bankr translates your intent into on-chain transactions on Base."},
                      {tag:"On-Chain",title:"Real Execution Engine",desc:"Not a simulator. Every swap, deploy, and limit order is a real transaction on Base chain — confirmed and traceable."},
                      {tag:"Philosophy",title:"Build in Public",desc:"Every agent action is logged, every trade is traceable, every decision is transparent. Built on Base chain with Bankr API."},
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
              </Reveal>

              </Reveal>
              <Reveal delay={0}>
              {/* ── USE CASES ── */}
              <div style={{padding:"4rem 3.5rem",borderBottom:"1px solid var(--border)"}}>
                <div style={{marginBottom:"2.5rem"}}>
                  <div style={{fontSize:".6rem",fontWeight:300,color:"var(--text2)",letterSpacing:".28em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:".6rem",marginBottom:"1rem"}}>
                    <span style={{width:"22px",height:"1px",background:"rgba(255,255,255,.2)",display:"inline-block"}}/>
                    Real use cases
                  </div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:"clamp(1.4rem,2.5vw,2rem)",fontWeight:100,color:"var(--white)",letterSpacing:"-.01em",lineHeight:1.1,marginBottom:".7rem"}}>What Bankr agent can do.</div>
                  <div style={{fontSize:".85rem",color:"var(--text2)",fontWeight:200,maxWidth:"480px",lineHeight:1.7}}>Real on-chain actions via natural language. Swap, deploy, analyze, set orders — powered by Bankr on Base.</div>
                </div>
                <UseCaseShowcase/>
              </div>

              <Reveal delay={0}>
              {/* ── CLI INSTALL SECTION — ala True Markets ── */}
              <div style={{padding:"5rem 3.5rem",borderBottom:"1px solid var(--border)",position:"relative",overflow:"hidden",textAlign:"center"}}>
                {/* BG glow */}
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"600px",height:"300px",background:"radial-gradient(ellipse,rgba(26,79,255,.06) 0%,transparent 70%)",pointerEvents:"none"}}/>

                <div style={{position:"relative",zIndex:1,maxWidth:"680px",margin:"0 auto"}}>
                  {/* Eyebrow */}
                  <div style={{display:"inline-flex",alignItems:"center",gap:".5rem",background:"rgba(26,79,255,.1)",border:"1px solid rgba(77,133,255,.2)",borderRadius:"20px",padding:".3rem .9rem",fontSize:".58rem",color:"rgba(140,180,255,.8)",letterSpacing:".2em",textTransform:"uppercase",marginBottom:"1.8rem",fontFamily:"'IBM Plex Mono',monospace"}}>
                    <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4d85ff",animation:"pulse 2s infinite",display:"inline-block"}}/>
                    Now in Beta
                  </div>

                  {/* Headline */}
                  <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:"clamp(2rem,5vw,3.8rem)",fontWeight:100,color:"#fff",lineHeight:1.05,letterSpacing:"-.03em",marginBottom:".8rem"}}>
                    Let your Agent <em style={{fontStyle:"normal",color:"rgba(100,160,255,.9)"}}>trade crypto</em><br/>
                    right from the chat.
                  </h2>
                  <p style={{fontSize:"1rem",color:"rgba(180,200,255,.5)",fontWeight:300,lineHeight:1.7,marginBottom:"2.5rem"}}>
                    Natural language to on-chain execution. Any token on Base — no code, no manual txs, no bridge fees.
                  </p>

                  {/* Install tabs */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",overflow:"hidden",marginBottom:"1.5rem",textAlign:"left"}}>
                    <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
                      {[["Chat Agent","⚡"],["CLI Terminal","$_"],["Auto Agent","🤖"]].map(([label,icon],i)=>(
                        <div key={i} style={{padding:".55rem 1.2rem",fontSize:".68rem",color:i===0?"#4d85ff":"rgba(180,200,255,.4)",fontFamily:"'IBM Plex Mono',monospace",borderBottom:i===0?"2px solid #4d85ff":"2px solid transparent",cursor:"default",userSelect:"none",display:"flex",alignItems:"center",gap:".4rem"}}>
                          <span>{icon}</span>{label}
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"1.2rem 1.4rem"}}>
                      <div style={{fontSize:".58rem",color:"rgba(180,200,255,.35)",letterSpacing:".15em",textTransform:"uppercase",marginBottom:".6rem",fontFamily:"'IBM Plex Mono',monospace"}}>Try it in Noel Agent</div>
                      <div style={{display:"flex",alignItems:"center",gap:".8rem",background:"#020508",border:"1px solid rgba(77,133,255,.15)",borderRadius:"8px",padding:".6rem 1rem"}}>
                        <span style={{color:"rgba(77,133,255,.5)",fontFamily:"'IBM Plex Mono',monospace",fontSize:".75rem",flexShrink:0}}>{">"}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".78rem",color:"rgba(200,220,255,.85)",flex:1}}>
                          <span style={{color:"#4d85ff"}}>analyze</span> BRETT <span style={{color:"rgba(180,200,255,.4)"}}>— should I buy?</span>
                        </span>
                        <button onClick={()=>{navigator.clipboard?.writeText('analyze BRETT — should I buy?')}}
                          style={{background:"none",border:"1px solid rgba(77,133,255,.2)",borderRadius:"5px",padding:".2rem .5rem",color:"rgba(77,133,255,.5)",fontSize:".6rem",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",transition:"all .2s",flexShrink:0}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(77,133,255,.5)";e.currentTarget.style.color="#4d85ff";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(77,133,255,.2)";e.currentTarget.style.color="rgba(77,133,255,.5)";}}>
                          copy
                        </button>
                      </div>
                      <div style={{marginTop:".6rem",display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                        {["swap 0.01 ETH USDC","price DEGEN","trending","balance","deploy MyToken MYT"].map(cmd=>(
                          <span key={cmd} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:".62rem",color:"rgba(140,180,255,.45)",background:"rgba(26,79,255,.06)",border:"1px solid rgba(77,133,255,.1)",borderRadius:"5px",padding:".15rem .5rem",cursor:"pointer",transition:"all .15s"}}
                            onMouseEnter={e=>{e.currentTarget.style.color="rgba(140,180,255,.8)";e.currentTarget.style.borderColor="rgba(77,133,255,.25)";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="rgba(140,180,255,.45)";e.currentTarget.style.borderColor="rgba(77,133,255,.1)";}}>
                            {cmd}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div style={{display:"flex",gap:".75rem",justifyContent:"center",flexWrap:"wrap"}}>
                    <button style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"50px",padding:".7rem 1.8rem",color:"#fff",fontSize:".78rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,display:"flex",alignItems:"center",gap:".5rem",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.12)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.07)";}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                      View on GitHub
                    </button>
                    <a href="https://x.com/noelclawfun" target="_blank" rel="noopener noreferrer"
                      style={{background:"rgba(77,133,255,.15)",border:"1px solid rgba(77,133,255,.35)",borderRadius:"50px",padding:".7rem 1.8rem",color:"#4d85ff",fontSize:".78rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,display:"flex",alignItems:"center",gap:".5rem",textDecoration:"none",transition:"all .2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(77,133,255,.22)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(77,133,255,.15)";}}>
                      𝕏 Follow Updates
                    </a>
                  </div>
                  <p style={{marginTop:"1.2rem",fontSize:".65rem",color:"rgba(180,200,255,.3)",fontFamily:"'IBM Plex Mono',monospace"}}>
                    Works with any wallet · Built on Base · Powered by Bankr API
                  </p>
                </div>
              </div>
              </Reveal>

              <Reveal delay={0}>
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
                    {name:"Bankr",    logo:"https://bankr.bot/favicon.ico"},
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
              </Reveal>
              </Reveal>
            </div>
          )}

        </div>

        {!newsArt&&(
        <>{/* FOOTER */}
        <footer className="footer">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={LOGO} className="footer-logo-icon" alt=""/>
                <span><span style={{color:"var(--blue-hi)"}}>Noel</span>Claw</span>
              </div>
              <p className="footer-desc">AI agent platform on Base chain — run agents, execute trades, deploy tokens via natural language. Powered by Bankr API.</p>
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
                {["Noel Agent","How It Works","About","Docs"].map(l=>(
                  <button key={l} className="footer-link btn-style" onClick={()=>navTo(l==="Noel Agent"?"articles":l.toLowerCase())}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Resources</div>
              <div className="footer-links">
                {["Getting Started","Bankr API Docs","Agent Examples","Base Chain Guide"].map(l=>(
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
        </>
        )}

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