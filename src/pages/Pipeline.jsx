import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const COLS = [
  { id:'Nuevo',          label:'NUEVO',          color:'var(--c-nuevo)' },
  { id:'Contactado',     label:'CONTACTADO',      color:'var(--c-contactado)' },
  { id:'Calificando',    label:'CALIFICANDO',     color:'var(--c-calificando)' },
  { id:'Visita Agendada',label:'VISITA AGENDADA', color:'var(--c-visita)' },
  { id:'Aplicación',     label:'APLICACIÓN',      color:'var(--c-aplicacion)' },
  { id:'Cerrado',        label:'CERRADO',         color:'var(--c-cerrado)' },
  { id:'Perdido',        label:'PERDIDO',         color:'var(--c-perdido)' },
]

const FUENTE_COLORS = {
  'Facebook Marketplace':'#1877f2','WhatsApp':'#25d366','Instagram':'#e1306c',
  'Referral':'#d4a843','Walk-in':'#8b5cf6','Zillow':'#006aff','Other':'#888',
}

const Q_COLORS = { 'CALIFICADO':'var(--c-cerrado)', 'REVISAR':'var(--c-calificando)', 'NO CALIFICADO':'var(--c-perdido)' }

export default function Pipeline({ onNavigate }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads')
      .select('id,nombre,telefono,fuente,presupuesto,habitaciones,qualification_score,qualification_status,estado,created_at')
      .order('created_at', { ascending: false })
    setLeads(data||[])
    setLoading(false)
  }

  function onDragStart(e, leadId) {
    e.dataTransfer.setData('leadId', leadId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e, colId) { e.preventDefault(); setDragOver(colId) }
  function onDragLeave() { setDragOver(null) }
  async function onDrop(e, newEstado) {
    e.preventDefault(); setDragOver(null)
    const leadId = e.dataTransfer.getData('leadId')
    if (!leadId) return
    setLeads(prev => prev.map(l => l.id===leadId ? {...l,estado:newEstado} : l))
    await supabase.from('leads').update({ estado:newEstado }).eq('id', leadId)
  }

  const fmt = n => n ? `$${Number(n).toLocaleString()}` : null

  return (
    <div className="page" style={{paddingBottom:0}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">PIPE<span>LINE</span></h1>
          <p className="page-subtitle">{leads.length} leads · Drag & drop para mover</p>
        </div>
        <button className="btn btn-gold" onClick={() => onNavigate('leads')}>✦ NUEVO LEAD</button>
      </div>

      {loading ? <div className="empty-state"><p>Cargando...</p></div> : (
        <div className="kanban-board">
          {COLS.map(col => {
            const colLeads = leads.filter(l => l.estado === col.id)
            return (
              <div key={col.id} className={`kanban-col${dragOver===col.id?' drag-over':''}`}
                onDragOver={e => onDragOver(e, col.id)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, col.id)}>
                <div className="kanban-col-header">
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'50%',background:col.color}} />
                    <span className="kanban-col-title" style={{color:col.color}}>{col.label}</span>
                  </div>
                  <span className="kanban-col-count">{colLeads.length}</span>
                </div>
                <div className="kanban-cards">
                  {colLeads.length===0 && (
                    <div style={{textAlign:'center',padding:'18px 8px',color:'var(--text-muted)',fontSize:'10px',border:'1px dashed var(--border)',marginTop:'4px'}}>
                      Arrastrar aquí
                    </div>
                  )}
                  {colLeads.map(lead => (
                    <div key={lead.id} className="kanban-card" draggable
                      onDragStart={e => onDragStart(e, lead.id)}
                      style={{borderLeft:`2px solid ${col.color}55`}}>
                      <div className="kanban-card-name">{lead.nombre}</div>
                      <div className="kanban-card-meta">
                        {lead.telefono && <span>📞 {lead.telefono}</span>}
                        {lead.habitaciones && <span>{lead.habitaciones} hab buscadas</span>}
                      </div>
                      <div className="kanban-card-bottom">
                        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                          {fmt(lead.presupuesto) && (
                            <span className="kanban-card-budget" style={{margin:0}}>{fmt(lead.presupuesto)}</span>
                          )}
                          {lead.fuente && (
                            <span style={{fontSize:'9px',padding:'1px 5px',border:`1px solid ${FUENTE_COLORS[lead.fuente]||'#333'}55`,color:FUENTE_COLORS[lead.fuente]||'var(--text-muted)'}}>
                              {lead.fuente.split(' ')[0]}
                            </span>
                          )}
                        </div>
                        {lead.qualification_score != null && (
                          <span style={{fontSize:'10px',color:Q_COLORS[lead.qualification_status]||'var(--text-muted)',fontFamily:"'Bebas Neue',sans-serif"}}>
                            {lead.qualification_score}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
