import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'Concepts',
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
    label: 'Guides',
    links: [
      { to: '/wheel', label: 'The Wheel' },
      { to: '/risk', label: 'Risk Management' },
      { to: '/mistakes', label: 'Common Mistakes' },
    ],
  },
  {
    label: 'Advanced',
    links: [
      { to: '/vrp', label: 'Volatility Risk Premium' },
      { to: '/dte45', label: '45/21 DTE System' },
      { to: '/vix-regime', label: 'VIX Regime Trading' },
      { to: '/dispersion', label: 'Dispersion Trading' },
      { to: '/gamma-scalping', label: 'Gamma Scalping' },
      { to: '/put-write', label: 'Systematic Put-Write' },
    ],
  },
];

// Desktop dropdown
function Dropdown({ label, links }: { label: string; links: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        style={{
          background: 'none',
          border: 'none',
          color: open ? '#e2e8f0' : '#64748b',
          fontSize: 14,
          fontWeight: 400,
          padding: '6px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'all 0.15s',
          ...(open ? { color: '#e2e8f0', background: '#1f2335' } : {}),
        } as React.CSSProperties}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <span style={{ fontSize: 9, opacity: 0.7, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            // Align right edge to parent right edge to prevent viewport overflow
            right: 0,
            left: 'auto',
            marginTop: 4,
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 210,
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {links.map(({ to, label: lbl }) => (
            <button
              key={to}
              onClick={() => { setOpen(false); navigate(to); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#6366f118'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile full-screen menu
function MobileMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const go = (to: string) => { navigate(to); onClose(); };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        top: 56,
        background: '#0f1117',
        zIndex: 40,
        overflowY: 'auto',
        borderTop: '1px solid #2a2d3e',
        paddingBottom: 24,
      }}
    >
      {/* Top-level links */}
      <div style={{ padding: '8px 0' }}>
        {[{ to: '/', label: 'Strategies' }, { to: '/glossary', label: 'Glossary' }].map(({ to, label }) => (
          <button
            key={to}
            onClick={() => go(to)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '13px 20px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #1e2130',
              color: '#e2e8f0',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}

        {/* Accordion sections */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <button
              onClick={() => setOpenSection((v) => (v === section.label ? null : section.label))}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                padding: '13px 20px',
                background: openSection === section.label ? '#1a1d27' : 'none',
                border: 'none',
                borderBottom: '1px solid #1e2130',
                color: openSection === section.label ? '#e2e8f0' : '#94a3b8',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {section.label}
              <span style={{
                fontSize: 10,
                transition: 'transform 0.2s',
                transform: openSection === section.label ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>▼</span>
            </button>
            {openSection === section.label && (
              <div style={{ background: '#0c0e16' }}>
                {section.links.map(({ to, label }) => (
                  <button
                    key={to}
                    onClick={() => go(to)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 28px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #1a1d27',
                      color: '#64748b',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    color: isActive ? '#e2e8f0' : '#64748b',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    padding: '6px 14px',
    borderRadius: 8,
    background: isActive ? '#1f2335' : 'transparent',
    transition: 'all 0.15s',
  });

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 56,
          borderBottom: '1px solid #2a2d3e',
          position: 'sticky',
          top: 0,
          background: '#0f1117',
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em', flexShrink: 0 }}>
          Option<span style={{ color: '#6366f1' }}>IQ</span>
        </span>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink to="/" end style={linkStyle}>Strategies</NavLink>
          <NavLink to="/glossary" style={linkStyle}>Glossary</NavLink>
          {NAV_SECTIONS.map((s) => (
            <Dropdown key={s.label} label={s.label} links={s.links} />
          ))}
        </div>

        {/* Hamburger (mobile only) */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            display: 'none',
            flexDirection: 'column',
            gap: 5,
            alignItems: 'center',
            justifyContent: 'center',
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
