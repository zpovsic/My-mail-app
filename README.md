# Google Mail App with Svelte and SvelteKit

This project is a simple Google Mail application built with Svelte, TypeScript, and Vite. It allows users to view their recent emails from their Gmail account.

## Prerequisites

Before running this application, make sure you have:

1. Node.js installed (version 14 or later)
2. A Google Cloud Platform project with the Gmail API enabled
3. OAuth 2.0 credentials (a `credentials.json` file) for your Google Cloud Platform project

## Setup

1. Clone this repository to your local machine.
2. Place your `credentials.json` file in the root directory of the project.
3. Install the dependencies:

```bash
npm install
```

## Running the Application

1. Start the backend server:

```bash
npm run server
```

2. In a new terminal, start the frontend development server:

```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` (or the URL provided by Vite).

4. The first time you run the application, you'll need to authorize it to access your Gmail account. Follow the prompts in the console to complete the authorization process.

## Project Structure

- `server.js`: The backend server that handles authentication with Google and fetches emails.
- `src/App.svelte`: The main Svelte component that orchestrates the application.
- `src/lib/EmailList.svelte`: Component for displaying the list of emails.
- `src/lib/EmailViewer.svelte`: Component for viewing the contents of a selected email.
- `src/types.ts`: TypeScript definitions for the application.

## Note

This is a basic implementation and does not include features like sending emails, pagination, or advanced email management. It's intended as a starting point for building more complex Gmail applications.