import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from './store';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsModal } from './KeyboardShortcuts';
import { TemplatesPanel } from './TemplatesPanel';
import { LogsPanel } from './LogsPanel';
import { colors, typography, shadows, radii } from './styles/theme';
import { ThemeProvider, useTheme } from './ThemeContext';

// ── TopBar ─────────────────────────────────────────────────────────────────
const TopBar = ({ onOpenPalette, onOpenShortcuts, onUndo, onRedo, canUndo, canRedo }) => {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const { dark, toggle } = useTheme();

  const topbarBg = dark
    ? 'rgba(13,15,10,0.88)'
    : 'rgba(244,245,240,0.92)';

  return (
    <header
      style={{
        position:       'fixed',
        top:            0, left: 0, right: 0,
        height:         '56px',
        zIndex:         50,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 20px',
        background:     topbarBg,
        backdropFilter: 'blur(12px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
        borderBottom:   `1px solid ${colors.outline}`,
        boxShadow:      shadows.topbar,
      }}
    >
      {/* Brand block — clicking the logo returns to the landing page */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div
          style={{
            width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${colors.primary}`,
            borderRadius: '2px',
            color: colors.primary,
            boxShadow: `0 0 12px ${colors.primaryGlow}`,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.primary }}>
            terminal
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ ...typography.brand, color: colors.text }}>Pipeline Architect</span>
          <span style={{ ...typography.code, color: `${colors.primary}99`, marginTop: '2px' }}>
            A VISUAL DAG COMPOSER FOR AI WORKFLOWS
          </span>
        </div>
      </Link>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Live node/edge counter */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outlineSubtle}`,
            borderRadius: radii.sm,
          }}
        >
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            {String(nodes.length).padStart(2, '0')}N · {String(edges.length).padStart(2, '0')}E
          </span>
        </div>

        {/* Undo / Redo buttons */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <TopBarIconBtn icon="undo"  title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
          <TopBarIconBtn icon="redo"  title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} />
        </div>

        {/* Command palette trigger */}
        <button
          onClick={onOpenPalette}
          title="Command Palette (Ctrl+K)"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outline}`,
            borderRadius: radii.sm,
            color: colors.textMuted,
            cursor: 'pointer',
            transition: 'all 0.12s',
            fontFamily: typography.fontMono,
            fontSize: '10px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.color = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.outline;
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>search</span>
          <span style={{ letterSpacing: '0.02em' }}>Ctrl K</span>
        </button>

        {/* System Live pill */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outline}`,
            borderRadius: '2px',
          }}
        >
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: colors.success,
            animation: 'status-pulse 2s ease-out infinite',
          }} />
          <span style={{ ...typography.label, color: colors.textMuted, fontSize: '9px' }}>
            System Live
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outline}`,
            borderRadius: radii.sm,
            color: colors.textMuted,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.color = colors.primary; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.outline; e.currentTarget.style.color = colors.textMuted; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            {dark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Shortcuts button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
          style={{
            width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.surfaceContainer,
            border: `1px solid ${colors.outline}`,
            borderRadius: radii.sm,
            color: colors.textMuted,
            cursor: 'pointer',
            fontFamily: typography.fontMono,
            fontWeight: 700, fontSize: '13px',
            transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.color = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.outline;
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          ?
        </button>
      </div>
    </header>
  );
};

// Small icon-only button used in the TopBar (undo, redo).
const TopBarIconBtn = ({ icon, title, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      width: '30px', height: '30px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: colors.surfaceContainer,
      border: `1px solid ${colors.outline}`,
      borderRadius: radii.sm,
      color: disabled ? colors.textDim : colors.textMuted,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'all 0.12s',
    }}
    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.color = colors.primary; } }}
    onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.borderColor = colors.outline; e.currentTarget.style.color = colors.textMuted; } }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
  </button>
);

// ── App root ───────────────────────────────────────────────────────────────
function App() {
  const [paletteOpen,    setPaletteOpen]    = useState(false);
  const [shortcutsOpen,  setShortcutsOpen]  = useState(false);
  const [templatesOpen,  setTemplatesOpen]  = useState(false);
  const [logsOpen,       setLogsOpen]       = useState(false);
  const [logs,           setLogs]           = useState([]);

  const openPalette    = useCallback(() => setPaletteOpen(true),    []);
  const closePalette   = useCallback(() => setPaletteOpen(false),   []);
  const openShortcuts  = useCallback(() => setShortcutsOpen(true),  []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);
  const openTemplates  = useCallback(() => setTemplatesOpen(true),  []);
  const closeTemplates = useCallback(() => setTemplatesOpen(false), []);
  const openLogs       = useCallback(() => setLogsOpen(true),       []);
  const closeLogs      = useCallback(() => setLogsOpen(false),      []);

  // Append a new log entry (called by SubmitButton on each pipeline submission)
  const addLog = useCallback((entry) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev, { ...entry, timestamp }]);
  }, []);

  const copySelection  = useStore((s) => s.copySelection);
  const pasteSelection = useStore((s) => s.pasteSelection);
  const undo           = useStore((s) => s.undo);
  const redo           = useStore((s) => s.redo);
  const selectAll      = useStore((s) => s.selectAll);
  const canUndo        = useStore((s) => s.past.length   > 0);
  const canRedo        = useStore((s) => s.future.length > 0);

  // Global keyboard shortcuts — capture phase (runs before ReactFlow handlers)
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+Z — undo
      if (mod && e.key === 'z' && !e.shiftKey && !isEditingTarget(e.target)) {
        e.preventDefault(); undo(); return;
      }
      // Ctrl+Shift+Z / Ctrl+Y — redo
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !isEditingTarget(e.target)) {
        e.preventDefault(); redo(); return;
      }
      // Ctrl+A — select all nodes
      if (mod && e.key === 'a' && !isEditingTarget(e.target)) {
        e.preventDefault(); selectAll(); return;
      }
      // Ctrl+C — copy selected nodes
      if (mod && e.key === 'c' && !isEditingTarget(e.target)) {
        copySelection(); return;
      }
      // Ctrl+V — paste copied graph offset by 40px
      if (mod && e.key === 'v' && !isEditingTarget(e.target)) {
        pasteSelection(); return;
      }
      // Ctrl+K / Cmd+K → command palette
      if (mod && e.key === 'k') {
        e.preventDefault(); setPaletteOpen((o) => !o); return;
      }
      // ? → shortcuts modal (only when not in an input field)
      if (e.key === '?' && !isEditingTarget(e.target)) {
        e.preventDefault(); setShortcutsOpen((o) => !o); return;
      }
      // Escape → close all overlays
      if (e.key === 'Escape') {
        setPaletteOpen(false); setShortcutsOpen(false);
        setTemplatesOpen(false); setLogsOpen(false);
      }
    };
    // Capture phase — fires before ReactFlow so Ctrl+K/? always reach us.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [undo, redo, selectAll, copySelection, pasteSelection]);

  return (
    <div style={{ position: 'relative', height: '100vh', background: colors.canvas, overflow: 'hidden', transition: 'background 0.25s' }}>
      <TopBar
        onOpenPalette={openPalette}
        onOpenShortcuts={openShortcuts}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <PipelineToolbar onOpenTemplates={openTemplates} onOpenLogs={openLogs} />
      <PipelineUI onOpenPalette={openPalette} />
      <SubmitButton onLog={addLog} />

      <CommandPalette open={paletteOpen}   onClose={closePalette}  />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={closeShortcuts} />
      {templatesOpen && <TemplatesPanel onClose={closeTemplates} />}
      {logsOpen      && <LogsPanel logs={logs} onClose={closeLogs} />}
    </div>
  );
}

function isEditingTarget(el) {
  const tag = el?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable;
}

function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWithTheme;
