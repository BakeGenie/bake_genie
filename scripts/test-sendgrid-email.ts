import sgMail from '@sendgrid/mail';

// Set SendGrid API key from environment variable
if (!process.env.SENDGRID_API_KEY) {
  console.error('SendGrid API key not found in environment variables');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email message
const msg = {
  to: 'annabel.m.fletcher@gmail.com',
  from: 'notifications@bakegenie.com', // This should be a verified sender in your SendGrid account
  subject: 'BakeGenie - Test Email',
  text: 'This is a test email from BakeGenie to verify SendGrid integration is working correctly.',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h1 style="color: #2563eb;">BakeGenie</h1>
      <p>Hello from BakeGenie!</p>
      <p>This is a test email to verify that our SendGrid email integration is working correctly.</p>
      <p>If you're receiving this email, it means the system is properly configured and ready to send:</p>
      <ul>
        <li>Order reports</li>
        <li>Payment reminders</li>
        <li>Other business notifications</li>
      </ul>
      <p>Thank you for using BakeGenie!</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666;">
        <p>This is an automated email from BakeGenie. Please do not reply to this message.</p>
      </div>
    </div>
  `
};

// Send the email
async function sendTestEmail() {
  try {
    const response = await sgMail.send(msg);
    console.log('Email sent successfully!');
    console.log('Status code:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
  } catch (error) {
    console.error('Error sending test email:');
    if (error.response) {
      console.error(error.response.body);
    } else {
      console.error(error);
    }
  }
}

sendTestEmail();