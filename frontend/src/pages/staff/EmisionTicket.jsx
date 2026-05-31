import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTicket, faPrint, faArrowLeft, faUser, faSun, faMoon, faCheck
} from '@fortawesome/free-solid-svg-icons'
import { PACIENTE_POR_ID } from '../../graphql/queries/pacientes'
import { EMITIR_TICKET, SLOTS_DIA } from '../../graphql/queries/tickets'
import { LoadingScreen } from '../../components/ui/Spinner'

// "07:00-07:30" → { start: "07:00", end: "07:30", label: "07:00 – 07:30" }
function parseFranja(franja) {
  const [start, end] = franja.split('-')
  return { start, end, label: `${start} – ${end}` }
}

function SlotGrid({ slots, slotMap, selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {slots.map(s => {
        const info = slotMap[s.franja] || s
        const { start, end } = parseFranja(s.franja)
        const pasado = info.pasado
        const tomado = info.tomado && !pasado
        const bloqueado = pasado || tomado
        const sel = selected === s.franja
        return (
          <button
            key={s.franja}
            disabled={bloqueado}
            onClick={() => onSelect(s.franja)}
            className={`
              p-2.5 rounded-xl border-2 text-center transition-all
              ${pasado
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : tomado
                  ? 'border-red-200 bg-red-50 cursor-not-allowed'
                  : sel
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
              }
            `}
          >
            <p className={`text-xs font-black leading-none ${pasado ? 'text-gray-400' : tomado ? 'text-red-400' : sel ? 'text-blue-700' : 'text-gray-700'}`}>
              {start}
            </p>
            <p className={`text-[10px] leading-none mt-0.5 ${pasado ? 'text-gray-300' : tomado ? 'text-red-300' : sel ? 'text-blue-400' : 'text-gray-400'}`}>
              {end}
            </p>
            <div className={`mt-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full inline-block
              ${pasado
                ? 'bg-gray-100 text-gray-400'
                : tomado
                  ? 'bg-red-100 text-red-500'
                  : sel
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-100 text-green-600'
              }`}
            >
              {pasado ? 'PASADO' : tomado ? 'TOMADO' : sel ? '✓ SEL.' : 'LIBRE'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function EmisionTicket() {
  const { pacienteId } = useParams()
  const navigate = useNavigate()
  const [ticketEmitido, setTicketEmitido] = useState(null)
  const [franjaSeleccionada, setFranjaSeleccionada] = useState(null)
  const [error, setError] = useState('')

  const { data: pacienteData, loading } = useQuery(PACIENTE_POR_ID, {
    variables: { id: pacienteId },
  })

  const { data: slotsData, loading: loadingSlots } = useQuery(SLOTS_DIA, {
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  })

  const [emitirTicket, { loading: emitiendo }] = useMutation(EMITIR_TICKET, {
    refetchQueries: [{ query: SLOTS_DIA }],
    awaitRefetchQueries: true,
    onCompleted: (data) => { setTicketEmitido(data.emitirTicket); setError('') },
    onError: (e) => setError(e.message),
  })

  if (loading) return <LoadingScreen />

  const paciente = pacienteData?.pacientePorId
  const slots = slotsData?.slotsDia || []
  const slotMap = Object.fromEntries(slots.map(s => [s.franja, s]))
  const slotsManana = slots.filter(s => s.turno === 'manana')
  const slotsTarde = slots.filter(s => s.turno === 'tarde')

  const handleEmitir = () => {
    if (!franjaSeleccionada) { setError('Selecciona un horario antes de emitir'); return }
    emitirTicket({ variables: { pacienteId, tipo: 'presencial', franjaHoraria: franjaSeleccionada } })
  }

  /* ── Confirmación post-emisión ── */
  if (ticketEmitido) {
    const franja = ticketEmitido.franjaHoraria
    const { start, end } = franja ? parseFranja(franja) : { start: '–', end: '–' }
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/recepcion')} className="text-gray-500 hover:text-gray-700">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Ticket Emitido</h1>
        </div>

        <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-b from-blue-50 to-white px-6 pt-6 pb-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-900 flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faTicket} className="text-white text-2xl" />
            </div>
            <p className="text-5xl font-black text-blue-800 tracking-wider">{ticketEmitido.numero}</p>
            <p className="text-gray-500 text-sm mt-1">{ticketEmitido.paciente?.nombreCompleto}</p>
          </div>

          <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Horario Reservado</p>
            <p className="text-2xl font-black text-blue-800">{start} – {end}</p>
            <p className="text-xs text-blue-500 mt-1">Presentarse 5 minutos antes del turno</p>
          </div>

          <div className="flex gap-3 justify-center px-4 pb-5">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faPrint} /> Imprimir
            </button>
            <button
              onClick={() => navigate('/recepcion')}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Nuevo Paciente
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Selector de franja ── */
  const fraLabel = franjaSeleccionada ? parseFranja(franjaSeleccionada).label : null

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recepcion')} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Emisión de Ticket</h1>
          <p className="text-gray-500 text-sm">Selecciona el horario de atención</p>
        </div>
      </div>

      {/* Paciente */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-200 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faUser} className="text-blue-700 text-lg" />
        </div>
        <div>
          <p className="font-bold text-gray-800">{paciente?.nombreCompleto}</p>
          <p className="text-gray-500 text-sm">CI: {paciente?.ci} · {paciente?.edad} años</p>
        </div>
        {franjaSeleccionada && (
          <div className="ml-auto bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {fraLabel}
          </div>
        )}
      </div>

      {/* ── MAÑANA ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faSun} className="text-yellow-500" />
          <h2 className="font-bold text-gray-800">Turno Mañana</h2>
          <span className="text-gray-400 text-sm ml-1">07:00 – 12:00</span>
          <span className="ml-auto text-xs text-gray-400">{slotsManana.filter(s => !s.tomado && !s.pasado).length} disponibles</span>
        </div>
        {loadingSlots ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <SlotGrid
            slots={slotsManana}
            slotMap={slotMap}
            selected={franjaSeleccionada}
            onSelect={(f) => { setFranjaSeleccionada(f); setError('') }}
          />
        )}
      </div>

      {/* ── RECESO ── */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-gray-200" />
        <p className="text-gray-400 text-xs font-semibold whitespace-nowrap">☕ Receso  12:00 – 14:00</p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ── TARDE ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faMoon} className="text-indigo-500" />
          <h2 className="font-bold text-gray-800">Turno Tarde</h2>
          <span className="text-gray-400 text-sm ml-1">14:00 – 18:00</span>
          <span className="ml-auto text-xs text-gray-400">{slotsTarde.filter(s => !s.tomado && !s.pasado).length} disponibles</span>
        </div>
        {loadingSlots ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <SlotGrid
            slots={slotsTarde}
            slotMap={slotMap}
            selected={franjaSeleccionada}
            onSelect={(f) => { setFranjaSeleccionada(f); setError('') }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Botón emitir */}
      <button
        onClick={handleEmitir}
        disabled={emitiendo || !franjaSeleccionada}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 text-base"
      >
        <FontAwesomeIcon icon={franjaSeleccionada ? faCheck : faTicket} />
        {emitiendo
          ? 'Emitiendo...'
          : franjaSeleccionada
            ? `Emitir Ticket — ${fraLabel}`
            : 'Selecciona un horario'
        }
      </button>
    </div>
  )
}
