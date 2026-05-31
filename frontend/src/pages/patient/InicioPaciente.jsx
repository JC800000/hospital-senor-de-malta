import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTicket, faCheckCircle, faArrowRight, faBell,
  faHospital, faWifi, faClock, faUsers
} from '@fortawesome/free-solid-svg-icons'
import { MIS_TICKETS_ACTIVOS } from '../../graphql/queries/tickets'
import { useAuth } from '../../context/AuthContext'

function getInitials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

function getBoliviaHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz', hour: 'numeric', hour12: false }))
}

function getGreeting() {
  const h = getBoliviaHour()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatCountdown(secs) {
  if (secs <= 0) return null
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const TURNO_LABEL = { manana: 'Turno Mañana', tarde: 'Turno Tarde' }

const ESTADO_BADGE = {
  esperando:  { label: 'En espera',           cls: 'bg-blue-100 text-blue-700' },
  llamado:    { label: '¡Te están llamando!', cls: 'bg-yellow-100 text-yellow-800' },
  atendiendo: { label: 'En consulta',          cls: 'bg-green-100 text-green-700' },
  atendido:   { label: 'Atendido',             cls: 'bg-gray-100 text-gray-500' },
}

export default function InicioPaciente() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  // Countdown basado en tiempoEsperaEst del backend
  const [secsLeft, setSecsLeft] = useState(null)
  const dataReceivedAt = useRef(null)
  const estimatedSecs = useRef(0)

  const { data, loading, error, refetch } = useQuery(MIS_TICKETS_ACTIVOS, {
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  })

  const tickets = data?.misTicketsActivos || []
  const ticketActivo = tickets.find(t => ['esperando', 'llamado', 'atendiendo'].includes(t.estado))
  const ticketsAtendidos = tickets.filter(t => t.estado === 'atendido')
  const nombre = usuario?.nombreCompleto || 'Paciente'

  // Reinicia countdown cuando llegan datos frescos
  useEffect(() => {
    if (ticketActivo?.estado === 'esperando' && ticketActivo.tiempoEsperaEst != null) {
      dataReceivedAt.current = Date.now()
      estimatedSecs.current = ticketActivo.tiempoEsperaEst * 60
      setSecsLeft(estimatedSecs.current)
    } else {
      setSecsLeft(null)
      dataReceivedAt.current = null
    }
  }, [ticketActivo?.tiempoEsperaEst, ticketActivo?.posicionCola, ticketActivo?.estado])

  // Ticker 1 segundo
  useEffect(() => {
    const interval = setInterval(() => {
      if (dataReceivedAt.current === null) return
      const elapsed = Math.floor((Date.now() - dataReceivedAt.current) / 1000)
      setSecsLeft(Math.max(0, estimatedSecs.current - elapsed))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-5 pb-4 pt-2">

      {/* Greeting */}
      <div className="flex items-center gap-4 pt-1">
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow">
          <span className="text-white font-black text-xl">{getInitials(nombre)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-300 text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-xl font-black text-white leading-tight truncate">{nombre}</h1>
        </div>
      </div>

      {/* Estado */}
      {error && !data ? (
        <div className="rounded-2xl p-6 text-center border border-red-400/30 bg-red-500/10">
          <p className="text-red-300 font-semibold text-sm mb-1">Error al cargar tickets</p>
          <p className="text-red-300/70 text-xs mb-3">{error.message}</p>
          <button onClick={refetch} className="px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-xs font-semibold hover:bg-red-500/30">
            Reintentar
          </button>
        </div>
      ) : loading && !data ? (
        <div className="rounded-2xl p-8 text-center border border-white/10 bg-white/10">
          <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-blue-200/70 text-sm">Cargando tu información...</p>
        </div>

      ) : ticketActivo ? (
        /* ── Ticket activo — diseño tipo ficha física ── */
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">

          {/* Header de confirmación */}
          <div className="bg-gradient-to-b from-blue-50 to-white px-5 pt-6 pb-2 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3 shadow-md">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xl" />
            </div>
            <p className="font-black text-gray-800 text-lg">¡Ticket asignado!</p>
            <p className="text-gray-400 text-xs mt-0.5">Guarda este número para presentarte</p>

            {/* Status badge si no es esperando */}
            {ticketActivo.estado !== 'esperando' && (
              <span className={`inline-block mt-3 px-3 py-1.5 rounded-full text-sm font-semibold ${ESTADO_BADGE[ticketActivo.estado]?.cls}`}>
                {ticketActivo.estado === 'llamado' && <FontAwesomeIcon icon={faBell} className="mr-1.5" />}
                {ESTADO_BADGE[ticketActivo.estado]?.label}
              </span>
            )}
          </div>

          {/* Ficha con borde punteado */}
          <div className="mx-4 mb-4 rounded-2xl border-2 border-dashed border-blue-200 overflow-hidden">

            {/* Cabecera hospital */}
            <div className="px-5 py-3 border-b border-dashed border-blue-100 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faHospital} className="text-blue-800 text-base" />
              <p className="text-blue-900 font-black text-xs tracking-widest uppercase">
                Hospital Señor de Malta
              </p>
            </div>

            {/* Número de turno */}
            <div className="px-5 py-5 text-center border-b border-dashed border-blue-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Tu número de turno
              </p>
              <div className="flex items-start justify-center leading-none">
                <span className="text-4xl font-black text-blue-700 mt-2 mr-1">T-</span>
                <span className="text-8xl font-black text-blue-700 leading-none">
                  {ticketActivo.numero.replace('T-', '')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {TURNO_LABEL[ticketActivo.turno] || ticketActivo.turno} · {new Date(ticketActivo.fechaEmision).toLocaleDateString('es-BO')}
              </p>
            </div>

            {/* Stats: tiempo + posición */}
            {ticketActivo.estado === 'esperando' && (
              <div className="px-4 py-4 border-b border-dashed border-blue-100">
                <div className="grid grid-cols-2 gap-3">
                  {/* Countdown */}
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <FontAwesomeIcon icon={faClock} className="text-blue-400 text-xs mb-1.5" />
                    {secsLeft !== null && secsLeft > 0 ? (
                      <>
                        <p className="text-2xl font-black text-blue-800 font-mono leading-none">
                          {formatCountdown(secsLeft)}
                        </p>
                        <p className="text-[10px] text-blue-400 mt-1">
                          {Math.floor(secsLeft / 60)}m {secsLeft % 60}s restantes
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-black text-blue-800 text-sm">~{ticketActivo.tiempoEsperaEst} min</p>
                        <p className="text-[10px] text-blue-400 mt-0.5">
                          {secsLeft === 0 ? 'Llegando pronto' : 'Espera estimada'}
                        </p>
                      </>
                    )}
                    <p className="text-[10px] text-blue-500 mt-0.5 font-medium">Espera estimada</p>
                  </div>

                  {/* Posición */}
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <FontAwesomeIcon icon={faUsers} className="text-blue-400 text-xs mb-1.5" />
                    <p className="text-2xl font-black text-blue-800 leading-none">{Math.max(0, ticketActivo.posicionCola - 1)}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5 font-medium">Pacientes antes</p>
                  </div>
                </div>

                <button onClick={refetch}
                  className="w-full mt-3 py-2 text-blue-500 text-xs font-semibold border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                  Actualizar estado
                </button>
              </div>
            )}

            {ticketActivo.estado === 'llamado' && (
              <div className="px-4 py-4 border-b border-dashed border-blue-100">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <FontAwesomeIcon icon={faBell} className="text-yellow-500 text-2xl mb-2" />
                  <p className="text-yellow-800 font-bold">¡Es tu turno!</p>
                  <p className="text-yellow-600 text-sm mt-1">Dirígete a la ventanilla de atención</p>
                </div>
              </div>
            )}

            {ticketActivo.estado === 'atendiendo' && (
              <div className="px-4 py-4 border-b border-dashed border-blue-100">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 font-bold">Estás siendo atendido/a</p>
                </div>
              </div>
            )}

            {/* Tipo + paciente + hora */}
            <div className="px-5 py-3 space-y-2">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={ticketActivo.tipo === 'remoto' ? faWifi : faTicket} className="text-xs" />
                  {ticketActivo.tipo === 'presencial' ? 'Ticket Presencial' : 'Ticket Remoto — Portal Web'}
                </span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm">{ticketActivo.paciente?.nombreCompleto || nombre}</p>
                <p className="text-xs text-gray-400">
                  Emitido: {new Date(ticketActivo.fechaEmision).toLocaleTimeString('es-BO', {
                    timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })} hrs
                </p>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* Sin ticket activo */
        <div className="rounded-2xl p-7 text-center border border-white/15 bg-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTicket} className="text-blue-300 text-2xl" />
          </div>
          <p className="text-white font-bold text-lg">Sin ticket activo</p>
          <p className="text-blue-300 text-sm mt-1.5">Saca un ticket para ser atendido en el hospital</p>
          <button
            onClick={() => navigate('/portal/ticket')}
            className="mt-5 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-blue-400 transition-colors shadow-lg"
          >
            Sacar ticket <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}

      {/* Visitas anteriores */}
      {ticketsAtendidos.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/10">
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-sm" />
            <h2 className="font-semibold text-white text-sm">Visitas anteriores</h2>
          </div>
          <div className="divide-y divide-white/5">
            {ticketsAtendidos.map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">{t.numero}</p>
                  <p className="text-xs text-blue-300/70">
                    {new Date(t.fechaEmision).toLocaleDateString('es-BO', { dateStyle: 'medium' })}
                  </p>
                </div>
                <span className="text-xs font-medium text-green-300 bg-green-500/15 border border-green-400/20 px-2.5 py-1 rounded-full">
                  Atendido
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
