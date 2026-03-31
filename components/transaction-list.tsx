'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
  id: string
  transaction_date: string
  amount: number
  description: string
  bank_name: string | null
  category: string | null
  category_confidence: number | null
}

interface Category {
  id: string
  main_category: string
  sub_category: string
}

interface UndoState {
  transactionId: string
  oldCategory: string | null
  newCategory: string
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [undoState, setUndoState] = useState<UndoState | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false)
        setUndoState(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showUndo])

  async function fetchTransactions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching transactions:', error)
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  async function fetchCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, main_category, sub_category')
      .eq('is_system', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  async function updateCategory(transactionId: string, newCategory: string) {
    const transaction = transactions.find(t => t.id === transactionId)
    if (!transaction) return

    // Store for undo
    setUndoState({
      transactionId,
      oldCategory: transaction.category,
      newCategory
    })
    setShowUndo(true)

    // Optimistically update UI
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, category: newCategory, category_confidence: null }
          : t
      )
    )

    // Save to database
    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .update({
        category: newCategory,
        category_confidence: null // Manual correction removes auto-confidence
      })
      .eq('id', transactionId)

    if (error) {
      console.error('Error updating category:', error)
      // Revert on error
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId
            ? { ...t, category: transaction.category, category_confidence: transaction.category_confidence }
            : t
        )
      )
      setShowUndo(false)
      setUndoState(null)
    }

    setEditingId(null)
  }

  async function undoChange() {
    if (!undoState) return

    const { transactionId, oldCategory } = undoState

    // Revert UI
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, category: oldCategory }
          : t
      )
    )

    // Revert in database
    const supabase = createClient()
    await supabase
      .from('transactions')
      .update({ category: oldCategory })
      .eq('id', transactionId)

    setShowUndo(false)
    setUndoState(null)
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2
    }).format(amount)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function getConfidenceBadge(confidence: number | null) {
    if (confidence === null) return null

    if (confidence >= 0.95) {
      return <span className="text-xs text-green-600">●</span>
    } else if (confidence >= 0.85) {
      return <span className="text-xs text-yellow-600">●</span>
    } else {
      return <span className="text-xs text-red-600">●</span>
    }
  }

  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.main_category]) {
      acc[cat.main_category] = []
    }
    acc[cat.main_category].push(cat)
    return acc
  }, {} as Record<string, Category[]>)

  // Get unique months from transactions
  const availableMonths = Array.from(new Set(
    transactions.map(t => {
      const date = new Date(t.transaction_date)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
  )).sort((a, b) => b.localeCompare(a))

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        if (transaction.category !== null) return false
      } else {
        if (transaction.category !== selectedCategory) return false
      }
    }

    // Month filter
    if (selectedMonth !== 'all') {
      const transactionMonth = new Date(transaction.transaction_date)
      const monthKey = `${transactionMonth.getFullYear()}-${String(transactionMonth.getMonth() + 1).padStart(2, '0')}`
      if (monthKey !== selectedMonth) return false
    }

    return true
  })

  // Group transactions by month
  const transactionsByMonth = filteredTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)

  const monthKeys = Object.keys(transactionsByMonth).sort((a, b) => b.localeCompare(a))

  function formatMonthHeader(monthKey: string) {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long'
    })
  }

  // Get unique categories from transactions for filter dropdown
  const transactionCategories = Array.from(new Set(
    transactions
      .filter(t => t.category !== null)
      .map(t => t.category as string)
  )).sort()

  const uncategorizedCount = transactions.filter(t => t.category === null).length

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
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
          Transaksjoner
        </h2>
        <p className="text-gray-500">
          Ingen transaksjoner ennå. Last opp en CSV-fil for å komme i gang.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Transaksjoner
            </h2>
            {uncategorizedCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                {uncategorizedCount} ukategorisert
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="category-filter" className="sr-only">Filtrer etter kategori</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">Alle kategorier</option>
                <option value="uncategorized">Ukategorisert ({uncategorizedCount})</option>
                {transactionCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="month-filter" className="sr-only">Filtrer etter måned</label>
              <select
                id="month-filter"
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

            <div className="text-sm text-gray-500">
              {filteredTransactions.length} av {transactions.length} transaksjoner
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {monthKeys.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Ingen transaksjoner matcher filtrene
            </div>
          ) : (
            monthKeys.map(monthKey => (
              <div key={monthKey}>
                <div className="bg-gray-100 px-6 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {formatMonthHeader(monthKey)}
                  </h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beskrivelse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beløp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionsByMonth[monthKey].map((transaction) => (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-gray-50 ${!transaction.category ? 'bg-amber-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.bank_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={transaction.amount >= 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>
                            {formatAmount(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {editingId === transaction.id ? (
                            <select
                              autoFocus
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              value={transaction.category || ''}
                              onChange={(e) => updateCategory(transaction.id, e.target.value)}
                              onBlur={() => setEditingId(null)}
                            >
                              <option value="">Ingen kategori</option>
                              {Object.entries(groupedCategories).map(([mainCat, subCats]) => (
                                <optgroup key={mainCat} label={mainCat}>
                                  {subCats.map((cat) => {
                                    const fullCategory = `${cat.main_category}: ${cat.sub_category}`
                                    return (
                                      <option key={cat.id} value={fullCategory}>
                                        {cat.sub_category}
                                      </option>
                                    )
                                  })}
                                </optgroup>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingId(transaction.id)}
                              className="text-left hover:text-blue-600 focus:outline-none focus:text-blue-600"
                            >
                              <span className="flex items-center gap-1.5">
                                {transaction.category ? (
                                  <>
                                    {getConfidenceBadge(transaction.category_confidence)}
                                    <span>{transaction.category}</span>
                                  </>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Ikke kategorisert
                                  </span>
                                )}
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Undo Snackbar */}
      {showUndo && undoState && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <span className="text-sm">
            Kategori endret til <strong>{undoState.newCategory}</strong>
          </span>
          <button
            onClick={undoChange}
            className="text-blue-400 hover:text-blue-300 font-medium text-sm"
          >
            Angre
          </button>
        </div>
      )}
    </>
  )
}
