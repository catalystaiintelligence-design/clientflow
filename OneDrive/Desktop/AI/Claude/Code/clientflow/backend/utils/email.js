// Email utility with Resend integration and console fallback

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    // Console fallback when Resend is not configured
    console.log('\n--- EMAIL LOG ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text || html}`);
    console.log('--- END EMAIL ---\n');
    return { id: 'mock-email-id', mock: true };
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@clientflow.app',
      to,
      subject,
      html,
      text,
    });

    return result;
  } catch (err) {
    console.error('Email send failed:', err.message);
    // Fallback to console on error
    console.log('\n--- EMAIL LOG (fallback) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--- END EMAIL ---\n');
    return { error: err.message };
  }
};

const sendPortalInvite = async ({ clientName, clientEmail, portalUrl }) => {
  return sendEmail({
    to: clientEmail,
    subject: `Action Required: Complete Your Onboarding`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${clientName}!</h2>
        <p>You have been invited to complete your onboarding. Please click the button below to get started.</p>
        <a href="${portalUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Complete Onboarding
        </a>
        <p>Or copy this link: <a href="${portalUrl}">${portalUrl}</a></p>
        <p>This link is unique to you. Please do not share it.</p>
      </div>
    `,
    text: `Welcome, ${clientName}! Please complete your onboarding at: ${portalUrl}`,
  });
};

const sendSubmissionNotification = async ({ ownerEmail, clientName }) => {
  return sendEmail({
    to: ownerEmail,
    subject: `${clientName} has submitted their onboarding`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Onboarding Submitted</h2>
        <p><strong>${clientName}</strong> has completed and submitted their onboarding form.</p>
        <p>Log in to ClientFlow to review the submission and manage tasks.</p>
      </div>
    `,
    text: `${clientName} has submitted their onboarding. Log in to ClientFlow to review.`,
  });
};

module.exports = { sendEmail, sendPortalInvite, sendSubmissionNotification };
