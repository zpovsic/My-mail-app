import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
console.log("Port:", port);

app.use(cors());

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf8");
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    console.log("No saved credentials found.");
    return null;
  }
}

async function saveCredentials(client) {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
    console.log("Credentials saved.");
  } catch (err) {
    console.error("Error saving credentials:", err);
  }
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }

  try {
    // Read the credentials file
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    const key = keys.installed || keys.web;

    // Create OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );

    // Generate auth url
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    // Instead of automatic browser auth, we'll require manual input
    console.log('After authorizing, copy the code from the redirect URL and set it in your .env file as AUTH_CODE');

    // Check if we have an auth code in env
    const code = process.env.AUTH_CODE;
    if (!code) {
      throw new Error('Please set AUTH_CODE in your .env file after visiting the auth URL');
    }

    // Get tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save the tokens
    await saveCredentials(oAuth2Client);

    return oAuth2Client;
  } catch (err) {
    console.error("Error during authorization:", err);
    throw err;
  }
}

async function listMessages(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  let allMessages = [];
  let pageToken = undefined;

  try {
    do {
      console.log('Fetching page of messages...');
      const response = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['UNREAD', 'INBOX'],
        pageToken: pageToken,
        maxResults: 500 // Get maximum messages per request
      });

      if (response.data.messages) {
        allMessages = allMessages.concat(response.data.messages);
        console.log(`Fetched ${allMessages.length} messages so far...`);
      }

      pageToken = response.data.nextPageToken;

    } while (pageToken); // Continue while there are more pages

    console.log('Total messages found:', allMessages.length);
    return allMessages;

  } catch (error) {
    console.error('Error listing messages:', error);
    return [];
  }
}

async function getMessage(auth, messageId) {
  const gmail = google.gmail({ version: 'v1', auth });
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = response.data.payload;
    let body = '';

    // Improved decode function with encoding support
    const decodeBody = (data, encoding = 'base64') => {
      if (!data) return '';
      try {
        let decoded = Buffer.from(data, encoding).toString('utf8');
        // Handle quoted-printable encoding
        if (encoding === 'quoted-printable') {
          decoded = decoded.replace(/=\r?\n/g, '')
                         .replace(/=([0-9A-F]{2})/g,
                           (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        }
        return decoded;
      } catch (error) {
        console.error(`Error decoding ${encoding}:`, error);
        return '';
      }
    };

    // Improved parts processing
    const processParts = (part) => {
      if (!part) return '';

      // Check for content encoding
      const encoding = part.body?.encoding || 'base64';

      // Direct body data
      if (part.body?.data) {
        return decodeBody(part.body.data, encoding);
      }

      // Handle multipart
      if (part.parts) {
        let htmlContent = '';
        let plainContent = '';

        part.parts.forEach(p => {
          const content = processParts(p);
          if (p.mimeType === 'text/html') {
            htmlContent += content;
          } else if (p.mimeType === 'text/plain') {
            plainContent += content;
          }
        });

        // Prefer HTML content over plain text
        return htmlContent || plainContent;
      }

      // Handle mimeType directly
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBody(part.body.data, encoding);
      }
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBody(part.body.data, encoding);
      }

      return '';
    };

    // Process the email content
    if (payload.body?.data) {
      body = decodeBody(payload.body.data);
    } else if (payload.parts) {
      body = processParts(payload);
    }

    // Fallback to snippet if no body content found
    if (!body || body.trim() === '') {
      body = `<div>${response.data.snippet || 'No content available'}</div>`;
      console.log(`Using snippet for message ${messageId}`);
    }

    const headers = payload.headers || [];
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : 'Unknown';
    };

    // Log successful processing
    console.log(`Successfully processed message ${messageId}`);

    return {
      id: response.data.id || messageId,
      threadId: response.data.threadId || '',
      from: getHeader('from'),
      to: getHeader('to'),
      subject: getHeader('subject'),
      date: getHeader('date'),
      body: body,
      attachments: payload.parts ? payload.parts
        .filter(part => part.filename && part.filename.length > 0)
        .map(part => ({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId
        })) : []
    };

  } catch (err) {
    console.error(`Error processing message ${messageId}:`, err);
    return {
      id: messageId,
      threadId: '',
      from: 'Error loading message',
      to: 'Error loading message',
      subject: 'Error loading message',
      date: new Date().toISOString(),
      body: 'Error loading message',
      attachments: []
    };
  }
}

// Add a route for the root path
app.get("/", (req, res) => {
  res.send(
    "Google Mail App Server is running. Use /api/emails to fetch emails."
  );
});

app.get("/api/emails", async (req, res) => {
  try {
    const auth = await authorize();
    const messages = await listMessages(auth);
    console.log('Found messages:', messages.length);

    const emails = await Promise.all(
      messages.map(async (message) => {
        try {
          return await getMessage(auth, message.id);
        } catch (error) {
          console.error('Error processing message:', message.id, error);
          return null;
        }
      })
    );

    const validEmails = emails.filter(email => email !== null);
    console.log('Valid emails processed:', validEmails.length);

    if (validEmails.length === 0) {
      res.status(404).json({
        error: "No valid emails found",
        details: "All processed emails were invalid"
      });
    } else {
      res.json(validEmails);
    }
  } catch (error) {
    console.error("Error in /api/emails:", error);
    res.status(500).json({
      error: "Failed to fetch emails",
      details: error.message
    });
  }
});

// Start server with better error handling
try {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please try these steps:`);
      console.error('1. Run "taskkill /F /IM node.exe" in PowerShell as Administrator');
      console.error(`2. Check if any other application is using port ${port}`);
      console.error('3. Try using a different port by setting PORT in your .env file');
      process.exit(1);
    }
    throw err;
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
