import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTicket, faClock, faUsers, faWifi, faHospital,
  faBell, faCheckCircle, faSun, faMoon
} from '@fortawesome/free-solid-svg-icons'
import { EMITIR_TICKET, MIS_TICKETS_ACTIVOS, SLOTS_DIA } from '../../graphql/queries/tickets'
import { useAuth } from '../../context/AuthContext'

const TURNO_LABEL = { manana: 'Turno Mañana', tarde: 'Turno Tarde' }
const ESTADO_BADGE = {
  esperando:  { label: 'En espera',           cls: 'bg-blue-100 text-blue-700' },
  llamado:    { label: '¡Te están llamando!', cls: 'bg-yellow-100 text-yellow-800' },
  atendiendo: { label: 'En consulta',          cls: 'bg-green-100 text-green-700' },
}

function parseFranja(franja) {
  if (!franja) return null
  const [start, end] = franja.split('-')
  return { start, end, label: `${start} – ${end}` }
}

function formatCountdown(secs) {
  if (secs <= 0) return null
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TicketRemoto() {
  const { usuario } = useAuth()
  const [franjaSeleccionada, setFranjaSeleccionada] = useState(null)
  const [error, setError] = useState('')
  const [secsLeft, setSecsLeft] = useState(null)
  const dataReceivedAt = useRef(null)
  const estimatedSecs = useRef(0)

  const pacienteId = usuario?.especialidad

  /* ── Ticket activo ── */
  const { data, loading, refetch } = useQuery(MIS_TICKETS_ACTIVOS, {
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  })

  /* ── Slots del día ── */
  const { data: slotsData, loading: loadingSlots } = useQuery(SLOTS_DIA, {
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  })

  const tickets = data?.misTicketsActivos || []
  const ticketActivo = tickets.find(t => ['esperando', 'llamado', 'atendiendo'].includes(t.estado))

  const slots = slotsData?.slotsDia || []
  const slotMap = Object.fromEntries(slots.map(s => [s.franja, s]))
  const slotsManana = slots.filter(s => s.turno === 'manana')
  const slotsTarde = slots.filter(s => s.turno === 'tarde')

  const [emitirTicket, { loading: emitiendo }] = useMutation(EMITIR_TICKET, {
    refetchQueries: [{ query: MIS_TICKETS_ACTIVOS }, { query: SLOTS_DIA }],
    awaitRefetchQueries: true,
    onCompleted: () => { setError(''); setFranjaSeleccionada(null) },
    onError: (e) => setError(e.message || 'Error al reservar el horario'),
  })

  // Countdown
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (dataReceivedAt.current === null) return
      const elapsed = Math.floor((Date.now() - dataReceivedAt.current) / 1000)
      setSecsLeft(Math.max(0, estimatedSecs.current - elapsed))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleEmitir = () => {
    if (!pacienteId) return setError('No se pudo identificar al paciente. Vuelve a iniciar sesión.')
    if (!franjaSeleccionada) return setError('Selecciona un horario primero')
    emitirTicket({ variables: { pacienteId, tipo: 'remoto', franjaHoraria: franjaSeleccionada } })
  }

  /* ── Loading inicial ── */
  if (loading && !data) {
    return (
      <div className="space-y-5 pb-4 pt-2">
        <div className="pt-1">
          <p className="text-blue-300 text-sm font-medium">Mi Ticket</p>
          <h1 className="text-xl font-black text-white">Estado del turno</h1>
        </div>
        <div className="rounded-2xl p-8 text-center border border-white/10 bg-white/10">
          <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-blue-200/70 text-sm">Cargando tu ticket...</p>
        </div>
      </div>
    )
  }

  /* ── Ticket activo: ficha física completa ── */
  if (ticketActivo) {
    const franja = parseFranja(ticketActivo.franjaHoraria)
    return (
      <div className="space-y-5 pb-4 pt-2">
        <div className="pt-1">
          <p className="text-blue-300 text-sm font-medium">Tu turno actual · se actualiza cada 5s</p>
          <h1 className="text-xl font-black text-white">Mi Ticket</h1>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">

          <div className="bg-gradient-to-b from-blue-50 to-white px-5 pt-6 pb-2 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3 shadow-md">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xl" />
            </div>
            <p className="font-black text-gray-800 text-lg">¡Ticket asignado!</p>
            <p className="text-gray-400 text-xs mt-0.5">Preséntate en ventanilla en tu horario</p>
            {ticketActivo.estado !== 'esperando' && (
              <span className={`inline-block mt-3 px-3 py-1.5 rounded-full text-sm font-semibold ${ESTADO_BADGE[ticketActivo.estado]?.cls}`}>
                {ticketActivo.estado === 'llamado' && <FontAwesomeIcon icon={faBell} className="mr-1.5" />}
                {ESTADO_BADGE[ticketActivo.estado]?.label}
              </span>
            )}
          </div>

          <div className="mx-4 mb-4 rounded-2xl border-2 border-dashed border-blue-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-dashed border-blue-100 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faHospital} className="text-blue-800 text-base" />
              <p className="text-blue-900 font-black text-xs tracking-widest uppercase">
                Hospital Señor de Malta
              </p>
            </div>

            <div className="px-5 py-5 text-center border-b border-dashed border-blue-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tu número de turno</p>
              <div className="flex items-start justify-center leading-none">
                <span className="text-4xl font-black text-blue-700 mt-2 mr-1">T-</span>
                <span className="text-8xl font-black text-blue-700 leading-none">
                  {ticketActivo.numero.replace('T-', '')}
                </span>
              </div>
              {franja && (
                <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5">
                  <FontAwesomeIcon icon={faClock} className="text-blue-400 text-xs" />
                  <p className="text-blue-700 font-bold text-sm">{franja.label}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {TURNO_LABEL[ticketActivo.turno] || ticketActivo.turno} · {new Date(ticketActivo.fechaEmision).toLocaleDateString('es-BO')}
              </p>
            </div>

            {ticketActivo.estado === 'esperando' && (
              <div className="px-4 py-4 border-b border-dashed border-blue-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <FontAwesomeIcon icon={faClock} className="text-blue-400 text-xs mb-1.5" />
                    {secsLeft !== null && secsLeft > 0 ? (
                      <>
                        <p className="text-2xl font-black text-blue-800 font-mono leading-none">{formatCountdown(secsLeft)}</p>
                        <p className="text-[10px] text-blue-400 mt-1">{Math.floor(secsLeft / 60)}m {secsLeft % 60}s restantes</p>
                      </>
                    ) : (
                      <>
                        <p className="font-black text-blue-800 text-sm">~{ticketActivo.tiempoEsperaEst} min</p>
                        <p className="text-[10px] text-blue-400 mt-0.5">{secsLeft === 0 ? 'Llegando pronto' : 'Espera estimada'}</p>
                      </>
                    )}
                    <p className="text-[10px] text-blue-500 mt-0.5 font-medium">Espera estimada</p>
                  </div>
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

            <div className="px-5 py-3 space-y-2">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={ticketActivo.tipo === 'remoto' ? faWifi : faTicket} className="text-xs" />
                  {ticketActivo.tipo === 'presencial' ? 'Ticket Presencial' : 'Ticket Remoto — Portal Web'}
                </span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm">{ticketActivo.paciente?.nombreCompleto || usuario?.nombreCompleto}</p>
                <p className="text-xs text-gray-400">
                  Emitido: {new Date(ticketActivo.fechaEmision).toLocaleTimeString('es-BO', {
                    timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit'
                  })} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Sin ticket: selector de franja horaria ── */
  const fraLabel = franjaSeleccionada ? parseFranja(franjaSeleccionada)?.label : null

  function SlotBtn({ franja }) {
    const info = slotMap[franja] || {}
    const { start, end } = parseFranja(franja)
    const pasado = info.pasado
    const tomado = info.tomado && !pasado
    const bloqueado = pasado || tomado
    const sel = franjaSeleccionada === franja
    return (
      <button
        disabled={bloqueado}
        onClick={() => { setFranjaSeleccionada(franja); setError('') }}
        className={`
          relative p-3 rounded-2xl border-2 text-center transition-all
          ${pasado
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : tomado
              ? 'border-red-200 bg-red-50 cursor-not-allowed'
              : sel
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
          }
        `}
      >
        <p className={`text-sm font-black leading-none ${pasado ? 'text-gray-400' : tomado ? 'text-red-400' : sel ? 'text-blue-700' : 'text-gray-800'}`}>
          {start}
        </p>
        <p className={`text-xs leading-none mt-1 ${pasado ? 'text-gray-300' : tomado ? 'text-red-300' : sel ? 'text-blue-400' : 'text-gray-400'}`}>
          {end}
        </p>
        <div className={`mt-2 text-[9px] font-bold py-0.5 px-1.5 rounded-full inline-block
          ${pasado ? 'bg-gray-100 text-gray-400' : tomado ? 'bg-red-100 text-red-500' : sel ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-600'}`}
        >
          {pasado ? 'PASADO' : tomado ? '● TOMADO' : sel ? '✓ SEL.' : 'LIBRE'}
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-4 pb-6 pt-2">
      <div className="pt-1">
        <p className="text-blue-300 text-sm font-medium">Turno virtual</p>
        <h1 className="text-xl font-black text-white">Reservar Horario</h1>
      </div>

      {/* ── MAÑANA ── */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faSun} className="text-yellow-500" />
          <p className="font-bold text-gray-800 text-sm">Turno Mañana</p>
          <p className="text-gray-400 text-xs">07:00 – 12:00</p>
          <p className="ml-auto text-xs text-gray-400">
            {loadingSlots ? '…' : `${slotsManana.filter(s => !s.tomado && !s.pasado).length} libres`}
          </p>
        </div>
        {loadingSlots ? (
          <div className="grid grid-cols-2 gap-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slotsManana.map(s => <SlotBtn key={s.franja} franja={s.franja} />)}
          </div>
        )}
      </div>

      {/* ── RECESO ── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/20" />
        <p className="text-white/50 text-xs font-semibold">☕ Receso  12:00 – 14:00</p>
        <div className="flex-1 h-px bg-white/20" />
      </div>

      {/* ── TARDE ── */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faMoon} className="text-indigo-500" />
          <p className="font-bold text-gray-800 text-sm">Turno Tarde</p>
          <p className="text-gray-400 text-xs">14:00 – 18:00</p>
          <p className="ml-auto text-xs text-gray-400">
            {loadingSlots ? '…' : `${slotsTarde.filter(s => !s.tomado && !s.pasado).length} libres`}
          </p>
        </div>
        {loadingSlots ? (
          <div className="grid grid-cols-2 gap-2">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slotsTarde.map(s => <SlotBtn key={s.franja} franja={s.franja} />)}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Botón reservar */}
      <button
        onClick={handleEmitir}
        disabled={emitiendo || !franjaSeleccionada}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 text-base"
      >
        <FontAwesomeIcon icon={faTicket} />
        {emitiendo
          ? 'Reservando...'
          : fraLabel
            ? `Reservar ${fraLabel}`
            : 'Selecciona un horario'
        }
      </button>
    </div>
  )
}
