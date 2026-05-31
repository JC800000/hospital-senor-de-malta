import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartPie, faTicket, faUserPlus, faUserMd, faStethoscope,
  faHeartbeat, faPills, faClipboardList, faUsers, faChartBar,
  faFileImport, faSignOutAlt, faBars, faTimes, faHospital, faIdCard
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',       icon: faChartPie,     roles: ['director'] },
  { path: '/recepcion',   label: 'Recepción',        icon: faTicket,       roles: ['director', 'administrativo'] },
  { path: '/pacientes',   label: 'Pacientes',        icon: faIdCard,       roles: ['director', 'administrativo', 'medico', 'especialista'] },
  { path: '/historiales', label: 'Historiales',      icon: faClipboardList,roles: ['director', 'medico', 'especialista', 'administrativo'] },
  { path: '/medico',      label: 'Panel Médico',     icon: faUserMd,       roles: ['medico'] },
  { path: '/especialista',label: 'Panel Especialista',icon: faHeartbeat,   roles: ['especialista'] },
  { path: '/farmacia',    label: 'Farmacia',         icon: faPills,        roles: ['farmacia', 'director'] },
  { path: '/medicos',     label: 'Gestión Médicos',  icon: faUsers,        roles: ['director'] },
  { path: '/reportes',    label: 'Reportes',         icon: faChartBar,     roles: ['director', 'administrativo'] },
  { path: '/migracion',   label: 'Migración',        icon: faFileImport,   roles: ['director'] },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = NAV_ITEMS.filter(item => item.roles.includes(usuario?.rol))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faHospital} className="text-blue-400 text-2xl" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Hospital</p>
            <p className="text-white/60 text-xs">Señor de Malta</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-blue-500/25 border-r-2 border-blue-400 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-white text-sm font-medium truncate">{usuario?.nombreCompleto}</p>
          <p className="text-white/50 text-xs">{usuario?.rolDisplay}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors w-full"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside
        className="hidden lg:flex w-64 flex-shrink-0 flex-col"
        style={{ background: 'var(--hospital-dark)' }}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative w-64 flex flex-col z-10"
            style={{ background: 'var(--hospital-dark)' }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <span className="font-semibold text-gray-800">Hospital Señor de Malta</span>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
