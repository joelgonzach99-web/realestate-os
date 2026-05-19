import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Pipeline from './pages/Pipeline'
import NuevoLead from './pages/NuevoLead'
import Filtros from './pages/Filtros'
import Propiedades from './pages/Propiedades'
import Agenda from './pages/Agenda'
import AgenteIA from './pages/AgenteIA'

const PAGES = {
  dashboard: Dashboard,
  leads: Leads,
  pipeline: Pipeline,
  nuevo_lead: NuevoLead,
  filtros: Filtros,
  propiedades: Propiedades,
  agenda: Agenda,
  agente_ia: AgenteIA,
}

function App() {
  const [page, setPage] = useState('dashboard')

  const CurrentPage = PAGES[page] || Dashboard

  return (
    <div className="app">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="main-content">
        <CurrentPage onNavigate={setPage} />
      </main>
    </div>
  )
}

export default App
