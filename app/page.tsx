import Link from 'next/link'
import { EmailSignup } from '@/components/email-signup'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-900">
            Financial Clarity
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/roadmap"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Veikart
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Logg inn
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Ta kontroll over din<br />
            <span className="text-blue-600">økonomiske fremtid</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            En smart personlig økonomi-app som hjelper deg å forstå hvor pengene dine går,
            kategorisere utgifter automatisk, og få innsikt i dine forbruksvaner.
          </p>

          {/* Email Signup */}
          <div className="max-w-md mx-auto mb-8">
            <EmailSignup />
          </div>

          <p className="text-sm text-gray-500">
            Bli med på ventelisten og få tidlig tilgang når vi lanserer
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Hva kan du gjøre med Financial Clarity?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Last opp bankkontoutskrifter</h3>
              <p className="text-gray-600">
                Last opp CSV eller PDF-filer fra norske banker som DNB, Nordea og Sparebank 1.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Automatisk kategorisering</h3>
              <p className="text-gray-600">
                Transaksjoner kategoriseres automatisk basert på norske butikker og tjenester.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visuell innsikt</h3>
              <p className="text-gray-600">
                Se hvor pengene dine går med enkle og tydelige visualiseringer og rapporter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Status Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Vi bygger akkurat nå</h2>
          <p className="text-lg text-gray-600 mb-8">
            Financial Clarity er under aktiv utvikling. Registrer e-posten din for å få
            beskjed når vi er klare for early access.
          </p>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se utviklingsplan
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; 2026 Financial Clarity Engine. Laget i Norge 🇳🇴</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
