import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/email-service'

export async function POST(request: NextRequest) {
    try {
        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Get user details
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (userError || !userData.user) {
            console.error('Error fetching user:', userError)
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Get user profile
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('display_name')
            .eq('user_id', userId)
            .single()

        const userName = profile?.display_name || userData.user.email?.split('@')[0] || 'there'
        const emailData = emailTemplates.welcome(userName)

        await sendEmail({
            to: userData.user.email!,
            ...emailData
        })

        return NextResponse.json(
            { message: 'Welcome email sent successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Welcome email error:', error)
        return NextResponse.json(
            { error: 'Failed to send welcome email' },
            { status: 500 }
        )
    }
}