import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'

const FUENTES = ['Facebook Marketplace','WhatsApp','Instagram','Referral','Walk-in','Zillow','Other']
const ESTADOS = ['Nuevo','Contactado','Calificando','Visita Agendada','Aplicación','Cerrado','Perdido']
const ESTADO_BADGE = {
  'Nuevo':'nuevo','Contactado':'contactado','Calificando':'calificando',
  'Visita Agendada':'visita','Aplicación':'aplicacion','Cerrado':'cerrado','Perdido':'perdido',
}
const Q_COLORS = { 'CALIFICADO':'var(--c-cerrado)','REVISAR':'var(--c-calificando)','NO CALIFICADO':'var(--c-perdido)' }

function calcQualification(f) {
  if (f.realtor_previo === true) return { score:0, status:'NO CALIFICADO', alert:'⚠️ Este cliente ya tiene realtor — no puedes cerrar contigo.' }
  if (f.evictions === true) return { score:10, status:'NO CALIFICADO', alert:null }

  let pts = 0
  const cs = Number(f.credito_score||0)
  if (cs>=750) pts+=25; else if (cs>=700) pts+=20; else if (cs>=650) pts+=15; else if (cs>=620) pts+=8; else if (cs>0) pts+=3

  if (f.estados_cuenta===true) pts+=15
  if (f.comprobante_ingresos===true) pts+=25
  if (f.evictions===false) pts+=20
  if (f.fondos_disponibles===true) pts+=20
  if (f.mascotas===true) pts-=5

  const score = Math.max(0, Math.min(100, Math.round((pts/105)*100)))
  const status = score>=75 ? 'CALIFICADO' : score>=45 ? 'REVISAR' : 'NO CALIFICADO'
  return { score, status, alert:null }
}

const empty = {
  nombre:'', telefono:'', email:'', fuente:'Facebook Marketplace', estado:'Nuevo',
  fecha_mudanza:'', personas_vivir:'', presupuesto:'', habitaciones:'', notas:'',
  tiene_credito:null, credito_score:650, estados_cuenta:null, comprobante_ingresos:null,
  realtor_previo:null, mascotas:null, tipo_mascotas:'', evictions:null, fondos_disponibles:null,
}

export default function Leads({ onNavigate }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterQ, setFilterQ] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending:false })
    setLeads(data||[])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = leads.filter(l => {
    const s = search.toLowerCase()
    const matchSearch = !s || [l.nombre,l.telefono,l.email,l.fuente].join(' ').toLowerCase().includes(s)
    const matchEstado = filterEstado==='Todos' || l.estado===filterEstado
    const matchQ = filterQ==='Todos' || l.qualification_status===filterQ || (filterQ==='Sin calificar' && !l.qualification_status)
    return matchSearch && matchEstado && matchQ
  })

  function openCreate() { setEditLead(null); setShowModal(true) }
  function openEdit(lead) { setEditLead(lead); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditLead(null) }
  function afterSave() { closeModal(); fetch() }

  const fmt = n => n ? `$${Number(n).toLocaleString()}/mo` : '—'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">LEAD<span>S</span></h1>
          <p className="page-subtitle">{leads.length} leads · {filtered.length} mostrados</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>✦ NUEVO LEAD</button>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input type="text" placeholder="Buscar nombre, teléfono, email..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select style={{width:'auto',padding:'7px 10px'}} value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}>
          <option>Todos</option>
          {ESTADOS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={{width:'auto',padding:'7px 10px'}} value={filterQ} onChange={e=>setFilterQ(e.target.value)}>
          <option>Todos</option>
          <option>CALIFICADO</option>
          <option>REVISAR</option>
          <option>NO CALIFICADO</option>
          <option>Sin calificar</option>
        </select>
      </div>

      {loading ? <div className="empty-state"><p>Cargando...</p></div>
        : filtered.length===0 ? <div className="empty-state"><h3>SIN RESULTADOS</h3></div>
        : (
          <div className="table-wrap card" style={{padding:0}}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Teléfono</th><th>Fuente</th><th>Presupuesto</th>
                  <th>Hab</th><th>Estado</th><th>Score</th><th>Fecha</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} onClick={() => openEdit(lead)}>
                    <td style={{fontWeight:500}}>{lead.nombre}</td>
                    <td style={{color:'var(--text-mid)'}}>{lead.telefono||'—'}</td>
                    <td><FuenteTag fuente={lead.fuente} /></td>
                    <td style={{color:'var(--gold)'}}>{fmt(lead.presupuesto)}</td>
                    <td style={{color:'var(--text-muted)'}}>{lead.habitaciones||'—'}</td>
                    <td><span className={`badge badge-${ESTADO_BADGE[lead.estado]||'nuevo'}`}>{lead.estado}</span></td>
                    <td>
                      {lead.qualification_status
                        ? <span style={{fontSize:'11px',color:Q_COLORS[lead.qualification_status]}}>{lead.qualification_score}% · {lead.qualification_status}</span>
                        : <span style={{color:'var(--text-muted)',fontSize:'11px'}}>—</span>}
                    </td>
                    <td style={{color:'var(--text-muted)',fontSize:'11px'}}>{new Date(lead.created_at).toLocaleDateString('es-ES')}</td>
                    <td><button className="btn btn-sm" onClick={e=>{e.stopPropagation();openEdit(lead)}}>Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {showModal && <LeadModal lead={editLead} onClose={closeModal} onSaved={afterSave} />}
    </div>
  )
}

