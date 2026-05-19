import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const COLUMNS = [
  { id: 'Nuevo',       label: 'NUEVO',       color: 'var(--c-nuevo)' },
  { id: 'Calificando', label: 'CALIFICANDO', color: 'var(--c-calificando)' },
  { id: 'Visita',      label: 'VISITA',      color: 'var(--c-visita)' },
  { id: 'Aplicacion',  label: 'APLICACIÓN',  color: 'var(--c-aplicacion)' },
  { id: 'Cerrado',     label: 'CERRADO',     color: 'var(--c-cerrado)' },
  { id: 'Perdido',     label: 'PERDIDO',     color: 'var(--c-perdido)' },
]

export default function Pipeline({ onNavigate }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  function handleDragStart(e, leadId) {
    e.dataTransfer.setData('leadId', leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, colId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(colId)
  }

  function handleDragLeave() {
    setDragOver(null)
  }

  async function handleDrop(e, newEstado) {
    e.preventDefault()
    setDragOver(null)
    const leadId = e.dataTransfer.getData('leadId')
    if (!leadId) return

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, estado: newEstado } : l))
    await supabase.from('leads').update({ estado: newEstado }).eq('id', leadId)
  }

  const fmt = (n) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : null
  const byEstado = (estado) => leads.filter(l => l.estado === estado)

  return (
    <div className="page" style={{ paddingBottom: '16px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">PIPE<span>LINE</span></h1>
          <p className="page-subtitle">{leads.length} leads totales · Drag & drop para mover</p>
        </div>
        <button className="btn btn-gold" onClick={() => onNavigate('nuevo_lead')}>✦ NUEVO LEAD</button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colLeads = byEstado(col.id)
            const isOver = dragOver === col.id
            return (
              <div
                key={col.id}
                className={`kanban-col${isOver ? ' drag-over' : ''}`}
                onDragOver={e => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className="kanban-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <span className="kanban-col-title" style={{ color: col.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px' }}>
                      {col.label}
                    </span>
                  </div>
                  <span className="kanban-col-count">{colLeads.length}</span>
                </div>

                <div className="kanban-cards">
                  {colLeads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '11px', border: '1px dashed var(--border)', marginTop: '4px' }}>
                      Arrastrar aquí
                    </div>
                  )}
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="kanban-card"
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      style={{ borderLeft: `2px solid ${col.color}44` }}
                    >
                      <div className="kanban-card-name">{lead.nombre}</div>
                      <div className="kanban-card-meta">
                        {lead.telefono && <span>📞 {lead.telefono}</span>}
                        {lead.fuente && <span style={{ color: 'var(--text-muted)' }}>{lead.fuente}</span>}
                        {lead.habitaciones && <span>{lead.habitaciones} hab</span>}
                        {lead.fecha_mudanza && (
                          <span>Mudanza: {new Date(lead.fecha_mudanza).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                      {fmt(lead.presupuesto) && (
                        <div className="kanban-card-budget">{fmt(lead.presupuesto)}</div>
                      )}
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
