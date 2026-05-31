import { useState, useCallback } from 'react'
import { useQuery } from '@apollo/client'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartBar, faFilePdf, faTicket, faCalendarDay,
  faCalendarWeek, faCalendar, faSlidersH,
  faSun, faMoon, faCheckCircle, faTimesCircle, faClock,
} from '@fortawesome/free-solid-svg-icons'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { REPORTE_RESUMEN, REPORTE_TICKETS } from '../../graphql/queries/reportes'
import { LoadingScreen } from '../../components/ui/Spinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

/* ── Helpers de fecha Bolivia ── */
const bolivia = (opts) => new Date().toLocaleString('en-CA', { timeZone: 'America/La_Paz', ...opts })
const hoyISO = () => bolivia({ dateStyle: 'short' })

function lunesDeSemana() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' }))
  const day = now.getDay()
  now.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  return now.toLocaleDateString('en-CA')
}
function primerDiaMes() { return hoyISO().slice(0, 7) + '-01' }

const fmtFecha = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-BO', { dateStyle: 'long' })

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy',          icon: faCalendarDay,  fi: () => hoyISO(),        ff: () => hoyISO() },
  { id: 'semana', label: 'Esta semana',   icon: faCalendarWeek, fi: () => lunesDeSemana(), ff: () => hoyISO() },
  { id: 'mes',    label: 'Este mes',      icon: faCalendar,     fi: () => primerDiaMes(),  ff: () => hoyISO() },
  { id: 'custom', label: 'Personalizado', icon: faSlidersH,     fi: null, ff: null },
]

/* ── Generador de PDF ── */
function generarPDF(r, rt, fechaInicio, fechaFin) {
  const doc = new jsPDF()
  const azul = [15, 45, 94]
  const azulClaro = [239, 246, 255]
  const verde = [16, 185, 129]
  const verdeClaro = [236, 253, 245]

  doc.setFillColor(...azul)
  doc.rect(0, 0, 210, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('HOSPITAL SEÑOR DE MALTA', 105, 16, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Gestión y Atención', 105, 24, { align: 'center' })
  doc.setFontSize(9)
  doc.text(`Período: ${fmtFecha(fechaInicio)}  al  ${fmtFecha(fechaFin)}`, 105, 31, { align: 'center' })
  doc.setTextColor(100)
  doc.setFontSize(8)
  doc.text(`Generado el: ${new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}`, 14, 44)

  doc.setTextColor(...azul)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen General', 14, 54)

  autoTable(doc, {
    startY: 57,
    head: [['Indicador', 'Valor']],
    body: [
      ['Pacientes registrados (activos)', r?.totalPacientes ?? 0],
      ['Consultas en el período', r?.totalConsultas ?? 0],
      ['Consultas finalizadas', r?.consultasFinalizadas ?? 0],
      ['Recetas emitidas en el período', (r?.recetasPendientes ?? 0) + (r?.recetasDespachadas ?? 0)],
      ['Recetas despachadas', r?.recetasDespachadas ?? 0],
      ['Recetas pendientes', r?.recetasPendientes ?? 0],
    ],
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: azulClaro },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
  })

  let y = doc.lastAutoTable.finalY + 12
  doc.setTextColor(...azul)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Reporte de Tickets', 14, y)

  autoTable(doc, {
    startY: y + 3,
    head: [['Período', 'Total de Tickets']],
    body: [
      ['Hoy', rt?.hoy ?? 0],
      ['Esta semana (lunes–hoy)', rt?.semana ?? 0],
      ['Este mes', rt?.mes ?? 0],
      [`Período del reporte (${fechaInicio} → ${fechaFin})`, rt?.periodo ?? 0],
    ],
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: azulClaro },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
  })

  y = doc.lastAutoTable.finalY + 8
  doc.setTextColor(...azul)
  doc.setFontSize(10)
  doc.text('Distribución por Turno', 14, y)

  autoTable(doc, {
    startY: y + 3,
    head: [['Turno', 'Tickets']],
    body: [
      ['Mañana (07:00 – 12:00)', rt?.manana ?? 0],
      ['Tarde (14:00 – 18:00)', rt?.tarde ?? 0],
    ],
    headStyles: { fillColor: [245, 158, 11], textColor: 255 },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    margin: { left: 14, right: 110 },
  })

  autoTable(doc, {
    startY: y + 3,
    head: [['Estado', 'Cantidad']],
    body: [
      ['Atendidos', rt?.atendidos ?? 0],
      ['Cancelados', rt?.cancelados ?? 0],
      ['Activos (en cola / consulta)', rt?.activos ?? 0],
    ],
    headStyles: { fillColor: verde, textColor: 255 },
    alternateRowStyles: { fillColor: verdeClaro },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    margin: { left: 110, right: 14 },
  })

  if (rt?.porDia?.length) {
    y = doc.lastAutoTable.finalY + 12
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setTextColor(...azul)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle Diario de Tickets', 14, y)
    autoTable(doc, {
      startY: y + 3,
      head: [['Fecha', 'Total', 'Atendidos', 'Cancelados', 'En espera']],
      body: rt.porDia.map(d => [
        d.fecha, d.total, d.atendidos, d.cancelados,
        Math.max(0, d.total - d.atendidos - d.cancelados),
      ]),
      headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: azulClaro },
      styles: { fontSize: 9, halign: 'center' },
      columnStyles: { 0: { halign: 'left' } },
    })
  }

  const total = doc.internal.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setTextColor(180)
    doc.text(
      `Hospital Señor de Malta  ·  Reporte generado automáticamente  ·  Pág. ${p} de ${total}`,
      105, 290, { align: 'center' }
    )
  }

  doc.save(`reporte_${fechaInicio}_al_${fechaFin}.pdf`)
}

