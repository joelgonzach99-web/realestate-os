import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ESTADOS = ['Todos', 'Nuevo', 'Calificando', 'Visita', 'Aplicacion', 'Cerrado', 'Perdido']
const BADGE_MAP = {
  Nuevo: 'nuevo', Calificando: 'calificando', Visita: 'visita',
  Aplicacion: 'aplicacion', Cerrado: 'cerrado', Perdido: 'perdido',
}

export default function Leads({ onNavigate }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function deleteLead(id) {
    if (!confirm('¿Eliminar este lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    setSelected(null)
    fetchLeads()
  }

  const fmt = (n) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—'
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—'

  const filtered = leads.filter(l => {
    const matchSearch = !search || [l.nombre, l.telefono, l.email, l.fuente].join(' ').toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'Todos' || l.estado === filterEstado
    return matchSearch && matchEstado
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">LEAD<span>S</span></h1>
          <p className="page-subtitle">{leads.length} leads en total · {filtered.length} mostrados</p>
        </div>
        <button className="btn btn-gold" onClick={() => onNavigate('nuevo_lead')}>✦ NUEVO LEAD</button>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-wrap" style={{ maxWidth: '320px' }}>
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {ESTADOS.map(e => (
            <button
              key={e}
              className="btn"
              onClick={() => setFilterEstado(e)}
              style={{
                fontSize: '10px',
                padding: '5px 10px',
                ...(filterEstado === e ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-dim)' } : {}),
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>SIN RESULTADOS</h3>
          <p>No hay leads que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Fuente</th>
                <th>Presupuesto</th>
                <th>Habitaciones</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => setSelected(lead)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{lead.nombre}</td>
                  <td style={{ color: 'var(--text-mid)' }}>{lead.telefono || '—'}</td>
                  <td style={{ color: 'var(--text-mid)' }}>{lead.email || '—'}</td>
                  <td><FuenteBadge fuente={lead.fuente} /></td>
                  <td style={{ color: 'var(--gold)' }}>{fmt(lead.presupuesto)}</td>
                  <td style={{ color: 'var(--text-mid)' }}>{lead.habitaciones ? `${lead.habitaciones} hab` : '—'}</td>
                  <td><span className={`badge badge-${BADGE_MAP[lead.estado] || 'nuevo'}`}>{lead.estado}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{fmtDate(lead.created_at)}</td>
                  <td>
                    <button className="btn" style={{ padding: '4px 10px', fontSize: '10px' }}
                      onClick={e => { e.stopPropagation(); setSelected(lead) }}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onDelete={deleteLead}
          onNavigate={onNavigate}
          onRefresh={fetchLeads}
        />
      )}
    </div>
  )
}

function FuenteBadge({ fuente }) {
  const colors = {
    Facebook: '#1877f2',
    WhatsApp: '#25d366',
    Referral: '#d4a843',
    'Walk-in': '#8b5cf6',
  }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: '10px',
      color: colors[fuente] || 'var(--text-muted)',
      border: `1px solid ${colors[fuente] ? colors[fuente] + '44' : 'var(--border)'}`,
      background: colors[fuente] ? colors[fuente] + '15' : 'transparent',
    }}>
      {fuente || '—'}
    </span>
  )
}

function LeadDrawer({ lead, onClose, onDelete, onNavigate, onRefresh }) {
  const [estado, setEstado] = useState(lead.estado)
  const [saving, setSaving] = useState(false)
  const fmt = (n) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—'

  async function updateEstado(newEstado) {
    setSaving(true)
    await supabase.from('leads').update({ estado: newEstado }).eq('id', lead.id)
    setEstado(newEstado)
    setSaving(false)
    onRefresh()
  }

  return (
    <div style={drawerOverlay} onClick={onClose}>
      <div style={drawerPanel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--text)', letterSpacing: '0.05em' }}>
              {lead.nombre}
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Ingresó: {new Date(lead.created_at).toLocaleDateString('es-ES')}
            </p>
          </div>
          <button className="btn" onClick={onClose} style={{ fontSize: '16px', padding: '4px 10px' }}>✕</button>
        </div>

        {/* Estado picker */}
        <div style={{ marginBottom: '20px' }}>
          <div className="form-label" style={{ marginBottom: '8px' }}>Estado</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Nuevo','Calificando','Visita','Aplicacion','Cerrado','Perdido'].map(s => (
              <button key={s} className="btn" onClick={() => updateEstado(s)}
                style={{ fontSize: '10px', padding: '5px 10px', opacity: saving ? 0.5 : 1,
                  ...(estado === s ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-dim)' } : {}),
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: '20px' }}>
          {[
            ['Teléfono', lead.telefono],
            ['Email', lead.email],
            ['Fuente', lead.fuente],
            ['Presupuesto', fmt(lead.presupuesto)],
            ['Habitaciones', lead.habitaciones ? `${lead.habitaciones} hab` : '—'],
            ['Fecha Mudanza', lead.fecha_mudanza ? new Date(lead.fecha_mudanza).toLocaleDateString('es-ES') : '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="form-label" style={{ marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '13px', color: 'var(--text)' }}>{val || '—'}</div>
            </div>
          ))}
        </div>

        {lead.notas && (
          <div style={{ marginBottom: '20px' }}>
            <div className="form-label" style={{ marginBottom: '4px' }}>Notas</div>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 12px', lineHeight: '1.6' }}>
              {lead.notas}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => { onClose(); onNavigate('filtros') }}>
            ◎ Calificar
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={() => { onClose(); onNavigate('agenda') }}>
            ◷ Agendar Visita
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(lead.id)}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

const drawerOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
  display: 'flex', justifyContent: 'flex-end',
}
const drawerPanel = {
  width: '420px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
  padding: '28px 24px', overflowY: 'auto',
}
