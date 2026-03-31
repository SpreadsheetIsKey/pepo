import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

interface ParsedTransaction {
  date: string
  amount: number
  description: string
  accountNumber?: string
}

interface ColumnMapping {
  date: number | null
  description: number | null
  amountIn: number | null
  amountOut: number | null
  amountCombined: number | null
}

// Parse date to YYYY-MM-DD format
function parseDate(dateStr: string): string {
  // Clean the string
  const cleaned = dateStr.trim()

  // Try DD.MM.YYYY format (Norwegian standard)
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      return `${year}-${month}-${day}`
    }
  }

  // Try M/D/YYYY or D/M/YYYY format (Excel often exports dates this way)
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/')
    if (parts.length === 3) {
      // Check if year is in the last position (M/D/YYYY or D/M/YYYY)
      const third = parseInt(parts[2])
      if (third > 1000) {
        // Likely M/D/YYYY or D/M/YYYY
        const first = parseInt(parts[0])
        const second = parseInt(parts[1])

        // Determine if it's M/D/YYYY (American) or D/M/YYYY (European)
        // If first number > 12, it must be day, so format is D/M/YYYY
        // If second number > 12, it must be day, so format is M/D/YYYY
        let day, month
        if (first > 12) {
          // D/M/YYYY
          day = first
          month = second
        } else if (second > 12) {
          // M/D/YYYY
          month = first
          day = second
        } else {
          // Ambiguous - assume M/D/YYYY (Excel default for many locales)
          month = first
          day = second
        }

        const year = third
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      }
    }
  }

  // Try YYYY-MM-DD format (already correct)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) {
    const parts = cleaned.split('-')
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }

  // If all else fails, return as-is and let the database handle it
  return cleaned
}

// Parse CSV using column mapping
function parseCSVWithMapping(csvText: string, mapping: ColumnMapping): ParsedTransaction[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const transactions: ParsedTransaction[] = []

  // Detect delimiter
  const delimiter = lines[0].includes(';') ? ';' : ','

  // Skip header row, start from index 1
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cells = line.split(delimiter).map(cell => cell.trim())

    if (mapping.date === null || mapping.description === null) {
      throw new Error('Date and description columns are required')
    }

    const dateStr = cells[mapping.date] || ''
    const description = cells[mapping.description] || ''

    if (!dateStr || !description) continue

    let amount = 0

    // Calculate amount based on mapping
    if (mapping.amountCombined !== null) {
      // Single amount column (negative = expense, positive = income)
      const amountStr = cells[mapping.amountCombined]?.replace(',', '.') || '0'
      amount = parseFloat(amountStr)
    } else {
      // Separate in/out columns
      const amountInStr = mapping.amountIn !== null
        ? cells[mapping.amountIn]?.replace(',', '.') || '0'
        : '0'
      const amountOutStr = mapping.amountOut !== null
        ? cells[mapping.amountOut]?.replace(',', '.') || '0'
        : '0'

      const amountIn = parseFloat(amountInStr)
      const amountOut = parseFloat(amountOutStr)

      // Positive for income, negative for expenses
      amount = amountIn > 0 ? amountIn : -Math.abs(amountOut)
    }

    if (isNaN(amount)) continue

    transactions.push({
      date: parseDate(dateStr),
      amount,
      description,
    })
  }

  return transactions
}

// Generate hash for duplicate detection
function generateRowHash(userId: string, date: string, amount: number, description: string): string {
  const data = `${userId}|${date}|${amount}|${description}`
  return crypto.createHash('md5').update(data).digest('hex')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    // Parse request body
    const { csvContent, fileName, columnMapping, mode, transactionsToImport } = await request.json()

    if (!csvContent || !fileName || !columnMapping) {
      return NextResponse.json(
        { error: 'Mangler CSV-innhold, filnavn eller kolonnetilordning' },
        { status: 400 }
      )
    }

    // Parse CSV using column mapping
    let transactions: ParsedTransaction[]
    try {
      transactions = parseCSVWithMapping(csvContent, columnMapping)
    } catch (error: any) {
      console.error('CSV parsing error:', error)
      return NextResponse.json(
        { error: error.message || 'Kunne ikke parse CSV-filen. Sjekk at formatet er riktig.' },
        { status: 400 }
      )
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'Ingen transaksjoner funnet i filen' },
        { status: 400 }
      )
    }

    // Detect bank name from filename
    let bankName = 'Unknown'
    const lowerFileName = fileName.toLowerCase()
    if (lowerFileName.includes('dnb')) bankName = 'DNB'
    else if (lowerFileName.includes('nordea')) bankName = 'Nordea'
    else if (lowerFileName.includes('sparebank') || lowerFileName.includes('sb1'))
      bankName = 'Sparebank 1'

    // Prepare transactions for database
    const now = new Date().toISOString()
    const dbTransactions = transactions.map(t => ({
      user_id: user.id,
      transaction_date: t.date,
      amount: t.amount,
      description: t.description,
      bank_name: bankName,
      account_number: t.accountNumber || null,
      category: null, // Will be set by categorization engine (T-08)
      category_confidence: null,
      file_name: fileName,
      file_uploaded_at: now,
      row_hash: generateRowHash(user.id, t.date, t.amount, t.description),
    }))

    // Check for duplicates
    // Get all existing hashes for this user
    const { data: existingTransactions, error: checkError } = await supabase
      .from('transactions')
      .select('row_hash')
      .eq('user_id', user.id)

    if (checkError) {
      console.error('Duplicate check error:', JSON.stringify(checkError, null, 2))
      return NextResponse.json(
        { error: `Kunne ikke sjekke for duplikater: ${checkError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    const existingHashes = new Set(existingTransactions?.map(t => t.row_hash) || [])
    const newTransactions = dbTransactions.filter(t => !existingHashes.has(t.row_hash))
    const duplicateTransactions = dbTransactions.filter(t => existingHashes.has(t.row_hash))

    // If mode is "check", return duplicate info without inserting
    if (mode === 'check' || !mode) {
      return NextResponse.json({
        requiresReview: duplicateTransactions.length > 0,
        newCount: newTransactions.length,
        duplicateCount: duplicateTransactions.length,
        totalCount: dbTransactions.length,
        newTransactions: newTransactions.map((t, index) => ({ ...t, index })),
        duplicateTransactions: duplicateTransactions.map((t, index) => ({ ...t, index })),
      })
    }

    // If mode is "import", insert only selected transactions
    if (mode === 'import') {
      if (!transactionsToImport || !Array.isArray(transactionsToImport)) {
        return NextResponse.json(
          { error: 'Ingen transaksjoner valgt for import' },
          { status: 400 }
        )
      }

      // Filter to only import selected transactions by row_hash
      const selectedHashes = new Set(transactionsToImport.map((t: any) => t.row_hash))
      const transactionsToInsert = dbTransactions.filter(t => selectedHashes.has(t.row_hash))

      if (transactionsToInsert.length === 0) {
        return NextResponse.json(
          { error: 'Ingen transaksjoner valgt for import' },
          { status: 400 }
        )
      }

      // Insert transactions into database
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Kunne ikke lagre transaksjoner i databasen' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        count: data.length,
        message: `${data.length} transaksjoner importert`,
      })
    }

    return NextResponse.json(
      { error: 'Ugyldig modus' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt' },
      { status: 500 }
    )
  }
}
