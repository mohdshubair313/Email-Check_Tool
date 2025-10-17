'use server';

import { google } from 'googleapis';
import { getOutlookGraphClient } from '@/lib/OutlookAuth';
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid';
import { saveTest, getTestByCode, getReport } from '@/lib/db'; // Supabase-based now!
import { Transporter } from 'nodemailer';
import imaps from 'imap-simple';

// 1. Generate Unique Test Code
export async function generateTestCode(userEmail?: string) {
  try {
    const code = uuidv4().slice(0, 8).toUpperCase();
    await saveTest(code, [], 0, userEmail);
    return { success: true, code };
  } catch (error) {
    return { success: false, error: 'Code generation failed' };
  }
}

// 2. Check Single Inbox (Modular functions)
async function checkGmail(code: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,  // Get from service account or OAuth
      },
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
    const gmail = google.gmail({ version: 'v1', auth });

    // Search in Inbox
    let res = await gmail.users.messages.list({ userId: 'me', q: `in:inbox ${code}` });
    if (res.data.messages?.length) return 'Inbox';

    // Search in Spam
    res = await gmail.users.messages.list({ userId: 'me', q: `in:spam ${code}` });
    if (res.data.messages?.length) return 'Spam';

    // Search in All (Promotions fallback)
    res = await gmail.users.messages.list({ userId: 'me', q: `${code}` });
    if (res.data.messages?.length) return 'Promotions';

    return 'Not Received';
  } catch (error) {
    console.error('Gmail check error:', error);
    return 'Error';
  }
}

const TEST_EMAIL = process.env.OUTLOOK_TEST_EMAIL!;  // test@outlook.com

export async function checkOutlook(testCode: string) {
  try {
    const client = await getOutlookGraphClient();

    // Step 1: Inbox check (well-known folder)
    let messages = await client
      .api(`/me/mailFolders/Inbox/messages`)
      .filter(`contains(subject,'${testCode}')`)
      .top(1)
      .select('id,subject,receivedDateTime')
      .get();

    if (messages.value.length > 0) {
      console.log(`Outlook Inbox: Found email with code ${testCode}`);
      return 'Inbox';
    }

    // Step 2: Junk/Spam folder check
    messages = await client
      .api(`/me/mailFolders/JunkEmail/messages`)  // Standard Junk folder name
      .filter(`contains(subject,'${testCode}')`)
      .top(1)
      .get();

    if (messages.value.length > 0) {
      return 'Spam';
    }

    // Step 3: Archive/Promotions fallback (All mail search)
    messages = await client
      .api(`/me/messages`)
      .filter(`contains(subject,'${testCode}')`)
      .top(1)
      .get();

    if (messages.value.length > 0) {
      return 'Promotions';  // Or Archive if isArchive true
    }

    return 'Not Received';
  } catch (error) {
    console.error('Outlook check error:', error);
    return 'Error';
  }
}

async function checkProton(code: string) {
  // Use IMAP for Proton
  // Install imap-simple, connect with env vars
  console.log('Proton IMAP check placeholder');
  return 'Not Received';  // TODO: Real IMAP implementation
}

export async function checkZohoIMAP(testCode: string) {
  try {
    const config = {
    imap: {
      user: 'shubair313@zohomail.in',  // Tumhara email
      password: process.env.ZOHO_APP_PASSWORD!, 
      host: 'imap.zoho.in', 
      port: 993,
      tls: true,  // SSL
      authTimeout: 3000,
  },
};

    const connection = await imaps.connect({ imap: config.imap });

    await connection.openBox('INBOX');  // First check Inbox

    // Search by subject
    const searchCriteria = ['SUBJECT', testCode];  // Or `['SUBJECT', `Test ${testCode}`]
    const fetchOptions = { bodies: [''], struct: true };  // Get full email
    const messages = await connection.search(searchCriteria, fetchOptions);

    if (messages.length > 0) {
      await connection.end();
      return 'Inbox';
    }

    // Check Spam/Junk folder
    await connection.openBox('Spam');  // Or '[Gmail]/Spam' if custom
    const spamMessages = await connection.search(searchCriteria, fetchOptions);

    if (spamMessages.length > 0) {
      await connection.end();
      return 'Spam';
    }

    // Fallback: All mail or Sent (for Promotions)
    await connection.openBox('[Gmail]/All Mail');  // Zoho mein All Mail available
    const allMessages = await connection.search(searchCriteria, fetchOptions);

    if (allMessages.length > 0) {
      await connection.end();
      return 'Promotions';
    }

    await connection.end();
    return 'Not Received';
  } catch (error) {
    console.error('Zoho IMAP error:', error);
    return 'Error';
  }
}

// 3. Analyze All Inboxes
export async function analyzeEmails(code: string) {
  try {
    const inboxes = ['Gmail', 'Outlook', 'Zoho', 'Proton'];
    const checkFunctions = [checkGmail, checkOutlook, checkProton, checkZohoIMAP];
    const results: string[] = [];

    // Parallel checks
    for (let i = 0; i < inboxes.length; i++) {
      results.push(await checkFunctions[i](code));
      await new Promise(resolve => setTimeout(resolve, 1000));  // Rate limit delay
    }

    // Calculate score (Inbox count / 5 * 100)
    const inboxCount = results.filter(r => r === 'Inbox').length;
    const score = Math.round((inboxCount / 5) * 100);

    await saveTest(code, results, score);

    return { success: true, results, score, inboxes };
  } catch (error) {
    return { success: false, error: 'Analysis failed' };
  }
}

// 4. Send Report Email
export async function sendReportEmail(code: string, userEmail: string) {
  try {
    const test = await getTestByCode(code);
    if (!test) return { success: false, error: 'Report not found' };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    const reportLink = `${process.env.APP_URL}/report/${test.id}`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `Deliverability Report for Code: ${code}`,
      html: `
        <h1>Your Report</h1>
        <p>Score: ${test.score}%</p>
        <p>View full report: <a href="${reportLink}">${reportLink}</a></p>
        <ul>${test.results.map((r: string, i: number) => `<li>${['Gmail', 'Outlook', 'Zoho', 'Proton'][i]}: ${r}</li>`).join('')}</ul>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// 5. Get Report for Page
// export async function getReport(id: string) {
//   const { rows } = await sql`SELECT * FROM tests WHERE id = ${id}`;
//   return rows[0];
// }
