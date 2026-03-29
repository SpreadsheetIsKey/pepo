import Link from 'next/link'

const phases = [
  {
    phase: 1,
    title: 'Grunnleggende funksjoner (MVP)',
    status: 'in-progress',
    description: 'De viktigste funksjonene for å komme i gang',
    features: [
      'Sikker innlogging med Google',
      'Last opp bankkontoutskrifter (CSV/PDF)',
      'Automatisk kategorisering av transaksjoner',
      'Visuell oversikt over utgifter',
      'Månedsrapporter'
    ]
  },
  {
    phase: 2,
    title: 'Smart sporing',
    status: 'planned',
    description: 'Intelligent oppfølging av dine utgifter',
    features: [
      'Gjenkjenning av abonnementer',
      'Budsjettvarsler',
      'Utgiftsanalyse',
      'Sammenligning måned-til-måned'
    ]
  },
  {
    phase: 3,
    title: 'Gjeldshåndtering',
    status: 'planned',
    description: 'Få oversikt og kontroll over gjeld',
    features: [
      'Gjeldsoversikt',
      'Lånekontrakter',
      'Nedbetalingsplaner',
      'Gjeldsreduksjonsstrategier'
    ]
  },
  {
    phase: 4,
    title: 'Sosiale funksjoner & Premium',
    status: 'planned',
    description: 'Del og samarbeid om økonomi',
    features: [
      'Del budsjetter med partner',
      'Familieøkonomi',
      'Gruppebudsjetter',
      'Avanserte rapporter'
    ]
  },
  {
    phase: 5,
    title: 'AI & Prediksjon',
    status: 'planned',
    description: 'Intelligent økonomisk rådgivning',
    features: [
      'AI-drevne innsikter',
      'Utgiftsprognoser',
      'Spareanbefalinger',
      'Personlig økonomicoach'
    ]
  }
]

const statusConfig = {
  'in-progress': {
    label: 'Under utvikling',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: '🚧'
  },
  'planned': {
    label: 'Planlagt',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '📋'
  },
  'completed': {
    label: 'Fullført',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: '✅'
  }
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-900">
            Financial Clarity
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Tilbake
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Utviklingsplan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Her er veien videre for Financial Clarity. Vi bygger i faser og lanserer
            funksjoner etterhvert som de blir klare.
          </p>
        </div>
      </section>

      {/* Phases */}
      <section className="container mx-auto px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {phases.map((phase) => {
            const config = statusConfig[phase.status]
            return (
              <div
                key={phase.phase}
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono font-semibold text-gray-500">
                        FASE {phase.phase}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
                      >
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {phase.title}
                    </h2>
                    <p className="text-gray-600">{phase.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {phase.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Vil du være med fra starten?
            </h2>
            <p className="text-lg mb-6 text-blue-100">
              Registrer deg på ventelisten og få tilgang til Financial Clarity
              når Fase 1 er klar.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Registrer deg nå
            </Link>
          </div>
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
