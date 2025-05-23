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
    console.log('Error fetching sender list:', error.response?.body || error.message);
    throw new Error('Unable to fetch sender list.');
  }
}

// Get Email List
export async function getEmailList(): Promise<from[]> {
  try {
    const senders = await fetchSenders();
    return senders.map(sender => sender.from);
  } catch (error: any) {
    console.log('Error fetching email list:', error.message);
    throw new Error('Unable to retrieve email list.');
  }
}

function extractInlineImages(message: string) {
  const imageRegex = /<img\s+src="data:image\/(.*?);base64,(.*?)"(?:\s+alt="(.*?)")?\s*\/?>/g;
  let match;
  const attachments = [];
  let updatedContent = message;

  while ((match = imageRegex.exec(message)) !== null) {
    const [, mimeType, base64Data, alt] = match;
    const cid: string = `inline-image-${attachments.length}`;
    attachments.push({
      filename: `${alt || 'image'}.${mimeType.split('/')[1]}`,
      content: base64Data,
      type: `image/${mimeType}`,
      disposition: 'inline',
      content_id: cid,
    });
    updatedContent = updatedContent.replace(match[0], `<img src="cid:${cid}" alt="${alt || ''}" />`);
  }

  return { content: updatedContent, attachments };
}


// Send Email
export async function sendEmail(emailData: EmailData): Promise<string> {
  const { from, tos, bccs = [], subject, message } = emailData;

  let verifiedSender;
  try {
    const senders = await fetchSenders();
    verifiedSender = senders.find(sender => sender.from.email === from)?.from;
    if (!verifiedSender) {
      throw new Error(`Sender email '${from}' is not verified.`);
    }
  } catch (error) {
    console.log('Error verifying sender:', error instanceof Error ? error.message : error);
    throw new Error('Unable to verify sender email.');
  }

  const toos = Array.from(new Set([...tos, "me@arunshrestha.info.np"])).map(email => ({ email }));

  const { content, attachments } = extractInlineImages(message);
  
  const emailParams = {
    personalizations: [
      {
        to: toos,
        bcc: bccs.map(email => ({ email })),
      },
    ],
    from: verifiedSender,
    subject,
    content: [
      {
        type: 'text/html',
        value: content,
      },
    ],
    attachments,
  };

  try {
    await sgMail.send(emailParams as any);
    // console.log(mail);
    console.log('Mail sent successfully.');
    return 'Mail sent successfully.';
  } catch (error : any) {
    console.log('Error sending email:', error);
    if (error.response) {
      console.log('Response details:', error.response.body);
    }
    throw new Error('Failed to send email. Please check the logs for details.');
  }
}


