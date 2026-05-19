const NAV = [
  { id: 'dashboard',   label: 'Dashboard',    icon: '▣' },
  { id: 'leads',       label: 'Leads',         icon: '◉' },
  { id: 'pipeline',    label: 'Pipeline',      icon: '▦' },
  { id: 'propiedades', label: 'Propiedades',   icon: '⬜' },
  { id: 'agenda',      label: 'Agenda',        icon: '◷' },
  { id: 'agente_ia',   label: 'Agente IA',     icon: '◆' },
]

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <div style={s.logoRow}>
          <span style={s.logoRE}>RE</span>
          <span style={s.logoOS}>OS</span>
        </div>
        <div style={s.brandSub}>MIAMI REALTY</div>
        <div style={s.brandAgents}>JOEL + DAHIANA</div>
      </div>

      <div style={s.divider} />

      <nav style={s.nav}>
        {NAV.map(item => {
          const active = currentPage === item.id
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
              <span style={{ ...s.navIcon, ...(active ? s.navIconActive : {}) }}>
                {item.icon}
              </span>
              <span style={active ? s.navLabelActive : s.navLabel}>
                {item.label}
              </span>
              {active && <div style={s.bar} />}
            </button>
          )
        })}
      </nav>

      <div style={s.footer}>
        <div style={s.dot} />
        <span style={s.footerText}>SISTEMA ACTIVO</span>
      </div>
    </aside>
  )
}

const s = {
  sidebar: { width: '224px', minWidth: '224px', height: '100vh', background: '#0d0d0d', borderRight: '1px solid #191919', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  brand: { padding: '26px 20px 20px' },
  logoRow: { display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '6px' },
  logoRE: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', color: '#d4a843', letterSpacing: '0.04em', lineHeight: 1 },
  logoOS: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', color: '#efefef', letterSpacing: '0.04em', lineHeight: 1 },
  brandSub: { fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#555', letterSpacing: '0.18em', textTransform: 'uppercase' },
  brandAgents: { fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(212,168,67,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' },
  divider: { height: '1px', background: '#191919', margin: '0 16px 8px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 10px', gap: '2px', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', background: 'transparent', border: 'none', color: '#555', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '0.04em', textAlign: 'left', cursor: 'pointer', position: 'relative', transition: 'color 0.15s' },
  navItemActive: { background: 'rgba(212,168,67,0.08)', color: '#d4a843' },
  navIcon: { fontSize: '14px', width: '18px', flexShrink: 0, color: '#333' },
  navIconActive: { color: '#d4a843' },
  navLabel: { color: '#666' },
  navLabelActive: { color: '#efefef' },
  bar: { position: 'absolute', right: 0, top: '20%', bottom: '20%', width: '2px', background: '#d4a843' },
  footer: { padding: '16px 20px', borderTop: '1px solid #191919', display: 'flex', alignItems: 'center', gap: '7px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)' },
  footerText: { fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#333', letterSpacing: '0.12em' },
}
