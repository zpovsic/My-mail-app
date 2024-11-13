<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GmailMessage } from '../types';

  export let emails: GmailMessage[] = [];

  const dispatch = createEventDispatcher();
  const apiPort = import.meta.env.VITE_API_PORT;

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

  async function markAsRead(event: Event, emailId: string) {
    event.stopPropagation();
    try {
      const response = await fetch(`http://localhost:${apiPort}/api/emails/${emailId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        // Update the emails list reactively
        emails = emails.filter(e => e.id !== emailId);
        console.log('Email marked as read successfully');
      } else {
        console.error('Failed to mark email as read:', await response.text());
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }

  async function deleteEmail(event: Event, emailId: string) {
    event.stopPropagation();
    try {
      console.log('Attempting to delete email:', emailId);
      const response = await fetch(`http://localhost:${apiPort}/api/emails/${emailId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Email deleted successfully');
        // Update the emails list reactively
        emails = emails.filter(e => e.id !== emailId);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete email:', errorData);
        alert('Failed to delete email. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Error deleting email. Please try again.');
    }
  }
</script>

<div class="email-list">
  <div class="email-items">
    {#if emails.length === 0}
      <p>No emails to display.</p>
    {:else}
      {#each emails as email}
        <div class="email-item" on:click={() => selectEmail(email)}>
          <div class="email-content">
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
          <div class="email-actions">
            <button
              class="icon-button"
              title="Mark as read"
              on:click={(e) => markAsRead(e, email.id)}
            >
              📧
            </button>
            <button
              class="icon-button delete"
              title="Delete email"
              on:click={(e) => deleteEmail(e, email.id)}
            >
              🗑️
            </button>
          </div>
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
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .email-content {
    flex: 1;
    min-width: 0; /* Allows text truncation to work */
  }

  .email-item:hover {
    background-color: #2c2c2c;
  }

  .email-item.selected,
  .email-item:active {
    background-color: #3a567c;
    color: white;
  }

  .sender {
    font-weight: 500;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subject {
    color: #888;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date {
    font-size: 0.8em;
    color: #666;
    display: block;
  }

  .email-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    opacity: 0.7;
  }

  .email-item:hover .email-actions {
    opacity: 1;
  }

  .icon-button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    font-size: 1.1em;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .icon-button.delete:hover {
    background-color: rgba(255, 0, 0, 0.2);
  }
</style>