import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { callClaude, fileToBase64 } from '../anthropic'

const ZONAS = ['Brickell','Downtown','Wynwood','Doral','Coral Gables','Miami Beach','Hialeah','Kendall','Other']
const ESTADOS_PROP = ['Disponible','Rentado','Pendiente']
const AMENIDADES_LIST = [
  {key:'pool',label:'🏊 Pool'},
  {key:'gym',label:'🏋️ Gym'},
  {key:'parking',label:'🅿️ Parking'},
  {key:'laundry',label:'🫧 Laundry'},
  {key:'pet_friendly',label:'🐾 Pet Friendly'},
  {key:'furnished',label:'🛋️ Furnished'},
  {key:'balcony',label:'🌅 Balcony'},
  {key:'concierge',label:'🛎️ Concierge'},
  {key:'doorman',label:'🚪 Doorman'},
]

const emptyForm = {
  direccion:'', edificio:'', zona:'Brickell', precio_renta:'', habitaciones:'', banos:'', sqft:'', piso:'',
  amenidades:{}, descripcion_es:'', descripcion_en:'', estado:'Disponible', video_url:'', mls_number:'',
}

export default function Propiedades() {
  const [props, setProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProp, setEditProp] = useState(null)
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterZona, setFilterZona] = useState('Todas')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchProps() }, [])

  async function fetchProps() {
    setLoading(true)
    const { data } = await supabase.from('propiedades').select('*').order('created_at', { ascending:false })
    setProps(data||[])
    setLoading(false)
  }

  function openCreate() { setEditProp(null); setShowForm(true) }
  function openEdit(p) { setEditProp(p); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditProp(null) }
  function afterSave() { closeForm(); fetchProps() }

  async function deleteProp(id) {
    if (!confirm('¿Eliminar esta propiedad?')) return
    await supabase.from('propiedades').delete().eq('id', id)
    fetchProps()
  }

  const fmt = n => n ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n) : '—'
  const estadoColor = { 'Disponible':'var(--c-cerrado)','Rentado':'var(--c-perdido)','Pendiente':'var(--c-calificando)' }

  const filtered = props.filter(p => {
    const matchSearch = !search || p.direccion.toLowerCase().includes(search.toLowerCase()) || (p.edificio||'').toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado==='Todos' || p.estado===filterEstado
    const matchZona = filterZona==='Todas' || p.zona===filterZona
    return matchSearch && matchEstado && matchZona
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">PROPIE<span>DADES</span></h1>
          <p className="page-subtitle">{props.length} propiedades · {filtered.length} mostradas</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>✦ AGREGAR PROPIEDAD</button>
      </div>

      <div className="filter-row">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input type="text" placeholder="Buscar dirección, edificio..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select style={{width:'auto',padding:'7px 10px'}} value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}>
          <option>Todos</option>
          {ESTADOS_PROP.map(s=><option key={s}>{s}</option>)}
        </select>
        <select style={{width:'auto',padding:'7px 10px'}} value={filterZona} onChange={e=>setFilterZona(e.target.value)}>
          <option>Todas</option>
          {ZONAS.map(z=><option key={z}>{z}</option>)}
        </select>
      </div>

      {loading ? <div className="empty-state"><p>Cargando...</p></div>
        : filtered.length===0 ? <div className="empty-state"><h3>SIN PROPIEDADES</h3><p>Agrega la primera propiedad.</p></div>
        : (
          <div className="prop-grid">
            {filtered.map(p => (
              <div key={p.id} className="prop-card">
                {p.fotos_urls?.length > 0
                  ? <div className="prop-gallery" onClick={()=>openEdit(p)}>
                      <img src={p.fotos_urls[0]} alt="" />
                      {p.fotos_urls.length>1 && <div className="prop-gallery-count">+{p.fotos_urls.length-1} fotos</div>}
                    </div>
                  : <div className="prop-gallery-empty" onClick={()=>openEdit(p)}>SIN FOTO</div>
                }
                <div className="prop-body">
                  <div className="prop-price">{fmt(p.precio_renta)}<span style={{fontSize:'13px',color:'var(--text-muted)',fontFamily:"'DM Mono',monospace"}}>/mo</span></div>
                  {p.edificio && <div style={{fontSize:'11px',color:'var(--gold)',marginBottom:'2px'}}>{p.edificio}</div>}
                  <div className="prop-address">{p.direccion}</div>
                  <div className="prop-zona">{p.zona}{p.piso ? ` · Piso ${p.piso}` : ''}</div>
                  <div className="prop-specs">
                    {p.habitaciones && <span>{p.habitaciones} hab</span>}
                    {p.banos && <span>{p.banos} baños</span>}
                    {p.sqft && <span>{p.sqft.toLocaleString()} sqft</span>}
                  </div>
                  {p.amenidades && Object.keys(p.amenidades).filter(k=>p.amenidades[k]).length>0 && (
                    <div className="prop-amenidades">
                      {AMENIDADES_LIST.filter(a=>p.amenidades[a.key]).map(a=>(
                        <span key={a.key} className="amenidad-tag">{a.label}</span>
                      ))}
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'10px'}}>
                    <span style={{fontSize:'10px',padding:'2px 8px',color:estadoColor[p.estado],border:`1px solid ${estadoColor[p.estado]}44`,background:`${estadoColor[p.estado]}12`}}>
                      {p.estado}
                    </span>
                    <div style={{display:'flex',gap:'5px'}}>
                      <button className="btn btn-sm" onClick={()=>openEdit(p)}>Editar</button>
                      <button className="btn btn-sm btn-danger" onClick={()=>deleteProp(p.id)}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {showForm && <PropModal prop={editProp} onClose={closeForm} onSaved={afterSave} />}
    </div>
  )
}

function PropModal({ prop, onClose, onSaved }) {
  const isEdit = !!prop
  const [form, setForm] = useState(isEdit ? { ...emptyForm, ...prop, amenidades: prop.amenidades||{} } : { ...emptyForm })
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState(isEdit ? (prop.fotos_urls||[]).map(u=>({url:u,file:null})) : [])
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiTab, setAiTab] = useState('es')
  const [postModal, setPostModal] = useState(null)
  const fileRef = useRef()

  function set(k,v) { setForm(f=>({...f,[k]:v})) }
  function toggleAmenidad(key) { set('amenidades', {...form.amenidades,[key]:!form.amenidades[key]}) }

  function handleFiles(selected) {
    const arr = Array.from(selected)
    const newPreviews = arr.map(f=>({ url:URL.createObjectURL(f), file:f }))
    setFiles(prev=>[...prev,...arr])
    setPreviews(prev=>[...prev,...newPreviews])
  }

  function removePreview(i) {
    const p = [...previews]; const f=[...files]
    if (p[i].file) { const fi=f.indexOf(p[i].file); if(fi>-1) f.splice(fi,1); setFiles(f) }
    p.splice(i,1); setPreviews(p)
  }

  async function handleSave() {
    if (!form.direccion.trim()) { setFlash({type:'error',msg:'La dirección es obligatoria.'}); return }
    setSaving(true); setFlash(null)

    const propId = isEdit ? prop.id : crypto.randomUUID()

    // Upload new files
    let newUrls = []
    if (files.length>0) {
      for (const file of files) {
        const path = `${propId}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('propiedades').upload(path, file, {upsert:true})
        if (!error) {
          const { data:{publicUrl} } = supabase.storage.from('propiedades').getPublicUrl(path)
          newUrls.push(publicUrl)
        }
      }
    }

    // Keep existing URLs from previews (those without a file object)
    const existingUrls = previews.filter(p=>!p.file).map(p=>p.url)
    const allUrls = [...existingUrls, ...newUrls]

    const payload = {
      id: propId,
      direccion: form.direccion.trim(),
      edificio: form.edificio||null,
      zona: form.zona||null,
      precio_renta: form.precio_renta ? Number(form.precio_renta) : null,
      habitaciones: form.habitaciones ? Number(form.habitaciones) : null,
      banos: form.banos ? Number(form.banos) : null,
      sqft: form.sqft ? Number(form.sqft) : null,
      piso: form.piso ? Number(form.piso) : null,
      amenidades: form.amenidades,
      descripcion_es: form.descripcion_es||null,
      descripcion_en: form.descripcion_en||null,
      estado: form.estado,
      fotos_urls: allUrls,
      video_url: form.video_url||null,
      mls_number: form.mls_number||null,
    }

    let error
    if (isEdit) {
      ({ error } = await supabase.from('propiedades').update(payload).eq('id', prop.id))
    } else {
      ({ error } = await supabase.from('propiedades').insert([payload]))
    }

    setSaving(false)
    if (error) { setFlash({type:'error',msg:error.message}); return }
    onSaved()
  }

  async function generateDescription() {
    setAiLoading(true); setAiResult(null); setFlash(null)
    try {
      const amenList = AMENIDADES_LIST.filter(a=>form.amenidades[a.key]).map(a=>a.label).join(', ')
      const details = `Dirección: ${form.direccion||'N/A'}, Edificio: ${form.edificio||'N/A'}, Zona: ${form.zona}, Precio: $${form.precio_renta}/mes, Habitaciones: ${form.habitaciones||'N/A'}, Baños: ${form.banos||'N/A'}, Sqft: ${form.sqft||'N/A'}, Piso: ${form.piso||'N/A'}, Amenidades: ${amenList||'N/A'}`

      // Build message content with optional images
      const imageFiles = files.slice(0, 3)
      const textContent = { type:'text', text:`Eres un copywriter profesional de bienes raíces en Miami. Crea una descripción de listing PROFESIONAL y ATRACTIVA para esta propiedad en renta.\n\nDetalles: ${details}\n\nResponde con un JSON con este formato exacto:\n{"headline_es":"...","descripcion_es":"...","headline_en":"...","descripcion_en":"..."}` }

      let content
      if (imageFiles.length > 0) {
        const images = await Promise.all(imageFiles.map(async f => {
          const { data, media_type } = await fileToBase64(f)
          return { type:'image', source:{ type:'base64', media_type, data } }
        }))
        content = [...images, textContent]
      } else {
        content = [textContent]
      }

      const raw = await callClaude({
        system: 'Eres un experto en marketing de bienes raíces en Miami. Escribes en español e inglés. Siempre responde con JSON válido.',
        messages: [{ role:'user', content }],
        max_tokens: 1500,
      })

      const json = JSON.parse(raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim())
      setAiResult(json)
      set('descripcion_es', `${json.headline_es}\n\n${json.descripcion_es}`)
      set('descripcion_en', `${json.headline_en}\n\n${json.descripcion_en}`)
    } catch (e) {
      setFlash({type:'error', msg:`Error IA: ${e.message}`})
    } finally {
      setAiLoading(false)
    }
  }

  async function generatePost(type) {
    setAiLoading(true)
    try {
      const amenList = AMENIDADES_LIST.filter(a=>form.amenidades[a.key]).map(a=>a.label).join(' | ')
      const details = `Dirección: ${form.direccion}, Zona: ${form.zona}, Precio: $${form.precio_renta}/mes, ${form.habitaciones} hab / ${form.banos} baños, ${form.sqft||''}sqft${form.piso?', Piso '+form.piso:''}, Amenidades: ${amenList}`

      const prompt = type==='facebook'
        ? `Crea un post de Facebook Marketplace para esta propiedad en renta en Miami. Usa emojis, hazlo atractivo y profesional. Incluye precio, características clave, contacto: "📱 Joel: (305) 000-0000 | Dahiana: (305) 000-0000". Incluye hashtags relevantes al final.\n\nPropiedad: ${details}`
        : `Crea un mensaje corto de WhatsApp para esta propiedad. Máximo 200 caracteres. Incluye: zona, precio, habitaciones, y "Joel: (305) 000-0000".\n\nPropiedad: ${details}`

      const text = await callClaude({
        system: 'Eres un agente de bienes raíces en Miami experto en marketing digital. Generas posts listos para copiar y pegar.',
        messages: [{ role:'user', content: prompt }],
        max_tokens: 600,
      })
      setPostModal({ type, text })
    } catch(e) {
      setFlash({type:'error',msg:`Error IA: ${e.message}`})
    } finally {
      setAiLoading(false)
    }
  }

  const noApiKey = !import.meta.env.VITE_ANTHROPIC_API_KEY

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:'900px'}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'EDITAR PROPIEDAD' : 'NUEVA PROPIEDAD'}</span>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}
          {noApiKey && <div className="no-api-key">⚠ VITE_ANTHROPIC_API_KEY no configurada — funciones de IA desactivadas</div>}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            {/* Left col */}
            <div>
              <div className="form-section-title">INFORMACIÓN</div>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div className="form-group">
                  <label className="form-label">Dirección *</label>
                  <input type="text" placeholder="1234 Brickell Ave, Miami FL 33131" value={form.direccion} onChange={e=>set('direccion',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Edificio / Complejo</label>
                  <input type="text" placeholder="ej. Icon Brickell" value={form.edificio} onChange={e=>set('edificio',e.target.value)} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  <div className="form-group">
                    <label className="form-label">Zona</label>
                    <select value={form.zona} onChange={e=>set('zona',e.target.value)}>
                      {ZONAS.map(z=><option key={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select value={form.estado} onChange={e=>set('estado',e.target.value)}>
                      {ESTADOS_PROP.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Renta/mes</label>
                    <input type="number" placeholder="2500" value={form.precio_renta} onChange={e=>set('precio_renta',e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sqft</label>
                    <input type="number" placeholder="850" value={form.sqft} onChange={e=>set('sqft',e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Habitaciones</label>
                    <select value={form.habitaciones} onChange={e=>set('habitaciones',e.target.value)}>
                      <option value="">—</option>
                      {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Baños</label>
                    <select value={form.banos} onChange={e=>set('banos',e.target.value)}>
                      <option value="">—</option>
                      {[1,'1.5',2,'2.5',3,'3.5',4].map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Piso</label>
                    <input type="number" placeholder="12" min="1" max="100" value={form.piso} onChange={e=>set('piso',e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MLS #</label>
                    <input type="text" placeholder="A12345" value={form.mls_number} onChange={e=>set('mls_number',e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{marginBottom:'8px'}}>Amenidades</label>
                  <div className="amenidades-grid">
                    {AMENIDADES_LIST.map(a=>(
                      <label key={a.key} className={`amenidad-check${form.amenidades[a.key]?' checked':''}`}>
                        <input type="checkbox" checked={!!form.amenidades[a.key]} onChange={()=>toggleAmenidad(a.key)} />
                        {a.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Video URL</label>
                  <input type="url" placeholder="https://youtube.com/..." value={form.video_url} onChange={e=>set('video_url',e.target.value)} />
                </div>
              </div>
            </div>

            {/* Right col */}
            <div>
              {/* Photo upload */}
              <div className="form-section-title">FOTOS / VIDEOS</div>
              <div className="photo-dropzone" onClick={()=>fileRef.current?.click()}>
                <div style={{fontSize:'22px',marginBottom:'6px'}}>📸</div>
                <div>Click para seleccionar fotos o videos</div>
                <div style={{fontSize:'10px',marginTop:'4px',color:'var(--text-muted)'}}>JPG, PNG, MP4 · Múltiples archivos</div>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{display:'none'}}
                  onChange={e=>handleFiles(e.target.files)} />
              </div>
              {previews.length>0 && (
                <div className="photo-grid">
                  {previews.map((p,i)=>(
                    <div key={i} className="photo-thumb">
                      <img src={p.url} alt="" />
                      <button className="photo-remove" onClick={()=>removePreview(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Tools */}
              <div className="ai-tools">
                <div className="ai-tools-title">◆ HERRAMIENTAS IA</div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button className="btn btn-gold" onClick={generateDescription} disabled={aiLoading||noApiKey}>
                    {aiLoading?'Generando...':'✨ Generar con IA'}
                  </button>
                  <button className="btn" onClick={()=>generatePost('facebook')} disabled={aiLoading||noApiKey}>
                    📘 Post Facebook
                  </button>
                  <button className="btn" onClick={()=>generatePost('whatsapp')} disabled={aiLoading||noApiKey}>
                    📱 Template WhatsApp
                  </button>
                </div>

                {aiResult && (
                  <div style={{marginTop:'12px'}}>
                    <div className="ai-output-tabs">
                      <button className={`ai-output-tab${aiTab==='es'?' active':''}`} onClick={()=>setAiTab('es')}>Español</button>
                      <button className={`ai-output-tab${aiTab==='en'?' active':''}`} onClick={()=>setAiTab('en')}>English</button>
                    </div>
                    <div className="ai-output">
                      {aiTab==='es' ? `${aiResult.headline_es}\n\n${aiResult.descripcion_es}` : `${aiResult.headline_en}\n\n${aiResult.descripcion_en}`}
                    </div>
                    <button className="copy-btn" onClick={()=>navigator.clipboard.writeText(aiTab==='es'?`${aiResult.headline_es}\n\n${aiResult.descripcion_es}`:`${aiResult.headline_en}\n\n${aiResult.descripcion_en}`)}>
                      📋 Copiar
                    </button>
                  </div>
                )}
              </div>

              {/* Manual descriptions */}
              <div style={{marginTop:'14px'}}>
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Descripción Español</label>
                  <textarea rows={4} placeholder="Descripción en español..." value={form.descripcion_es} onChange={e=>set('descripcion_es',e.target.value)} style={{resize:'vertical'}} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción English</label>
                  <textarea rows={4} placeholder="Description in English..." value={form.descripcion_en} onChange={e=>set('descripcion_en',e.target.value)} style={{resize:'vertical'}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? 'GUARDANDO...' : isEdit ? '✓ GUARDAR CAMBIOS' : '✦ CREAR PROPIEDAD'}
          </button>
        </div>
      </div>

      {/* Post modal */}
      {postModal && (
        <div className="modal-overlay" style={{zIndex:300}} onClick={()=>setPostModal(null)}>
          <div className="modal" style={{maxWidth:'560px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{postModal.type==='facebook'?'📘 POST FACEBOOK':'📱 TEMPLATE WHATSAPP'}</span>
              <button className="btn btn-icon" onClick={()=>setPostModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="post-output">{postModal.text}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-gold" onClick={()=>{navigator.clipboard.writeText(postModal.text);setPostModal(null)}}>
                📋 COPIAR Y CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
