
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL;

interface WelcomeEmailProps {
  fullName: string;
  email: string;
  loginUrl: string;
  siteName: string;
}

export async function sendWelcomeEmail({
  fullName,
  email,
  loginUrl,
  siteName,
}: WelcomeEmailProps) {
  if (!process.env.RESEND_API_KEY || !fromEmail) {
    throw new Error('Email service is not configured. Missing RESEND_API_KEY or FROM_EMAIL.');
  }

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: `Welcome to ${siteName}!`,
    html: `
      <h1>Welcome to ${siteName}, ${fullName}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Your username is your email address: <strong>${email}</strong></p>
      <p>A temporary password has been set for you by an administrator. For security, you will be required to change it on your first login.</p>
      <p>You can log in to the system here:</p>
      <a href="${loginUrl}">${loginUrl}</a>
      <p>Thank you,</p>
      <p>The ${siteName} Team</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
