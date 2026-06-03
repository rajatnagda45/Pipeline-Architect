/**
 * LandingPage.js — Premium landing page for Pipeline Architect.
 * Uses Framer Motion for animations (Three.js omitted: R3F v9 requires React 19).
 * Supports dark / light mode via ThemeContext.
 */

import { useRef, useEffect, useState, useCallback, useMemo, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  motion, useScroll, useTransform, useMotionValue, useMotionTemplate,
  useInView, AnimatePresence, useMotionValueEvent,
} from 'framer-motion';
import {
  LogIn, Filter, Brain, Zap, Code, CheckCircle2, Sparkles, Lock,
  Network, Blocks, Variable, ShieldCheck, Cpu, FileText, Calculator,
  Clock, StickyNote, LogOut, Play, Sun, Moon,
} from 'lucide-react';

// ── Theme context ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

function mkTokens(dark) {
  const fg    = dark ? '#ffffff'       : '#0f1009';
  const fgRgb = dark ? '255,255,255'   : '15,16,9';
  const a = (o) => `rgba(${fgRgb},${o})`;
  return {
    // surfaces
    bg:       dark ? '#050505'  : '#f5f6f0',
    surface:  dark ? '#0a0a08'  : '#ffffff',
    surface2: dark ? '#11120f'  : '#eff1e8',
    surface3: dark ? '#12120e'  : '#e9ece2',
    border:   dark ? '#2c3322'  : '#c8cdb8',
    borderL:  dark ? '#3e4732'  : '#b0b89e',
    // special surfaces
    nodeHead:    dark ? '#1a1d16'  : '#e2e6d6',
    nodeBg:      dark ? '#1C1D18'  : '#eceee6',
    nodeInner:   dark ? '#141512'  : '#dde0d3',
    badge:       dark ? `rgba(5,5,5,0.5)`           : `rgba(245,246,240,0.85)`,
    navScrollBg: dark ? 'rgba(10,10,8,0.92)'         : 'rgba(245,246,240,0.95)',
    navScrollBd: dark ? 'rgba(44,51,34,0.5)'         : 'rgba(200,205,184,0.7)',
    terminal:    dark ? 'rgba(10,10,8,0.9)'          : 'rgba(240,242,234,0.95)',
    terminalBd:  dark ? 'rgba(255,255,255,0.1)'      : 'rgba(15,16,9,0.12)',
    hexFill:     dark ? '#0a0a08' : '#ffffff',
    dotGrid:     dark ? '#2c3322' : '#c0c5ae',
    // accents (same in both modes)
    pink:   '#E83A82',
    green:  '#4ade80',
    purple: '#c084fc',
    cyan:   '#38bdf8',
    yellow: '#facc15',
    red:    '#ef4444',
    // text
    fg,
    muted: a(0.5),
    // alpha scale
    fg03: a(0.03), fg05: a(0.05), fg08: a(0.08), fg10: a(0.1),
    fg15: a(0.15), fg20: a(0.2),  fg25: a(0.25), fg30: a(0.3),
    fg35: a(0.35), fg40: a(0.4),  fg45: a(0.45), fg50: a(0.5),
    fg55: a(0.55), fg60: a(0.6),  fg65: a(0.65), fg70: a(0.7),
    fg75: a(0.75), fg80: a(0.8),  fg85: a(0.85), fg90: a(0.9),
    fg92: a(0.92), fg95: a(0.95),
    // fonts
    fontSans: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontHead: "'Outfit', 'Inter', sans-serif",
  };
}

// ── Body overflow fix ─────────────────────────────────────────────────────────
function useLandingSetup() {
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height   = 'auto';
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.body.style.overflow = 'hidden';
      document.body.style.height   = '100%';
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
}

// ── Typing text ───────────────────────────────────────────────────────────────
function TypingText({ text }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => { setDisplayed(text.substring(0, i)); i++; if (i > text.length) clearInterval(iv); }, 50);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}</span>;
}

