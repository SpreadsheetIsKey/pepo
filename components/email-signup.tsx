'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function EmailSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const supabase = createClient()

      // Insert email into waitlist table
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, created_at: new Date().toISOString() }])

      if (error) {
        // Check if email already exists
        if (error.code === '23505') {
          setStatus('error')
          setMessage('Denne e-posten er allerede registrert!')
        } else {
          throw error
        }
      } else {
        setStatus('success')
        setMessage('Takk! Du er nå på ventelisten.')
        setEmail('')
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setMessage('Noe gikk galt. Prøv igjen senere.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.no"
          required
          disabled={status === 'loading' || status === 'success'}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Vennligst vent...' : status === 'success' ? 'Registrert!' : 'Bli med'}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  )
}
