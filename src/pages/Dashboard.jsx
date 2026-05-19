import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const STAGES = ['Nuevo','Contactado','Calificando','Visita Agendada','Aplicación','Cerrado','Perdido']
const STAGE_COLORS = {
  'Nuevo':'var(--c-nuevo)','Contactado':'var(--c-contactado)','Calificando':'var(--c-calificando)',
  'Visita Agendada':'var(--c-visita)','Aplicación':'var(--c-aplicacion)',
  'Cerrado':'var(--c-cerrado)','Perdido':'var(--c-perdido)',
}
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ leadsHoy:0, pipelineActivo:0, cierresMes:0, comisionMes:0 })
  const [funnel, setFunnel] = useState([])
  const [weekData, setWeekData] = useState([])
  const [topProps, setTopProps] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [
      { count: leadsHoy },
      { data: allLeads },
      { data: cierres },
      { data: recent },
      { data: props },
      { data: weekLeads },
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('leads').select('estado, qualification_score'),
      supabase.from('cierres').select('comision, fecha_cierre').gte('fecha_cierre', monthStart.split('T')[0]),
      supabase.from('leads').select('id,nombre,estado,fuente,presupuesto,qualification_status,qualification_score').order('created_at', { ascending: false }).limit(5),
      supabase.from('propiedades').select('id,direccion,zona,precio_renta,estado,habitaciones').eq('estado','Disponible').limit(4),
      supabase.from('leads').select('created_at').gte('created_at', weekAgo),
    ])

    const ACTIVE = ['Nuevo','Contactado','Calificando','Visita Agendada','Aplicación']
    const pipelineActivo = (allLeads||[]).filter(l => ACTIVE.includes(l.estado)).length
    const comisionMes = (cierres||[]).reduce((s,c) => s+(c.comision||0), 0)

    // funnel counts
    const counts = {}
    ;(allLeads||[]).forEach(l => { counts[l.estado] = (counts[l.estado]||0)+1 })
    const funnelData = STAGES.map(s => ({ estado:s, count: counts[s]||0 }))

    // weekly chart (last 7 days)
    const dayMap = {}
    for (let i=6; i>=0; i--) {
      const d = new Date(Date.now() - i*86400000)
      const key = d.toISOString().split('T')[0]
      dayMap[key] = { day: DAYS[d.getDay()], count: 0 }
    }
    ;(weekLeads||[]).forEach(l => {
      const key = l.created_at.split('T')[0]
      if (dayMap[key]) dayMap[key].count++
    })
    setWeekData(Object.values(dayMap))

    setStats({ leadsHoy: leadsHoy||0, pipelineActivo, cierresMes: (cierres||[]).length, comisionMes })
    setFunnel(funnelData)
    setRecentLeads(recent||[])
    setTopProps(props||[])
    setLoading(false)
  }

  const fmt = n => n ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n) : '—'
  const maxFunnel = Math.max(...funnel.map(f => f.count), 1)
  const maxWeek = Math.max(...weekData.map(d => d.count), 1)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">DASH<span>BOARD</span></h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <button className="btn btn-gold" onClick={() => onNavigate('leads')}>✦ NUEVO LEAD</button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label:'Leads Hoy', value: loading?'—':stats.leadsHoy, sub:'Ingresados hoy' },
          { label:'Pipeline Activo', value: loading?'—':stats.pipelineActivo, sub:'En proceso' },
          { label:'Cierres Este Mes', value: loading?'—':stats.cierresMes, sub: new Date().toLocaleDateString('es-ES',{month:'long'}) },
          { label:'Comisión Ganada', value: loading?'—':fmt(stats.comisionMes), sub:'Este mes', small: true },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={s.small?{fontSize:'26px'}:{}}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
        {/* Conversion funnel */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <h3 className="section-title" style={{marginBottom:0}}>EMBUDO DE PIPELINE</h3>
          </div>
          <div className="funnel">
            {funnel.map(({ estado, count }) => (
              <div key={estado} className="funnel-row">
                <span className="funnel-label">{estado}</span>
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{ width:`${(count/maxFunnel)*100}%`, background: STAGE_COLORS[estado] || 'var(--gold)', opacity:0.7 }} />
                </div>
                <span className="funnel-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly chart */}
        <div className="card">
          <h3 className="section-title" style={{marginBottom:'16px'}}>LEADS ESTA SEMANA</h3>
          <div style={{display:'flex',alignItems:'flex-end',gap:'8px',height:'90px'}}>
            {weekData.map(({ day, count }) => (
              <div key={day} className="week-bar-wrap">
                <div className="week-bar-outer">
                  <div className="week-bar" style={{ height: `${Math.max(4, (count/maxWeek)*80)}px` }} />
                </div>
                <span className="week-day">{day}</span>
                {count > 0 && <span style={{fontSize:'9px',color:'var(--gold)'}}>{count}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        {/* Recent Leads */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <h3 className="section-title" style={{marginBottom:0}}>LEADS RECIENTES</h3>
            <button className="btn btn-sm" onClick={() => onNavigate('leads')}>Ver todos →</button>
          </div>
          <div className="card" style={{padding:0}}>
            {recentLeads.length === 0
              ? <p style={{padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:'12px'}}>Sin leads aún</p>
              : recentLeads.map(lead => (
                <div key={lead.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontSize:'13px',marginBottom:'2px'}}>{lead.nombre}</div>
                    <div style={{fontSize:'10px',color:'var(--text-muted)'}}>{lead.fuente}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
                    <StateBadge estado={lead.estado} />
                    {lead.qualification_status && <QBadge status={lead.qualification_status} score={lead.qualification_score} />}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Top Properties */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <h3 className="section-title" style={{marginBottom:0}}>PROPIEDADES DISPONIBLES</h3>
            <button className="btn btn-sm" onClick={() => onNavigate('propiedades')}>Ver todas →</button>
          </div>
          <div className="card" style={{padding:0}}>
            {topProps.length === 0
              ? <p style={{padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:'12px'}}>Sin propiedades</p>
              : topProps.map(p => (
                <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontSize:'12px',marginBottom:'2px'}}>{p.direccion.slice(0,40)}</div>
                    <div style={{fontSize:'10px',color:'var(--text-muted)'}}>{p.zona} · {p.habitaciones ? `${p.habitaciones} hab` : ''}</div>
                  </div>
                  <div style={{color:'var(--gold)',fontSize:'13px',fontFamily:"'Bebas Neue', sans-serif"}}>{fmt(p.precio_renta)}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{marginTop:'20px'}}>
        <h3 className="section-title" style={{marginBottom:'10px'}}>ACCESOS RÁPIDOS</h3>
        <div style={{display:'flex',gap:'8px'}}>
          {[
            {label:'Pipeline',page:'pipeline',icon:'▦'},
            {label:'Propiedades',page:'propiedades',icon:'⬜'},
            {label:'Agenda',page:'agenda',icon:'◷'},
            {label:'Agente IA',page:'agente_ia',icon:'◆'},
          ].map(({label,page,icon}) => (
            <button key={page} className="btn" onClick={() => onNavigate(page)}
              style={{flex:1,flexDirection:'column',gap:'6px',padding:'14px',justifyContent:'center',alignItems:'center',display:'flex'}}>
              <span style={{fontSize:'18px',color:'var(--gold)'}}>{icon}</span>
              <span style={{fontSize:'10px',color:'var(--text-muted)'}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StateBadge({ estado }) {
  const map = { 'Nuevo':'nuevo','Contactado':'contactado','Calificando':'calificando','Visita Agendada':'visita','Aplicación':'aplicacion','Cerrado':'cerrado','Perdido':'perdido' }
  return <span className={`badge badge-${map[estado]||'nuevo'}`}>{estado}</span>
}
function QBadge({ status, score }) {
  const map = { 'CALIFICADO':'calificado','NO CALIFICADO':'nocalificado','REVISAR':'revisar' }
  return <span className={`badge badge-${map[status]||'revisar'}`}>{score ?? '?'}%</span>
}
