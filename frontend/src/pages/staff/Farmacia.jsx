import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPills, faClipboardList, faCheck, faExclamationTriangle,
  faSearch, faPlus
} from '@fortawesome/free-solid-svg-icons'
import { MEDICAMENTOS, ACTUALIZAR_STOCK, REGISTRAR_MEDICAMENTO } from '../../graphql/queries/farmacia'
import { RECETAS_PENDIENTES, DESPACHAR_RECETA } from '../../graphql/queries/recetas'
import { LoadingScreen } from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'

const TABS = [
  { id: 'recetas', label: 'Recetas Pendientes', icon: faClipboardList },
  { id: 'stock', label: 'Stock de Medicamentos', icon: faPills },
]

const inputCls = 'w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center'

export default function Farmacia() {
  const [tab, setTab] = useState('recetas')
  const [busqueda, setBusqueda] = useState('')
  const [modalStock, setModalStock] = useState(null)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [stockForm, setStockForm] = useState({ cantidad: '', operacion: 'incremento' })
  const [nuevoForm, setNuevoForm] = useState({ nombre: '', presentacion: '', stockActual: '', stockMinimo: '', unidad: 'unidades' })

  // despachoVals[`${recetaId}-${itemId}-field`] = value
  const [despachoVals, setDespachoVals] = useState({})

  const { data: recetasData, loading: loadingRecetas, refetch: refetchRecetas } = useQuery(RECETAS_PENDIENTES, { pollInterval: 15000 })
  const { data: medData, loading: loadingMed, refetch: refetchMed } = useQuery(MEDICAMENTOS, {
    variables: { busqueda: busqueda || undefined }
  })

  const [despacharReceta, { loading: despachando }] = useMutation(DESPACHAR_RECETA, {
    onCompleted: () => refetchRecetas()
  })
  const [actualizarStock] = useMutation(ACTUALIZAR_STOCK, {
    onCompleted: () => { setModalStock(null); refetchMed() }
  })
  const [registrarMedicamento] = useMutation(REGISTRAR_MEDICAMENTO, {
    onCompleted: () => { setModalNuevo(false); refetchMed() }
  })

  const getVal = (recetaId, itemId, field) =>
    despachoVals[`${recetaId}-${itemId}-${field}`] ?? ''

  const setVal = (recetaId, itemId, field, value) =>
    setDespachoVals(prev => ({ ...prev, [`${recetaId}-${itemId}-${field}`]: value }))

  const handleDespachar = (receta) => {
    const items = receta.items?.map(item => {
      const cr = getVal(receta.id, item.id, 'cantidadRecetada')
      const cd = getVal(receta.id, item.id, 'cantidadDispensada')
      const vu = getVal(receta.id, item.id, 'valorUnitario')
      return {
        itemId: item.id,
        cantidadRecetada: cr !== '' ? parseInt(cr, 10) : undefined,
        cantidadDispensada: cd !== '' ? parseInt(cd, 10) : undefined,
        valorUnitario: vu !== '' ? parseFloat(vu) : undefined,
      }
    }) || []
    despacharReceta({ variables: { recetaId: receta.id, items } })
  }

  const alertaColor = { ok: 'text-green-600', bajo: 'text-yellow-600', agotado: 'text-red-600', vencido: 'text-purple-600' }
  const modalInputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Farmacia</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Recetas Pendientes */}
      {tab === 'recetas' && (
        <div className="space-y-5">
          {loadingRecetas ? <LoadingScreen /> : recetasData?.recetasPendientes?.length === 0 ? (
            <EmptyState icon={faClipboardList} title="Sin recetas pendientes" description="Todas las recetas han sido despachadas" />
          ) : (
            recetasData?.recetasPendientes?.map(r => {
              // Costo total de esta receta
              const costoTotal = r.items?.reduce((sum, item) => {
                const cd = parseFloat(getVal(r.id, item.id, 'cantidadDispensada')) || 0
                const vu = parseFloat(getVal(r.id, item.id, 'valorUnitario')) || 0
                return sum + cd * vu
              }, 0) || 0

              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Header de receta */}
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800">{r.paciente?.nombreCompleto}</p>
                      <p className="text-gray-500 text-sm">CI: {r.paciente?.ci} · Dr. {r.medico?.nombreCompleto}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{new Date(r.fechaEmision).toLocaleDateString('es-BO', { dateStyle: 'medium' })}</p>
                    </div>
                    <button
                      onClick={() => handleDespachar(r)}
                      disabled={despachando}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 shrink-0"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      Despachar
                    </button>
                  </div>

                  {/* Tabla de items */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <th className="px-4 py-2.5 text-left min-w-[150px]">Medicamento / Insumo</th>
                          <th className="px-3 py-2.5 text-center w-24">Cantidad</th>
                          <th className="px-3 py-2.5 text-center w-28">Frecuencia</th>
                          <th className="px-3 py-2.5 text-center w-24">Tiempo Uso</th>
                          <th className="px-3 py-2.5 text-center w-24">Vía</th>
                          <th className="px-3 py-2.5 text-center w-28 text-blue-600">Cant. Recetada</th>
                          <th className="px-3 py-2.5 text-center w-28 text-blue-600">Cant. Dispensada</th>
                          <th className="px-3 py-2.5 text-center w-28 text-blue-600">Valor Unit. (Bs)</th>
                          <th className="px-3 py-2.5 text-right w-24">Total (Bs)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {r.items?.map(item => {
                          const cd = parseFloat(getVal(r.id, item.id, 'cantidadDispensada')) || 0
                          const vu = parseFloat(getVal(r.id, item.id, 'valorUnitario')) || 0
                          const rowTotal = cd * vu
                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              {/* Datos del médico — solo lectura */}
                              <td className="px-4 py-2.5 font-medium text-gray-800">{item.medicamentoNombre}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{item.cantidad || '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{item.frecuencia || '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{item.tiempoUso || '—'}</td>
                              <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{item.viaAdministracion || '—'}</td>
                              {/* Campos que llena la farmacéutica */}
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  className={inputCls}
                                  placeholder={item.cantidad || '0'}
                                  value={getVal(r.id, item.id, 'cantidadRecetada')}
                                  onChange={e => setVal(r.id, item.id, 'cantidadRecetada', e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  className={inputCls}
                                  placeholder="0"
                                  value={getVal(r.id, item.id, 'cantidadDispensada')}
                                  onChange={e => setVal(r.id, item.id, 'cantidadDispensada', e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={inputCls}
                                  placeholder="0.00"
                                  value={getVal(r.id, item.id, 'valorUnitario')}
                                  onChange={e => setVal(r.id, item.id, 'valorUnitario', e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className={`font-semibold text-sm ${rowTotal > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                                  {rowTotal > 0 ? `Bs ${rowTotal.toFixed(2)}` : '—'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Costo total */}
                  <div className="flex justify-end items-center gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-600">Costo Total:</span>
                    <span className={`text-lg font-black ${costoTotal > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                      {costoTotal > 0 ? `Bs ${costoTotal.toFixed(2)}` : 'Bs 0.00'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Stock */}
      {tab === 'stock' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Buscar medicamento..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setModalNuevo(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Nuevo
            </button>
          </div>

          {loadingMed ? <LoadingScreen /> : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Medicamento</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Presentación</th>
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Stock</th>
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Estado</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {medData?.medicamentos?.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{m.nombre}</td>
                      <td className="py-3 px-4 text-gray-500">{m.presentacion}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${m.stockActual === 0 ? 'text-red-600' : m.stockActual <= m.stockMinimo ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {m.stockActual}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">/ min {m.stockMinimo}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge estado={m.alertaStock} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setModalStock(m)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                        >
                          Ajustar stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal stock */}
      <Modal open={!!modalStock} onClose={() => setModalStock(null)} title={`Ajustar Stock — ${modalStock?.nombre}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
            <select className={modalInputCls} value={stockForm.operacion} onChange={e => setStockForm(f => ({ ...f, operacion: e.target.value }))}>
              <option value="incremento">Incremento</option>
              <option value="decremento">Decremento</option>
              <option value="ajuste">Ajuste directo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input type="number" className={modalInputCls} value={stockForm.cantidad} onChange={e => setStockForm(f => ({ ...f, cantidad: e.target.value }))} />
          </div>
          <button
            onClick={() => actualizarStock({ variables: { medicamentoId: modalStock.id, cantidad: parseInt(stockForm.cantidad), operacion: stockForm.operacion } })}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium"
          >
            Actualizar
          </button>
        </div>
      </Modal>

      {/* Modal nuevo medicamento */}
      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Registrar Medicamento">
        <div className="space-y-3">
          {[
            { key: 'nombre', label: 'Nombre *' },
            { key: 'presentacion', label: 'Presentación *' },
            { key: 'stockActual', label: 'Stock Inicial', type: 'number' },
            { key: 'stockMinimo', label: 'Stock Mínimo', type: 'number' },
            { key: 'unidad', label: 'Unidad' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type || 'text'} className={modalInputCls} value={nuevoForm[f.key]} onChange={e => setNuevoForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <button
            onClick={() => registrarMedicamento({ variables: { input: { ...nuevoForm, stockActual: parseInt(nuevoForm.stockActual) || 0, stockMinimo: parseInt(nuevoForm.stockMinimo) || 10 } } })}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium mt-2"
          >
            Registrar
          </button>
        </div>
      </Modal>
    </div>
  )
}
