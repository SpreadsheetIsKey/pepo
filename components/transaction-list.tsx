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
          <h2 className="text-xl font-semibold text-gray-900">
            Transaksjoner
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {transactions.length} transaksjoner (viser siste 100)
          </p>
        </div>

        <div className="overflow-x-auto">
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
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
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
                            <span className="text-gray-400 italic">Ikke kategorisert</span>
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
