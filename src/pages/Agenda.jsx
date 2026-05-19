import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

const emptyForm = {
  lead_id: '', propiedad_id: '', fecha: '', hora: '', notas: '',
}

export default function Agenda() {
  const [visitas, setVisitas] = useState([])
  const [leads, setLeads] = useState([])
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(null)
  const [filter, setFilter] = useState('proximas')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: v }, { data: l }, { data: p }] = await Promise.all([
      supabase.from('visitas')
        .select('*, leads(nombre, telefono), propiedades(direccion)')
        .order('fecha', { ascending: true }),
      supabase.from('leads').select('id, nombre').order('nombre'),
      supabase.from('propiedades').select('id, direccion').order('direccion'),
    ])
    setVisitas(v || [])
    setLeads(l || [])
    setPropiedades(p || [])
    setLoading(false)
  }

  function setF(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.lead_id || !form.fecha) {
      setFlash({ type: 'error', msg: 'Lead y fecha son obligatorios.' })
      return
    }
    setSaving(true)
    setFlash(null)

    const payload = {
      lead_id: form.lead_id || null,
      propiedad_id: form.propiedad_id || null,
      fecha: form.fecha,
      hora: form.hora || null,
      notas: form.notas || null,
    }

    const { error } = await supabase.from('visitas').insert([payload])
    setSaving(false)
    if (error) {
      setFlash({ type: 'error', msg: `Error: ${error.message}` })
    } else {
      setFlash({ type: 'success', msg: '✓ Visita agendada.' })
      setForm(emptyForm)
      setShowForm(false)
      fetchAll()
    }
  }

  async function deleteVisita(id) {
    if (!confirm('¿Eliminar esta visita?')) return
    await supabase.from('visitas').delete().eq('id', id)
    fetchAll()
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = visitas.filter(v => {
    if (filter === 'proximas') return v.fecha >= today
    if (filter === 'pasadas') return v.fecha < today
    return true
  })

  const fmt = (fechaStr) => {
    if (!fechaStr) return { day: '—', month: '' }
    const d = new Date(fechaStr + 'T00:00:00')
    return { day: d.getDate(), month: MESES[d.getMonth()] }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AGEN<span>DA</span></h1>
          <p className="page-subtitle">{visitas.length} visitas registradas</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancelar' : '✦ AGENDAR VISITA'}
        </button>
      </div>

      {/* New visit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="form-section-title">NUEVA VISITA</div>
          {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Lead *</label>
                <select value={form.lead_id} onChange={e => setF('lead_id', e.target.value)} required>
                  <option value="">Seleccionar lead...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Propiedad</label>
                <select value={form.propiedad_id} onChange={e => setF('propiedad_id', e.target.value)}>
                  <option value="">Seleccionar propiedad...</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.direccion}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input type="date" value={form.fecha} onChange={e => setF('fecha', e.target.value)} required min={today} />
              </div>
              <div className="form-group">
                <label className="form-label">Hora</label>
                <input type="time" value={form.hora} onChange={e => setF('hora', e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label">Notas</label>
                <textarea rows={2} placeholder="Instrucciones, detalles..." value={form.notas} onChange={e => setF('notas', e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'GUARDANDO...' : '◷ AGENDAR'}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[
          { id: 'proximas', label: 'Próximas' },
          { id: 'todas', label: 'Todas' },
          { id: 'pasadas', label: 'Pasadas' },
        ].map(({ id, label }) => (
          <button key={id} className="btn"
            onClick={() => setFilter(id)}
            style={{ fontSize: '11px',
              ...(filter === id ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-dim)' } : {}),
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>SIN VISITAS</h3>
          <p>No hay visitas {filter === 'proximas' ? 'próximas' : filter === 'pasadas' ? 'pasadas' : ''} registradas.</p>
        </div>
      ) : (
        <div className="agenda-list">
          {filtered.map(visita => {
            const { day, month } = fmt(visita.fecha)
            const isPast = visita.fecha < today
            const leadNombre = visita.leads?.nombre || 'Lead desconocido'
            const propDir = visita.propiedades?.direccion || 'Sin propiedad'

            return (
              <div key={visita.id} className="agenda-item" style={{ opacity: isPast ? 0.6 : 1 }}>
                <div className="agenda-date-box">
                  <div className="agenda-day">{day}</div>
                  <div className="agenda-month">{month}</div>
                </div>

                <div className="agenda-details">
                  <div className="agenda-lead">{leadNombre}</div>
                  <div className="agenda-prop">{propDir}</div>
                  {visita.notas && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{visita.notas}</div>
                  )}
                </div>

                {visita.hora && (
                  <div className="agenda-time">{visita.hora.slice(0,5)}</div>
                )}

                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '10px', flexShrink: 0 }}
                  onClick={() => deleteVisita(visita.id)}>
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
