"use server";

import sgClient from '@sendgrid/client';
import sgMail from '@sendgrid/mail';

// Set up SendGrid API keys
const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  throw new Error('SENDGRID_API_KEY is not set');
}
sgMail.setApiKey(apiKey);
sgClient.setApiKey(apiKey);

// Type Definitions
type Sender = {
  from: from;
};

export type from ={
    email: string;
    name?: string;
}

type EmailData = {
  from: string;
  tos: string[];
  bccs?: string[];
  subject: string;
  message: string;
};

// Fetch Verified Senders
async function fetchSenders(): Promise<Sender[]> {
  try {
    const [response, body] = await sgClient.request({
      url: '/v3/senders',
      method: 'GET',
    });
    response.statusCode = 200;
    return body as Sender[];
  } catch (error: any) {
    console.error('Error fetching sender list:', error.response?.body || error.message);
    throw new Error('Unable to fetch sender list.');
  }
}

// Get Email List
export async function getEmailList(): Promise<from[]> {
  try {
    const senders = await fetchSenders();
    return senders.map(sender => sender.from);
  } catch (error: any) {
    console.error('Error fetching email list:', error.message);
    throw new Error('Unable to retrieve email list.');
  }
}

// Send Email
export async function sendEmail(emailData: EmailData): Promise<string> {
  const { from, tos, bccs = [], subject, message } = emailData;

  // Verify sender exists
  let verifiedSender;
  try {
    const senders = await fetchSenders();
    verifiedSender = senders.find(sender => sender.from.email === from)?.from;
    if (!verifiedSender) {
      throw new Error(`Sender email '${from}' is not verified.`);
    }
  } catch (error: any) {
    console.error('Error verifying sender:', error.message);
    throw new Error('Unable to verify sender email.');
  }

    const emailParams = {
      personalizations: [
        {
          to: tos.map(email => ({ email })),
          bcc: bccs.map(email => ({ email })),
        },
      ],
      from: verifiedSender,
      subject,
      content: [
        {
          type: 'text/html',
          value: message,
        },
      ],
    };

    await sgMail.send(emailParams as any)
        .then(() => {
            console.log('Mail sent successfully.');
            return 'Mail sent successfully.';
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            throw new Error('Error sending email.');
        });

        return 'Mail sent successfully.';
}



