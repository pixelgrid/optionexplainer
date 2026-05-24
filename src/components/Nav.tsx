import { NavLink } from 'react-router-dom';

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
      <div style={{ display: 'flex', gap: 4 }}>
        <NavLink to="/" end style={linkStyle}>Strategies</NavLink>
        <NavLink to="/glossary" style={linkStyle}>Glossary</NavLink>
      </div>
    </nav>
  );
}
