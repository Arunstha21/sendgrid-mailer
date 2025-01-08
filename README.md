# SendGrid Mailer Application

## Overview
This application provides a robust platform to manage email communications for events, including composing, scheduling, and sending emails using the SendGrid API. The application is built using modern frameworks like Next.js, React, and TypeScript, and integrates with a MongoDB database for data management.

## Features

- **Compose Emails:** Create and send personalized emails.
- **Rich Text Editor:** Format emails with a rich text editor.
- **Event Data Management:** Import and manage event schedules and groupings.
- **SendGrid Integration:** Seamless email delivery using SendGrid.
- **Database Integration:** Manage events, stages, groups, schedules, and teams with MongoDB.

## Directory Structure
```
Arunstha21-sendgrid-mailer/
├── public/
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── dashboard/
    │       ├── [path]/
    │       │   └── page.tsx
    │       └── components/
    │           ├── EmailChip.tsx
    │           ├── MultiEmailInput.tsx
    │           ├── RichEditor.tsx
    │           ├── dummyData.ts
    │           ├── event.tsx
    │           ├── import.tsx
    │           ├── message.tsx
    │           └── new.tsx
    ├── lib/
    │   ├── utils.ts
    │   └── database/
    │       ├── connect.tsx
    │       └── schema.tsx
    └── server/
        ├── database.ts
        └── sendgrid.ts
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Arunstha21-sendgrid-mailer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     MONGO_URL=<your-mongodb-uri>
     SENDGRID_API_KEY=<your-sendgrid-api-key>
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Components

### Core Components

1. **RichEditor:** Provides a rich text editor for composing emails.
2. **MultiEmailInput:** Allows input of multiple email addresses.
3. **EmailChip:** Displays individual email addresses as chips.
4. **Event:** Handles event-related email composition.
5. **Import:** Facilitates importing event and schedule data from files.

### Backend Modules

1. **Database Module:**
   - Connects to MongoDB using `mongoose`.
   - Models: Users, Events, Stages, Groups, Teams, and Schedules.

2. **SendGrid Integration:**
   - Fetches verified senders.
   - Sends emails with SendGrid.

## Usage

### Sending Emails
1. Navigate to the dashboard.
2. Use the "Compose New" tab to create an email.
3. Use the "Compose for Event" tab to send event-related emails.
4. Preview the message and click "Send."

### Importing Data
1. Navigate to the "Import Data" tab.
2. Upload CSV or Excel files containing event or schedule data.
3. Validate and import the data into the database.

### Managing Events
1. Add or edit event data in the "Compose for Event" tab.
2. View and manage schedules and groupings.

## Requirements

- Node.js
- MongoDB
- SendGrid Account
- Modern browser

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

Feel free to fork the repository and submit pull requests for new features or bug fixes.

