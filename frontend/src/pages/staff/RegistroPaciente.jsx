import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight, faCheck, faUser, faPhone, faHeart, faClipboard } from '@fortawesome/free-solid-svg-icons'
import { REGISTRAR_PACIENTE } from '../../graphql/queries/pacientes'

const STEPS = ['Datos Personales', 'Contacto', 'Datos Médicos', 'Confirmar']

const EMPTY_FORM = {
  ci: '', nombres: '', apellidos: '', fechaNac: '', sexo: '', estadoCivil: '',
  ocupacion: '', departamento: '', municipio: '', direccion: '', telefono: '',
  idiomaPrincipal: 'español', tipoSangre: '', alergias: '', observaciones: '',
}

export default function RegistroPaciente() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...EMPTY_FORM, ci: location.state?.ci || '' })
  const [registrar, { loading }] = useMutation(REGISTRAR_PACIENTE)

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    try {
      const { data } = await registrar({
        variables: {
          input: {
            ci: form.ci, nombres: form.nombres, apellidos: form.apellidos,
            fechaNac: form.fechaNac, sexo: form.sexo,
            estadoCivil: form.estadoCivil || undefined,
            ocupacion: form.ocupacion || undefined,
            departamento: form.departamento || undefined,
            municipio: form.municipio || undefined,
            direccion: form.direccion || undefined,
            telefono: form.telefono || undefined,
            idiomaPrincipal: form.idiomaPrincipal || undefined,
            tipoSangre: form.tipoSangre || undefined,
            alergias: form.alergias || undefined,
            observaciones: form.observaciones || undefined,
          },
        },
      })
      navigate(`/emision-ticket/${data.registrarPaciente.id}`)
    } catch (err) {
      alert('Error al registrar paciente: ' + err.message)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recepcion')} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Registro de Paciente</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? <FontAwesomeIcon icon={faCheck} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FontAwesomeIcon icon={faUser} className="text-blue-500" /> Datos Personales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>CI *</label><input className={inputCls} value={form.ci} onChange={update('ci')} required /></div>
              <div><label className={labelCls}>Nombres *</label><input className={inputCls} value={form.nombres} onChange={update('nombres')} required /></div>
              <div><label className={labelCls}>Apellidos *</label><input className={inputCls} value={form.apellidos} onChange={update('apellidos')} required /></div>
              <div><label className={labelCls}>Fecha de Nacimiento *</label><input type="date" className={inputCls} value={form.fechaNac} onChange={update('fechaNac')} required /></div>
              <div>
                <label className={labelCls}>Sexo *</label>
                <select className={inputCls} value={form.sexo} onChange={update('sexo')} required>
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado Civil</label>
                <select className={inputCls} value={form.estadoCivil} onChange={update('estadoCivil')}>
                  <option value="">Seleccionar...</option>
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="viudo">Viudo/a</option>
                  <option value="divorciado">Divorciado/a</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FontAwesomeIcon icon={faPhone} className="text-blue-500" /> Contacto y Ubicación</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Teléfono</label><input className={inputCls} value={form.telefono} onChange={update('telefono')} /></div>
              <div><label className={labelCls}>Ocupación</label><input className={inputCls} value={form.ocupacion} onChange={update('ocupacion')} /></div>
              <div><label className={labelCls}>Departamento</label><input className={inputCls} value={form.departamento} onChange={update('departamento')} /></div>
              <div><label className={labelCls}>Municipio</label><input className={inputCls} value={form.municipio} onChange={update('municipio')} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Dirección</label><textarea className={inputCls} rows={2} value={form.direccion} onChange={update('direccion')} /></div>
              <div>
                <label className={labelCls}>Idioma Principal</label>
                <select className={inputCls} value={form.idiomaPrincipal} onChange={update('idiomaPrincipal')}>
                  <option value="español">Español</option>
                  <option value="quechua">Quechua</option>
                  <option value="aymara">Aymara</option>
                  <option value="guaraní">Guaraní</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FontAwesomeIcon icon={faHeart} className="text-blue-500" /> Datos Médicos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de Sangre</label>
                <select className={inputCls} value={form.tipoSangre} onChange={update('tipoSangre')}>
                  <option value="">Seleccionar...</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className={labelCls}>Alergias conocidas</label><textarea className={inputCls} rows={2} value={form.alergias} onChange={update('alergias')} placeholder="Ej: Penicilina, Ibuprofeno..." /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Observaciones</label><textarea className={inputCls} rows={3} value={form.observaciones} onChange={update('observaciones')} /></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FontAwesomeIcon icon={faClipboard} className="text-blue-500" /> Confirmar Registro</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><span className="text-gray-500">CI:</span> <span className="font-medium">{form.ci}</span></div>
                <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{form.nombres} {form.apellidos}</span></div>
                <div><span className="text-gray-500">Nacimiento:</span> <span className="font-medium">{form.fechaNac}</span></div>
                <div><span className="text-gray-500">Sexo:</span> <span className="font-medium">{form.sexo === 'M' ? 'Masculino' : 'Femenino'}</span></div>
                <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{form.telefono || '—'}</span></div>
                <div><span className="text-gray-500">Tipo de Sangre:</span> <span className="font-medium">{form.tipoSangre || '—'}</span></div>
              </div>
              {form.alergias && <p className="text-orange-700 bg-orange-50 rounded-lg px-3 py-2"><strong>Alergias:</strong> {form.alergias}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-between">
        <button
          onClick={() => step === 0 ? navigate('/recepcion') : setStep(s => s - 1)}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          {step === 0 ? 'Cancelar' : 'Anterior'}
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            Siguiente <FontAwesomeIcon icon={faArrowRight} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCheck} />
            {loading ? 'Registrando...' : 'Registrar y Emitir Ticket'}
          </button>
        )}
      </div>
    </div>
  )
}
