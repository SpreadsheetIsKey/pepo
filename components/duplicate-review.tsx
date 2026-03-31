'use client'

import { useState } from 'react'

interface Transaction {
  transaction_date: string
  amount: number
  description: string
  bank_name: string
  row_hash: string
  index: number
}

interface DuplicateReviewProps {
  newTransactions: Transaction[]
  duplicateTransactions: Transaction[]
  onImport: (selectedTransactions: Transaction[]) => void
  onCancel: () => void
}

export function DuplicateReview({
  newTransactions,
  duplicateTransactions,
  onImport,
  onCancel,
}: DuplicateReviewProps) {
  // By default, select all new transactions, deselect all duplicates
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(
    new Set(newTransactions.map(t => t.row_hash))
  )

  const toggleTransaction = (hash: string) => {
    setSelectedHashes(prev => {
      const next = new Set(prev)
      if (next.has(hash)) {
        next.delete(hash)
      } else {
        next.add(hash)
      }
      return next
    })
  }

  const selectAll = () => {
    const allHashes = [...newTransactions, ...duplicateTransactions].map(t => t.row_hash)
    setSelectedHashes(new Set(allHashes))
  }

  const deselectAll = () => {
    setSelectedHashes(new Set())
  }

  const handleImport = () => {
    const selected = [...newTransactions, ...duplicateTransactions].filter(t =>
      selectedHashes.has(t.row_hash)
    )
    onImport(selected)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('nb-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const selectedCount = selectedHashes.size

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gjennomgå transaksjoner
          </h2>
          <p className="text-gray-600 mb-6">
            {duplicateTransactions.length > 0
              ? `Vi fant ${duplicateTransactions.length} duplikater. Velg hvilke transaksjoner du vil importere.`
              : 'Gjennomgå transaksjonene før import.'}
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Nye transaksjoner</div>
              <div className="text-2xl font-bold text-green-900">{newTransactions.length}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium">Duplikater</div>
              <div className="text-2xl font-bold text-yellow-900">{duplicateTransactions.length}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Valgt for import</div>
              <div className="text-2xl font-bold text-blue-900">{selectedCount}</div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Velg alle
            </button>
            <button
              onClick={deselectAll}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Fjern alle
            </button>
          </div>

          {/* New Transactions */}
          {newTransactions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                  NYE
                </span>
                Nye transaksjoner ({newTransactions.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          <input
                            type="checkbox"
                            checked={newTransactions.every(t => selectedHashes.has(t.row_hash))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                newTransactions.forEach(t => selectedHashes.add(t.row_hash))
                                setSelectedHashes(new Set(selectedHashes))
                              } else {
                                newTransactions.forEach(t => selectedHashes.delete(t.row_hash))
                                setSelectedHashes(new Set(selectedHashes))
                              }
                            }}
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Dato
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Beskrivelse
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                          Beløp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {newTransactions.map((transaction) => (
                        <tr
                          key={transaction.row_hash}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedHashes.has(transaction.row_hash) ? 'bg-green-50' : ''
                          }`}
                          onClick={() => toggleTransaction(transaction.row_hash)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedHashes.has(transaction.row_hash)}
                              onChange={() => toggleTransaction(transaction.row_hash)}
                              className="w-4 h-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                            <span
                              className={
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {formatAmount(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Transactions */}
          {duplicateTransactions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                  DUPLIKAT
                </span>
                Duplikater ({duplicateTransactions.length})
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Disse transaksjonene er allerede importert. Du kan velge å importere dem på nytt hvis du vil.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          <input
                            type="checkbox"
                            checked={duplicateTransactions.every(t => selectedHashes.has(t.row_hash))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                duplicateTransactions.forEach(t => selectedHashes.add(t.row_hash))
                                setSelectedHashes(new Set(selectedHashes))
                              } else {
                                duplicateTransactions.forEach(t => selectedHashes.delete(t.row_hash))
                                setSelectedHashes(new Set(selectedHashes))
                              }
                            }}
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Dato
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                          Beskrivelse
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                          Beløp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {duplicateTransactions.map((transaction) => (
                        <tr
                          key={transaction.row_hash}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedHashes.has(transaction.row_hash) ? 'bg-yellow-50' : ''
                          }`}
                          onClick={() => toggleTransaction(transaction.row_hash)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedHashes.has(transaction.row_hash)}
                              onChange={() => toggleTransaction(transaction.row_hash)}
                              className="w-4 h-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                            <span
                              className={
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {formatAmount(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Importer {selectedCount > 0 && `(${selectedCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
