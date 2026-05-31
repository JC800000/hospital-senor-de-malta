import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserMd, faClock, faPlay, faUsers, faStethoscope, faArrowRight, faRotateLeft
} from '@fortawesome/free-solid-svg-icons'
import { TICKETS, COLA_ESTADO, LLAMAR_SIGUIENTE_TICKET } from '../../graphql/queries/tickets'
import { INICIAR_CONSULTA, CONSULTA_ACTIVA } from '../../graphql/queries/consultas'
import { useAuth } from '../../context/AuthContext'
import { LoadingScreen } from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import TicketCard from '../../components/shared/TicketCard'

const TIMER_KEY = 'medicoTimerStart'

export default function PanelMedico() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [timerSecs, setTimerSecs] = useState(0)
  const [ticketActual, setTicketActual] = useState(null)

  const { data: colaData, refetch: refetchCola } = useQuery(COLA_ESTADO, {
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  })
  const { data: ticketsData, refetch: refetchTickets } = useQuery(TICKETS, {
    variables: { estado: 'esperando' },
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  })
  const { data: llamadosData } = useQuery(TICKETS, {
    variables: { estado: 'llamado' },
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  })

  const [llamarSiguiente, { loading: llamando }] = useMutation(LLAMAR_SIGUIENTE_TICKET, {
    onCompleted: (data) => {
      setTicketActual(data.llamarSiguienteTicket)
      // Guardar timestamp de inicio en sessionStorage para sobrevivir navegación
      sessionStorage.setItem(TIMER_KEY, Date.now().toString())
      refetchCola()
      refetchTickets()
    },
  })

  const [iniciarConsulta, { loading: iniciando }] = useMutation(INICIAR_CONSULTA, {
    onCompleted: (data) => {
      navigate(`/consulta/${data.iniciarConsulta.id}`)
    },
  })

  const { data: consultaActivaData } = useQuery(CONSULTA_ACTIVA, {
    variables: { medicoId: usuario?.id },
    skip: !usuario?.id,
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  })
  const consultaActiva = consultaActivaData?.consultaActiva

  // Timer que calcula desde el timestamp guardado — persiste al volver de /consulta
  useEffect(() => {
    const tick = () => {
      const start = sessionStorage.getItem(TIMER_KEY)
      if (start) setTimerSecs(Math.floor((Date.now() - parseInt(start)) / 1000))
      else setTimerSecs(0)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  // Si los datos confirman que no hay ticket llamado ni en consulta, limpiar el timer
  useEffect(() => {
    const ticketsLlamados = llamadosData?.tickets || []
    if (ticketsLlamados.length === 0 && !ticketActual && sessionStorage.getItem(TIMER_KEY)) {
      sessionStorage.removeItem(TIMER_KEY)
      setTimerSecs(0)
    }
  }, [llamadosData, ticketActual])

  // Reloj Bolivia (America/La_Paz UTC-4, sin horario de verano)
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

  const resetTimer = () => {
    sessionStorage.removeItem(TIMER_KEY)
    setTimerSecs(0)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const timerActivo = !!sessionStorage.getItem(TIMER_KEY)

  const cola = colaData?.colaEstado
  const ticketsEsperando = ticketsData?.tickets || []
  const ticketsLlamados = llamadosData?.tickets || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Panel Médico</h1>
        <p className="text-gray-500 text-sm">Dr. {usuario?.nombreCompleto}</p>
      </div>

      {/* Estado cola */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">{cola?.totalEspera ?? 0}</p>
            <p className="text-xs text-gray-500">En Espera</p>
          </div>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 flex items-center gap-3 ${timerActivo ? 'bg-emerald-600 border-emerald-500' : 'bg-white border-gray-100'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${timerActivo ? 'bg-white/20' : 'bg-emerald-50'}`}>
            <FontAwesomeIcon icon={faClock} className={timerActivo ? 'text-white' : 'text-emerald-600'} />
          </div>
          <div>
            <p className={`text-xl font-black font-mono tracking-wider ${timerActivo ? 'text-white' : 'text-gray-800'}`}>
              {formatTime(timerSecs)}
            </p>
            <p className={`text-xs ${timerActivo ? 'text-emerald-100' : 'text-gray-500'}`}>
              {timerActivo ? 'En consulta' : 'Sin consulta activa'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faClock} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">~{cola?.tiempoPromedioMin ?? 15} min</p>
            <p className="text-xs text-gray-500">Espera Promedio</p>
          </div>
        </div>
        {/* Reloj Bolivia */}
        <div className="bg-blue-900 rounded-xl shadow-sm p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faClock} className="text-blue-300" />
          </div>
          <div>
            <p className="text-xl font-black font-mono text-white tracking-widest">{boliviaTime}</p>
            <p className="text-xs text-blue-300">Bolivia · La Paz</p>
          </div>
        </div>
      </div>

      {/* Banner consulta activa (médico cerró la página sin finalizar) */}
      {consultaActiva && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faRotateLeft} className="text-white text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800">Consulta en progreso</p>
            <p className="text-amber-700 text-sm">
              {consultaActiva.paciente?.nombreCompleto} · Ticket {consultaActiva.ticket?.numero}
            </p>
          </div>
          <button
            onClick={() => navigate(`/consulta/${consultaActiva.id}`)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shrink-0"
          >
            <FontAwesomeIcon icon={faArrowRight} />
            Retomar
          </button>
        </div>
      )}

      {/* Ticket llamado / acción principal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faStethoscope} className="text-blue-500" />
          Acción Principal
        </h2>

        {ticketActual || ticketsLlamados.length > 0 ? (
          <div className="space-y-4">
            {(ticketActual || ticketsLlamados[0]) && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 font-medium mb-2">Ticket Llamado:</p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black text-blue-700">{(ticketActual || ticketsLlamados[0]).numero}</p>
                    <p className="text-gray-700 font-medium">{(ticketActual || ticketsLlamados[0]).paciente?.nombreCompleto}</p>
                    <p className="text-gray-500 text-sm">CI: {(ticketActual || ticketsLlamados[0]).paciente?.ci}</p>
                  </div>
                  <button
                    onClick={() => {
                      const t = ticketActual || ticketsLlamados[0]
                      iniciarConsulta({
                        variables: { ticketId: t.id, motivo: 'Consulta médica general' }
                      })
                    }}
                    disabled={iniciando}
                    className="px-5 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faArrowRight} />
                    Atender
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => { resetTimer(); llamarSiguiente({ variables: { medicoId: usuario?.id } }) }}
            disabled={llamando || ticketsEsperando.length === 0}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <FontAwesomeIcon icon={faPlay} className="text-xl" />
            {llamando ? 'Llamando...' : 'Llamar Siguiente Paciente'}
          </button>
        )}
      </div>

      {/* Cola */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-blue-500" />
          Cola de Espera ({ticketsEsperando.length})
        </h2>
        {ticketsEsperando.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No hay pacientes en espera</p>
        ) : (
          <div className="space-y-3">
            {ticketsEsperando.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
