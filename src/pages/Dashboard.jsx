import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ESTADO_COLORS = {
  Nuevo: 'var(--c-nuevo)',
  Calificando: 'var(--c-calificando)',
  Visita: 'var(--c-visita)',
  Aplicacion: 'var(--c-aplicacion)',
  Cerrado: 'var(--c-cerrado)',
  Perdido: 'var(--c-perdido)',
}

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    leadsHoy: 0,
    pipelineActivo: 0,
    cierresMes: 0,
    comisionMes: 0,
  })
  const [recentLeads, setRecentLeads] = useState([])
  const [pipelineDist, setPipelineDist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const [
        { count: leadsHoy },
        { data: allLeads },
        { data: cierres },
        { data: recent },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true })
          .gte('created_at', today),
        supabase.from('leads').select('estado'),
        supabase.from('cierres').select('comision').gte('fecha_cierre', monthStart),
        supabase.from('leads').select('id, nombre, estado, fuente, presupuesto, created_at')
          .order('created_at', { ascending: false }).limit(6),
      ])

      const ACTIVE = ['Nuevo', 'Calificando', 'Visita', 'Aplicacion']
      const pipelineActivo = (allLeads || []).filter(l => ACTIVE.includes(l.estado)).length

      const comisionMes = (cierres || []).reduce((s, c) => s + (c.comision || 0), 0)

      // distribution
      const dist = {}
      ;(allLeads || []).forEach(l => { dist[l.estado] = (dist[l.estado] || 0) + 1 })

      setStats({ leadsHoy: leadsHoy || 0, pipelineActivo, cierresMes: (cierres || []).length, comisionMes })
      setRecentLeads(recent || [])
      setPipelineDist(Object.entries(dist).map(([estado, count]) => ({ estado, count })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">DASH<span>BOARD</span></h1>
          <p className="page-subtitle">{dateStr}</p>
        </div>
        <button className="btn btn-gold" onClick={() => onNavigate('nuevo_lead')}>
          ✦ NUEVO LEAD
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Leads Hoy</div>
          <div className="stat-value">{loading ? '—' : stats.leadsHoy}</div>
          <div className="stat-sub">Entrados hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pipeline Activo</div>
          <div className="stat-value">{loading ? '—' : stats.pipelineActivo}</div>
          <div className="stat-sub">En proceso</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cierres Este Mes</div>
          <div className="stat-value">{loading ? '—' : stats.cierresMes}</div>
          <div className="stat-sub">{now.toLocaleDateString('es-ES', { month: 'long' })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Comisión Ganada</div>
          <div className="stat-value" style={{ fontSize: '30px' }}>
            {loading ? '—' : fmt(stats.comisionMes)}
          </div>
          <div className="stat-sub">Este mes</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Leads */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>LEADS RECIENTES</h3>
            <button className="btn" style={{ fontSize: '11px' }} onClick={() => onNavigate('leads')}>
              Ver todos →
            </button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {recentLeads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Sin leads aún
              </div>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>{lead.nombre}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{lead.fuente}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <EstadoBadge estado={lead.estado} />
                    {lead.presupuesto && (
                      <span style={{ fontSize: '10px', color: 'var(--gold)' }}>{fmt(lead.presupuesto)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div>
          <h3 className="section-title" style={{ marginBottom: '12px' }}>DISTRIBUCIÓN PIPELINE</h3>
          <div className="card">
            {pipelineDist.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
                Sin datos
              </div>
            ) : (
              pipelineDist.map(({ estado, count }) => {
                const total = pipelineDist.reduce((s, i) => s + i.count, 0)
                const pct = Math.round((count / total) * 100)
                const color = ESTADO_COLORS[estado] || 'var(--text-muted)'
                return (
                  <div key={estado} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-mid)' }}>{estado}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} · {pct}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--border)', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: '20px' }}>
        <h3 className="section-title" style={{ marginBottom: '12px' }}>ACCESOS RÁPIDOS</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Ver Pipeline', page: 'pipeline', icon: '▦' },
            { label: 'Calificar Lead', page: 'filtros', icon: '◎' },
            { label: 'Ver Propiedades', page: 'propiedades', icon: '⬜' },
            { label: 'Ver Agenda', page: 'agenda', icon: '◷' },
            { label: 'Análisis IA', page: 'agente_ia', icon: '◆' },
          ].map(({ label, page, icon }) => (
            <button key={page} className="btn" onClick={() => onNavigate(page)}
              style={{ flex: 1, flexDirection: 'column', gap: '6px', padding: '14px 10px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
              <span style={{ fontSize: '18px', color: 'var(--gold)' }}>{icon}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function EstadoBadge({ estado }) {
  const map = {
    Nuevo: 'nuevo', Calificando: 'calificando', Visita: 'visita',
    Aplicacion: 'aplicacion', Cerrado: 'cerrado', Perdido: 'perdido',
  }
  return <span className={`badge badge-${map[estado] || 'nuevo'}`}>{estado}</span>
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '11px 16px',
  borderBottom: '1px solid var(--border)',
}
