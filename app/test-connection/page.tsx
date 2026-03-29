import { createClient } from '@/lib/supabase/server'

export default async function TestConnectionPage() {
  const supabase = await createClient()

  // Test connection by fetching Supabase metadata
  const { data, error } = await supabase.auth.getSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Connection Error</p>
          <p>{error.message}</p>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">✓ Connection Successful</p>
          <p className="text-sm mt-2">Supabase client is configured correctly</p>
          <p className="text-xs mt-2 text-gray-600">
            Session: {data.session ? 'Active' : 'No active session'}
          </p>
        </div>
      )}
    </div>
  )
}
