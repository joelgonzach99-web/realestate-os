import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { callClaude, MIAMI_SYSTEM } from '../anthropic'

const QUICK_PROMPTS = [
  '¿Cuáles son los precios promedio de renta en Brickell este mes?',
  '¿Qué documentos necesita un tenant para aplicar en Florida?',
  '¿Cómo estructuro mis comisiones de realtor?',
  'Dame tips para cerrar más deals en Miami',
  '¿Cómo calificar un lead rápidamente?',
  '¿Qué hacer si el cliente ya tiene realtor?',
]

const MENTOR_STEPS = [
  { step:1, title:'Primer Contacto', desc:'Responde en menos de 1 hora. Saluda por WhatsApp, preséntate y pide la fecha de mudanza y presupuesto.' },
  { step:2, title:'Calificación', desc:'Verifica crédito (620+), ingresos 3x el alquiler, y que no tenga realtor previo. Sin esto, no avances.' },
  { step:3, title:'Mostrar Propiedades', desc:'Selecciona máximo 3 opciones que encajen. Agenda visita en menos de 48 horas.' },
  { step:4, title:'Visita', desc:'Sé puntual, conoce la propiedad, resalta amenidades. Cierra para aplicación en la misma visita si es posible.' },
  { step:5, title:'Aplicación', desc:'Ayuda con el paquete: ID + bank statements + pay stubs. Sigue up con el landlord diariamente.' },
  { step:6, title:'Cierre', desc:'Coordina firma de lease, recoge fee de realtor al momento de firma. Celebra con el cliente.' },
]

