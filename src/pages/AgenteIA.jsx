import { useState } from 'react'

const MARKET_DATA = [
  { label: 'Precio Med. Miami', val: '$2,850/mo' },
  { label: 'Inventario Activo', val: '4,320 propiedades' },
  { label: 'Días en mercado', val: '28 días' },
  { label: 'Tasa de Vacancia', val: '4.2%' },
  { label: 'YoY Rent Growth', val: '+6.8%' },
  { label: 'Brickell Avg', val: '$3,400/mo' },
  { label: 'Doral Avg', val: '$2,600/mo' },
  { label: 'Hialeah Avg', val: '$2,100/mo' },
]

const INSIGHTS = [
  { title: 'DEMANDA ALTA', body: 'El inventario en Brickell está 18% por debajo del promedio anual. Alta competencia entre prospectos calificados.', color: 'var(--c-cerrado)' },
  { title: 'ESTACIONALIDAD', body: 'Temporada pico: Oct–Ene. Se anticipa aumento de demanda del 22% para Q4 2025.', color: 'var(--c-calificando)' },
  { title: 'OPORTUNIDAD', body: 'Doral y Hialeah muestran crecimiento sostenido. Ideal para clientes con presupuesto de $1,800–$2,400.', color: 'var(--c-aplicacion)' },
]

const CHAT_INIT = [
  { role: 'bot', text: 'Hola Joel / Dahiana 👋 Soy tu Agente IA de mercado. Puedo ayudarte con análisis de precios, tendencias, y estrategias para cerrar más deals. ¿En qué área de Miami te enfocas esta semana?' },
]

export default function AgenteIA() {
  const [messages, setMessages] = useState(CHAT_INIT)
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input.trim() }

    const botReplies = [
      'Basado en datos recientes de Miami-Dade, te recomiendo enfocarte en leads con presupuesto de $2,200+ para maximizar comisiones este mes.',
      'El área de Doral tiene alta demanda de familias con 2–3 habitaciones. Asegúrate de tener propiedades disponibles en ese rango.',
      'Leads de Facebook suelen tener menor intención de compra. Prioriza leads por Referral — tienen 3x más tasa de cierre.',
      'Con un credit score de 620+, la mayoría de propietarios en Brickell aprueban. Filtra tus leads y prioriza los calificados.',
      'El tiempo promedio para cerrar un deal en Miami es 45 días. ¡Mantén tu pipeline actualizado para no perder momentum!',
    ]

    const botMsg = { role: 'bot', text: botReplies[Math.floor(Math.random() * botReplies.length)] }
    setMessages(prev => [...prev, userMsg, botMsg])
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AGENTE <span>IA</span></h1>
          <p className="page-subtitle">Análisis de mercado Miami · Powered by AI</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-cerrado)', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Modelo activo</span>
        </div>
      </div>

      {/* Market metrics grid */}
      <div className="ai-grid" style={{ marginBottom: '20px' }}>
        <div className="ai-card">
          <div className="ai-card-title">MERCADO MIAMI — {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</div>
          {MARKET_DATA.map(m => (
            <div key={m.label} className="ai-metric">
              <span style={{ color: 'var(--text-mid)' }}>{m.label}</span>
              <span className="ai-metric-val">{m.val}</span>
            </div>
          ))}
        </div>

        <div className="ai-card">
          <div className="ai-card-title">INSIGHTS ACTIVOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {INSIGHTS.map(ins => (
              <div key={ins.title} style={{ borderLeft: `2px solid ${ins.color}`, paddingLeft: '12px' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", color: ins.color, fontSize: '14px', marginBottom: '4px' }}>{ins.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-mid)', lineHeight: '1.55' }}>{ins.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div>
        <h3 className="section-title" style={{ marginBottom: '12px' }}>CONSULTA AL AGENTE</h3>
        <div className="ai-chat">
          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role === 'bot' ? 'ai-msg-bot' : 'ai-msg-user'}`}>
                {m.role === 'bot' && (
                  <div style={{ fontSize: '9px', color: 'var(--gold)', marginBottom: '4px', letterSpacing: '0.1em' }}>◆ AGENTE IA</div>
                )}
                {m.text}
              </div>
            ))}
          </div>
          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Pregunta sobre el mercado, leads, propiedades..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button onClick={handleSend}>ENVIAR</button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px', lineHeight: '1.6' }}>
        ⚠ Los datos de mercado son ilustrativos. Para análisis en tiempo real, conecta con la API de Zillow, Rentometer, o CoStar.
        El chat IA será conectado con Claude API para respuestas reales.
      </div>
    </div>
  )
}
