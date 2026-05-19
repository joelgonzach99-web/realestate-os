const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

export async function callClaude({ system, messages, max_tokens = 2048 }) {
  if (!API_KEY) throw new Error('VITE_ANTHROPIC_API_KEY not configured')
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: MODEL, max_tokens, system, messages }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ data: reader.result.split(',')[1], media_type: file.type })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const MIAMI_SYSTEM = `You are the AI assistant for Joel and Dahiana's Miami real estate rental business. You are an expert in the Miami rental market.

MIAMI RENTAL MARKET (2025):
- Brickell: $2,800–$4,500/mo (studio $2,100, 1/1 $2,800, 2/2 $3,500, 3/2 $4,500+)
- Downtown Miami: $2,000–$3,500/mo
- Wynwood: $2,500–$3,800/mo
- Doral: $1,800–$3,200/mo (family-friendly, top schools)
- Coral Gables: $2,400–$4,000/mo (upscale, quiet)
- Miami Beach: $2,800–$6,000+/mo
- Hialeah: $1,500–$2,400/mo (affordable, high demand)
- Kendall: $1,800–$2,800/mo

FLORIDA TENANT REQUIREMENTS:
- Government-issued ID (DL, passport)
- Last 3 months bank statements
- Last 2 pay stubs OR most recent tax return
- Income must be 2.5x–3x monthly rent
- Credit check: 620+ minimum, 650+ preferred
- Full background check

FEES & COMMISSIONS:
- Realtor fee: typically 1 month's rent (paid by landlord)
- Security deposit: 1–2 months
- Move-in total: first month + deposit + realtor fee ≈ 3x rent
- Joel & Dahiana collect realtor fee at lease signing

FAIR HOUSING (FL): Cannot discriminate by race, color, religion, sex, national origin, disability, familial status.

CLOSING BEST PRACTICES:
- Respond within 1 hour on WhatsApp
- Qualify before showing properties
- Always get ID + income proof before scheduling tour
- Follow up at day 1, 3, 7 after first contact
- Miami is relationship-driven — build trust first
- WhatsApp is the #1 communication channel
- Facebook Marketplace = high volume, lower quality leads
- Referrals close 3x faster than cold leads

You speak Spanish and English. Be direct, practical, help Joel and Dahiana close more deals.`
