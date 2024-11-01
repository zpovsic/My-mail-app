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
  <div class="email-items">
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

  .subject {
    font-weight: bold;
  }

  .date {
    font-size: 0.8em;
    color: #666;
  }
</style>