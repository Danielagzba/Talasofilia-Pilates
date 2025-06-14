import { Resend } from 'resend'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
    to: string
    subject: string
    html: string
    replyTo?: string
}

export async function sendEmail(data: EmailData) {
    try {
        const { data: result, error } = await resend.emails.send({
            from: 'Talasofilia Pilates <contact@resend.dev>',
            to: data.to,
            subject: data.subject,
            html: data.html,
            replyTo: data.replyTo,
        })

        if (error) {
            console.error('Failed to send email:', error)
            throw error
        }

        return result
    } catch (error) {
        console.error('Email service error:', error)
        throw error
    }
}

// Email Templates
export const emailTemplates = {
    welcome: (userName: string) => ({
        subject: 'Welcome to Talasofilia Pilates!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Welcome to Talasofilia Pilates!</h1>
                <p>Hi ${userName},</p>
                <p>Thank you for joining our Pilates community! We're excited to have you with us on your wellness journey.</p>
                <p>Here's what you can do next:</p>
                <ul>
                    <li>Browse our <a href="${process.env.NEXT_PUBLIC_APP_URL}/classes">class schedule</a></li>
                    <li>Purchase a <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/buy-classes">class package</a></li>
                    <li>Book your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/book-class">first class</a></li>
                </ul>
                <p>If you have any questions, feel free to contact us at talasofiliapilates@gmail.com</p>
                <p>Best regards,<br>The Talasofilia Pilates Team</p>
            </div>
        `
    }),

    classReminder: (userName: string, className: string, instructorName: string, classTime: Date) => ({
        subject: `Reminder: Your Pilates class is starting soon!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Class Reminder</h1>
                <p>Hi ${userName},</p>
                <p>This is a friendly reminder that you have a Pilates class starting in 1 hour:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Class:</strong> ${className}</p>
                    <p><strong>Instructor:</strong> ${instructorName}</p>
                    <p><strong>Time:</strong> ${format(classTime, 'EEEE, MMMM d, yyyy - h:mm a')}</p>
                    <p><strong>Location:</strong> Bugambilias 3, Santa María, Puerto Escondido</p>
                </div>
                <p>Please arrive 5-10 minutes early to prepare for your class.</p>
                <p>If you need to cancel, you can do so from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-classes">My Classes</a> page (at least 2 hours before class).</p>
                <p>See you soon!<br>The Talasofilia Pilates Team</p>
            </div>
        `
    }),

    classCancelled: (userName: string, className: string, instructorName: string, classTime: Date, creditReturned: boolean = true) => ({
        subject: `Class Cancelled: ${className}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Class Cancellation Notice</h1>
                <p>Hi ${userName},</p>
                <p>We regret to inform you that the following class has been cancelled:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Class:</strong> ${className}</p>
                    <p><strong>Instructor:</strong> ${instructorName}</p>
                    <p><strong>Scheduled Time:</strong> ${format(classTime, 'EEEE, MMMM d, yyyy - h:mm a')}</p>
                </div>
                ${creditReturned ? '<p>Your class credit has been automatically returned to your account.</p>' : ''}
                <p>You can book another class from our <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/book-class">schedule</a>.</p>
                <p>We apologize for any inconvenience.</p>
                <p>Best regards,<br>The Talasofilia Pilates Team</p>
            </div>
        `
    }),

    purchaseConfirmation: (userName: string, packageName: string, totalClasses: number, validityDays: number, amount: number) => ({
        subject: 'Purchase Confirmation - Talasofilia Pilates',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Thank You for Your Purchase!</h1>
                <p>Hi ${userName},</p>
                <p>Your class package purchase has been confirmed. Here are the details:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Purchase Details</h3>
                    <p><strong>Package:</strong> ${packageName}</p>
                    <p><strong>Classes:</strong> ${totalClasses} classes</p>
                    <p><strong>Valid for:</strong> ${validityDays} days</p>
                    <p><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)} MXN</p>
                </div>
                <p>Your classes are now available in your account. You can start booking immediately!</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/book-class" style="display: inline-block; background-color: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Book Your First Class</a></p>
                <p>If you have any questions about your purchase, please don't hesitate to contact us.</p>
                <p>Best regards,<br>The Talasofilia Pilates Team</p>
            </div>
        `
    }),
}