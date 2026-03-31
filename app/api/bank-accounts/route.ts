import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    // Fetch user's bank accounts
    const { data: bankAccounts, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching bank accounts:', error)
      return NextResponse.json(
        { error: 'Kunne ikke hente bankkontoer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bankAccounts: bankAccounts || [] })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    const { bank_name, account_name, account_number, is_default } = await request.json()

    if (!bank_name || !account_name) {
      return NextResponse.json(
        { error: 'Banknavn og kontonavn er påkrevd' },
        { status: 400 }
      )
    }

    // If this account is being set as default, unset all other defaults
    if (is_default) {
      await supabase
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    // Create new bank account
    const { data: bankAccount, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: user.id,
        bank_name,
        account_name,
        account_number,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bank account:', error)
      return NextResponse.json(
        { error: 'Kunne ikke opprette bankkonto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bankAccount })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    const { id, bank_name, account_name, account_number, is_default } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Konto-ID er påkrevd' },
        { status: 400 }
      )
    }

    // If this account is being set as default, unset all other defaults
    if (is_default) {
      await supabase
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    // Update bank account
    const { data: bankAccount, error } = await supabase
      .from('bank_accounts')
      .update({
        bank_name,
        account_name,
        account_number,
        is_default,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bank account:', error)
      return NextResponse.json(
        { error: 'Kunne ikke oppdatere bankkonto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bankAccount })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Konto-ID er påkrevd' },
        { status: 400 }
      )
    }

    // Delete bank account
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting bank account:', error)
      return NextResponse.json(
        { error: 'Kunne ikke slette bankkonto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Noe gikk galt' },
      { status: 500 }
    )
  }
}
