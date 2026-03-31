'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CsvColumnMapper } from './csv-column-mapper'
import * as XLSX from 'xlsx'

type UploadStatus = 'idle' | 'uploading' | 'mapping' | 'processing' | 'success' | 'error'

interface ColumnMapping {
  date: number | null
  description: number | null
  amountIn: number | null
  amountOut: number | null
  amountCombined: number | null
}

export function CsvUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [transactionCount, setTransactionCount] = useState(0)

  const convertXlsxToCsv = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })

          // Get first sheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Convert to CSV
          const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' })
          resolve(csv)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Kunne ikke lese Excel-filen'))
      reader.readAsBinaryString(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isCSV = file.name.endsWith('.csv')
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (!isCSV && !isExcel) {
      setStatus('error')
      setMessage('Vennligst last opp en CSV- eller Excel-fil (.csv, .xlsx, .xls)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error')
      setMessage('Filen er for stor. Maksimal størrelse er 10MB')
      return
    }

    setFileName(file.name)
    setStatus('uploading')
    setMessage('Leser fil...')

    try {
      let text: string

      if (isExcel) {
        // Convert Excel to CSV
        setMessage('Konverterer Excel til CSV...')
        text = await convertXlsxToCsv(file)
      } else {
        // Read CSV directly
        text = await file.text()
      }

      setCsvContent(text)

      // Show column mapper
      setStatus('mapping')

      // Reset file input
      e.target.value = ''
    } catch (error: any) {
      console.error('File read error:', error)
      setStatus('error')
      setMessage(error.message || 'Kunne ikke lese filen. Prøv igjen.')
    }
  }

  const handleMappingComplete = async (mapping: ColumnMapping) => {
    setStatus('processing')
    setMessage('Behandler transaksjoner...')

    try {
      // Parse CSV and upload to backend with column mapping
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvContent,
          fileName,
          columnMapping: mapping,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt')
      }

      setStatus('success')
      setTransactionCount(data.count)
      setMessage(`✓ ${data.count} transaksjoner importert!`)
      setCsvContent('')
    } catch (error: any) {
      console.error('Upload error:', error)
      setStatus('error')
      setMessage(error.message || 'Kunne ikke laste opp filen. Prøv igjen.')
    }
  }

  const handleMappingCancel = () => {
    setStatus('idle')
    setCsvContent('')
    setFileName(null)
    setMessage('')
  }

  const resetUpload = () => {
    setStatus('idle')
    setMessage('')
    setFileName(null)
    setTransactionCount(0)
  }

  return (
    <>
      {/* Column Mapper Dialog */}
      {status === 'mapping' && csvContent && (
        <CsvColumnMapper
          csvContent={csvContent}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
        />
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Last opp bankkontoutskrift
        </h2>

      <p className="text-sm text-gray-600 mb-6">
        Støttede banker: DNB, Nordea, Sparebank 1. Last opp CSV eller Excel-filer fra nettbanken din.
      </p>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          disabled={status === 'uploading' || status === 'processing'}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className={`cursor-pointer ${
            status === 'uploading' || status === 'processing'
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700">
            {status === 'uploading' || status === 'processing'
              ? message
              : 'Klikk for å velge CSV eller Excel-fil'}
          </p>
          <p className="text-sm text-gray-500 mt-2">eller dra og slipp filen her (.csv, .xlsx, .xls)</p>
        </label>
      </div>

      {/* Status Messages */}
      {status !== 'idle' && status !== 'uploading' && status !== 'processing' && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            status === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`text-sm ${
              status === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message}
          </p>
          {status === 'success' && (
            <button
              onClick={resetUpload}
              className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium"
            >
              Last opp flere transaksjoner →
            </button>
          )}
        </div>
      )}

      {/* File Info */}
      {fileName && status !== 'success' && (
        <div className="mt-4 text-sm text-gray-600">
          <strong>Fil:</strong> {fileName}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Hvordan laste ned fra din bank:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            <strong>DNB:</strong> Logg inn → Kontooversikt → Eksporter → Velg CSV eller Excel
          </li>
          <li>
            <strong>Nordea:</strong> Kontooversikt → Eksporter til Excel/CSV
          </li>
          <li>
            <strong>Sparebank 1:</strong> Transaksjoner → Last ned → CSV eller Excel-format
          </li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          💡 Tip: Excel-filer (.xlsx) konverteres automatisk til riktig format
        </p>
      </div>
    </div>
    </>
  )
}
