<script lang="ts">
  import type { GmailMessage } from '../types';

  export let email: GmailMessage | null = null;
</script>

<div class="email-viewer">
  {#if email}
    <h2>{email.subject}</h2>
    <p>From: {email.from}</p>
    <p>Date: {new Date(email.date).toLocaleString()}</p>
    <div class="email-body">
      {@html email.body}
    </div>
  {:else}
    <p>Select an email to view its contents.</p>
  {/if}
</div>

<style>
  .email-viewer {
    flex-grow: 1;
    padding: 20px;
  }

  .email-body {
    margin-top: 20px;
    white-space: pre-wrap;
  }
</style>