/* ── Componente principal ── */
export default function Reportes() {
  const today = hoyISO()
  const [periodoId, setPeriodoId] = useState('mes')
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes())
  const [fechaFin, setFechaFin] = useState(today)

  const aplicarPeriodo = useCallback((p) => {
    setPeriodoId(p.id)
    if (p.id !== 'custom') {
      setFechaInicio(p.fi())
      setFechaFin(p.ff())
    }
  }, [])

  const { data: resData, loading: resLoading } = useQuery(REPORTE_RESUMEN, {
    variables: { fechaInicio, fechaFin },
  })
  const { data: tickData, loading: tickLoading } = useQuery(REPORTE_TICKETS, {
    variables: { fechaInicio, fechaFin },
  })

  const r = resData?.reporteResumen
  const rt = tickData?.reporteTickets
  const loading = resLoading || tickLoading

  const barDiario = {
    labels: rt?.porDia?.map(d => d.fecha) || [],
    datasets: [
      {
        label: 'Total',
        data: rt?.porDia?.map(d => d.total) || [],
        backgroundColor: '#3B82F6',
        borderRadius: 6,
        maxBarThickness: 36,
      },
      {
        label: 'Atendidos',
        data: rt?.porDia?.map(d => d.atendidos) || [],
        backgroundColor: '#10B981',
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  }

  return (
    <div className="space-y-6">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-500 text-sm">
            {fmtFecha(fechaInicio)} — {fmtFecha(fechaFin)}
          </p>
        </div>
        <button
          onClick={() => generarPDF(r, rt, fechaInicio, fechaFin)}
          disabled={!r || !rt}
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <FontAwesomeIcon icon={faFilePdf} />
          Descargar PDF
        </button>
      </div>

      {/* ── Selector de período ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map(p => (
            <button
              key={p.id}
              onClick={() => aplicarPeriodo(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                periodoId === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FontAwesomeIcon icon={p.icon} className="text-xs" />
              {p.label}
            </button>
          ))}
        </div>
        {periodoId === 'custom' && (
          <div className="flex flex-wrap gap-4 items-end pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                type="date" value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                type="date" value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? <LoadingScreen /> : (
        <>
          {/* ── RESUMEN GENERAL ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChartBar} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Resumen General</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Pacientes registrados', value: r?.totalPacientes,     color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: 'Consultas en período',   value: r?.totalConsultas,     color: 'bg-violet-50 text-violet-700 border-violet-100' },
                { label: 'Tickets emitidos',        value: rt?.periodo,          color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { label: 'Recetas pendientes',      value: r?.recetasPendientes, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-4 border ${item.color}`}>
                  <p className="text-3xl font-black">{item.value ?? '—'}</p>
                  <p className="text-sm font-medium opacity-80 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── REPORTE DE TICKETS ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTicket} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Reporte de Tickets</h2>
            </div>

            {/* KPIs fijos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-900 rounded-xl p-5 text-white text-center">
                <FontAwesomeIcon icon={faCalendarDay} className="text-blue-300 mb-2" />
                <p className="text-4xl font-black">{rt?.hoy ?? '—'}</p>
                <p className="text-blue-200 text-sm font-medium mt-1">Tickets hoy</p>
              </div>
              <div className="bg-blue-700 rounded-xl p-5 text-white text-center">
                <FontAwesomeIcon icon={faCalendarWeek} className="text-blue-200 mb-2" />
                <p className="text-4xl font-black">{rt?.semana ?? '—'}</p>
                <p className="text-blue-100 text-sm font-medium mt-1">Esta semana</p>
              </div>
              <div className="bg-blue-600 rounded-xl p-5 text-white text-center">
                <FontAwesomeIcon icon={faCalendar} className="text-blue-100 mb-2" />
                <p className="text-4xl font-black">{rt?.mes ?? '—'}</p>
                <p className="text-blue-50 text-sm font-medium mt-1">Este mes</p>
              </div>
            </div>

            {/* Gráfico diario */}
            {rt?.porDia?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-4 text-sm">
                  Tickets por día — {rt.periodo} total en el período
                </h3>
                <div style={{ height: 220 }}>
                  <Bar
                    data={barDiario}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Breakdown turno + estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Por Turno</h3>
                <div className="divide-y divide-gray-50">
                  {[
                    { icon: faSun,  color: 'text-yellow-500', label: 'Mañana  07:00 – 12:00', val: rt?.manana ?? 0 },
                    { icon: faMoon, color: 'text-indigo-500', label: 'Tarde   14:00 – 18:00', val: rt?.tarde ?? 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={item.icon} className={`text-sm ${item.color}`} />
                        <span className="text-sm text-gray-600">{item.label}</span>
                      </div>
                      <span className="text-2xl font-black text-gray-800">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Por Estado</h3>
                <div className="divide-y divide-gray-50">
                  {[
                    { icon: faCheckCircle, color: 'text-green-500', label: 'Atendidos',          val: rt?.atendidos ?? 0 },
                    { icon: faTimesCircle, color: 'text-red-500',   label: 'Cancelados',         val: rt?.cancelados ?? 0 },
                    { icon: faClock,       color: 'text-blue-500',  label: 'Activos (en espera)', val: rt?.activos ?? 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={item.icon} className={`text-sm ${item.color}`} />
                        <span className="text-sm text-gray-600">{item.label}</span>
                      </div>
                      <span className="text-2xl font-black text-gray-800">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
