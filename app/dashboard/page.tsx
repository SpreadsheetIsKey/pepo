import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'

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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Brukerinformasjon
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">E-post:</span>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Bruker-ID:</span>
              <p className="text-gray-900 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Innloggingsmetode:</span>
              <p className="text-gray-900">
                {user.app_metadata.provider === 'google' ? 'Google OAuth' : user.app_metadata.provider}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Opprettet:</span>
              <p className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString('nb-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Flere funksjoner kommer snart!
          </h3>
          <p className="text-blue-700">
            Dashboard-funksjonalitet for opplasting av filer, transaksjonsvisning og kategorisering vil bli tilgjengelig i de neste fasene.
          </p>
        </div>
      </main>
    </div>
  )
}
