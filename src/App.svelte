<script lang="ts">
  import { onMount } from "svelte";
  import type { GmailMessage } from "./types";
  import EmailList from "./lib/EmailList.svelte";
  import EmailViewer from "./lib/EmailViewer.svelte";

  let emails: GmailMessage[] = [];
  let selectedEmail: GmailMessage | null = null;
  let error: string | null = null;
  let loading: boolean = true;

  const apiPort = import.meta.env.VITE_API_PORT;
  const apiUrl = `http://localhost:${apiPort}/api/emails`;

  async function checkServerConnection(): Promise<boolean> {
    try {
      const response = await fetch(apiUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  onMount(async () => {
    try {
      if (!apiPort) {
        throw new Error('API port is not configured. Please check your .env file.');
      }

      const isServerRunning = await checkServerConnection();
      if (!isServerRunning) {
        throw new Error(`Cannot connect to server at ${apiUrl}. Is the server running?`);
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData.error}, details: ${errorData.details}`
        );
      }
      emails = await response.json();
    } catch (e) {
      console.error("Error fetching emails:", e);
      error = `Failed to fetch emails: ${e instanceof Error ? e.message : String(e)}

Please check:
1. Backend server is running on port ${apiPort}
2. Run 'npm start' or 'node server.js' in the backend directory
3. Check if your .env file has the correct VITE_API_PORT value
4. Ensure there are no firewall issues blocking the connection`;
    } finally {
      loading = false;
    }
  });

  function handleSelectEmail(email: GmailMessage) {
    selectedEmail = email;
  }
</script>

<main>
  <h1>Google Mail App</h1>
  {#if loading}
    <p>Loading emails...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="app-container">
      <EmailList
        {emails}
        on:selectEmail={(event) => handleSelectEmail(event.detail)}
      />
      <EmailViewer email={selectedEmail} />
    </div>
  {/if}
</main>

<style>
  .app-container {
    display: flex;
    gap: 20px;
  }
  .error {
    color: red;
    font-weight: bold;
    white-space: pre-wrap;
  }
</style>
