import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTicket, faPrescriptionBottle, faSignOutAlt, faHospital, faHome } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'

export default function PatientLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const [boliviaTime, setBoliviaTime] = useState('')
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('es-BO', {
      timeZone: 'America/La_Paz',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
    setBoliviaTime(fmt())
    const iv = setInterval(() => setBoliviaTime(fmt()), 1000)
    return () => clearInterval(iv)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/portal')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `
          linear-gradient(rgba(255,255,255,0.025) 2px, transparent 2px) 0 0 / 38px 38px fixed,
          linear-gradient(90deg, rgba(255,255,255,0.025) 2px, transparent 2px) 0 0 / 38px 38px fixed,
          linear-gradient(160deg, #071a38 0%, #0F2D5E 55%, #1a4f8a 100%)
        `,
      }}
    >
      {/* Header */}
      <header
        className="text-white p-4 sticky top-0 z-10"
        style={{
          background: 'rgba(7, 26, 56, 0.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faHospital} className="text-blue-300 text-base" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Hospital Señor de Malta</p>
              <p className="text-white/50 text-xs">Portal del Paciente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Reloj Bolivia */}
            <div className="text-right hidden sm:block">
              <p className="text-white font-mono font-bold text-sm tracking-widest leading-none">{boliviaTime}</p>
              <p className="text-white/40 text-[10px]">La Paz</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-white/50 hover:text-white/90 text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-28">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10"
        style={{
          background: 'rgba(7, 26, 56, 0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-md mx-auto flex">
          <NavLink
            to="/portal/inicio"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3.5 gap-1 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-300' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <FontAwesomeIcon icon={faHome} className="text-base" />
            Inicio
          </NavLink>
          <NavLink
            to="/portal/ticket"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3.5 gap-1 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-300' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <FontAwesomeIcon icon={faTicket} className="text-base" />
            Mi Ticket
          </NavLink>
          <NavLink
            to="/portal/recetas"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3.5 gap-1 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-300' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <FontAwesomeIcon icon={faPrescriptionBottle} className="text-base" />
            Mis Recetas
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
