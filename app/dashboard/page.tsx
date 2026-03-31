import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'
import { CsvUpload } from '@/components/csv-upload'
import { TransactionList } from '@/components/transaction-list'

export default async function DashboardPage() {
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
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Velkommen tilbake, {user.email}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CSV Upload Section */}
        <div className="mb-8">
          <CsvUpload />
        </div>

        {/* Transaction List Section */}
        <div className="mb-8">
          <TransactionList />
        </div>
      </main>
    </div>
  )
}
