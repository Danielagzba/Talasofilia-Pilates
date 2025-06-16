import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/email-service'
import { addHours, startOfHour } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        // Verify the request is from a trusted source (Vercel Cron)
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get the current hour and the next hour
        const now = new Date()
        const nextHour = startOfHour(addHours(now, 1))
        const twoHoursFromNow = addHours(nextHour, 1)

        // Find all bookings for classes starting in the next hour
        const { data: bookings, error } = await supabaseAdmin
            .from('class_bookings')
            .select(`
                id,
                class_schedules (
                    start_time,
                    end_time,
                    class_types (
                        name
                    ),
                    instructors (
                        name
                    )
                ),
                user_profiles (
                    user_id,
                    display_name
                )
            `)
            .eq('booking_status', 'confirmed')
            .gte('class_schedules.start_time', nextHour.toISOString())
            .lt('class_schedules.start_time', twoHoursFromNow.toISOString())

        if (error) {
            console.error('Error fetching bookings:', error)
            return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ message: 'No classes starting in the next hour' }, { status: 200 })
        }

        // Send reminder emails
        const emailPromises = bookings.map(async (booking: any) => {
            try {
                // Get user email
                const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
                    booking.user_profiles.user_id
                )

                if (!userData.user?.email) {
                    console.error(`No email found for user ${booking.user_profiles.user_id}`)
                    return null
                }

                const emailData = emailTemplates.classReminder(
                    booking.user_profiles.display_name || 'there',
                    booking.class_schedules.class_types.name,
                    booking.class_schedules.instructors.name,
                    new Date(booking.class_schedules.start_time)
                )

                await sendEmail({
                    to: userData.user.email,
                    ...emailData
                })

                return { success: true, bookingId: booking.id }
            } catch (error) {
                console.error(`Failed to send reminder for booking ${booking.id}:`, error)
                return { success: false, bookingId: booking.id, error }
            }
        })

        const results = await Promise.all(emailPromises)
        const successCount = results.filter(r => r?.success).length

        return NextResponse.json({
            message: `Sent ${successCount} out of ${bookings.length} reminder emails`,
            results
        }, { status: 200 })

    } catch (error) {
        console.error('Class reminder cron error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}