import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const conceptsLinks = [
  { to: '/greeks', label: 'The Greeks' },
  { to: '/pricing', label: 'Options Pricing' },
  { to: '/volatility', label: 'IV & Volatility' },
  { to: '/options-chain', label: 'Options Chain' },
  { to: '/lifecycle', label: 'Trade Lifecycle' },
  { to: '/earnings', label: 'Earnings Playbook' },
];

const guidesLinks = [
  { to: '/wheel', label: 'The Wheel' },
  { to: '/risk', label: 'Risk Management' },
  { to: '/mistakes', label: 'Common Mistakes' },
];

const advancedLinks = [
  { to: '/vrp', label: 'Volatility Risk Premium' },
  { to: '/dte45', label: '45/21 DTE System' },
  { to: '/vix-regime', label: 'VIX Regime Trading' },
  { to: '/dispersion', label: 'Dispersion Trading' },
  { to: '/gamma-scalping', label: 'Gamma Scalping' },
  { to: '/put-write', label: 'Systematic Put-Write' },
];

function Dropdown({
  label,
  links,
}: {
  label: string;
  links: { to: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
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
        }}
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
            left: 0,
            marginTop: 4,
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 200,
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {links.map(({ to, label: lbl }) => (
            <button
              key={to}
              onClick={() => {
                setOpen(false);
                navigate(to);
              }}
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
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6366f118';
                e.currentTarget.style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Nav() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
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
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid #2a2d3e',
        position: 'sticky',
        top: 0,
        background: '#0f1117',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
          Option<span style={{ color: '#6366f1' }}>IQ</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/" end style={linkStyle}>Strategies</NavLink>
        <NavLink to="/glossary" style={linkStyle}>Glossary</NavLink>
        <Dropdown label="Concepts" links={conceptsLinks} />
        <Dropdown label="Guides" links={guidesLinks} />
        <Dropdown label="Advanced" links={advancedLinks} />
      </div>
    </nav>
  );
}
