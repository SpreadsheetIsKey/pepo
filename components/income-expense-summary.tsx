'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
  id: string
  transaction_date: string
  amount: number
  category: string | null
}

export function IncomeExpenseSummary() {
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

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netSavings = totalIncome - totalExpenses

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Månedsoversikt
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
            Månedsoversikt
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[250px]">
            <label htmlFor="month-selector-summary" className="sr-only">Velg måned</label>
            <select
              id="month-selector-summary"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Income Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-green-900">
                Inntekt
              </div>
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatAmount(totalIncome)}
            </div>
            <div className="text-xs text-green-700 mt-1">
              {filteredTransactions.filter(t => t.amount > 0).length} transaksjon(er)
            </div>
          </div>

          {/* Expenses Card */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-red-900">
                Utgifter
              </div>
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {formatAmount(totalExpenses)}
            </div>
            <div className="text-xs text-red-700 mt-1">
              {filteredTransactions.filter(t => t.amount < 0).length} transaksjon(er)
            </div>
          </div>

          {/* Net Savings Card */}
          <div className={`rounded-lg p-5 border ${
            netSavings >= 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
              : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${
                netSavings >= 0 ? 'text-blue-900' : 'text-amber-900'
              }`}>
                Netto sparing
              </div>
              {netSavings >= 0 ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </div>
            <div className={`text-2xl font-bold ${
              netSavings >= 0 ? 'text-blue-900' : 'text-amber-900'
            }`}>
              {formatAmount(Math.abs(netSavings))}
            </div>
            <div className={`text-xs mt-1 ${
              netSavings >= 0 ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {netSavings >= 0 ? 'Overskudd' : 'Underskudd'}
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        {totalIncome > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Sparerate
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {((netSavings / totalIncome) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  netSavings >= 0 ? 'bg-blue-600' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(Math.abs((netSavings / totalIncome) * 100), 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {netSavings >= 0
                ? `Du sparer ${((netSavings / totalIncome) * 100).toFixed(1)}% av inntekten din`
                : `Du bruker ${Math.abs((netSavings / totalIncome) * 100).toFixed(1)}% mer enn du tjener`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
