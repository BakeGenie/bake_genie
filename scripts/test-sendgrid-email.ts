import { sendCancellationEmail } from '../server/services/email-service';

/**
 * Test the SendGrid email integration with a cancellation email
 */
async function sendTestEmail() {
  try {
    const testEmail = 'test@example.com'; // Replace with actual email for testing
    const userName = 'Test User';
    const effectiveDate = new Date();
    effectiveDate.setMonth(effectiveDate.getMonth() + 1); // Set to end of billing period
    
    console.log(`Sending test cancellation email to ${testEmail}...`);
    
    const result = await sendCancellationEmail(
      testEmail,
      userName,
      effectiveDate
    );
    
    if (result) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.error('❌ Failed to send test email.');
    }
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

// Execute the test
sendTestEmail().catch(console.error);