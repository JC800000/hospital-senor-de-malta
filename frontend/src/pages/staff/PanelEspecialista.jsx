import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeartbeat, faClock, faUser, faCheck, faUserMd,
  faAllergies, faTint, faClipboardList, faExclamationTriangle,
  faChevronDown, faChevronUp, faStethoscope
} from '@fortawesome/free-solid-svg-icons'
import { DERIVACIONES, ACEPTAR_DERIVACION, FINALIZAR_DERIVACION } from '../../graphql/queries/consultas'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

function InfoPill({ label, value, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]}`}>
      {label}: <strong>{value || '—'}</strong>
    </span>
  )
}

function SignoRow({ label, value, unit }) {
  if (!value) return null
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-gray-800">{value}<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span></p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

export default function PanelEspecialista() {
  const { usuario } = useAuth()
  const [expandido, setExpandido] = useState(null)
  const [notas, setNotas] = useState({})

  const { data, loading, refetch } = useQuery(DERIVACIONES, {
    variables: { medicoDestinoId: usuario?.id },
    pollInterval: 20000,
    skip: !usuario?.id,
  })

  const [aceptarDerivacion, { loading: aceptando }] = useMutation(ACEPTAR_DERIVACION, {
    onCompleted: () => refetch(),
  })

  const [finalizarDerivacion, { loading: finalizando }] = useMutation(FINALIZAR_DERIVACION, {
    onCompleted: () => { refetch(); setExpandido(null) },
  })

  const handleAceptar = (id) => {
    aceptarDerivacion({ variables: { derivacionId: id } })
    setExpandido(id)
  }

  const handleFinalizar = (id) => {
    if (!notas[id]?.trim()) { alert('Las notas del especialista son obligatorias'); return }
    finalizarDerivacion({ variables: { derivacionId: id, notasEspecialista: notas[id] } })
  }

  const derivaciones = data?.derivaciones || []
  const pendientes  = derivaciones.filter(d => d.estado === 'pendiente')
  const enAtencion  = derivaciones.filter(d => d.estado === 'aceptada')
  const finalizadas = derivaciones.filter(d => d.estado === 'finalizada')

  const CardPendiente = ({ d }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">Pendiente</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FontAwesomeIcon icon={faClock} />
              {new Date(d.fechaDerivacion).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm" />
            <p className="font-bold text-gray-800">{d.paciente?.nombreCompleto}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <InfoPill label="CI" value={d.paciente?.ci} />
            <InfoPill label="Edad" value={d.paciente?.edad ? `${d.paciente.edad} años` : null} />
            <InfoPill label="Sangre" value={d.paciente?.tipoSangre} color="blue" />
            {d.paciente?.alergias && <InfoPill label="Alergias" value={d.paciente.alergias} color="red" />}
          </div>

          <div className="bg-violet-50 rounded-xl p-3 mb-3">
            <p className="text-xs font-semibold text-violet-600 mb-1">
              Derivado por Dr. {d.medicoOrigen?.nombreCompleto}
            </p>
            <p className="text-sm text-gray-700">{d.motivo}</p>
          </div>

          {d.consultaOrigen?.diagnostico && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1">Diagnóstico previo</p>
              <p className="text-sm text-gray-700">{d.consultaOrigen.diagnostico}</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => handleAceptar(d.id)}
        disabled={aceptando}
        className="mt-4 w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
      >
        <FontAwesomeIcon icon={faCheck} />
        {aceptando ? 'Aceptando...' : 'Aceptar y atender'}
      </button>
    </div>
  )

  const CardEnAtencion = ({ d }) => {
    const abierta = expandido === d.id
    const sv = d.consultaOrigen?.signosVitales

    return (
      <div className="bg-white rounded-2xl border-2 border-violet-200 shadow-sm">
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full">En atención</span>
              </div>
              <p className="font-bold text-gray-800 text-lg">{d.paciente?.nombreCompleto}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <InfoPill label="CI" value={d.paciente?.ci} />
                <InfoPill label="Edad" value={d.paciente?.edad ? `${d.paciente.edad} años` : null} />
                <InfoPill label="Sangre" value={d.paciente?.tipoSangre} color="blue" />
                {d.paciente?.alergias && <InfoPill label="Alergias" value={d.paciente.alergias} color="red" />}
              </div>
            </div>
            <button
              onClick={() => setExpandido(abierta ? null : d.id)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <FontAwesomeIcon icon={abierta ? faChevronUp : faChevronDown} />
            </button>
          </div>
        </div>

        {/* Detalle expandible */}
        {abierta && (
          <div className="border-t border-violet-100 p-5 space-y-4">

            {/* Motivo de derivación */}
            <div className="bg-violet-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-violet-600 mb-1">Motivo de derivación · Dr. {d.medicoOrigen?.nombreCompleto}</p>
              <p className="text-sm text-gray-700">{d.motivo}</p>
            </div>

            {/* Observaciones del paciente */}
            {d.paciente?.observaciones && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} /> Antecedentes del paciente
                </p>
                <p className="text-sm text-gray-700">{d.paciente.observaciones}</p>
              </div>
            )}

            {/* Signos vitales de la consulta anterior */}
            {sv && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faHeartbeat} className="text-rose-400" />
                  Signos vitales registrados por médico general
                </p>
                <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-3">
                  <SignoRow label="Temperatura" value={sv.temperatura} unit="°C" />
                  <SignoRow label="P. Sistólica" value={sv.presionSistolica} unit="mmHg" />
                  <SignoRow label="Frec. Cardíaca" value={sv.frecuenciaCardiaca} unit="bpm" />
                  <SignoRow label="Saturación O₂" value={sv.saturacionOxigeno} unit="%" />
                  <SignoRow label="Peso" value={sv.peso} unit="kg" />
                  <SignoRow label="Talla" value={sv.talla} unit="cm" />
                  <SignoRow label="Glucosa" value={sv.glucosa} unit="mg/dL" />
                </div>
              </div>
            )}

            {/* Diagnóstico previo del médico general */}
            {d.consultaOrigen?.diagnostico && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">Diagnóstico del médico general</p>
                <p className="text-sm text-gray-700">{d.consultaOrigen.diagnostico}</p>
              </div>
            )}

            {/* Notas del especialista */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notas del especialista *
              </label>
              <textarea
                rows={4}
                value={notas[d.id] || ''}
                onChange={e => setNotas(n => ({ ...n, [d.id]: e.target.value }))}
                placeholder="Escriba su diagnóstico especializado, tratamiento recomendado y observaciones..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            <button
              onClick={() => handleFinalizar(d.id)}
              disabled={finalizando || !notas[d.id]?.trim()}
              className="w-full py-3 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
            >
              <FontAwesomeIcon icon={faCheck} />
              {finalizando ? 'Guardando...' : 'Finalizar atención y guardar notas'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Especialista</h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUserMd} className="text-violet-400" />
            Dr. {usuario?.nombreCompleto} · {usuario?.especialidad || 'Sin especialidad asignada'}
          </p>
        </div>
        {loading && <Spinner />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes',  count: pendientes.length,  color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'En atención', count: enAtencion.length,  color: 'bg-violet-50 text-violet-600 border-violet-100' },
          { label: 'Finalizadas', count: finalizadas.length, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
            <p className="text-3xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* En atención */}
      {enAtencion.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <FontAwesomeIcon icon={faStethoscope} className="text-violet-500" />
            En atención ({enAtencion.length})
          </h2>
          {enAtencion.map(d => <CardEnAtencion key={d.id} d={d} />)}
        </div>
      )}

      {/* Pendientes */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <FontAwesomeIcon icon={faClipboardList} className="text-amber-500" />
          Derivaciones pendientes ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState
              icon={faHeartbeat}
              title="Sin derivaciones pendientes"
              description="Cuando un médico derive un paciente a tu especialidad aparecerá aquí"
            />
          </div>
        ) : (
          pendientes.map(d => <CardPendiente key={d.id} d={d} />)
        )}
      </div>

      {/* Finalizadas (colapsado) */}
      {finalizadas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Casos finalizados ({finalizadas.length})
          </p>
          {finalizadas.map(d => (
            <div key={d.id} className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{d.paciente?.nombreCompleto}</p>
                <p className="text-xs text-gray-400">{d.especialidadDestino} · {new Date(d.fechaDerivacion).toLocaleDateString('es-BO')}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Finalizado</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
