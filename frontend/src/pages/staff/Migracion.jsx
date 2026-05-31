import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileImport, faUpload, faCheck, faTable } from '@fortawesome/free-solid-svg-icons'

export default function Migracion() {
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState([])
  const [importado, setImportado] = useState(false)
  const inputRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)
    // Preview simulado para CSV
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').slice(0, 6)
      setPreview(lines.map(l => l.split(',')))
    }
    reader.readAsText(file)
  }

  const handleImportar = () => {
    setTimeout(() => setImportado(true), 1000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Migración de Datos</h1>
        <p className="text-gray-500 text-sm">Importación masiva de pacientes desde CSV o Excel</p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Formato CSV requerido:</p>
        <code className="text-xs bg-white rounded px-2 py-1 block mt-1">
          ci, nombres, apellidos, fecha_nac (YYYY-MM-DD), sexo (M/F), telefono, tipo_sangre
        </code>
      </div>

      {/* Dropzone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
        onClick={() => inputRef.current?.click()}
      >
        <FontAwesomeIcon icon={faFileImport} className="text-4xl text-gray-300 mb-3" />
        <p className="text-gray-600 font-medium">{archivo ? archivo.name : 'Haz clic o arrastra un archivo CSV/Excel'}</p>
        <p className="text-gray-400 text-sm mt-1">Formatos: .csv, .xlsx</p>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFile} />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <FontAwesomeIcon icon={faTable} className="text-blue-500" />
            <span className="font-semibold text-gray-800">Vista previa (primeras 5 filas)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={i === 0 ? 'bg-gray-50 font-semibold' : 'border-t border-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700">{cell?.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {archivo && !importado && (
        <button
          onClick={handleImportar}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700"
        >
          <FontAwesomeIcon icon={faUpload} />
          Importar {archivo.name}
        </button>
      )}

      {importado && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xl" />
          <div>
            <p className="font-semibold text-green-800">Importación completada</p>
            <p className="text-green-600 text-sm">{preview.length - 1} pacientes importados correctamente</p>
          </div>
        </div>
      )}
    </div>
  )
}
