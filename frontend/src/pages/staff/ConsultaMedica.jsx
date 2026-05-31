import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHistory, faStethoscope, faShare, faPlus, faTrash,
  faCheck, faArrowLeft, faExclamationTriangle, faHeartPulse, faPills
} from '@fortawesome/free-solid-svg-icons'
import {
  CONSULTA_POR_ID, HISTORIAL_PACIENTE, FINALIZAR_CONSULTA, DERIVAR_PACIENTE
} from '../../graphql/queries/consultas'
import { EMITIR_RECETA } from '../../graphql/queries/recetas'
import { TICKETS, COLA_ESTADO } from '../../graphql/queries/tickets'
import { USUARIOS } from '../../graphql/queries/auth'
import { LoadingScreen } from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import PacienteCard from '../../components/shared/PacienteCard'

const TABS = [
  { id: 'historial', label: 'Historial',       icon: faHistory },
  { id: 'consulta',  label: 'Consulta Actual', icon: faStethoscope },
  { id: 'receta',    label: 'Receta',           icon: faPills },
  { id: 'derivar',   label: 'Derivar',          icon: faShare },
]

const SINTOMAS_CATEGORIAS = [
  { cat: 'Generales',          items: ['Fiebre', 'Escalofríos', 'Fatiga/Cansancio', 'Pérdida de apetito', 'Sudoración excesiva'] },
  { cat: 'Respiratorios',      items: ['Tos', 'Dificultad para respirar', 'Dolor en el pecho', 'Silbido al respirar'] },
  { cat: 'Digestivos',         items: ['Náuseas', 'Vómitos', 'Diarrea', 'Dolor abdominal'] },
  { cat: 'Neurológicos/Otros', items: ['Dolor de cabeza', 'Mareos', 'Confusión', 'Sangrado', 'Desmayo'] },
]

const DOLOR_COLORS = [
  'bg-green-500', 'bg-green-400', 'bg-lime-400', 'bg-yellow-300', 'bg-yellow-400',
  'bg-amber-400', 'bg-orange-400', 'bg-orange-500', 'bg-red-400', 'bg-red-500', 'bg-red-700',
]

const DOLOR_LABELS = {
  0: 'Sin dolor',
  1: 'Leve', 2: 'Leve', 3: 'Leve',
  4: 'Moderado', 5: 'Moderado', 6: 'Moderado',
  7: 'Intenso', 8: 'Intenso', 9: 'Intenso',
  10: 'Insoportable',
}

const SIGNOS_CONFIG = [
  { key: 'temperatura',            label: 'Temperatura',        unit: '°C',    step: '0.1', isFloat: true,  ref: '36.5–37.5' },
  { key: 'presionSistolica',       label: 'Presión Sistólica',  unit: 'mmHg',  step: '1',   isFloat: false, ref: '90–120' },
  { key: 'presionDiastolica',      label: 'Presión Diastólica', unit: 'mmHg',  step: '1',   isFloat: false, ref: '60–80' },
  { key: 'frecuenciaCardiaca',     label: 'Frec. Cardíaca',     unit: 'bpm',   step: '1',   isFloat: false, ref: '60–100' },
  { key: 'saturacionOxigeno',      label: 'Saturación O₂',      unit: '%',     step: '1',   isFloat: false, ref: '95–100' },
  { key: 'frecuenciaRespiratoria', label: 'Frec. Respiratoria', unit: 'rpm',   step: '1',   isFloat: false, ref: '12–20' },
  { key: 'glucosa',                label: 'Glucosa',            unit: 'mg/dL', step: '1',   isFloat: false, ref: '70–100' },
  { key: 'peso',                   label: 'Peso',               unit: 'kg',    step: '0.1', isFloat: true,  ref: null },
  { key: 'talla',                  label: 'Talla',              unit: 'cm',    step: '0.1', isFloat: true,  ref: null },
]

const TODOS_PREDEFINIDOS = SINTOMAS_CATEGORIAS.flatMap(c => c.items)

