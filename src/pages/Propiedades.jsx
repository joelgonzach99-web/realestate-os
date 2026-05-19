import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ESTADOS_PROP = ['Disponible', 'En Proceso', 'Rentada', 'Vendida']

const emptyForm = {
  direccion: '', precio: '', habitaciones: '', banos: '',
  descripcion: '', estado: 'Disponible',
}

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(null)
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPropiedades() }, [])

  async function fetchPropiedades() {
    setLoading(true)
    const { data } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false })
    setPropiedades(data || [])
    setLoading(false)
  }

  function setF(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.direccion.trim()) {
      setFlash({ type: 'error', msg: 'La dirección es obligatoria.' })
      return
    }
    setSaving(true)
    setFlash(null)

    const payload = {
      ...form,
      precio: form.precio ? Number(form.precio) : null,
      habitaciones: form.habitaciones ? Number(form.habitaciones) : null,
      banos: form.banos ? Number(form.banos) : null,
    }

    const { error } = await supabase.from('propiedades').insert([payload])
    setSaving(false)
    if (error) {
      setFlash({ type: 'error', msg: `Error: ${error.message}` })
    } else {
      setFlash({ type: 'success', msg: '✓ Propiedad agregada.' })
      setForm(emptyForm)
      setShowForm(false)
      fetchPropiedades()
    }
  }

  async function deletePropiedad(id) {
    if (!confirm('¿Eliminar esta propiedad?')) return
    await supabase.from('propiedades').delete().eq('id', id)
    fetchPropiedades()
  }

  const fmt = (n) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—'

  const estadoColor = {
    Disponible: 'var(--c-cerrado)',
    'En Proceso': 'var(--c-calificando)',
    Rentada: 'var(--c-aplicacion)',
    Vendida: 'var(--c-visita)',
  }

  const filtered = propiedades.filter(p => {
    const matchSearch = !search || p.direccion.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'Todos' || p.estado === filterEstado
    return matchSearch && matchEstado
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">PROPIE<span>DADES</span></h1>
          <p className="page-subtitle">{propiedades.length} propiedades · {filtered.length} mostradas</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancelar' : '✦ AGREGAR PROPIEDAD'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="form-section-title">NUEVA PROPIEDAD</div>
          {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Dirección *</label>
                <input type="text" placeholder="ej. 1234 Brickell Ave, Miami FL 33131" value={form.direccion} onChange={e => setF('direccion', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Precio (USD/mes o total)</label>
                <input type="number" placeholder="ej. 2500" value={form.precio} onChange={e => setF('precio', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select value={form.estado} onChange={e => setF('estado', e.target.value)}>
                  {ESTADOS_PROP.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Habitaciones</label>
                <select value={form.habitaciones} onChange={e => setF('habitaciones', e.target.value)}>
                  <option value="">—</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Baños</label>
                <select value={form.banos} onChange={e => setF('banos', e.target.value)}>
                  <option value="">—</option>
                  {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Descripción</label>
                <textarea rows={3} placeholder="Detalles de la propiedad..." value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'GUARDANDO...' : '✦ GUARDAR'}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="filter-row">
        <div className="search-wrap" style={{ maxWidth: '300px' }}>
          <span className="search-icon">⌕</span>
          <input type="text" placeholder="Buscar por dirección..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['Todos', ...ESTADOS_PROP].map(s => (
            <button key={s} className="btn"
              onClick={() => setFilterEstado(s)}
              style={{ fontSize: '10px', padding: '5px 10px',
                ...(filterEstado === s ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-dim)' } : {}),
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>SIN PROPIEDADES</h3>
          <p>Agrega tu primera propiedad.</p>
        </div>
      ) : (
        <div className="prop-grid">
          {filtered.map(prop => (
            <div key={prop.id} className="prop-card">
              <div className="prop-img">
                <span>SIN FOTO</span>
              </div>
              <div className="prop-body">
                <div className="prop-price">{fmt(prop.precio)}</div>
                <div className="prop-address">{prop.direccion}</div>
                <div className="prop-specs">
                  {prop.habitaciones && <span>{prop.habitaciones} hab</span>}
                  {prop.banos && <span>{prop.banos} baños</span>}
                </div>
                {prop.descripcion && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                    {prop.descripcion.slice(0, 80)}{prop.descripcion.length > 80 ? '...' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '10px', color: estadoColor[prop.estado] || 'var(--text-muted)', background: `${estadoColor[prop.estado]}22`, border: `1px solid ${estadoColor[prop.estado]}44`, padding: '2px 8px' }}>
                    {prop.estado}
                  </span>
                  <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '10px' }}
                    onClick={() => deletePropiedad(prop.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