// ── CSS Particle field ────────────────────────────────────────────────────────
function ParticleField({ count = 60 }) {
  const C = mkTokens(useTheme().dark);
  const colors = [C.pink, C.green, C.purple, C.cyan, C.yellow];
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: Math.random() * 8 + 6, delay: Math.random() * 5,
    dx: (Math.random() - .5) * 20, dy: (Math.random() - .5) * 15,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: '50%', background: p.color, left: `${p.x}%`, top: `${p.y}%`, boxShadow: `0 0 ${p.size * 3}px ${p.color}` }}
          animate={{ x: [0, p.dx, 0], y: [0, p.dy, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

// ── Hexagon node icon ─────────────────────────────────────────────────────────
function HexIcon({ icon: Icon, color }) {
  const C = mkTokens(useTheme().dark);
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <motion.div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, filter: 'blur(12px)', zIndex: 0 }}
        animate={{ opacity: [0.1, 0.35, 0.1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
          <polygon points="50 3,93 25,93 75,50 97,7 75,7 25" fill={C.hexFill} stroke={color} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

// ── Flowing data line ─────────────────────────────────────────────────────────
function FlowLine({ c1, c2 }) {
  const { dark } = useTheme();
  return (
    <div style={{ flex: 1, height: 2, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', minWidth: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,${c1},${c2})`, opacity: 0.2 }} />
      {[0, 0.4, 0.8].map((d, i) => (
        <motion.div key={i}
          style={{ position: 'absolute', width: i===0?10:i===1?6:4, height: i===0?6:4, borderRadius: '50%', background: dark ? '#fff' : '#0f1009', boxShadow: `0 0 12px ${dark?'#fff':'#0f1009'}`, zIndex: 1 }}
          initial={{ left: '-10%' }} animate={{ left: '110%' }}
          transition={{ duration: 1.2, delay: d, repeat: Infinity, ease: 'linear' }} />
      ))}
    </div>
  );
}

// ── SECTION: Navbar ───────────────────────────────────────────────────────────
function Navbar() {
  const { dark, toggle } = useTheme();
  const C = mkTokens(dark);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 50));
  const bg = useTransform(scrollY, [0, 50], [dark ? 'rgba(5,5,5,0)' : 'rgba(245,246,240,0)', scrolled ? C.navScrollBg : 'transparent']);
  const bc = useTransform(scrollY, [0, 50], ['rgba(255,255,255,0)', C.navScrollBd]);

  return (
    <motion.nav style={{ backgroundColor: bg, borderBottomColor: bc, position: 'fixed', top: 0, width: '100%', zIndex: 100, borderBottomWidth: 1, borderBottomStyle: 'solid', backdropFilter: scrolled ? 'blur(12px)' : 'none' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: `${scrolled?16:24}px 32px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'padding 0.3s' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: `1px solid ${C.pink}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: C.fontMono, color: C.pink, fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>PA</span>
          </div>
          <div>
            <div style={{ fontFamily: C.fontHead, fontWeight: 800, fontSize: 15, letterSpacing: 1, color: C.fg, lineHeight: 1 }}>PIPELINE ARCHITECT</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.fg40, letterSpacing: 3, marginTop: 3 }}>A visual DAG composer for AI workflows</div>
          </div>
        </div>

        {/* Nav anchors */}
        <nav style={{ display: 'flex', gap: 32 }}>
          {[['How it works','#features'],['Node types','#node-types'],['Stack','#stack']].map(([label, href]) => (
            <NavLink key={label} href={href}>{label}</NavLink>
          ))}
        </nav>

        {/* Right: theme toggle + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={toggle}
            style={{ width: 36, height: 36, borderRadius: 2, background: C.surface2, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.pink; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
            aria-label="Toggle theme">
            {dark ? <Sun size={15} color={C.fg60} /> : <Moon size={15} color={C.fg60} />}
          </button>
          <Link to="/app"
            style={{ background: C.pink, color: '#fff', fontFamily: C.fontMono, fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', padding: '10px 22px', borderRadius: 2, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.pink}`, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#ff5ca6'; e.currentTarget.style.boxShadow=`0 0 18px ${C.pink}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background=C.pink; e.currentTarget.style.boxShadow='none'; }}>
            Open Editor →
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children }) {
  const C = mkTokens(useTheme().dark);
  const [hov, setHov] = useState(false);
  return (
    <a href={href} style={{ fontFamily: C.fontSans, fontSize: 13, fontWeight: 700, color: hov ? C.pink : C.fg, textDecoration: 'none', transition: 'color 0.2s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</a>
  );
}

// ── SECTION: Hero ─────────────────────────────────────────────────────────────
function HeroSection() {
  const C = mkTokens(useTheme().dark);
  return (
    <section style={{ position: 'relative', minHeight: '110vh', background: C.bg, paddingTop: 160, paddingBottom: 80, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid ${C.fg08}` }}>

      <div style={{ position: 'absolute', inset: 0, opacity: 0.25, backgroundImage: `radial-gradient(circle at center, ${C.dotGrid} 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 100, height: 2, background: `linear-gradient(90deg,transparent,${C.pink},transparent)`, transform: 'rotate(-45deg)', opacity: 0.6, boxShadow: `0 0 15px ${C.pink}` }} />
      <div style={{ position: 'absolute', top: '30%', right: '10%', width: 150, height: 2, background: `linear-gradient(90deg,transparent,${C.green},transparent)`, transform: 'rotate(-45deg)', opacity: 0.5, boxShadow: `0 0 15px ${C.green}` }} />
      <div style={{ position: 'absolute', top: '15%', right: '25%', width: 80, height: 2, background: 'linear-gradient(90deg,transparent,#f97316,transparent)', transform: 'rotate(-45deg)', opacity: 0.6, boxShadow: '0 0 15px #f97316' }} />

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: `linear-gradient(to top, ${C.bg} 0%, transparent 100%)`, pointerEvents: 'none', zIndex: 1 }} />

      <ParticleField count={80} />

      <motion.div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: `radial-gradient(circle, ${C.pink}08 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }}
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>

        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 24px', borderRadius: 40, background: C.badge, backdropFilter: 'blur(12px)', border: `1px solid rgba(232,58,130,0.3)`, boxShadow: '0 0 20px rgba(232,58,130,0.15)', marginBottom: 48 }}>
          <motion.span animate={{ opacity:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: C.pink, boxShadow: `0 0 8px ${C.pink}`, display: 'inline-block' }} />
          <span style={{ fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, color: C.fg, letterSpacing: '0.2em' }}>A visual DAG composer for AI workflows</span>
        </motion.div>

        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:1, delay:0.1, ease:[0.16,1,0.3,1] }}
          style={{ position: 'relative', display: 'inline-block', marginBottom: 40, width: '100%' }}>
          {[{t:-24,l:0,bTop:true,bLeft:true},{t:-24,r:0,bTop:true,bRight:true},{b:-24,l:0,bBot:true,bLeft:true},{b:-24,r:0,bBot:true,bRight:true}].map((s,i) => (
            <div key={i} style={{ position:'absolute', width:24, height:24, ...(s.t!==undefined?{top:s.t}:{}), ...(s.b!==undefined?{bottom:s.b}:{}), ...(s.l!==undefined?{left:s.l}:{}), ...(s.r!==undefined?{right:s.r}:{}), ...(s.bTop?{borderTop:`1px solid ${C.fg30}`}:{}), ...(s.bBot?{borderBottom:`1px solid ${C.fg30}`}:{}), ...(s.bLeft?{borderLeft:`1px solid ${C.fg30}`}:{}), ...(s.bRight?{borderRight:`1px solid ${C.fg30}`}:{}) }} />
          ))}
          {[[{top:-8,left:-48}],[{top:-8,right:-48}],[{bottom:-8,left:-48}],[{bottom:-8,right:-48}]].map((pos,i) => (
            <div key={i} style={{ position:'absolute', ...pos[0], color:'rgba(232,58,130,0.6)', fontFamily:C.fontMono, fontSize:18, pointerEvents:'none', userSelect:'none' }}>⌖</div>
          ))}
          <h1 style={{ fontFamily: C.fontHead, fontSize: 'clamp(72px,12vw,160px)', fontWeight: 900, color: C.fg, lineHeight: 0.95, letterSpacing: '-0.05em' }}>
            Wire<br/><span style={{ color: 'transparent', WebkitTextStroke: `2px ${C.pink}`, textShadow: `0 0 60px ${C.pink}66, 0 0 120px ${C.pink}33` }}>Everything.</span>
          </h1>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.2 }}
          style={{ marginBottom: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/app" style={{ background: C.pink, color: '#fff', fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', padding: '14px 32px', borderRadius: 2, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.pink}`, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#ff5ca6'; e.currentTarget.style.boxShadow=`0 0 24px ${C.pink}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background=C.pink; e.currentTarget.style.boxShadow='none'; }}>
            Open Editor →
          </Link>
          <a href="#features" style={{ background: 'transparent', color: C.fg70, fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', padding: '14px 32px', borderRadius: 2, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.border}`, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.fg35; e.currentTarget.style.color=C.fg; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.fg70; }}>
            How it works ↓
          </a>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.3 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 720, margin: '0 auto 80px', padding: '0 32px', gap: 8 }}>
          <HexIcon icon={LogIn}   color={C.pink}   />
          <FlowLine c1={C.pink}   c2={C.green}  />
          <HexIcon icon={Filter}  color={C.green}  />
          <FlowLine c1={C.green}  c2={C.purple} />
          <HexIcon icon={Brain}   color={C.purple} />
          <FlowLine c1={C.purple} c2={C.yellow} />
          <HexIcon icon={Zap}     color={C.yellow} />
          <FlowLine c1={C.yellow} c2={C.red}    />
          <HexIcon icon={Code}    color={C.red}    />
        </motion.div>

        <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.4 }}
          style={{ fontFamily: C.fontMono, fontSize: 15, color: C.fg65, maxWidth: 640, margin: '0 auto 48px', lineHeight: 1.8 }}>
          Pipeline Architect is a frontend for composing AI workflows visually. Each node is a step — an input, a model call, a transformation, an output — and edges define how data flows between them. The editor validates your pipeline's structure in real time and submits the graph to a FastAPI backend that confirms it's a valid directed acyclic graph before any execution is attempted. Built as a config-driven system: adding a new node type is a single config object, not a new component.
        </motion.p>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.5 }}
          style={{ width: '100%', maxWidth: 680, margin: '0 auto 40px' }}>
          <div style={{ background: C.terminal, backdropFilter: 'blur(12px)', border: `1px solid ${C.terminalBd}`, borderRadius: 4, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: C.fontMono, fontSize: 14, color: C.fg80 }}>
              <span style={{ color: C.fg40 }}>{'>'}</span>
              <TypingText text="Initializing pipeline environment..." />
              <motion.span animate={{ opacity:[1,0] }} transition={{ duration:0.8, repeat:Infinity }} style={{ width: 8, height: 16, background: C.fg60, display: 'inline-block', marginLeft: 4 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 2 }}>
              <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.5, repeat:Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, boxShadow: `0 0 8px ${C.red}` }} />
              <span style={{ fontFamily: C.fontMono, fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: 3 }}>LIVE</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.6 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[[CheckCircle2,'System Online'],[Sparkles,'Nodes Active'],[Lock,'Secure'],[Zap,'Real-time Execution']].map(([Icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color={C.fg40} />
              <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.fg50, letterSpacing: 2 }}>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── SECTION: App Mockup ───────────────────────────────────────────────────────
function MockupSection() {
  const C = mkTokens(useTheme().dark);

  const SidebarItem = ({ icon: Icon, label, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface2, cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background=C.surface3}
      onMouseLeave={e => e.currentTarget.style.background=C.surface2}>
      <Icon size={16} color={color} />
      <span style={{ fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, color: C.fg80, textTransform: 'uppercase', letterSpacing: 3 }}>{label}</span>
    </div>
  );

  return (
    <section style={{ position: 'relative', background: C.bg, paddingBottom: 128 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ width: '100%', height: 750, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 30px 100px -20px rgba(0,0,0,0.4)', display: 'flex' }}>

          <div style={{ width: 256, borderRight: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
            <div style={{ padding: '20px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
              <span style={{ fontFamily: C.fontMono, fontSize: 14, fontWeight: 700, color: C.fg, letterSpacing: 4, textTransform: 'uppercase' }}>Components</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SidebarItem icon={LogIn}      label="Input"    color={C.pink}    />
              <SidebarItem icon={Cpu}        label="LLM"      color={C.purple}  />
              <SidebarItem icon={FileText}   label="Text"     color={C.green}   />
              <SidebarItem icon={Filter}     label="Filter"   color={C.yellow}  />
              <SidebarItem icon={Calculator} label="Math"     color="#60a5fa"   />
              <SidebarItem icon={Clock}      label="Delay"    color="#f97316"   />
              <SidebarItem icon={StickyNote} label="Note"     color="#fef08a"   />
              <SidebarItem icon={LogOut}     label="Output"   color={C.fg}      />
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', background: C.surface, overflow: 'hidden', backgroundImage: `radial-gradient(${C.dotGrid} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 64, borderBottom: `1px solid ${C.border}`, background: C.surface2, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 30 }}>
              <span style={{ fontFamily: C.fontMono, fontSize: 14, color: C.fg50, letterSpacing: 3 }}>Pipeline / Main Flow</span>
              <Link to="/app" style={{ background: C.pink, color: '#fff', fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, padding: '8px 24px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 2, textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='#ff5ca6'}
                onMouseLeave={e => e.currentTarget.style.background=C.pink}>
                <Play size={14} /> Open Editor
              </Link>
            </div>

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
              <path d="M 280 200 C 350 200, 350 350, 420 350" fill="none" stroke={C.border} strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 620 350 C 690 350, 690 250, 790 250" fill="none" stroke={C.border} strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            <div style={{ position: 'absolute', inset: 0, paddingTop: 64, zIndex: 20 }}>
              <MockupNode top={80}  left={60}  title="Input"  accent={C.pink}   icon={LogIn}  handleRight fields={[{ label:'prompt_text' },{ label:'user_id' }]} />
              <MockupNode top={230} left={420} title="Text"   accent={C.purple} icon={FileText} handleLeft handleRight textarea={'You are helpful.\nAnswer: {{prompt_text}}'} />
              <MockupNode top={130} left={790} title="LLM"    accent={C.green}  icon={Cpu}    handleLeft model="GPT-4-Turbo" temp="0.7" />
            </div>

            <div style={{ position: 'absolute', bottom: 24, left: 24, width: 160, height: 128, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 8, zIndex: 30 }}>
              <div style={{ width: '100%', height: '100%', border: `1px solid ${C.border}`, background: C.surface2, position: 'relative' }}>
                {[[C.pink,'10%','10%'],[C.purple,'40%','40%'],[C.green,'20%','70%']].map(([c,t,l],i) => (
                  <div key={i} style={{ position: 'absolute', width: '15%', height: '20%', background: `${c}44`, border: `1px solid ${c}88`, top: t, left: l, borderRadius: 2 }} />
                ))}
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 30 }}>
              {['+','-'].map(s => (
                <button key={s} style={{ width: 32, height: 32, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, color: C.fg70, cursor: 'pointer', fontFamily: C.fontMono, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockupNode({ top, left, title, accent, icon: Icon, handleLeft, handleRight, fields, textarea, model, temp }) {
  const C = mkTokens(useTheme().dark);
  return (
    <motion.div style={{ position: 'absolute', top, left, width: title === 'LLM' ? 256 : 224, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 10 }}
      whileHover={{ y: -2, boxShadow: `0 10px 30px -10px ${accent}44` }}>
      {handleLeft  && <div style={{ position:'absolute', left:-6,  top:'50%', transform:'translateY(-50%)', width:12, height:12, borderRadius:'50%', background:C.fg30, border:`2px solid ${C.surface2}` }} />}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderBottom:`1px solid ${C.border}`, background:C.nodeHead }}>
        <div style={{ width:24, height:24, borderRadius:4, background:C.border, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={14} color={accent} /></div>
        <span style={{ fontFamily:C.fontMono, fontSize:12, fontWeight:700, color:C.fg, textTransform:'uppercase', letterSpacing:3 }}>{title}</span>
      </div>
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        {fields && fields.map(f => (
          <div key={f.label} style={{ height:24, width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:3, fontSize:10, color:C.fg50, padding:'0 8px', display:'flex', alignItems:'center', fontFamily:C.fontMono }}>{f.label}</div>
        ))}
        {textarea && <div style={{ width:'100%', height:64, background:C.surface, border:`1px solid ${C.border}`, borderRadius:3, fontSize:10, color:C.fg50, padding:8, fontFamily:C.fontMono, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{textarea}</div>}
        {model && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.fg50 }}>Model:</span>
              <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.green }}>{model}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.fg50 }}>Temperature:</span>
              <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.fg }}>{temp}</span>
            </div>
            <div style={{ width:'100%', height:6, background:C.surface, borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:'70%', height:'100%', background:C.green }} />
            </div>
          </>
        )}
      </div>
      {handleRight && <div style={{ position:'absolute', right:-6, top:'50%', transform:'translateY(-50%)', width:12, height:12, borderRadius:'50%', background:accent, border:`2px solid ${C.surface2}` }} />}
    </motion.div>
  );
}

// ── SECTION: Logo Ticker ──────────────────────────────────────────────────────
function LogoTicker() {
  const C = mkTokens(useTheme().dark);
  const logos = [
    { name:'React', icon:'⚛' },{ name:'ReactFlow', icon:'◈' },{ name:'FastAPI', icon:'⚡' },
    { name:'Zustand', icon:'◉' },{ name:'Python', icon:'🐍' },{ name:'Framer Motion', icon:'◐' },{ name:'Lucide', icon:'✦' },
  ];
  return (
    <section style={{ padding: '48px 0', borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden', background: C.surface }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,${C.surface},transparent,${C.surface})`, zIndex: 10, pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontFamily: C.fontMono, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.fg40 }}>Built with</span>
      </div>
      <div style={{ overflow: 'hidden', display: 'flex' }}>
        <motion.div style={{ display: 'flex', whiteSpace: 'nowrap', gap: 96, padding: '0 48px', alignItems: 'center' }}
          animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
          {[...logos, ...logos].map((l, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, color:C.fg40, transition:'color 0.3s', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.color=C.fg80}
              onMouseLeave={e=>e.currentTarget.style.color=C.fg40}>
              <span style={{ fontSize:20 }}>{l.icon}</span>
              <span style={{ fontFamily:C.fontHead, fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>{l.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── SECTION: Features Grid ────────────────────────────────────────────────────
function FeaturesGrid() {
  const C = mkTokens(useTheme().dark);
  const features = [
    { icon: <Blocks size={24} color={C.pink} />, marker:'◢', title:'Config-driven node abstraction', color:C.pink,
      desc:'Every node — Input, LLM, Text, Output, Filter, Math, API, Delay, Note — is declared as data, not duplicated as code. A single BaseNode interprets the config and renders the title, fields, and handles. Adding a tenth node type takes about ten lines.' },
    { icon: <Variable size={24} color={C.green} />, marker:'◢', title:'Live template variables', color:C.green,
      desc:'The Text node parses {{ variable }} syntax in real time. Every valid variable becomes a connectable input handle on the left side of the node. Type a template, get the wire-in points for free. Delete a variable, the handle vanishes.' },
    { icon: <ShieldCheck size={24} color={C.cyan} />, marker:'◢', title:'DAG validation on submit', color:C.cyan,
      desc:"Click Submit and the pipeline is parsed by a FastAPI backend that runs Kahn's algorithm on the node-edge graph. The response — node count, edge count, and DAG validity — is returned in under a second. Cycles are caught before they reach execution." },
  ];
  return (
    <section id="features" style={{ padding: '128px 0', position: 'relative', background: C.bg, zIndex: 20 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-100px' }} transition={{ duration:0.8 }}
          style={{ maxWidth:560, margin:'0 0 80px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6H20M4 12H20M4 18H20" stroke={C.pink} strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.pink, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700 }}>How it works</span>
          </div>
          <h2 style={{ fontFamily:C.fontHead, fontSize:'clamp(28px,3.5vw,44px)', fontWeight:700, color:C.fg, lineHeight:1.1, margin:0 }}>
            Three things that make it work.
          </h2>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:2 }}>
          {features.map((f,i) => <FeatureCard key={i} feature={f} i={i} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, i }) {
  const C = mkTokens(useTheme().dark);
  const ref = useRef(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const [hov, setHov] = useState(false);
  const onMove = useCallback(e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(e.clientX - r.left); my.set(e.clientY - r.top);
  }, [mx, my]);
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-50px' }} transition={{ duration:0.6, delay:i*.1 }}
      whileHover={{ y:-4 }} onMouseMove={onMove} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:'relative', padding:32, background:C.surface3, border:`1px solid ${C.border}`, overflow:'hidden', cursor:'pointer' }}>
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:150, background:`linear-gradient(to bottom,${feature.color}15,transparent)`, opacity:hov?1:0, transition:'opacity 0.5s', pointerEvents:'none' }} />
      <motion.div style={{ position:'absolute', inset:-1, opacity:hov?1:0, background:useMotionTemplate`radial-gradient(300px circle at ${mx}px ${my}px,${C.fg03},transparent 80%)`, transition:'opacity 0.3s', pointerEvents:'none' }} />
      <div style={{ position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <motion.div whileHover={{ scale:1.05 }} style={{ width:44, height:44, background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {feature.icon}
          </motion.div>
          <span style={{ fontFamily:C.fontMono, fontSize:11, color:feature.color, fontWeight:700, letterSpacing:'0.15em' }}>{feature.marker}</span>
        </div>
        <h3 style={{ fontFamily:C.fontMono, fontSize:15, fontWeight:700, color:C.fg92, marginBottom:16, lineHeight:1.3 }}>{feature.title}</h3>
        <p style={{ fontFamily:C.fontMono, fontSize:13, color:C.fg55, lineHeight:1.75, margin:0 }}>{feature.desc}</p>
      </div>
    </motion.div>
  );
}

// ── SECTION: Metrics ──────────────────────────────────────────────────────────
const METRICS = [
  { label:'9',       subLabel:'NODE TYPES',        desc:'Input · LLM · Text · Filter · Math · API · Delay · Note · Output',             color:'pink'   },
  { label:'1',       subLabel:'BASENODE COMPONENT', desc:'Every node renders through BaseNode. Config objects drive the entire library.', color:'cyan'   },
  { label:'O(V+E)',  subLabel:'DAG VALIDATION',     desc:"Kahn's algorithm — iterative topological sort, no recursion-limit risk.",       color:'green'  },
  { label:'< 100ms', subLabel:'AVG PARSE LATENCY',  desc:'Submit parses the graph, validates acyclicity, and returns results in one response.', color:'yellow' },
];

function Metrics() {
  const C = mkTokens(useTheme().dark);
  return (
    <section style={{ padding:'128px 0', position:'relative', overflow:'hidden', background:C.surface }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60%', height:'40%', background:`${C.pink}0d`, filter:'blur(120px)', borderRadius:'100%', pointerEvents:'none' }} />
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:48, textAlign:'center' }}>
          {METRICS.map((m,i) => (
            <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-50px' }} transition={{ duration:0.6, delay:i*.1 }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <span style={{ fontFamily:C.fontMono, fontSize:'clamp(36px,4vw,56px)', fontWeight:700, color:C[m.color], letterSpacing:'-0.03em', lineHeight:1.1 }}>{m.label}</span>
              <h4 style={{ fontFamily:C.fontMono, fontWeight:700, color:C.fg, margin:'12px 0 8px', textTransform:'uppercase', fontSize:12, letterSpacing:'0.15em' }}>{m.subLabel}</h4>
              <p style={{ fontFamily:C.fontMono, fontSize:13, color:C.muted, maxWidth:200, lineHeight:1.6, margin:0 }}>{m.desc}</p>
              <motion.div style={{ height:2, width:'100%', maxWidth:150, marginTop:24, originX:0.5, background:`linear-gradient(90deg,transparent,${C[m.color]},transparent)`, opacity:0.5 }}
                initial={{ scaleX:0 }} whileInView={{ scaleX:1 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.3+i*.1 }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SECTION: Node Types Table ─────────────────────────────────────────────────
function NodeTypesTable() {
  const C = mkTokens(useTheme().dark);
  const rows = [
    { category: 'Core',      nodes: ['Input', 'LLM', 'Text', 'Output'] },
    { category: 'Utilities', nodes: ['Filter', 'Math', 'API', 'Delay', 'Note'] },
  ];
  return (
    <section id="node-types" style={{ background: C.surface, padding: '80px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-80px' }} transition={{ duration:0.7 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.pink, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Built-in node types</div>
            <h2 style={{ fontFamily: C.fontHead, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: C.fg, lineHeight: 1.15, margin: '0 0 16px' }}>
              Nine types ship by default.
            </h2>
            <p style={{ fontFamily: C.fontMono, fontSize: 13, color: C.fg50, lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
              The abstraction makes a tenth trivial to add — one config object in <code style={{ color: C.cyan, background: `${C.cyan}15`, padding: '1px 5px', borderRadius: 2 }}>nodeConfigs.js</code>, no new component.
            </p>
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.fg40, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 16px' }}>Category</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.fg40, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 16px', borderLeft: `1px solid ${C.border}` }}>Nodes</div>
            </div>
            {rows.map((row, i) => (
              <div key={row.category} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.fg70, padding: '14px 16px', fontWeight: 700 }}>{row.category}</div>
                <div style={{ padding: '14px 16px', borderLeft: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                  {row.nodes.map((n, j) => (
                    <span key={n} style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>
                      {n}{j < row.nodes.length - 1 && <span style={{ color: C.border, marginLeft: 12 }}>·</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── SECTION: Tech Specs Strip ─────────────────────────────────────────────────
function TechSpecsStrip() {
  const C = mkTokens(useTheme().dark);
  const specs = [
    { label: 'FRONTEND',   value: 'React · ReactFlow · Zustand'  },
    { label: 'BACKEND',    value: 'Python · FastAPI · Uvicorn'   },
    { label: 'VALIDATION', value: "Kahn's algorithm · O(V+E)"    },
    { label: 'TRANSPORT',  value: 'REST · JSON · CORS-enabled'   },
  ];
  return (
    <section id="stack" style={{ background: C.bg, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '32px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true, margin:'-60px' }} transition={{ duration:0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 0 }}>
          {specs.map((s, i) => (
            <div key={s.label} style={{ padding: '20px 24px', borderRight: i < specs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 9, color: C.fg30, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.fg70, letterSpacing: '0.05em' }}>{s.value}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── SECTION: Product Showcase ─────────────────────────────────────────────────
function ProductShowcase() {
  const C = mkTokens(useTheme().dark);
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => { const iv = setInterval(() => setActiveStep(p=>(p+1)%4), 2000); return ()=>clearInterval(iv); }, []);

  const steps = [
    { label:'INPUT',  left:20,  top:60,  c:C.pink,   step:0 },
    { label:'TEXT',   left:260, top:60,  c:C.cyan,   step:1 },
    { label:'LLM',    left:520, top:60,  c:C.purple, step:2 },
    { label:'FILTER', left:20,  top:200, c:C.green,  step:2 },
    { label:'API',    left:260, top:200, c:C.yellow, step:3 },
    { label:'OUTPUT', left:520, top:200, c:C.pink,   step:3 },
  ];

  const features = [
    { title:'Drag from library, drop on canvas',  desc:'Connect nodes via handles. Standard ReactFlow interactions — pan, zoom, select, delete.'            },
    { title:'Template variable parsing',          desc:'Type {{ name }} in a Text node and it becomes a live input handle, wired anywhere in the graph.'     },
    { title:'Declarative node configuration',     desc:'Nodes are config objects in nodeConfigs.js. Adding a node type is ~10 lines, no new files needed.'   },
    { title:'Live DAG validation',                desc:"Submit runs Kahn's algorithm on the graph and returns node count, edge count, and acyclicity."        },
    { title:'Pipeline submission',                desc:'Submit parses your graph, validates DAG structure, and returns the analysis without leaving the canvas.' },
  ];

  return (
    <section style={{ padding:'128px 0', background:C.surface }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-100px' }} transition={{ duration:0.8 }}
          style={{ textAlign:'center', maxWidth:700, margin:'0 auto 80px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:24 }}>
            <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity }} style={{ width:12, height:12, borderRadius:'50%', background:C.pink, boxShadow:`0 0 10px ${C.pink}` }} />
            <span style={{ fontFamily:C.fontMono, fontSize:12, color:C.fg60, letterSpacing:'0.2em', textTransform:'uppercase' }}>Live Pipeline Execution</span>
          </div>
          <h2 style={{ fontFamily:C.fontHead, fontSize:'clamp(32px,4vw,48px)', fontWeight:700, color:C.fg, lineHeight:1.1, marginBottom:48 }}>
            From idea to production<br/>in one <span style={{ color:C.pink }}>unified canvas</span>
          </h2>
          <ul style={{ listStyle:'none', maxWidth:500, margin:'0 auto 48px', padding:0, display:'flex', flexDirection:'column', gap:32 }}>
            {features.map((item,i) => (
              <motion.li key={i} initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*.1 }}
                style={{ display:'flex', alignItems:'flex-start', gap:20 }}>
                <div style={{ width:48, height:48, borderRadius:2, background:C.surface3, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.pink} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ textAlign:'left' }}>
                  <h4 style={{ fontFamily:C.fontMono, fontWeight:700, fontSize:14, color:C.fg, margin:'0 0 4px' }}>{item.title}</h4>
                  <p style={{ fontFamily:C.fontMono, fontSize:12, color:C.muted, lineHeight:1.6, maxWidth:280, margin:0 }}>{item.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true, margin:'-100px' }} transition={{ duration:1 }}>
          <div style={{ width:'100%', height:600, background:C.surface3, border:`1px solid ${C.border}`, borderRadius:4, overflow:'hidden', boxShadow:'0 20px 80px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column' }}>
            <div style={{ height:60, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:C.surface2, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:28, height:28, border:`1px solid ${C.pink}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.pink, fontWeight:700 }}>PA</span>
                </div>
                <span style={{ fontFamily:C.fontMono, fontSize:13, color:C.fg90, fontWeight:700, textTransform:'uppercase' }}>Customer Onboarding Pipeline</span>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:C.fontMono, fontSize:10, color:C.fg60, background:C.surface3, padding:'2px 8px', borderRadius:2, border:`1px solid ${C.border}` }}>
                  <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity }} style={{ width:6, height:6, borderRadius:'50%', background:C.green, boxShadow:`0 0 5px ${C.green}` }} />
                  LIVE
                </span>
              </div>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
              <div style={{ width:192, borderRight:`1px solid ${C.border}`, background:C.surface2, padding:16, flexShrink:0 }}>
                <div style={{ fontFamily:C.fontMono, fontSize:10, color:C.fg30, marginBottom:20, textTransform:'uppercase', letterSpacing:'0.2em' }}>Node Library</div>
                {[['INPUT',C.pink],['LLM',C.purple],['TEXT',C.cyan],['FILTER',C.green],['MATH',C.yellow],['API','#f97316'],['DELAY','#38bdf8'],['OUTPUT',C.pink]].map(([n,c],i) => (
                  <div key={n} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', borderRadius:2, marginBottom:4, background:i===0?C.surface:'transparent', fontFamily:C.fontMono, fontSize:11, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:i===0?C.fg90:C.fg60, cursor:'pointer' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:c }} />{n}
                  </div>
                ))}
              </div>

              <div style={{ flex:1, position:'relative', overflow:'hidden', background:C.surface, backgroundImage:`radial-gradient(${C.dotGrid} 1px, transparent 1px)`, backgroundSize:'24px 24px' }}>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}>
                  {[
                    { d:'M 140 100 C 190 100 210 100 260 100', c:C.pink,   s:0 },
                    { d:'M 400 100 C 450 100 480 100 520 100', c:C.cyan,   s:1 },
                    { d:'M 140 240 C 190 240 220 250 260 250', c:C.green,  s:2 },
                    { d:'M 400 250 C 450 250 480 250 520 250', c:C.yellow, s:3 },
                  ].map((e,i) => (
                    <motion.path key={i} d={e.d} fill="none" strokeWidth="2.5" strokeDasharray="6"
                      animate={{ stroke: activeStep >= e.s ? e.c : `${e.c}33` }} transition={{ duration:0.3 }} />
                  ))}
                </svg>
                {steps.map((n,i) => (
                  <motion.div key={i} style={{ position:'absolute', top:n.top, left:n.left, width:n.label==='TEXT'||n.label==='API'?140:120, background:C.nodeBg, borderRadius:4, padding:14, zIndex:10, border:`1px solid ${C.border}` }}
                    animate={{ borderColor:activeStep===n.step?n.c:C.border, boxShadow:activeStep===n.step?`0 0 30px ${n.c}4d`:'none' }}
                    transition={{ duration:0.3 }}>
                    <div style={{ fontFamily:C.fontMono, fontSize:10, fontWeight:700, color:C.fg, letterSpacing:'0.2em', marginBottom:12 }}>{n.label}</div>
                    <div style={{ fontFamily:C.fontMono, fontSize:11, background:C.nodeInner, border:`1px solid ${C.border}`, padding:8, borderRadius:2 }}>
                      <AnimatePresence mode="wait">
                        <motion.span key={activeStep===n.step?'a':'i'} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ color:activeStep===n.step?n.c:C.fg70 }}>
                          {activeStep===n.step ? 'Processing...' : n.label.toLowerCase()}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ height:40, borderTop:`1px solid ${C.border}`, background:C.surface2, display:'flex', alignItems:'center', padding:'0 16px', gap:16, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:C.fontMono, fontSize:11, color:C.fg80, letterSpacing:'0.2em' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Validation Passed
              </div>
              <div style={{ background:C.surface3, border:`1px solid ${C.border}`, borderRadius:2, padding:'2px 8px', fontFamily:C.fontMono, fontSize:10, color:C.fg50, letterSpacing:'0.2em' }}>DAG Valid</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── SECTION: Design Decisions ─────────────────────────────────────────────────
const DESIGN_DECISIONS = [
  { icon:'◈', colorKey:'pink',  title:'CONFIG-DRIVEN NODES',
    desc:'A node is a config object, not a component. Adding a tenth node type is ~10 lines in nodeConfigs.js, not a new file tree. BaseNode handles all rendering.',
    tag:'nodeConfigs.js' },
  { icon:'{{ }}', colorKey:'green', title:'DYNAMIC HANDLES',
    desc:'The Text node computes its inputs at render time from {{ variable }} parsing — no special case in BaseNode. Any identifier becomes a connectable handle automatically.',
    tag:'textNode.js · parseVariables.js' },
  { icon:'→', colorKey:'cyan', title:"KAHN'S ALGORITHM",
    desc:"Iterative topological sort. No recursion-limit risk on deep graphs, and the resulting order is the pipeline's execution order. Runs in O(V+E).",
    tag:'submit.js · /pipelines/parse' },
];

function Testimonials() {
  const C = mkTokens(useTheme().dark);
  return (
    <section style={{ padding:'96px 0', background:C.surface }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-100px' }} transition={{ duration:0.8 }}
          style={{ textAlign:'center', maxWidth:600, margin:'0 auto 64px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:24 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6H20M4 12H20M4 18H20" stroke={C.pink} strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.pink, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700 }}>Architecture decisions</span>
          </div>
          <h2 style={{ fontFamily:C.fontHead, fontSize:'clamp(28px,3.5vw,40px)', fontWeight:700, color:C.fg, lineHeight:1.1 }}>Built on deliberate design choices</h2>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
          {DESIGN_DECISIONS.map((d,i) => <DesignDecisionCard key={i} d={d} i={i} />)}
        </div>
      </div>
    </section>
  );
}

function DesignDecisionCard({ d, i }) {
  const C = mkTokens(useTheme().dark);
  const color = C[d.colorKey];
  const ref = useRef(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const [hov, setHov] = useState(false);
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-50px' }} transition={{ duration:0.6, delay:i*.1 }}
      whileHover={{ y:-4 }}
      onMouseMove={e=>{const r=ref.current?.getBoundingClientRect();if(r){mx.set(e.clientX-r.left);my.set(e.clientY-r.top);}}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ position:'relative', padding:32, background:C.surface3, border:`1px solid ${C.border}`, overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:250 }}>
      <motion.div style={{ position:'absolute', inset:-1, opacity:hov?1:0, background:useMotionTemplate`radial-gradient(400px circle at ${mx}px ${my}px,${C.fg03},transparent 80%)`, transition:'opacity 0.3s', pointerEvents:'none' }} />
      <div style={{ position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:40, height:40, borderRadius:2, background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:C.fontMono, fontSize:14, color, fontWeight:700 }}>{d.icon}</div>
          <span style={{ fontFamily:C.fontMono, fontSize:12, fontWeight:700, color, letterSpacing:'0.15em' }}>{d.title}</span>
        </div>
        <p style={{ fontFamily:C.fontMono, fontSize:13, color:C.fg75, lineHeight:1.7, marginBottom:24 }}>{d.desc}</p>
      </div>
      <div style={{ position:'relative', zIndex:10 }}>
        <span style={{ fontFamily:C.fontMono, fontSize:10, color:C.fg35, letterSpacing:'0.1em' }}>{d.tag}</span>
      </div>
    </motion.div>
  );
}

// ── SECTION: CTA ──────────────────────────────────────────────────────────────
const CTA_NODES = [
  { x:'8%',  y:'35%', c:'pink',   label:'INPUT'  },
  { x:'26%', y:'25%', c:'green',  label:'FILTER' },
  { x:'50%', y:'20%', c:'purple', label:'LLM'    },
  { x:'74%', y:'28%', c:'yellow', label:'API'    },
  { x:'90%', y:'30%', c:'red',    label:'OUTPUT' },
];

function CTASection() {
  const C = mkTokens(useTheme().dark);
  const nodes = CTA_NODES.map(n => ({ ...n, c: C[n.c] }));
  return (
    <section style={{ position:'relative', width:'100%', background:C.bg, overflow:'hidden', paddingTop:160, paddingBottom:96, borderTop:`1px solid ${C.fg08}` }}>
      <ParticleField count={100} />

      {nodes.map((n, i) => (
        <motion.div key={i}
          initial={{ opacity:0, y:-20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:i*.1 }}
          style={{ position:'absolute', left:n.x, top:n.y, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', pointerEvents:'none', zIndex:5 }}>
          <span style={{ fontFamily:C.fontMono, fontSize:11, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:n.c, textShadow:`0 0 15px ${n.c}`, marginBottom:12 }}>{n.label}</span>
          <motion.div animate={{ boxShadow:[`0 0 15px 4px ${n.c}66`,`0 0 40px 15px ${n.c}99`,`0 0 15px 4px ${n.c}66`] }} transition={{ duration:2, repeat:Infinity, delay:i*.3 }}
            style={{ width:16, height:16, borderRadius:'50%', background:n.c }} />
        </motion.div>
      ))}

      <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4 }}>
        {nodes.slice(0,-1).map((n,i) => {
          const next = nodes[i+1];
          return <motion.line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke={n.c} strokeWidth="1" strokeDasharray="4 4" opacity="0.3"
            animate={{ strokeDashoffset:[-16,0] }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }} />;
        })}
      </svg>

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:800, margin:'0 auto', padding:'0 24px', textAlign:'center', paddingTop:120 }}>
        <motion.h2 initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }}
          style={{ fontFamily:C.fontHead, fontSize:'clamp(36px,5vw,64px)', fontWeight:700, color:C.fg, marginBottom:24 }}>
          Open the canvas.
        </motion.h2>
        <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.1 }}
          style={{ fontFamily:C.fontMono, fontSize:15, color:C.fg55, maxWidth:440, margin:'0 auto 40px', lineHeight:1.8 }}>
          Drag a node. Wire it up. Submit and see the graph parsed in real time.
        </motion.p>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8, delay:0.2 }}>
          <Link to="/app" style={{ background:'transparent', border:`1px solid ${C.pink}`, color:C.fg, fontFamily:C.fontMono, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', padding:'16px 40px', borderRadius:2, display:'inline-flex', alignItems:'center', gap:12, textDecoration:'none', transition:'all 0.3s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${C.pink}1a`;e.currentTarget.style.boxShadow=`0 0 24px ${C.pink}44`;}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.boxShadow='none';}}>
            [ OPEN EDITOR ]
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── SECTION: Footer ───────────────────────────────────────────────────────────
function Footer() {
  const C = mkTokens(useTheme().dark);
  return (
    <footer style={{ borderTop:`1px solid ${C.border}`, background:C.surface, paddingTop:64, paddingBottom:32 }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:32, marginBottom:64 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:32, height:32, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:C.fontHead, color:C.pink, fontWeight:700, fontSize:12 }}>PA</span>
            </div>
            <div>
              <div style={{ fontFamily:C.fontHead, fontWeight:800, fontSize:12, letterSpacing:1, lineHeight:1, color:C.fg }}>PIPELINE ARCHITECT</div>
              <div style={{ fontFamily:C.fontMono, fontSize:8, color:C.fg50, letterSpacing:3, marginTop:4 }}>A visual DAG composer for AI workflows</div>
            </div>
          </div>
          <a href="https://github.com" style={{ color:C.fg40, transition:'color 0.2s', display:'inline-block' }}
            onMouseEnter={e=>e.currentTarget.style.color=C.fg} onMouseLeave={e=>e.currentTarget.style.color=C.fg40}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          </a>
        </div>
        {[
          { h:'Product',   links:['Features','Use Cases','Node Library'] },
          { h:'Resources', links:['README','Architecture','API Reference'] },
          { h:'About',     links:['GitHub','Contact'] },
        ].map(({ h, links }) => (
          <div key={h}>
            <h4 style={{ fontFamily:C.fontSans, fontWeight:700, fontSize:14, color:C.fg, marginBottom:16, marginTop:0 }}>{h}</h4>
            {links.map(l => (
              <a key={l} href="#" style={{ display:'block', fontFamily:C.fontSans, fontSize:14, color:C.fg50, textDecoration:'none', marginBottom:12, transition:'color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.color=C.fg} onMouseLeave={e=>e.currentTarget.style.color=C.fg50}>{l}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'32px 24px 0', borderTop:`1px solid ${C.fg05}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <p style={{ fontFamily:C.fontMono, fontSize:12, color:C.fg40, margin:0 }}>© 2026 VectorShift. All rights reserved.</p>
        <div style={{ display:'flex', gap:24 }}>
          <a href="https://github.com" style={{ fontFamily:C.fontMono, fontSize:12, color:C.fg40, textDecoration:'none', transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color=C.fg} onMouseLeave={e=>e.currentTarget.style.color=C.fg40}>GitHub</a>
          <a href="mailto:abhaysingh0293@gmail.com" style={{ fontFamily:C.fontMono, fontSize:12, color:C.fg40, textDecoration:'none', transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color=C.fg} onMouseLeave={e=>e.currentTarget.style.color=C.fg40}>Contact</a>
        </div>
      </div>
    </footer>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  useLandingSetup();
  const [dark, setDark] = useState(true);
  const C = mkTokens(dark);
  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <div style={{ background:C.bg, color:C.fg, fontFamily:C.fontSans, overflowX:'hidden', lineHeight:1.6, transition:'background 0.3s, color 0.3s' }}>
        <style>{`@keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:0.4}} *{box-sizing:border-box;} a{color:inherit;}`}</style>
        <Navbar />
        <main>
          <HeroSection />
          <MockupSection />
          <LogoTicker />
          <FeaturesGrid />
          <NodeTypesTable />
          <TechSpecsStrip />
          <Metrics />
          <ProductShowcase />
          <Testimonials />
          <CTASection />
        </main>
        <Footer />
      </div>
    </ThemeCtx.Provider>
  );
}
