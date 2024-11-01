<script lang="ts">
  import type { GmailMessage } from '../types';

  export let email: GmailMessage | null = null;
</script>

<div class="email-viewer">
  {#if email}
    <div class="email-content">
      <h2>{email.subject}</h2>
      <p>From: {email.from}</p>
      <p>Date: {new Date(email.date).toLocaleString()}</p>
      <div class="email-body">
        {@html email.body}
      </div>
    </div>
  {:else}
    <p>Select an email to view its contents.</p>
  {/if}
</div>

<style>
  .email-viewer {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
    height: 100%;
    position: relative;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .email-content {
    flex: 1;
    overflow-y: auto;
  }

  .email-body {
    margin-top: 20px;
    white-space: pre-wrap;
  }
</style>