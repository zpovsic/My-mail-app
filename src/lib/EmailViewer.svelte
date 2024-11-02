<script lang="ts">
  export let email: any;

  function sanitizeHtml(html: string) {
    // Basic sanitization - you might want to use DOMPurify in production
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '');
  }

  function formatBody(body: string) {
    // If the body is plain text, wrap it in pre tags
    if (!body.includes('<')) {
      return `<pre style="white-space: pre-wrap;">${body}</pre>`;
    }
    return body;
  }
</script>

<div class="email-viewer">
  {#if email}
    <div class="email-content">
      <h2>{email.subject}</h2>
      <p class="email-header">From: {email.from}</p>
      <p class="email-header">To: {email.to}</p>
      <p class="email-header">Date: {new Date(email.date).toLocaleString()}</p>
      <div class="email-body">
        {@html sanitizeHtml(formatBody(email.body))}
      </div>
      {#if email.attachments && email.attachments.length > 0}
        <div class="attachments">
          <h3>Attachments:</h3>
          <ul>
            {#each email.attachments as attachment}
              <li>{attachment.filename} ({attachment.mimeType})</li>
            {/each}
          </ul>
        </div>
      {/if}
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

  .email-header {
    margin: 5px 0;
    color: #888;
  }

  .email-body {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ccc;
  }

  .email-body :global(img) {
    max-width: 100%;
    height: auto;
  }

  .attachments {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ccc;
  }

  .attachments ul {
    list-style: none;
    padding: 0;
  }

  .attachments li {
    padding: 5px 0;
  }
</style>