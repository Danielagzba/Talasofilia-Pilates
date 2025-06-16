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
        const { bookingId, userId } = await request.json()

        if (!bookingId || !userId) {
            return NextResponse.json(
                { error: 'Booking ID and User ID are required' },
                { status: 400 }
            )
        }

        // Get booking details
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('class_bookings')
            .select(`
                id,
                class_schedules (
                    start_time,
                    class_date,
                    class_name,
                    instructor_name
                )
            `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            console.error('Error fetching booking:', bookingError)
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
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
        const schedule = booking.class_schedules as any
        const classDateTime = new Date(`${schedule.class_date} ${schedule.start_time}`)
        
        const emailData = emailTemplates.classCancelled(
            userName,
            schedule.class_name,
            schedule.instructor_name,
            classDateTime,
            true // Credit has been returned
        )

        await sendEmail({
            to: userData.user.email!,
            ...emailData
        })

        return NextResponse.json(
            { message: 'Cancellation email sent successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Cancellation email error:', error)
        return NextResponse.json(
            { error: 'Failed to send cancellation email' },
            { status: 500 }
        )
    }
}