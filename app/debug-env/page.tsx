'use client'

export default function DebugEnvPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="space-y-2 font-mono text-sm">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
        </div>
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
            : 'NOT SET'}
        </div>
        <div className="mt-4">
          <strong>All NEXT_PUBLIC_ vars:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(
              Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}