function LeadModal({ lead, onClose, onSaved }) {
  const isEdit = !!lead
  const [tab, setTab] = useState('basico')
  const [form, setForm] = useState(isEdit ? {
    ...empty, ...lead,
    credito_score: lead.credito_score ?? 650,
  } : { ...empty })
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(null)

  const qResult = calcQualification(form)
  const hasQData = form.realtor_previo!==null || form.evictions!==null || form.estados_cuenta!==null || form.fondos_disponibles!==null

  function set(k,v) { setForm(f => ({...f,[k]:v})) }

  function Toggle({ field, label, sub }) {
    return (
      <div className="toggle-row">
        <div className="toggle-label">{label}{sub&&<small>{sub}</small>}</div>
        <div className="toggle">
          <button type="button" className={`toggle-opt${form[field]===true?' yes':''}`} onClick={()=>set(field, form[field]===true?null:true)}>SÍ</button>
          <button type="button" className={`toggle-opt${form[field]===false?' no':''}`} onClick={()=>set(field, form[field]===false?null:false)}>NO</button>
        </div>
      </div>
    )
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setFlash({type:'error',msg:'Nombre es obligatorio.'}); return }
    setSaving(true); setFlash(null)

    const { score, status } = hasQData ? calcQualification(form) : { score:null, status:null }

    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono||null,
      email: form.email||null,
      fuente: form.fuente||null,
      estado: form.estado,
      fecha_mudanza: form.fecha_mudanza||null,
      personas_vivir: form.personas_vivir ? Number(form.personas_vivir) : null,
      presupuesto: form.presupuesto ? Number(form.presupuesto) : null,
      habitaciones: form.habitaciones ? Number(form.habitaciones) : null,
      tiene_credito: form.tiene_credito,
      credito_score: form.tiene_credito ? Number(form.credito_score)||null : null,
      estados_cuenta: form.estados_cuenta,
      comprobante_ingresos: form.comprobante_ingresos,
      realtor_previo: form.realtor_previo,
      mascotas: form.mascotas,
      tipo_mascotas: form.mascotas ? form.tipo_mascotas||null : null,
      evictions: form.evictions,
      fondos_disponibles: form.fondos_disponibles,
      qualification_score: score,
      qualification_status: status,
      notas: form.notas||null,
    }

    let error
    if (isEdit) {
      ({ error } = await supabase.from('leads').update(payload).eq('id', lead.id))
    } else {
      ({ error } = await supabase.from('leads').insert([payload]))
    }

    setSaving(false)
    if (error) { setFlash({type:'error',msg:error.message}); return }
    onSaved()
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar lead "${form.nombre}"?`)) return
    await supabase.from('leads').delete().eq('id', lead.id)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? `EDITAR — ${lead.nombre.toUpperCase()}` : 'NUEVO LEAD'}</span>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}
          {qResult.alert && <div className="alert-banner">{qResult.alert}</div>}

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab${tab==='basico'?' active':''}`} onClick={()=>setTab('basico')}>DATOS BÁSICOS</button>
            <button className={`tab${tab==='cal'?' active':''}`} onClick={()=>setTab('cal')}>
              CALIFICACIÓN {hasQData && <span style={{marginLeft:'6px',color:Q_COLORS[qResult.status]}}>{qResult.score}%</span>}
            </button>
          </div>

          {tab==='basico' && (
            <div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input type="text" placeholder="ej. María García" value={form.nombre} onChange={e=>set('nombre',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input type="tel" placeholder="(305) 555-0123" value={form.telefono} onChange={e=>set('telefono',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" placeholder="maria@email.com" value={form.email} onChange={e=>set('email',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuente</label>
                  <select value={form.fuente} onChange={e=>set('fuente',e.target.value)}>
                    {FUENTES.map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">¿Cuándo necesita mudarse?</label>
                  <input type="date" value={form.fecha_mudanza} onChange={e=>set('fecha_mudanza',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">¿Cuántas personas van a vivir?</label>
                  <input type="number" min="1" max="20" placeholder="ej. 3" value={form.personas_vivir} onChange={e=>set('personas_vivir',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Presupuesto mensual máximo (USD)</label>
                  <input type="number" placeholder="ej. 2500" value={form.presupuesto} onChange={e=>set('presupuesto',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Habitaciones buscadas</label>
                  <select value={form.habitaciones} onChange={e=>set('habitaciones',e.target.value)}>
                    <option value="">Sin especificar</option>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} hab</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado Pipeline</label>
                  <select value={form.estado} onChange={e=>set('estado',e.target.value)}>
                    {ESTADOS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Notas</label>
                  <textarea rows={3} placeholder="Detalles adicionales..." value={form.notas} onChange={e=>set('notas',e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {tab==='cal' && (
            <div>
              {/* Score display */}
              {hasQData && (
                <div style={{background:'var(--bg)',border:'1px solid var(--border)',padding:'16px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'20px'}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'52px',color:Q_COLORS[qResult.status]||'var(--gold)',lineHeight:1}}>{qResult.score}</div>
                    <div style={{fontSize:'10px',color:'var(--text-muted)'}}>SCORE</div>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'22px',color:Q_COLORS[qResult.status]}}>{qResult.status}</div>
                    {qResult.alert && <div style={{fontSize:'12px',color:'var(--c-perdido)',marginTop:'4px'}}>{qResult.alert}</div>}
                    <div style={{fontSize:'11px',color:'var(--text-muted)',marginTop:'4px'}}>
                      {qResult.status==='CALIFICADO'?'✓ Listo para mostrar propiedades':qResult.status==='REVISAR'?'Revisar documentación antes de continuar':'✕ No califica con el perfil actual'}
                    </div>
                  </div>
                </div>
              )}

              {/* Credit */}
              <div style={{marginBottom:'16px'}}>
                <Toggle field="tiene_credito" label="¿Tiene crédito?" sub="" />
                {form.tiene_credito===true && (
                  <div style={{marginTop:'10px',padding:'0 0 0 10px'}}>
                    <label className="form-label" style={{display:'block',marginBottom:'8px'}}>Credit score aproximado: <span className="score-display">{form.credito_score}</span></label>
                    <input type="range" className="score-slider" min="300" max="850" step="10"
                      value={form.credito_score} onChange={e=>set('credito_score',e.target.value)} />
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--text-muted)'}}>
                      <span>300</span>
                      <span style={{color:'var(--c-perdido)'}}>580</span>
                      <span style={{color:'var(--c-calificando)'}}>620</span>
                      <span style={{color:'var(--c-cerrado)'}}>700</span>
                      <span>850</span>
                    </div>
                  </div>
                )}
              </div>

              <Toggle field="estados_cuenta" label="¿Puede mostrar 2-3 meses de estados de cuenta?" sub="Bank statements del banco" />
              <Toggle field="comprobante_ingresos" label="¿Tiene comprobante de ingresos?" sub="El ingreso debe ser 3x el alquiler mensual" />
              <Toggle field="realtor_previo" label="¿Trabajó con otro realtor para este apartamento?" sub="Si dice SÍ → ALERTA: no puedes cerrar" />

              <div>
                <Toggle field="mascotas" label="¿Tiene mascotas?" sub="" />
                {form.mascotas===true && (
                  <div style={{marginTop:'8px',paddingLeft:'10px'}}>
                    <label className="form-label" style={{display:'block',marginBottom:'4px'}}>Tipo de mascota</label>
                    <input type="text" placeholder="ej. perro pequeño, 2 gatos..." value={form.tipo_mascotas} onChange={e=>set('tipo_mascotas',e.target.value)} style={{maxWidth:'300px'}} />
                  </div>
                )}
              </div>

              <Toggle field="evictions" label="¿Tiene evictions o desalojos previos?" sub="Historial de desalojos en Florida" />
              <Toggle field="fondos_disponibles" label="¿Tiene fondos para 1er mes + depósito + fee realtor?" sub="Típicamente 3x el precio del alquiler" />
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isEdit && <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>}
          <div style={{flex:1}} />
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? 'GUARDANDO...' : isEdit ? '✓ GUARDAR CAMBIOS' : '✦ CREAR LEAD'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FuenteTag({ fuente }) {
  const colors = { 'Facebook Marketplace':'#1877f2','WhatsApp':'#25d366','Instagram':'#e1306c','Referral':'#d4a843','Walk-in':'#8b5cf6','Zillow':'#006aff' }
  const c = colors[fuente]
  return (
    <span style={{display:'inline-block',padding:'2px 7px',fontSize:'10px',color:c||'var(--text-muted)',border:`1px solid ${c?c+'44':'var(--border)'}`,background:c?c+'12':'transparent'}}>
      {fuente||'—'}
    </span>
  )
}
