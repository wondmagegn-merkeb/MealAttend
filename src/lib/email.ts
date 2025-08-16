
'use server';

import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = process.env;

interface WelcomeEmailProps {
  fullName: string;
  email: string;
  loginUrl: string;
  siteName: string;
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});


export async function sendWelcomeEmail({
  fullName,
  email,
  loginUrl,
  siteName,
}: WelcomeEmailProps) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
    throw new Error('Email service (SMTP) is not configured. Please set SMTP variables in .env file.');
  }

  const mailOptions = {
    from: `"${siteName}" <${FROM_EMAIL}>`,
    to: email,
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
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    throw new Error(`Failed to send email: ${(error as Error).message}`);
  }
}

interface ForgotPasswordEmailProps {
    adminEmail: string;
    userName: string;
    userEmail: string;
    siteName: string;
}

export async function sendForgotPasswordNotification({ adminEmail, userName, userEmail, siteName }: ForgotPasswordEmailProps) {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
        throw new Error('Email service (SMTP) is not configured. Please set SMTP variables in .env file.');
    }

    const mailOptions = {
        from: `"${siteName} Security" <${FROM_EMAIL}>`,
        to: adminEmail,
        subject: `${siteName} - Password Reset Request for ${userName}`,
        html: `
            <h1>Password Reset Request</h1>
            <p>User <strong>${userName} (${userEmail})</strong> has requested a password reset for their account.</p>
            <p>Please log in to the ${siteName} admin panel, navigate to the User Management section, and set a new password for them.</p>
            <p>This is a notification only. No further action is required from this email.</p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Forgot password notification sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error(`Failed to send forgot password email to admin ${adminEmail}:`, error);
        throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
}
