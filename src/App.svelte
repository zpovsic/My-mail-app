<script lang="ts">
  import { onMount } from "svelte";
  import type { GmailMessage } from "./types";

  let emails: GmailMessage[] = [];
  let selectedEmail: GmailMessage | null = null;
  let error: string | null = null;
  let loading: boolean = true;

  const apiPort = import.meta.env.VITE_API_PORT;
  console.log('API Port:', apiPort);

  onMount(async () => {
    try {
      const response = await fetch(`http://localhost:${apiPort}/api/emails`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData.error}, details: ${errorData.details}`
        );
      }
      emails = await response.json();
    } catch (e) {
      console.error("Error fetching emails:", e);
      error = `Failed to fetch emails: ${e.message}. Please make sure the server is running and credentials are set up correctly.`;
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
