import express from "express";
import cors from "cors";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001; // Use environment variable for port

app.use(cors());

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content.toString());
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
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  } catch (err) {
    console.error("Error during authorization:", err);
    throw err;
  }
}

async function listMessages(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });
    return res.data.messages || [];
  } catch (err) {
    console.error("Error listing messages:", err);
    throw err;
  }
}

async function getMessage(auth, id) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id: id,
    });
    return res.data;
  } catch (err) {
    console.error("Error getting message:", err);
    throw err;
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
    const emails = await Promise.all(
      messages.map(async (message) => {
        const fullMessage = await getMessage(auth, message.id);
        const headers = fullMessage.payload.headers;
        const subject =
          headers.find((header) => header.name === "Subject")?.value ||
          "No Subject";
        const from =
          headers.find((header) => header.name === "From")?.value ||
          "Unknown Sender";
        const to =
          headers.find((header) => header.name === "To")?.value ||
          "Unknown Recipient";
        const date =
          headers.find((header) => header.name === "Date")?.value ||
          new Date().toISOString();

        return {
          id: fullMessage.id,
          threadId: fullMessage.threadId,
          from,
          to,
          subject,
          date,
          body: fullMessage.snippet || "No body",
        };
      })
    );
    res.json(emails);
  } catch (error) {
    console.error("Error in /api/emails:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch emails", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});