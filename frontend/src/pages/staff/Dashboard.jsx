import { useQuery } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faTicket, faStethoscope, faPills,
  faUserMd, faChartBar, faCheckCircle, faHourglassHalf
} from '@fortawesome/free-solid-svg-icons'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js'
import { REPORTE_RESUMEN } from '../../graphql/queries/reportes'
import { USUARIOS } from '../../graphql/queries/auth'
import { Spinner } from '../../components/ui/Spinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const ROL_LABELS = {
  director: { label: 'Director', bg: 'bg-blue-100', text: 'text-blue-700' },
  administrativo: { label: 'Administrativo', bg: 'bg-purple-100', text: 'text-purple-700' },
  medico: { label: 'Médico', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  especialista: { label: 'Especialista', bg: 'bg-amber-100', text: 'text-amber-700' },
  farmacia: { label: 'Farmacia', bg: 'bg-pink-100', text: 'text-pink-700' },
}

function KpiCard({ value, label, icon, bg, iconColor, sub, subIcon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
          <FontAwesomeIcon icon={icon} className={`text-lg ${iconColor}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value ?? <span className="text-gray-300">—</span>}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub !== undefined && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          {subIcon && <FontAwesomeIcon icon={subIcon} />}
          {sub}
        </p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const today      = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const { data: resumenData, loading } = useQuery(REPORTE_RESUMEN, {
    variables: { fechaInicio: monthStart, fechaFin: today },
  })
  const { data: personalData } = useQuery(USUARIOS, { variables: {} })

  const resumen  = resumenData?.reporteResumen
  const personal = personalData?.usuarios || []

  const medicos      = personal.filter(u => u.rol === 'medico')
  const especialistas = personal.filter(u => u.rol === 'especialista')

  const donutData = {
    labels: ['Pendientes', 'Despachadas'],
    datasets: [{
      data: [resumen?.recetasPendientes ?? 0, resumen?.recetasDespachadas ?? 0],
      backgroundColor: ['#F59E0B', '#10B981'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  const barData = {
    labels: ['Pacientes', 'Tickets', 'Consultas', 'Finalizadas', 'Rec. Pend.', 'Rec. Desp.'],
    datasets: [{
      label: 'Este mes',
      data: [
        resumen?.totalPacientes ?? 0,
        resumen?.totalTickets ?? 0,
        resumen?.totalConsultas ?? 0,
        resumen?.consultasFinalizadas ?? 0,
        resumen?.recetasPendientes ?? 0,
        resumen?.recetasDespachadas ?? 0,
      ],
      backgroundColor: ['#3B82F6','#10B981','#8B5CF6','#06B6D4','#F59E0B','#EC4899'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  }

  const barOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#F3F4F6' } },
      x: { grid: { display: false } },
    },
  }

  const donutOpts = {
    responsive: true,
    cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {loading && <Spinner />}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          value={resumen?.totalPacientes}
          label="Pacientes registrados"
          icon={faUsers}
          bg="bg-blue-50" iconColor="text-blue-500"
        />
        <KpiCard
          value={resumen?.ticketsHoy}
          label="Tickets hoy"
          icon={faTicket}
          bg="bg-emerald-50" iconColor="text-emerald-500"
          sub={`${resumen?.totalTickets ?? 0} en el mes`}
        />
        <KpiCard
          value={resumen?.totalConsultas}
          label="Consultas del mes"
          icon={faStethoscope}
          bg="bg-violet-50" iconColor="text-violet-500"
          sub={`${resumen?.consultasFinalizadas ?? 0} finalizadas`}
          subIcon={faCheckCircle}
        />
        <KpiCard
          value={resumen?.recetasPendientes}
          label="Recetas pendientes"
          icon={faPills}
          bg="bg-amber-50" iconColor="text-amber-500"
          sub={`${resumen?.recetasDespachadas ?? 0} despachadas`}
          subIcon={faHourglassHalf}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartBar} className="text-blue-500" />
            Resumen General del Mes
          </h2>
          <Bar data={barData} options={barOpts} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-4">Estado de Recetas</h2>
          <div className="flex-1 flex items-center justify-center">
            <Doughnut data={donutData} options={donutOpts} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
            <div className="bg-amber-50 rounded-xl py-2">
              <p className="font-bold text-amber-600">{resumen?.recetasPendientes ?? 0}</p>
              <p className="text-amber-500 text-xs">Pendientes</p>
            </div>
            <div className="bg-emerald-50 rounded-xl py-2">
              <p className="font-bold text-emerald-600">{resumen?.recetasDespachadas ?? 0}</p>
              <p className="text-emerald-500 text-xs">Despachadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal del sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserMd} className="text-blue-500" />
            Médicos ({medicos.length})
          </h2>
          <div className="space-y-2">
            {medicos.length === 0 && <p className="text-gray-400 text-sm">Sin médicos registrados</p>}
            {medicos.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.nombreCompleto}</p>
                  <p className="text-xs text-gray-400">{m.especialidad || 'Medicina General'} · CI {m.ci}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faStethoscope} className="text-violet-500" />
            Especialistas ({especialistas.length})
          </h2>
          <div className="space-y-2">
            {especialistas.length === 0 && <p className="text-gray-400 text-sm">Sin especialistas registrados</p>}
            {especialistas.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.nombreCompleto}</p>
                  <p className="text-xs text-gray-400">{e.especialidad || '—'} · CI {e.ci}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.activo ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                  {e.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Todo el personal */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Todo el Personal</h2>
        <div className="flex flex-wrap gap-3">
          {personal.filter(u => !['medico','especialista'].includes(u.rol)).map(u => {
            const cfg = ROL_LABELS[u.rol] || { label: u.rol, bg: 'bg-gray-100', text: 'text-gray-600' }
            return (
              <div key={u.id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {u.nombres?.[0]}{u.apellidos?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-tight">{u.nombreCompleto}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
