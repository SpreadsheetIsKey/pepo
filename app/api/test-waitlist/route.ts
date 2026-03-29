import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('waitlist')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }

    // Test 2: Try to insert a test email
    const testEmail = `test-${Date.now()}@example.com`
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([{ email: testEmail }])

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert failed',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    // Test 3: Clean up test data
    await supabase
      .from('waitlist')
      .delete()
      .eq('email', testEmail)

    return NextResponse.json({
      success: true,
      message: 'Waitlist table is working correctly!'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 })
  }
}
