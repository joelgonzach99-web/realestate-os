import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const BADGE_MAP = {
  Nuevo: 'nuevo', Calificando: 'calificando', Visita: 'visita',
  Aplicacion: 'aplicacion', Cerrado: 'cerrado', Perdido: 'perdido',
}

const emptyFiltro = {
  credito_score: '',
  estados_banco: null,
  comprobante_ingresos: null,
  realtor_previo: null,
  mascotas: null,
  evictions: null,
  aprobado: null,
  notas: '',
}

export default function Filtros() {
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [filtro, setFiltro] = useState(emptyFiltro)
  const [filtroId, setFiltroId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('id, nombre, estado, fuente, presupuesto').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function selectLead(lead) {
    setSelected(lead)
    setFlash(null)
    const { data } = await supabase.from('filtros_lead').select('*').eq('lead_id', lead.id).maybeSingle()
    if (data) {
      setFiltroId(data.id)
      setFiltro({
        credito_score: data.credito_score || '',
        estados_banco: data.estados_banco,
        comprobante_ingresos: data.comprobante_ingresos,
        realtor_previo: data.realtor_previo,
        mascotas: data.mascotas,
        evictions: data.evictions,
        aprobado: data.aprobado,
        notas: data.notas || '',
      })
    } else {
      setFiltroId(null)
      setFiltro(emptyFiltro)
    }
  }

  function setF(field, val) {
    setFiltro(f => ({ ...f, [field]: val }))
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setFlash(null)

    const payload = {
      lead_id: selected.id,
      credito_score: filtro.credito_score ? Number(filtro.credito_score) : null,
      estados_banco: filtro.estados_banco,
      comprobante_ingresos: filtro.comprobante_ingresos,
      realtor_previo: filtro.realtor_previo,
      mascotas: filtro.mascotas,
      evictions: filtro.evictions,
      aprobado: filtro.aprobado,
      notas: filtro.notas || null,
    }

    let error
    if (filtroId) {
      ;({ error } = await supabase.from('filtros_lead').update(payload).eq('id', filtroId))
    } else {
      const { data, error: e } = await supabase.from('filtros_lead').insert([payload]).select().single()
      error = e
      if (data) setFiltroId(data.id)
    }

    setSaving(false)
    if (error) {
      setFlash({ type: 'error', msg: `Error: ${error.message}` })
    } else {
      setFlash({ type: 'success', msg: '✓ Filtros guardados.' })
    }
  }

  const fmt = (n) => n ? `$${Number(n).toLocaleString()}` : '—'
  const filtered = leads.filter(l => !search || l.nombre.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page" style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">FILTROS <span>/ CALIFICACIÓN</span></h1>
          <p className="page-subtitle">Califica leads antes de continuar el proceso</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: 'calc(100vh - 160px)' }}>
        {/* Lead list */}
        <div style={{ overflowY: 'auto' }}>
          <div style={{ marginBottom: '10px' }}>
            <input type="text" placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px' }}>Cargando...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => selectLead(lead)}
                  style={{
                    background: selected?.id === lead.id ? 'var(--gold-dim)' : 'var(--bg-card)',
                    border: `1px solid ${selected?.id === lead.id ? 'var(--gold-border)' : 'var(--border)'}`,
                    padding: '12px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{lead.nombre}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge badge-${BADGE_MAP[lead.estado] || 'nuevo'}`}>{lead.estado}</span>
                    <span style={{ fontSize: '10px', color: 'var(--gold)' }}>{fmt(lead.presupuesto)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtro form */}
        <div style={{ overflowY: 'auto' }}>
          {!selected ? (
            <div className="empty-state" style={{ paddingTop: '80px' }}>
              <h3>SELECCIONA UN LEAD</h3>
              <p>Elige un lead de la lista para calificarlo</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'var(--text)' }}>{selected.nombre}</div>
                  <span className={`badge badge-${BADGE_MAP[selected.estado] || 'nuevo'}`}>{selected.estado}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{fmt(selected.presupuesto)}</div>
              </div>

              {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}

              <div className="card">
                <div className="form-section-title" style={{ marginBottom: '16px' }}>CALIFICACIÓN</div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Credit Score</label>
                  <input type="number" placeholder="ej. 650" min="300" max="850"
                    value={filtro.credito_score} onChange={e => setF('credito_score', e.target.value)}
                    style={{ maxWidth: '200px' }} />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  {[
                    { key: 'estados_banco', label: 'Estados de Banco', sub: '3 meses de extractos bancarios' },
                    { key: 'comprobante_ingresos', label: 'Comprobante de Ingresos', sub: 'Pay stubs, W-2, o tax returns' },
                    { key: 'realtor_previo', label: 'Realtor Previo', sub: '¿Tiene contrato con otro agente?' },
                    { key: 'mascotas', label: 'Mascotas', sub: '¿Tiene animales en casa?' },
                    { key: 'evictions', label: 'Evictions', sub: '¿Ha sido desalojado?' },
                  ].map(({ key, label, sub }) => (
                    <div key={key} className="toggle-row">
                      <div>
                        <div className="toggle-label">{label}</div>
                        {sub && <div className="toggle-label"><small>{sub}</small></div>}
                      </div>
                      <div className="toggle">
                        <button
                          type="button"
                          className={`toggle-opt ${filtro[key] === true ? 'active-yes' : ''}`}
                          onClick={() => setF(key, filtro[key] === true ? null : true)}
                        >SÍ</button>
                        <button
                          type="button"
                          className={`toggle-opt ${filtro[key] === false ? 'active-no' : ''}`}
                          onClick={() => setF(key, filtro[key] === false ? null : false)}
                        >NO</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div className="form-section-title" style={{ marginBottom: '10px', fontSize: '14px' }}>APROBACIÓN FINAL</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn ${filtro.aprobado === true ? 'btn-gold' : ''}`}
                      style={{ flex: 1, padding: '12px', justifyContent: 'center',
                        ...(filtro.aprobado === true ? {} : { borderColor: 'var(--c-cerrado)', color: 'var(--c-cerrado)' }),
                      }}
                      onClick={() => setF('aprobado', filtro.aprobado === true ? null : true)}
                    >
                      ✓ APROBADO
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '12px', justifyContent: 'center',
                        ...(filtro.aprobado === false
                          ? { background: 'rgba(239,68,68,0.1)', borderColor: 'var(--c-perdido)', color: 'var(--c-perdido)' }
                          : { borderColor: 'var(--c-perdido)', color: 'var(--c-perdido)' }),
                      }}
                      onClick={() => setF('aprobado', filtro.aprobado === false ? null : false)}
                    >
                      ✕ NO CALIFICA
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Notas de Calificación</label>
                  <textarea rows={3} placeholder="Observaciones adicionales..." value={filtro.notas} onChange={e => setF('notas', e.target.value)} />
                </div>

                <button className="btn btn-gold" onClick={handleSave} disabled={saving}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}>
                  {saving ? 'GUARDANDO...' : '◎ GUARDAR CALIFICACIÓN'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
