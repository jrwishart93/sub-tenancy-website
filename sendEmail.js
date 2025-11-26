import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email sending will be disabled.');
}

const resend = new Resend(resendApiKey);

// Builds HTML content for the email
export async function sendAgreementEmail({ to, subject, html }) {
  try {
    const response = await resend.emails.send({
      from: 'James Square Booking <noreply@james-square.com>',
      to,
      subject,
      html,
    });

    console.log('Email sent:', response);
    return response;
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
}
