
'use server';
/**
 * @fileOverview An AI flow to generate a welcome email for new users.
 * THIS FLOW IS OBSOLETE AND NO LONGER USED.
 * The system now uses a direct email service via /src/lib/email.ts
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WelcomeEmailInputSchema = z.object({
  userName: z.string().describe('The full name of the new user.'),
  userEmail: z.string().email().describe('The email address of the new user.'),
  tempPassword: z.string().describe('The temporary password for the user to log in with.'),
  loginUrl: z.string().url().describe('The URL where the user can log in.'),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

const WelcomeEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line for the welcome email.'),
  body: z.string().describe('The full body of the welcome email in plain text. It should be friendly and professional.'),
});
export type WelcomeEmailOutput = z.infer<typeof WelcomeEmailOutputSchema>;

export async function generateWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailOutput> {
  return generateWelcomeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWelcomeEmailPrompt',
  input: { schema: WelcomeEmailInputSchema },
  output: { schema: WelcomeEmailOutputSchema },
  prompt: `You are an onboarding specialist for a company called "MealAttend". Your task is to generate a welcome email for a new user.

The email should be professional, friendly, and clear.

It must contain the following information:
1.  A welcome message addressing the user by their name ({{userName}}).
2.  Their user ID, which is their email address ({{userEmail}}).
3.  Their temporary password ({{tempPassword}}).
4.  A clear instruction that they will be required to change this password upon their first login for security.
5.  The login URL ({{loginUrl}}) where they can access the system.

Generate a suitable subject line and a full email body.
Do not use markdown or HTML, only plain text.
`,
});

const generateWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'generateWelcomeEmailFlow',
    inputSchema: WelcomeEmailInputSchema,
    outputSchema: WelcomeEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
