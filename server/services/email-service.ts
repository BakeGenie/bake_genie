import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html: string;
  cc?: string;
  bcc?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    await sgMail.send(emailData);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a subscription cancellation confirmation email
 */
export async function sendCancellationEmail(
  userEmail: string,
  userName: string,
  effectiveDate: Date
): Promise<boolean> {
  // Format the date in a readable format
  const formattedDate = effectiveDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emailContent = {
    to: userEmail,
    from: 'noreply@bakegenie.co',
    subject: 'Your BakeGenie Subscription Cancellation Confirmation',
    cc: 'support@bakegenie.co', // Send a copy to support
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ff6b6b;">BakeGenie</h1>
        </div>
        <div>
          <h2>Subscription Cancellation Confirmation</h2>
          <p>Dear ${userName},</p>
          <p>We're sorry to see you go! This email confirms that your BakeGenie subscription has been cancelled as requested.</p>
          <p>Your subscription will remain active until the end of your current billing period on <strong>${formattedDate}</strong>.</p>
          <p>Until then, you'll continue to have full access to all BakeGenie features and services.</p>
          <p>If you change your mind or cancelled by mistake, please contact our support team at <a href="mailto:support@bakegenie.co">support@bakegenie.co</a> as soon as possible.</p>
          <p>We hope to welcome you back in the future!</p>
          <p>Warm regards,</p>
          <p>The BakeGenie Team</p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailContent);
}