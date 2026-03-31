'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
  id: string
  transaction_date: string
  amount: number
  category: string | null
}

interface CategorySpend {
  category: string
  total: number
  percentage: number
  transactionCount: number
}

export function SpendingDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareMode, setShareMode] = useState<'percentage' | 'amount'>('percentage')
  const [hasNativeShare, setHasNativeShare] = useState(false)

  useEffect(() => {
    setHasNativeShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('id, transaction_date, amount, category')
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
    } else {
      setTransactions(data || [])
      // Set default to current month if transactions exist
      if (data && data.length > 0) {
        const latestDate = new Date(data[0].transaction_date)
        const monthKey = `${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, '0')}`
        setSelectedMonth(monthKey)
      }
    }
    setLoading(false)
  }

  // Get unique months from transactions
  const availableMonths = Array.from(new Set(
    transactions.map(t => {
      const date = new Date(t.transaction_date)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
  )).sort((a, b) => b.localeCompare(a))

  // Filter transactions by month
  const filteredTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter(t => {
        const date = new Date(t.transaction_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return monthKey === selectedMonth
      })

  // Calculate spending by main category only (only expenses, negative amounts)
  const categorySpending = filteredTransactions
    .filter(t => t.amount < 0 && t.category !== null)
    .reduce((acc, t) => {
      const fullCategory = t.category as string
      // Extract main category (before the colon)
      const mainCategory = fullCategory.includes(':')
        ? fullCategory.split(':')[0].trim()
        : fullCategory

      if (!acc[mainCategory]) {
        acc[mainCategory] = { total: 0, count: 0 }
      }
      acc[mainCategory].total += Math.abs(t.amount)
      acc[mainCategory].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)

  const totalExpenses = Object.values(categorySpending).reduce((sum, cat) => sum + cat.total, 0)

  const categoryData: CategorySpend[] = Object.entries(categorySpending)
    .map(([category, data]) => ({
      category,
      total: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      transactionCount: data.count
    }))
    .sort((a, b) => b.total - a.total)

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  function formatMonthHeader(monthKey: string) {
    if (monthKey === 'all') return 'Alle måneder'
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long'
    })
  }

  function handleShare() {
    const text = generateShareText()

    if (navigator.share) {
      // Use native share if available (mobile)
      navigator.share({
        title: 'Mine utgifter - Financial Clarity Engine',
        text: text,
      }).catch(() => {
        // Fallback to clipboard if share is cancelled
        copyToClipboard(text)
      })
    } else {
      // Desktop: copy to clipboard
      copyToClipboard(text)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('✓ Kopiert til utklippstavle! Lim inn hvor du vil dele.')
    }).catch(() => {
      alert('Kunne ikke kopiere. Prøv igjen.')
    })
  }

  function generateShareText(): string {
    const header = `📊 Mine utgifter - ${formatMonthHeader(selectedMonth)}\n\n`

    const categories = categoryData
      .slice(0, 5) // Top 5 categories
      .map(cat => {
        if (shareMode === 'percentage') {
          return `${cat.category}: ${cat.percentage.toFixed(1)}%`
        } else {
          return `${cat.category}: ${formatAmount(cat.total)}`
        }
      })
      .join('\n')

    const footer = `\n\n💡 Sporet med Financial Clarity Engine`

    return header + categories + footer
  }

  const uncategorizedExpenses = filteredTransactions
    .filter(t => t.amount < 0 && t.category === null)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Forbruksoversikt
        </h2>
        <p className="text-gray-500">
          Ingen transaksjoner å vise ennå.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Forbruksoversikt
          </h2>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Del
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[250px]">
            <label htmlFor="month-selector" className="sr-only">Velg måned</label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="all">Alle måneder</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {formatMonthHeader(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Total Spending Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div className="text-sm font-medium text-blue-900 mb-1">
            Totalt forbruk {selectedMonth !== 'all' && `(${formatMonthHeader(selectedMonth)})`}
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {formatAmount(totalExpenses)}
          </div>
          {uncategorizedExpenses > 0 && (
            <div className="mt-2 text-xs text-amber-700">
              + {formatAmount(uncategorizedExpenses)} ukategorisert
            </div>
          )}
        </div>

        {/* Category List */}
        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Ingen utgifter å vise for denne perioden
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Kategorier ({categoryData.length})
            </h3>

            {categoryData.map((cat, index) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {cat.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({cat.transactionCount} transaksjon{cat.transactionCount !== 1 ? 'er' : ''})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatAmount(cat.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      index === 0
                        ? 'bg-blue-600'
                        : index === 1
                        ? 'bg-indigo-500'
                        : index === 2
                        ? 'bg-purple-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Del utgifter</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Toggle between percentage and amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velg visning
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShareMode('percentage')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      shareMode === 'percentage'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Prosent (%)
                  </button>
                  <button
                    onClick={() => setShareMode('amount')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      shareMode === 'amount'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Beløp (kr)
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Forhåndsvisning:</div>
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                  {generateShareText()}
                </pre>
              </div>

              {/* Share button */}
              <button
                onClick={() => {
                  handleShare()
                  setShowShareModal(false)
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {hasNativeShare ? 'Del' : 'Kopier til utklippstavle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