export default function ConsultaMedica() {
  const { consultaId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('consulta')
  const [diagnostico, setDiagnostico] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [signos, setSignos] = useState({})
  const [items, setItems] = useState([{ medicamentoNombre: '', cantidad: '', frecuencia: '', tiempoUso: '', viaAdministracion: '' }])
  const [derivacion, setDerivacion] = useState({ especialidadDestino: '', medicoDestinoId: '', motivo: '' })
  const [sintomas, setSintomas] = useState(new Set())
  const [sintomaExtra, setSintomaExtra] = useState('')
  const [nivelDolor, setNivelDolor] = useState(null)

  const { data, loading } = useQuery(CONSULTA_POR_ID, { variables: { id: consultaId } })
  const { data: especialistasData } = useQuery(USUARIOS, { variables: { rol: 'especialista', activo: true } })

  const [finalizarConsulta, { loading: finalizando }] = useMutation(FINALIZAR_CONSULTA, {
    refetchQueries: [
      { query: TICKETS, variables: { estado: 'esperando' } },
      { query: TICKETS, variables: { estado: 'llamado' } },
      { query: COLA_ESTADO },
    ],
    awaitRefetchQueries: true,
  })
  const [emitirReceta, { loading: emitiendo }] = useMutation(EMITIR_RECETA)
  const [derivarPaciente, { loading: derivando }] = useMutation(DERIVAR_PACIENTE)

  const { data: historialData } = useQuery(HISTORIAL_PACIENTE, {
    variables: { pacienteId: data?.consultaPorId?.paciente?.id },
    skip: !data?.consultaPorId?.paciente?.id,
  })

  if (loading) return <LoadingScreen />

  const consulta = data?.consultaPorId
  const historial = historialData?.historialPaciente || []

  // IMC derivado — no se envía al backend
  const peso = parseFloat(signos.peso) || 0
  const talla = parseFloat(signos.talla) || 0
  const imc = peso > 0 && talla > 0 ? (peso / Math.pow(talla / 100, 2)).toFixed(1) : null
  const imcLabel = !imc ? null
    : imc < 18.5 ? 'Bajo peso'
    : imc < 25   ? 'Normal'
    : imc < 30   ? 'Sobrepeso'
    : 'Obesidad'

  const toggleSintoma = (s) => setSintomas(prev => {
    const next = new Set(prev)
    if (next.has(s)) next.delete(s); else next.add(s)
    return next
  })

  const agregarExtra = () => {
    const trimmed = sintomaExtra.trim()
    if (!trimmed) return
    setSintomas(prev => new Set([...prev, trimmed]))
    setSintomaExtra('')
  }

  const handleFinalizar = async () => {
    if (!diagnostico.trim()) { alert('El diagnóstico es obligatorio'); return }
    try {
      await finalizarConsulta({
        variables: {
          consultaId,
          diagnostico,
          observaciones: observaciones || undefined,
          signosVitales: Object.keys(signos).length ? signos : undefined,
          sintomas: sintomas.size > 0 ? [...sintomas].join(',') : undefined,
          nivelDolor: nivelDolor !== null ? nivelDolor : undefined,
        }
      })
      const itemsValidos = items.filter(i => i.medicamentoNombre.trim())
      if (itemsValidos.length > 0) {
        await emitirReceta({
          variables: {
            consultaId,
            items: itemsValidos.map(i => ({
              medicamentoNombre: i.medicamentoNombre,
              cantidad: i.cantidad || undefined,
              frecuencia: i.frecuencia || undefined,
              tiempoUso: i.tiempoUso || undefined,
              viaAdministracion: i.viaAdministracion || undefined,
            })),
          }
        })
      }
      sessionStorage.removeItem('medicoTimerStart')
      navigate('/medico')
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleDerivar = async () => {
    if (!derivacion.especialidadDestino || !derivacion.motivo) {
      alert('Especialidad y motivo son obligatorios')
      return
    }
    try {
      await derivarPaciente({
        variables: {
          consultaId,
          especialidadDestino: derivacion.especialidadDestino,
          medicoDestinoId: derivacion.medicoDestinoId || undefined,
          motivo: derivacion.motivo,
        }
      })
      alert('Derivación creada exitosamente')
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const updateItem = (i, field, value) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/medico')} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Consulta Médica</h1>
          <p className="text-gray-500 text-sm">Ticket: {consulta?.ticket?.numero}</p>
        </div>
        <Badge estado={consulta?.estado} className="ml-auto" />
      </div>

      {consulta?.paciente && <PacienteCard paciente={consulta.paciente} />}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Historial */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {historial.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Sin consultas previas</p>
          ) : historial.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{new Date(c.fechaInicio).toLocaleDateString('es-BO')}</p>
                  <p className="text-gray-500 text-xs">Dr. {c.medico?.nombreCompleto}</p>
                </div>
                <Badge estado={c.estado} />
              </div>
              <p className="text-sm text-gray-700"><strong>Motivo:</strong> {c.motivo}</p>
              {c.diagnostico && <p className="text-sm text-gray-700 mt-1"><strong>Diagnóstico:</strong> {c.diagnostico}</p>}
              {c.sintomas && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Síntomas:</strong> {c.sintomas}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Consulta actual */}
      {tab === 'consulta' && (
        <div className="space-y-5">

          {/* ── 1. Síntomas Principales ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Síntomas Principales</h3>
              {sintomas.size > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {sintomas.size} seleccionados
                </span>
              )}
            </div>

            {SINTOMAS_CATEGORIAS.map(({ cat, items: catItems }) => (
              <div key={cat} className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {catItems.map(s => {
                    const active = sintomas.has(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSintoma(s)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          active ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                        }`}>
                          {active && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                          {s}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Síntomas custom agregados */}
            {[...sintomas].filter(s => !TODOS_PREDEFINIDOS.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {[...sintomas].filter(s => !TODOS_PREDEFINIDOS.includes(s)).map(s => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-blue-500 bg-blue-50">
                    <div className="w-4 h-4 rounded bg-blue-600 border-2 border-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-blue-700 whitespace-nowrap">{s}</span>
                    <button type="button" onClick={() => toggleSintoma(s)} className="text-blue-400 hover:text-blue-700 text-sm leading-none ml-1">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input síntoma libre */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                className={inputCls}
                placeholder="Agregar otro síntoma..."
                value={sintomaExtra}
                onChange={e => setSintomaExtra(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarExtra() } }}
              />
              <button
                type="button"
                onClick={agregarExtra}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 shrink-0 font-medium"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* ── 2. Signos Vitales ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faHeartPulse} className="text-red-500" />
              <h3 className="font-semibold text-gray-800">Signos Vitales</h3>
              <span className="text-xs text-gray-400 ml-1">(todos opcionales)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SIGNOS_CONFIG.map(sv => (
                <div key={sv.key} className="bg-gray-50 rounded-xl p-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{sv.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={sv.step}
                      className="flex-1 bg-white px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={signos[sv.key] ?? ''}
                      onChange={e => {
                        const raw = e.target.value
                        setSignos(s => ({
                          ...s,
                          [sv.key]: raw === '' ? undefined : (sv.isFloat ? parseFloat(raw) : parseInt(raw, 10)),
                        }))
                      }}
                    />
                    <span className="text-xs text-gray-400 shrink-0 w-10">{sv.unit}</span>
                  </div>
                  {sv.ref && (
                    <p className="text-xs text-gray-400 mt-1.5">ref: {sv.ref} {sv.unit}</p>
                  )}
                </div>
              ))}
            </div>

            {/* IMC calculado */}
            {imc && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                <div>
                  <p className="text-xs text-blue-400 font-medium">IMC calculado</p>
                  <p className="text-lg font-bold text-blue-700">
                    {imc} <span className="text-sm font-normal text-blue-500">— {imcLabel}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── 4. Diagnóstico y Observaciones ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Diagnóstico y Observaciones</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico *</label>
              <textarea
                className={inputCls}
                rows={3}
                value={diagnostico}
                onChange={e => setDiagnostico(e.target.value)}
                placeholder="Ingrese el diagnóstico..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                className={inputCls}
                rows={2}
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
              />
            </div>
          </div>

        </div>
      )}

      {/* Tab: Receta */}
      {tab === 'receta' && (() => {
        return (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPills} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Medicamentos / Insumos</h3>
                </div>
                <button
                  onClick={() => setItems(prev => [...prev, { medicamentoNombre: '', cantidad: '', frecuencia: '', tiempoUso: '', viaAdministracion: '' }])}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1.5 font-medium"
                >
                  <FontAwesomeIcon icon={faPlus} /> Agregar fila
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left min-w-[160px]">Medicamento / Insumo</th>
                      <th className="px-4 py-3 text-center w-28">Cantidad</th>
                      <th className="px-4 py-3 text-center w-32">Frecuencia</th>
                      <th className="px-4 py-3 text-center w-32">Tiempo de Uso</th>
                      <th className="px-4 py-3 text-center w-36">Vía de Administración</th>
                      <th className="px-2 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, i) => {
                      const cellInput = 'w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                      return (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2">
                            <input
                              className={cellInput}
                              placeholder="Nombre genérico..."
                              value={item.medicamentoNombre}
                              onChange={e => updateItem(i, 'medicamentoNombre', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={cellInput + ' text-center'}
                              placeholder="Ej: 2 tabletas"
                              value={item.cantidad}
                              onChange={e => updateItem(i, 'cantidad', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={cellInput + ' text-center'}
                              placeholder="Ej: cada 8h"
                              value={item.frecuencia}
                              onChange={e => updateItem(i, 'frecuencia', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className={cellInput + ' text-center'}
                              placeholder="Ej: 7 días"
                              value={item.tiempoUso}
                              onChange={e => updateItem(i, 'tiempoUso', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className={cellInput}
                              value={item.viaAdministracion}
                              onChange={e => updateItem(i, 'viaAdministracion', e.target.value)}
                            >
                              <option value="">Seleccionar...</option>
                              <option value="Oral">Oral</option>
                              <option value="Inyectable">Inyectable</option>
                              <option value="Tópica">Tópica</option>
                              <option value="Inhalatoria">Inhalatoria</option>
                              <option value="Sublingual">Sublingual</option>
                              <option value="Oftálmica">Oftálmica</option>
                              <option value="Ótica">Ótica</option>
                              <option value="Rectal">Rectal</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {items.length > 1 && (
                              <button
                                onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {consulta?.estado === 'activa' && (
              <button
                onClick={handleFinalizar}
                disabled={finalizando || emitiendo}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} />
                {finalizando || emitiendo ? 'Finalizando...' : 'Finalizar Consulta y Emitir Receta'}
              </button>
            )}
          </div>
        )
      })()}

      {/* Tab: Derivar */}
      {tab === 'derivar' && (
        <div className="space-y-4">
          {consulta?.derivacion && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
              <FontAwesomeIcon icon={faShare} className="text-violet-500 mt-0.5" />
              <div>
                <p className="font-semibold text-violet-800">Derivación ya creada</p>
                <p className="text-sm text-violet-600 mt-0.5">
                  → {consulta.derivacion.especialidadDestino}
                  {consulta.derivacion.medicoDestino && ` · Dr. ${consulta.derivacion.medicoDestino.nombreCompleto}`}
                </p>
                <p className="text-xs text-violet-500 mt-1">Estado: {consulta.derivacion.estado}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Seleccionar Especialista *</h3>

            {!especialistasData?.usuarios?.length ? (
              <div className="text-center py-6 text-gray-400">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mb-2" />
                <p className="text-sm">No hay especialistas registrados en el sistema.</p>
                <p className="text-xs mt-1">El director debe crear usuarios con rol "Especialista".</p>
              </div>
            ) : (
              <div className="space-y-2">
                {especialistasData.usuarios.filter(e => e.activo).map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setDerivacion(d => ({
                      ...d,
                      medicoDestinoId: e.id,
                      especialidadDestino: e.especialidad || 'Especialidad General',
                    }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      derivacion.medicoDestinoId === e.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 text-sm font-bold text-violet-700">
                      {e.nombres?.[0]}{e.apellidos?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{e.nombreCompleto}</p>
                      <p className="text-violet-600 text-xs font-medium">{e.especialidad || 'Especialista'}</p>
                    </div>
                    {derivacion.medicoDestinoId === e.id && (
                      <FontAwesomeIcon icon={faCheck} className="text-violet-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de derivación *</label>
              <textarea
                className={inputCls}
                rows={3}
                value={derivacion.motivo}
                onChange={e => setDerivacion(d => ({ ...d, motivo: e.target.value }))}
                placeholder="Describa el motivo por el que deriva al paciente..."
              />
            </div>

            <button
              onClick={handleDerivar}
              disabled={derivando || !derivacion.medicoDestinoId || !derivacion.motivo}
              className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faShare} />
              {derivando ? 'Derivando...' : 'Crear Derivación'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
