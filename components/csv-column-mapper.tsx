'use client'

import { useState, useEffect } from 'react'

interface ColumnMapping {
  date: number | null
  description: number | null
  amountIn: number | null
  amountOut: number | null
  amountCombined: number | null
}

interface CsvColumnMapperProps {
  csvContent: string
  onMappingComplete: (mapping: ColumnMapping) => void
  onCancel: () => void
}

export function CsvColumnMapper({ csvContent, onMappingComplete, onCancel }: CsvColumnMapperProps) {
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: null,
    description: null,
    amountIn: null,
    amountOut: null,
    amountCombined: null,
  })
  const [useSeparateAmountColumns, setUseSeparateAmountColumns] = useState(false)

  useEffect(() => {
    // Parse CSV to get headers and preview
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length === 0) return

    // Detect delimiter
    const delimiter = lines[0].includes(';') ? ';' : ','

    // Get headers
    const headerRow = lines[0].split(delimiter).map(h => h.trim())
    setHeaders(headerRow)

    // Get preview rows (first 3 data rows)
    const previewRows = lines.slice(1, 4).map(line =>
      line.split(delimiter).map(cell => cell.trim())
    )
    setPreview(previewRows)

    // Auto-detect columns
    const autoDetect: ColumnMapping = {
      date: null,
      description: null,
      amountIn: null,
      amountOut: null,
      amountCombined: null,
    }

    headerRow.forEach((header, index) => {
      const lower = header.toLowerCase()

      // Date detection
      if (lower.includes('date') || lower.includes('dato') || lower.includes('bokført')) {
        autoDetect.date = index
      }

      // Description detection
      if (lower.includes('beskrivelse') || lower.includes('description') || lower.includes('tekst') || lower.includes('transaksjon')) {
        autoDetect.description = index
      }

      // Amount detection
      if (lower.includes('inn') || lower.includes('credit') || lower.includes('innskudd')) {
        autoDetect.amountIn = index
        setUseSeparateAmountColumns(true)
      }
      if (lower.includes('ut') || lower.includes('debit') || lower.includes('uttak')) {
        autoDetect.amountOut = index
        setUseSeparateAmountColumns(true)
      }
      if (lower.includes('beløp') || lower.includes('amount') || lower.includes('sum')) {
        autoDetect.amountCombined = index
      }
    })

    setMapping(autoDetect)
  }, [csvContent])

  const handleColumnSelect = (field: keyof ColumnMapping, columnIndex: number) => {
    setMapping(prev => ({ ...prev, [field]: columnIndex }))
  }

  const isValid = () => {
    if (mapping.date === null || mapping.description === null) return false

    if (useSeparateAmountColumns) {
      return mapping.amountIn !== null || mapping.amountOut !== null
    } else {
      return mapping.amountCombined !== null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tilpass kolonner
          </h2>
          <p className="text-gray-600 mb-6">
            Velg hvilke kolonner som inneholder dato, beskrivelse og beløp i din CSV-fil.
          </p>

          {/* Preview Table */}
          <div className="mb-6 overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Column Mapping */}
          <div className="space-y-4 mb-6">
            {/* Date Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dato-kolonne *
              </label>
              <select
                value={mapping.date ?? ''}
                onChange={(e) => handleColumnSelect('date', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Velg kolonne...</option>
                {headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse-kolonne *
              </label>
              <select
                value={mapping.description ?? ''}
                onChange={(e) => handleColumnSelect('description', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Velg kolonne...</option>
                {headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Column Type Toggle */}
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={useSeparateAmountColumns}
                  onChange={(e) => setUseSeparateAmountColumns(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Beløp er i to separate kolonner (Inn/Ut)
                </span>
              </label>

              {useSeparateAmountColumns ? (
                <>
                  {/* Amount In Column */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inn-kolonne (innskudd/credit)
                    </label>
                    <select
                      value={mapping.amountIn ?? ''}
                      onChange={(e) => handleColumnSelect('amountIn', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Velg kolonne (valgfritt)...</option>
                      {headers.map((header, index) => (
                        <option key={index} value={index}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Out Column */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ut-kolonne (uttak/debit)
                    </label>
                    <select
                      value={mapping.amountOut ?? ''}
                      onChange={(e) => handleColumnSelect('amountOut', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Velg kolonne (valgfritt)...</option>
                      {headers.map((header, index) => (
                        <option key={index} value={index}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Combined Amount Column */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beløp-kolonne * (negative tall = utgifter)
                  </label>
                  <select
                    value={mapping.amountCombined ?? ''}
                    onChange={(e) => handleColumnSelect('amountCombined', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Velg kolonne...</option>
                    {headers.map((header, index) => (
                      <option key={index} value={index}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={() => onMappingComplete(mapping)}
              disabled={!isValid()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Fortsett import
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
