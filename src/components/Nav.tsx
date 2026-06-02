import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

// ── Navigation data ────────────────────────────────────────────────────────

interface NavLink2 { to: string; label: string }
interface NavGroup { heading: string; links: NavLink2[] }
interface NavSection { id: string; label: string; accent: string; groups: NavGroup[] }

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'options',
    label: 'Options',
    accent: '#6366f1',
    groups: [
      {
        heading: 'Strategies & Guides',
        links: [
          { to: '/strategies', label: 'Strategy Library' },
          { to: '/wheel', label: 'The Wheel' },
          { to: '/pmcc', label: "Poor Man's Covered Call" },
          { to: '/risk', label: 'Risk Management' },
          { to: '/mistakes', label: 'Common Mistakes' },
        ],
      },
      {
        heading: 'Concepts',
        links: [
          { to: '/greeks', label: 'The Greeks' },
          { to: '/pricing', label: 'Options Pricing' },
          { to: '/volatility', label: 'IV & Volatility' },
          { to: '/options-chain', label: 'Options Chain' },
          { to: '/lifecycle', label: 'Trade Lifecycle' },
          { to: '/earnings', label: 'Earnings Playbook' },
        ],
      },
      {
        heading: 'Advanced',
        links: [
          { to: '/vrp', label: 'Volatility Risk Premium' },
          { to: '/dte45', label: '45/21 DTE System' },
          { to: '/vix-regime', label: 'VIX Regime Trading' },
          { to: '/dispersion', label: 'Dispersion Trading' },
          { to: '/gamma-scalping', label: 'Gamma Scalping' },
          { to: '/put-write', label: 'Systematic Put-Write' },
        ],
      },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    accent: '#10b981',
    groups: [
      {
        heading: 'Fundamental Analysis',
        links: [
          { to: '/financials', label: 'Financial Statements' },
          { to: '/earnings-history', label: 'Earnings Surprises' },
          { to: '/valuation', label: 'Valuation Snapshot' },
          { to: '/dcf', label: 'DCF Calculator' },
          { to: '/dividends', label: 'Dividend Safety' },
        ],
      },
      {
        heading: 'AI Tools',
        links: [
          { to: '/news-sentiment', label: 'News Sentiment & Summary' },
        ],
      },
    ],
  },
];

// ── Desktop mega-dropdown ──────────────────────────────────────────────────

function Dropdown({ section }: { section: NavSection }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const totalLinks = section.groups.reduce((s, g) => s + g.links.length, 0);
  const isWide = totalLinks > 8;

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: open ? '#1f2335' : 'none',
          border: 'none',
          color: open ? section.accent : '#64748b',
          fontSize: 14,
          fontWeight: open ? 600 : 400,
          padding: '6px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'all 0.15s',
        }}
      >
        {section.label}
        <span style={{ fontSize: 9, opacity: 0.7, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 12,
            padding: '16px 0 10px',
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            gap: 0,
            minWidth: isWide ? 580 : 220,
          }}
        >
          {section.groups.map((group, gi) => (
            <div key={gi} style={{ flex: 1, padding: '0 16px', borderLeft: gi > 0 ? '1px solid #2a2d3e' : 'none' }}>
              <div style={{ color: section.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '0 0 8px', textTransform: 'uppercase' }}>
                {group.heading}
              </div>
              {group.links.map(({ to, label }) => (
                <button
                  key={to}
                  onClick={() => { setOpen(false); navigate(to); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 10px', background: 'none', border: 'none',
                    color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                    borderRadius: 6, transition: 'all 0.1s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = section.accent + '18'; e.currentTarget.style.color = '#e2e8f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mobile full-screen menu ────────────────────────────────────────────────

function MobileMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const go = (to: string) => { navigate(to); onClose(); };

  return (
    <div style={{
      position: 'fixed', inset: 0, top: 56, background: '#0f1117',
      zIndex: 40, overflowY: 'auto', borderTop: '1px solid #2a2d3e', paddingBottom: 24,
    }}>
      {/* Home + Glossary */}
      {[{ to: '/', label: 'Home' }, { to: '/glossary', label: 'Glossary' }].map(({ to, label }) => (
        <button key={to} onClick={() => go(to)} style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '13px 20px', background: 'none', border: 'none',
          borderBottom: '1px solid #1e2130', color: '#e2e8f0',
          fontSize: 15, fontWeight: 500, cursor: 'pointer',
        }}>{label}</button>
      ))}

      {NAV_SECTIONS.map(section => (
        <div key={section.id}>
          <button
            onClick={() => setOpenSection(v => v === section.id ? null : section.id)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', textAlign: 'left', padding: '13px 20px',
              background: openSection === section.id ? '#1a1d27' : 'none',
              border: 'none', borderBottom: '1px solid #1e2130',
              color: openSection === section.id ? section.accent : '#94a3b8',
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {section.label}
            <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: openSection === section.id ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>

          {openSection === section.id && section.groups.map(group => (
            <div key={group.heading} style={{ background: '#0c0e16' }}>
              <button
                onClick={() => setOpenGroup(v => v === group.heading ? null : group.heading)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', textAlign: 'left', padding: '10px 28px',
                  background: 'none', border: 'none', borderBottom: '1px solid #1a1d27',
                  color: section.accent, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                {group.heading}
                <span style={{ fontSize: 9, opacity: 0.7, transform: openGroup === group.heading ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
              </button>
              {(openGroup === group.heading || section.groups.length === 1) && group.links.map(({ to, label }) => (
                <button key={to} onClick={() => go(to)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 36px', background: 'none', border: 'none',
                  borderBottom: '1px solid #12141e', color: '#64748b',
                  fontSize: 14, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Nav ───────────────────────────────────────────────────────────────

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    color: isActive ? '#e2e8f0' : '#64748b',
    textDecoration: 'none', fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    padding: '6px 14px', borderRadius: 8,
    background: isActive ? '#1f2335' : 'transparent',
    transition: 'all 0.15s',
  });

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56, borderBottom: '1px solid #2a2d3e',
        position: 'sticky', top: 0, background: '#0f1117', zIndex: 50,
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
            Meridian
          </span>
        </NavLink>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink to="/glossary" style={linkStyle}>Glossary</NavLink>
          {NAV_SECTIONS.map(s => <Dropdown key={s.id} section={s} />)}
        </div>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 8,
            display: 'none', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#6366f1' : '#94a3b8', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#6366f1' : '#94a3b8', borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#6366f1' : '#94a3b8', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>
      </nav>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
