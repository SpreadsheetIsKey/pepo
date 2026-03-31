'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CsvColumnMapper } from './csv-column-mapper'
import { DuplicateReview } from './duplicate-review'
import * as XLSX from 'xlsx'

type UploadStatus = 'idle' | 'uploading' | 'mapping' | 'reviewing' | 'processing' | 'success' | 'error'

interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string | null
  is_default: boolean
}

interface ColumnMapping {
  date: number | null
  description: number | null
  amountIn: number | null
  amountOut: number | null
  amountCombined: number | null
}

interface Transaction {
  transaction_date: string
  amount: number
  description: string
  bank_name: string
  row_hash: string
  index: number
}

interface CsvUploadProps {
  onUploadComplete?: () => void
}

export function CsvUpload({ onUploadComplete }: CsvUploadProps = {}) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [transactionCount, setTransactionCount] = useState(0)
  const [newTransactions, setNewTransactions] = useState<Transaction[]>([])
  const [duplicateTransactions, setDuplicateTransactions] = useState<Transaction[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null)
  const [showNewBankAccountForm, setShowNewBankAccountForm] = useState(false)
  const [newBankName, setNewBankName] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')

  // Fetch bank accounts on mount
  useEffect(() => {
    fetchBankAccounts()
  }, [])

  async function fetchBankAccounts() {
    try {
      const response = await fetch('/api/bank-accounts')
      const data = await response.json()
      if (response.ok) {
        setBankAccounts(data.bankAccounts || [])
        // Set default account as selected
        const defaultAccount = data.bankAccounts?.find((acc: BankAccount) => acc.is_default)
        if (defaultAccount) {
          setSelectedBankAccountId(defaultAccount.id)
        }
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }

  async function createBankAccount() {
    if (!newBankName || !newAccountName) {
      setStatus('error')
      setMessage('Banknavn og kontonavn er påkrevd')
      return null
    }

    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bank_name: newBankName,
          account_name: newAccountName,
          account_number: newAccountNumber || null,
          is_default: bankAccounts.length === 0, // First account is default
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke opprette bankkonto')
      }

      // Refresh bank accounts list
      await fetchBankAccounts()
      setSelectedBankAccountId(data.bankAccount.id)
      setShowNewBankAccountForm(false)
      setNewBankName('')
      setNewAccountName('')
      setNewAccountNumber('')

      return data.bankAccount.id
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Kunne ikke opprette bankkonto')
      return null
    }
  }

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
    setColumnMapping(mapping)

    // Handle bank account selection or creation
    let bankAccountId = selectedBankAccountId

    if (showNewBankAccountForm) {
      setMessage('Oppretter bankkonto...')
      bankAccountId = await createBankAccount()
      if (!bankAccountId) {
        return // Error already handled in createBankAccount
      }
    }

    if (!bankAccountId && bankAccounts.length === 0) {
      setStatus('error')
      setMessage('Vennligst opprett en bankkonto først')
      return
    }

    setMessage('Sjekker for duplikater...')

    try {
      // Step 1: Check for duplicates
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvContent,
          fileName,
          columnMapping: mapping,
          mode: 'check',
          bankAccountId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt')
      }

      // If duplicates found or user needs to review, show duplicate review
      if (data.requiresReview || data.duplicateCount > 0) {
        setNewTransactions(data.newTransactions || [])
        setDuplicateTransactions(data.duplicateTransactions || [])
        setStatus('reviewing')
      } else {
        // No duplicates, import all automatically
        await handleImport(data.newTransactions)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setStatus('error')
      setMessage(error.message || 'Kunne ikke sjekke for duplikater. Prøv igjen.')
    }
  }

  const handleImport = async (transactionsToImport: Transaction[]) => {
    setStatus('processing')
    setMessage('Importerer transaksjoner...')

    try {
      // Step 2: Import selected transactions
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvContent,
          fileName,
          columnMapping,
          mode: 'import',
          transactionsToImport,
          bankAccountId: selectedBankAccountId,
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
      setNewTransactions([])
      setDuplicateTransactions([])

      // Notify parent that upload completed
      onUploadComplete?.()
    } catch (error: any) {
      console.error('Import error:', error)
      setStatus('error')
      setMessage(error.message || 'Kunne ikke importere transaksjoner. Prøv igjen.')
    }
  }

  const handleMappingCancel = () => {
    setStatus('idle')
    setCsvContent('')
    setFileName(null)
    setMessage('')
  }

  const handleReviewCancel = () => {
    setStatus('idle')
    setCsvContent('')
    setFileName(null)
    setMessage('')
    setNewTransactions([])
    setDuplicateTransactions([])
    setColumnMapping(null)
  }

  const resetUpload = () => {
    setStatus('idle')
    setMessage('')
    setFileName(null)
    setTransactionCount(0)
    setNewTransactions([])
    setDuplicateTransactions([])
    setColumnMapping(null)
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

      {/* Duplicate Review Dialog */}
      {status === 'reviewing' && (
        <DuplicateReview
          newTransactions={newTransactions}
          duplicateTransactions={duplicateTransactions}
          onImport={handleImport}
          onCancel={handleReviewCancel}
        />
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Last opp bankkontoutskrift
        </h2>

      <p className="text-sm text-gray-600 mb-6">
        Støttede banker: DNB, Nordea, Sparebank 1. Last opp CSV eller Excel-filer fra nettbanken din.
      </p>

      {/* Bank Account Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Velg bankkonto
        </label>
        {!showNewBankAccountForm ? (
          <div className="space-y-2">
            <select
              value={selectedBankAccountId || ''}
              onChange={(e) => setSelectedBankAccountId(e.target.value || null)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={status === 'uploading' || status === 'processing'}
            >
              <option value="">Velg konto...</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_name}
                  {account.account_number ? ` (${account.account_number})` : ''}
                  {account.is_default ? ' [Standard]' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewBankAccountForm(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={status === 'uploading' || status === 'processing'}
            >
              + Opprett ny bankkonto
            </button>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Banknavn *
              </label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="DNB, Nordea, Sparebank 1..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kontonavn *
              </label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Brukskonto, Sparekonto..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kontonummer (valgfritt)
              </label>
              <input
                type="text"
                value={newAccountNumber}
                onChange={(e) => setNewAccountNumber(e.target.value)}
                placeholder="1234 56 78901"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewBankAccountForm(false)
                  setNewBankName('')
                  setNewAccountName('')
                  setNewAccountNumber('')
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Avbryt
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Kontoen vil bli opprettet når du laster opp filen
              </p>
            </div>
          </div>
        )}
      </div>

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
