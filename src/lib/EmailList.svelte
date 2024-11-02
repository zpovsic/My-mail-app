<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GmailMessage } from '../types';

  export let emails: GmailMessage[] = [];

  const dispatch = createEventDispatcher();

  function formatSender(from: string) {
    if (!from) return 'Unknown Sender';

    // Try to extract name from format "Name <email@domain.com>"
    const match = from.match(/^([^<]+)?.*?([^>]+@[^>]+)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    // If no name found, return the email address or the whole string
    return from.split('@')[0].replace(/<|>/g, '').trim();
  }

  function selectEmail(email: GmailMessage) {
    dispatch('selectEmail', email);
  }
</script>

<div class="email-list">
  <div class="email-items">
    {#if emails.length === 0}
      <p>No emails to display.</p>
    {:else}
      {#each emails as email}
        <div class="email-item" on:click={() => selectEmail(email)}>
          <span class="sender">{formatSender(email.from)}</span>
          <span class="subject">{email.subject || 'No Subject'}</span>
          <span class="date">
            {#if email.date}
              {new Date(email.date).toLocaleDateString()}
            {:else}
              Unknown Date
            {/if}
          </span>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .email-list {
    width: 300px;
    border-right: 1px solid #ccc;
    padding-right: 20px;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .email-items {
    overflow-y: auto;
    flex: 1;
  }

  .email-item {
    padding: 10px;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
  }

  .email-item:hover {
    background-color: #2c2c2c;
  }

  .email-item.selected,
  .email-item:active {
    background-color: #3a567c;
    color: white;
  }

  .sender, .subject, .date {
    display: block;
  }

  .sender {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .subject {
    color: #888;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date {
    font-size: 0.9em;
    color: #666;
  }
</style>