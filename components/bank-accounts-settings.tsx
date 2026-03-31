'use client'

import { useState, useEffect } from 'react'

interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string | null
  is_default: boolean
}

export function BankAccountsSettings() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    is_default: false,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchBankAccounts()
  }, [])

  async function fetchBankAccounts() {
    try {
      setLoading(true)
      const response = await fetch('/api/bank-accounts')
      const data = await response.json()
      if (response.ok) {
        setBankAccounts(data.bankAccounts || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Kunne ikke hente bankkontoer' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunne ikke hente bankkontoer' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    try {
      if (editingId) {
        // Update existing account
        const response = await fetch('/api/bank-accounts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setMessage({ type: 'success', text: 'Bankkonto oppdatert!' })
      } else {
        // Create new account
        const response = await fetch('/api/bank-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setMessage({ type: 'success', text: 'Bankkonto opprettet!' })
      }

      // Reset form and refresh list
      setFormData({ bank_name: '', account_name: '', account_number: '', is_default: false })
      setShowAddForm(false)
      setEditingId(null)
      fetchBankAccounts()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Noe gikk galt' })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Er du sikker på at du vil slette denne bankkontoen?')) return

    try {
      const response = await fetch(`/api/bank-accounts?id=${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setMessage({ type: 'success', text: 'Bankkonto slettet!' })
      fetchBankAccounts()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Kunne ikke slette bankkonto' })
    }
  }

  function handleEdit(account: BankAccount) {
    setFormData({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number || '',
      is_default: account.is_default,
    })
    setEditingId(account.id)
    setShowAddForm(true)
  }

  function cancelEdit() {
    setFormData({ bank_name: '', account_name: '', account_number: '', is_default: false })
    setEditingId(null)
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Laster bankkontoer...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bankkontoer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Administrer bankkontoer for å holde transaksjoner organisert
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Legg til konto
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mx-6 mt-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Rediger bankkonto' : 'Legg til ny bankkonto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banknavn *
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="DNB, Nordea, Sparebank 1..."
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontonavn *
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Brukskonto, Sparekonto..."
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontonummer (valgfritt)
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="1234 56 78901"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                Sett som standardkonto
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Oppdater' : 'Legg til'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank Accounts List */}
      <div className="p-6">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Ingen bankkontoer registrert ennå.</p>
            <p className="text-sm text-gray-500 mt-2">
              Legg til en bankkonto for å komme i gang.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {account.bank_name} - {account.account_name}
                      </h3>
                      {account.is_default && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Standard
                        </span>
                      )}
                    </div>
                    {account.account_number && (
                      <p className="text-sm text-gray-600 mt-1">
                        Kontonummer: {account.account_number}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      Rediger
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
