import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'
import { BankAccountsSettings } from '@/components/bank-accounts-settings'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
                ← Tilbake til Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Innstillinger
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Administrer bankkontoer og preferanser
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BankAccountsSettings />
      </main>
    </div>
  )
}
