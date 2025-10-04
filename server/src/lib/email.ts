/**
 * Отправляет уведомление администратору о новой форме (с HTML)
 */
export async function sendAdminNotification(
    formType: 'contact' | 'join',
    formData: Record<string, any>
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL
  
    if (!adminEmail) {
      console.warn('⚠️ ADMIN_EMAIL not configured, skipping notification')
      return false
    }
  
    const isContact = formType === 'contact'
    const subject = isContact 
      ? `📧 New Contact Form: ${formData.name}` 
      : `🎓 New Application: ${formData.name}`
  
    const adminUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/${
      isContact ? 'contact-submissions' : 'join-submissions'
    }`
  
    // Формируем список полей
    const fields = Object.entries(formData)
      .filter(([key]) => key !== 'subject' && key !== 'type')
      .map(([key, value]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; text-transform: capitalize;">
            ${key.replace(/([A-Z])/g, ' $1').trim()}:
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
            ${value || 'N/A'}
          </td>
        </tr>
      `).join('')
  
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">
                ${isContact ? '📧 New Contact Form' : '🎓 New Join Application'}
              </h1>
              <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">
                Photonics Society Eindhoven
              </p>
            </div>
  
            <!-- Content -->
            <div style="background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <table style="width: 100%; border-collapse: collapse;">
                ${fields}
              </table>
  
              <!-- Action Button -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="${adminUrl}" 
                   style="display: inline-block; background-color: #22d3ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  View in Admin Panel
                </a>
              </div>
  
              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">
                  This notification was sent automatically from your PhE website.
                </p>
                <p style="margin: 8px 0 0;">
                  Received at ${new Date().toLocaleString('en-GB', { 
                    timeZone: 'Europe/Amsterdam',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  
    const text = `You have received a new ${isContact ? 'contact form' : 'join application'}:
  
  ${Object.entries(formData)
    .filter(([key]) => key !== 'subject' && key !== 'type')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')}
  
  ---
  View in admin: ${adminUrl}
  Sent from PhE Website at ${new Date().toISOString()}`
  
    try {
      await sendEmail({
        to: adminEmail,
        subject,
        text,
        html,
      })
      
      console.log('✅ Admin notification sent to:', adminEmail)
      return true
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error)
      return false
    }
  }