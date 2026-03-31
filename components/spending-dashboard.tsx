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

  // Calculate spending by category (only expenses, negative amounts)
  const categorySpending = filteredTransactions
    .filter(t => t.amount < 0 && t.category !== null)
    .reduce((acc, t) => {
      const cat = t.category as string
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0 }
      }
      acc[cat].total += Math.abs(t.amount)
      acc[cat].count += 1
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
    </div>
  )
}
