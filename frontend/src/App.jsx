import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import AdminLayout from './layouts/AdminLayout'
import PatientLayout from './layouts/PatientLayout'

import Login from './pages/staff/Login'
import Dashboard from './pages/staff/Dashboard'
import GestionMedicos from './pages/staff/GestionMedicos'
import Reportes from './pages/staff/Reportes'
import Recepcion from './pages/staff/Recepcion'
import RegistroPaciente from './pages/staff/RegistroPaciente'
import EmisionTicket from './pages/staff/EmisionTicket'
import PanelMedico from './pages/staff/PanelMedico'
import ConsultaMedica from './pages/staff/ConsultaMedica'
import PanelEspecialista from './pages/staff/PanelEspecialista'
import Farmacia from './pages/staff/Farmacia'
import HistorialMedico from './pages/staff/HistorialMedico'
import Migracion from './pages/staff/Migracion'
import Pacientes from './pages/staff/Pacientes'

import LoginPaciente from './pages/patient/LoginPaciente'
import InicioPaciente from './pages/patient/InicioPaciente'
import TicketRemoto from './pages/patient/TicketRemoto'
import MisRecetas from './pages/patient/MisRecetas'

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, usuario } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(usuario?.rol)) {
    return <Navigate to={usuario?.panelDestino || '/login'} replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<Login />} />
      <Route path="/portal" element={<LoginPaciente />} />

      {/* Staff — layout compartido, protección por rol en cada grupo */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>

          {/* Solo director */}
          <Route element={<ProtectedRoute allowedRoles={['director']} />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/medicos"    element={<GestionMedicos />} />
            <Route path="/migracion"  element={<Migracion />} />
          </Route>

          {/* Director + Administrativo */}
          <Route element={<ProtectedRoute allowedRoles={['director', 'administrativo']} />}>
            <Route path="/reportes" element={<Reportes />} />
          </Route>

          {/* Director + Administrativo */}
          <Route element={<ProtectedRoute allowedRoles={['director', 'administrativo']} />}>
            <Route path="/recepcion"                      element={<Recepcion />} />
            <Route path="/registro-paciente"              element={<RegistroPaciente />} />
            <Route path="/emision-ticket/:pacienteId"     element={<EmisionTicket />} />
          </Route>

          {/* Médico */}
          <Route element={<ProtectedRoute allowedRoles={['medico', 'director']} />}>
            <Route path="/medico"                   element={<PanelMedico />} />
            <Route path="/consulta/:consultaId"     element={<ConsultaMedica />} />
          </Route>

          {/* Especialista */}
          <Route element={<ProtectedRoute allowedRoles={['especialista', 'director']} />}>
            <Route path="/especialista" element={<PanelEspecialista />} />
          </Route>

          {/* Farmacia */}
          <Route element={<ProtectedRoute allowedRoles={['farmacia', 'director']} />}>
            <Route path="/farmacia" element={<Farmacia />} />
          </Route>

          {/* Pacientes — directorio */}
          <Route element={<ProtectedRoute allowedRoles={['director', 'administrativo', 'medico', 'especialista']} />}>
            <Route path="/pacientes" element={<Pacientes />} />
          </Route>

          {/* Historiales — varios roles */}
          <Route element={<ProtectedRoute allowedRoles={['director', 'medico', 'especialista', 'administrativo']} />}>
            <Route path="/historiales" element={<HistorialMedico />} />
          </Route>

        </Route>
      </Route>

      {/* Portal paciente */}
      <Route element={<ProtectedRoute allowedRoles={['paciente_portal']} />}>
        <Route element={<PatientLayout />}>
          <Route path="/portal/inicio"  element={<InicioPaciente />} />
          <Route path="/portal/ticket"  element={<TicketRemoto />} />
          <Route path="/portal/recetas" element={<MisRecetas />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
