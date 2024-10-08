<script lang="ts">
  import EmailList from './lib/EmailList.svelte';
  import EmailViewer from './lib/EmailViewer.svelte';
  import { onMount } from 'svelte';
  import type { GmailMessage } from './types';

  let emails: GmailMessage[] = [];
  let selectedEmail: GmailMessage | null = null;
  let error: string | null = null;

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emails');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      emails = await response.json();
    } catch (e) {
      console.error('Error fetching emails:', e);
      error = 'Failed to fetch emails. Please try again later.';
    }
  });

  function handleSelectEmail(email: GmailMessage) {
    selectedEmail = email;
  }
</script>

<main>
  <h1>Google Mail App</h1>
  {#if error}
    <p class="error">{error}</p>
  {:else}
    <div class="app-container">
      <EmailList {emails} on:selectEmail={(event) => handleSelectEmail(event.detail)} />
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
  }
</style>