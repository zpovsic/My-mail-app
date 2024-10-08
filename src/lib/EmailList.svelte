<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GmailMessage } from '../types';

  export let emails: GmailMessage[] = [];

  const dispatch = createEventDispatcher();

  function selectEmail(email: GmailMessage) {
    dispatch('selectEmail', email);
  }
</script>

<div class="email-list">
  <h2>Inbox</h2>
  {#if emails.length === 0}
    <p>No emails to display.</p>
  {:else}
    {#each emails as email}
      <div class="email-item" on:click={() => selectEmail(email)}>
        <span class="sender">{email.from}</span>
        <span class="subject">{email.subject}</span>
        <span class="date">{new Date(email.date).toLocaleDateString()}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  .email-list {
    width: 300px;
    border-right: 1px solid #ccc;
    padding-right: 20px;
  }

  .email-item {
    cursor: pointer;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }

  .email-item:hover {
    background-color: #f5f5f5;
  }

  .sender, .subject, .date {
    display: block;
  }

  .subject {
    font-weight: bold;
  }

  .date {
    font-size: 0.8em;
    color: #666;
  }
</style>