export default function AgenteIA() {
  const [messages, setMessages] = useState([
    { role:'bot', text:'Hola Joel / Dahiana 👋 Soy tu Agente IA de bienes raíces en Miami. Puedo ayudarte con precios de mercado, calificación de leads, estrategias de cierre, y más. ¿En qué te puedo ayudar hoy?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [activePanel, setActivePanel] = useState('chat')
  const messagesEndRef = useRef(null)
  const noKey = !import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => { fetchMetrics() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  async function fetchMetrics() {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const [{ data:leads }, { data:cierres }, { count:total }] = await Promise.all([
      supabase.from('leads').select('estado,fuente,created_at').gte('created_at', monthStart),
      supabase.from('cierres').select('comision,fecha_cierre').gte('fecha_cierre', monthStart.split('T')[0]),
      supabase.from('leads').select('*',{count:'exact',head:true}),
    ])
    const cerrados = (leads||[]).filter(l=>l.estado==='Cerrado').length
    const totalMes = (leads||[]).length
    const convRate = totalMes>0 ? Math.round((cerrados/totalMes)*100) : 0
    const comision = (cierres||[]).reduce((s,c)=>s+(c.comision||0),0)

    const fuentes = {}
    ;(leads||[]).forEach(l=>{ if(l.fuente) fuentes[l.fuente]=(fuentes[l.fuente]||0)+1 })
    const topFuente = Object.entries(fuentes).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'

    setMetrics({ leadesMes:totalMes, cerradosMes:cerrados, convRate, comision, topFuente, totalLeads:total||0 })
  }

  async function send(text) {
    if (noKey) { setMessages(p=>[...p,{role:'bot',text:'⚠️ Configura VITE_ANTHROPIC_API_KEY para usar el chat.'}]); return }
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(p=>[...p,{role:'user',text:msg},{role:'loading'}])
    setLoading(true)
    try {
      const history = messages.filter(m=>m.role!=='loading').slice(-10).map(m=>({
        role: m.role==='bot'?'assistant':'user', content:m.text
      }))
      history.push({ role:'user', content:msg })
      const response = await callClaude({ system:MIAMI_SYSTEM, messages:history, max_tokens:1024 })
      setMessages(p=>[...p.filter(m=>m.role!=='loading'),{role:'bot',text:response}])
    } catch(e) {
      setMessages(p=>[...p.filter(m=>m.role!=='loading'),{role:'bot',text:`Error: ${e.message}`}])
    } finally {
      setLoading(false)
    }
  }

  async function dailyBriefing() {
    await send('Dame un briefing del mercado de renta de Miami para hoy. Incluye: tendencias actuales, qué zonas tienen más demanda, tips para esta semana, y cualquier factor que deba considerar.')
  }

  const fmt = n => n ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n) : '$0'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AGENTE <span>IA</span></h1>
          <p className="page-subtitle">Miami Real Estate Intelligence · claude-sonnet-4-20250514</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'7px',height:'7px',borderRadius:'50%',background:noKey?'var(--c-perdido)':'var(--c-cerrado)',boxShadow:noKey?'none':'0 0 8px rgba(34,197,94,0.5)'}} />
          <span style={{fontSize:'11px',color:'var(--text-muted)'}}>{noKey?'API Key pendiente':'Modelo conectado'}</span>
        </div>
      </div>

      {noKey && (
        <div className="no-api-key" style={{marginBottom:'20px'}}>
          ⚠ Agrega <code>VITE_ANTHROPIC_API_KEY=sk-ant-...</code> a tu <code>.env.local</code> y reinicia el servidor para activar el Agente IA.
        </div>
      )}

      {/* Performance metrics */}
      {metrics && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'20px'}}>
          {[
            {label:'Leads Este Mes', val:metrics.leadesMes},
            {label:'Cerrados', val:metrics.cerradosMes},
            {label:'Conversión', val:`${metrics.convRate}%`},
            {label:'Comisión Mes', val:fmt(metrics.comision), small:true},
            {label:'Top Fuente', val:metrics.topFuente, small:true},
          ].map(m=>(
            <div key={m.label} className="stat-card">
              <div className="stat-label">{m.label}</div>
              <div className="stat-value" style={m.small?{fontSize:'18px',marginTop:'4px'}:{}}>{m.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Panel tabs */}
      <div className="tabs" style={{marginBottom:'16px'}}>
        {[{id:'chat',label:'CHAT IA'},{id:'mentor',label:'MODO MENTOR'},{id:'market',label:'MERCADO MIAMI'}].map(t=>(
          <button key={t.id} className={`tab${activePanel===t.id?' active':''}`} onClick={()=>setActivePanel(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* CHAT panel */}
      {activePanel==='chat' && (
        <div>
          <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'}}>
            <button className="btn btn-gold btn-sm" onClick={dailyBriefing} disabled={loading||noKey}>
              ◆ Briefing Diario
            </button>
            {QUICK_PROMPTS.map(p=>(
              <button key={p} className="btn btn-sm" onClick={()=>send(p)} disabled={loading||noKey}
                style={{fontSize:'10px'}}>
                {p.slice(0,30)}...
              </button>
            ))}
          </div>

          <div className="ai-chat-wrap">
            <div className="ai-chat-messages">
              {messages.map((m,i)=>(
                m.role==='loading'
                  ? <div key={i} className="ai-msg ai-msg-bot ai-msg-loading">
                      <div className="ai-dot"/><div className="ai-dot"/><div className="ai-dot"/>
                    </div>
                  : <div key={i} className={`ai-msg ai-msg-${m.role==='bot'?'bot':'user'}`}>
                      {m.role==='bot' && <div style={{fontSize:'9px',color:'var(--gold)',marginBottom:'4px',letterSpacing:'0.1em'}}>◆ AGENTE IA</div>}
                      <span style={{whiteSpace:'pre-wrap'}}>{m.text}</span>
                    </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="ai-chat-input">
              <input type="text" placeholder="Pregunta sobre leads, mercado, comisiones, estrategias..."
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() }}}
                disabled={loading||noKey} />
              <button className="ai-chat-send" onClick={()=>send()} disabled={loading||noKey||!input.trim()}>
                ENVIAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENTOR panel */}
      {activePanel==='mentor' && (
        <div>
          <div className="card" style={{marginBottom:'16px'}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'20px',color:'var(--gold)',marginBottom:'6px'}}>GUÍA DE CIERRE — 6 PASOS</div>
            <p style={{fontSize:'11px',color:'var(--text-muted)'}}>El proceso óptimo para cerrar un deal en Miami. Sigue estos pasos en orden.</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {MENTOR_STEPS.map(s=>(
              <div key={s.step} className="card" style={{display:'flex',gap:'16px',alignItems:'flex-start'}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'36px',color:'var(--gold)',lineHeight:1,flexShrink:0,width:'40px'}}>{s.step}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'18px',marginBottom:'4px'}}>{s.title}</div>
                  <div style={{fontSize:'12px',color:'var(--text-mid)',lineHeight:'1.6'}}>{s.desc}</div>
                </div>
                <button className="btn btn-sm" onClick={()=>{ setActivePanel('chat'); send(`Dame más detalles y tips específicos para el paso: "${s.title}" en el proceso de cierre de renta en Miami.`) }}
                  disabled={noKey}>
                  Preguntar IA →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKET panel */}
      {activePanel==='market' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
            <div className="card">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'18px',color:'var(--gold)',marginBottom:'14px'}}>PRECIOS PROMEDIO 2025</div>
              {[
                {zona:'Brickell',studio:'$2,100',one:'$2,800',two:'$3,500',three:'$4,500+'},
                {zona:'Downtown',studio:'$1,900',one:'$2,400',two:'$3,000',three:'$4,000'},
                {zona:'Wynwood',studio:'$2,200',one:'$2,700',two:'$3,500',three:'$4,200'},
                {zona:'Doral',studio:'$1,600',one:'$2,000',two:'$2,600',three:'$3,200'},
                {zona:'Coral Gables',studio:'—',one:'$2,400',two:'$3,200',three:'$4,000'},
                {zona:'Miami Beach',studio:'$2,400',one:'$3,000',two:'$4,000',three:'$6,000+'},
                {zona:'Hialeah',studio:'$1,400',one:'$1,700',two:'$2,100',three:'$2,600'},
              ].map(r=>(
                <div key={r.zona} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:'11px',gap:'4px'}}>
                  <span style={{color:'var(--text)'}}>{r.zona}</span>
                  <span style={{color:'var(--text-muted)',textAlign:'right'}}>Studio: {r.studio}</span>
                  <span style={{color:'var(--text-muted)',textAlign:'right'}}>1/1: {r.one}</span>
                  <span style={{color:'var(--text-muted)',textAlign:'right'}}>2/2: {r.two}</span>
                  <span style={{color:'var(--gold)',textAlign:'right'}}>3+: {r.three}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'18px',color:'var(--gold)',marginBottom:'14px'}}>DOCUMENTOS REQUERIDOS</div>
              {[
                {doc:'ID Oficial', detail:'Driver\'s license, pasaporte, ITIN'},
                {doc:'Bank Statements', detail:'Últimos 3 meses — debe mostrar fondos'},
                {doc:'Pay Stubs / W-2', detail:'Últimos 2 recibos ó tax return'},
                {doc:'Ingreso mínimo', detail:'2.5x–3x el alquiler mensual'},
                {doc:'Credit Score', detail:'620+ mínimo, 650+ preferido'},
                {doc:'Rental Application', detail:'Completar por cada adulto'},
                {doc:'Background Check', detail:'Autorización firmada'},
              ].map(d=>(
                <div key={d.doc} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:'11px'}}>
                  <span style={{color:'var(--text)'}}>{d.doc}</span>
                  <span style={{color:'var(--text-muted)',textAlign:'right',maxWidth:'55%'}}>{d.detail}</span>
                </div>
              ))}

              <div style={{marginTop:'16px',padding:'12px',background:'var(--gold-dim)',border:'1px solid var(--gold-border)'}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",color:'var(--gold)',marginBottom:'6px',fontSize:'14px'}}>COMISIÓN REALTOR</div>
                <div style={{fontSize:'11px',color:'var(--text-mid)',lineHeight:'1.7'}}>
                  • Estándar: 1 mes de renta (pagado por landlord)<br/>
                  • Si hay dos agentes: 50/50<br/>
                  • Se cobra al momento de firma del lease
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'18px',color:'var(--gold)',marginBottom:'12px'}}>ANÁLISIS IA DEL MERCADO</div>
            <button className="btn btn-gold" onClick={()=>{ setActivePanel('chat'); send('Dame un análisis detallado del mercado de renta de Miami actual. Incluye tendencias, zonas de mayor demanda, oportunidades para agentes, y predicciones para los próximos 3 meses.') }}
              disabled={noKey} style={{marginBottom:'12px'}}>
              ◆ Generar Análisis con IA
            </button>
            <p style={{fontSize:'11px',color:'var(--text-muted)',lineHeight:'1.7'}}>
              Datos actualizados a través del modelo de IA. Para datos en tiempo real, integra con Zillow API, Rentometer, o CoStar. El chat IA usa el conocimiento entrenado de Claude sobre el mercado de Miami.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
