import { useState } from 'react'
import { supabase } from '../supabase'

const FUENTES = ['Facebook', 'WhatsApp', 'Referral', 'Walk-in', 'Instagram', 'Zillow', 'Otro']
const ESTADOS = ['Nuevo', 'Calificando', 'Visita', 'Aplicacion', 'Cerrado', 'Perdido']

const emptyForm = {
  nombre: '', telefono: '', email: '', fuente: 'Facebook',
  presupuesto: '', fecha_mudanza: '', habitaciones: '',
  estado: 'Nuevo', notas: '',
}

export default function NuevoLead({ onNavigate }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState(null)

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setFlash({ type: 'error', msg: 'El nombre es obligatorio.' })
      return
    }
    setLoading(true)
    setFlash(null)

    const payload = {
      ...form,
      presupuesto: form.presupuesto ? Number(form.presupuesto) : null,
      habitaciones: form.habitaciones ? Number(form.habitaciones) : null,
      fecha_mudanza: form.fecha_mudanza || null,
    }

    const { error } = await supabase.from('leads').insert([payload])
    setLoading(false)

    if (error) {
      setFlash({ type: 'error', msg: `Error: ${error.message}` })
    } else {
      setFlash({ type: 'success', msg: '✓ Lead creado exitosamente.' })
      setForm(emptyForm)
      setTimeout(() => onNavigate('leads'), 1400)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">NUEVO <span>LEAD</span></h1>
          <p className="page-subtitle">Ingresa la información del nuevo prospecto</p>
        </div>
        <button className="btn" onClick={() => onNavigate('leads')}>← Volver a Leads</button>
      </div>

      {flash && (
        <div className={`flash flash-${flash.type}`}>{flash.msg}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          {/* Main form */}
          <div>
            <div className="form-section">
              <div className="form-section-title">INFORMACIÓN PERSONAL</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input type="text" placeholder="ej. María García" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input type="tel" placeholder="ej. (305) 555-0123" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" placeholder="ej. maria@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuente</label>
                  <select value={form.fuente} onChange={e => set('fuente', e.target.value)}>
                    {FUENTES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">BÚSQUEDA</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Presupuesto (USD)</label>
                  <input type="number" placeholder="ej. 1800" min="0" value={form.presupuesto} onChange={e => set('presupuesto', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Habitaciones</label>
                  <select value={form.habitaciones} onChange={e => set('habitaciones', e.target.value)}>
                    <option value="">Sin especificar</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} hab</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Mudanza</label>
                  <input type="date" value={form.fecha_mudanza} onChange={e => set('fecha_mudanza', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado Inicial</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}>
                    {ESTADOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Notas</label>
                  <textarea placeholder="Detalles adicionales sobre el lead..." rows={4} value={form.notas} onChange={e => set('notas', e.target.value)} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div>
            <div className="card" style={{ marginBottom: '14px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', color: 'var(--gold)', marginBottom: '14px', letterSpacing: '0.06em' }}>
                PREVIEW
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <PreviewRow label="Nombre" val={form.nombre || '—'} />
                <PreviewRow label="Teléfono" val={form.telefono || '—'} />
                <PreviewRow label="Email" val={form.email || '—'} />
                <PreviewRow label="Fuente" val={form.fuente} />
                <PreviewRow label="Presupuesto" val={form.presupuesto ? `$${Number(form.presupuesto).toLocaleString()}` : '—'} gold />
                <PreviewRow label="Habitaciones" val={form.habitaciones ? `${form.habitaciones} hab` : '—'} />
                <PreviewRow label="Estado" val={form.estado} />
              </div>
            </div>

            <button type="submit" className="btn btn-gold" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px', letterSpacing: '0.08em' }}>
              {loading ? 'GUARDANDO...' : '✦ CREAR LEAD'}
            </button>

            <button type="button" className="btn" onClick={() => setForm(emptyForm)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px', fontSize: '11px' }}>
              Limpiar formulario
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function PreviewRow({ label, val, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '11px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: gold ? 'var(--gold)' : 'var(--text)', textAlign: 'right', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
    </div>
  )
}
