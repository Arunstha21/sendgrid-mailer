# SendGrid Mailer

SendGrid Mailer is a simple email-sending application built using the SendGrid API. It is designed for managing user accounts, handling events, and sending automated emails with customizable content.

## Features

1. **User Authentication:**
   - Secure login system with JWT token validation.
   - Middleware to restrict access to certain pages based on roles.

2. **User Management:**
   - Create new user accounts with the ability to assign administrative privileges.
   - Simple user interface for managing user credentials.

3. **Email Composition:**
   - Rich text editor for composing customized email content.
   - Support for multi-recipient emails (To, BCC).

4. **Event Management:**
   - Import event data and schedules from `.csv` or `.xlsx` files.
   - Send emails with event details, including match credentials and groupings.

5. **Data Handling:**
   - Import event or match data and validate the content before saving to the database.
   - Display and update match results through an intuitive interface.

6. **Dynamic Dashboard:**
   - Tabs for composing new emails, importing data, and viewing results.
   - User-friendly dropdowns for selecting event stages, groups, and matches.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sendgrid-mailer.git
   cd sendgrid-mailer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file at the root of the project.
   - Add the following variables:
     ```
     SENDGRID_API_KEY=your_sendgrid_api_key
     JWT_SECRET=your_jwt_secret
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Visit the application at [http://localhost:3000](http://localhost:3000).

## Directory Structure

```
src/
├── app/
│   ├── adduser/        # Pages for adding new users.
│   ├── dashboard/      # Dashboard components for events and matches.
│   ├── globals.css     # Global styles using Tailwind CSS.
│   ├── layout.tsx      # Main layout for the application.
│   └── page.tsx        # Login page.
├── components/         # Reusable UI components.
├── lib/
│   ├── utils.ts        # Utility functions.
│   └── database/       # Database connection and schema definitions.
├── middleware.ts       # Middleware for route protection.
└── server/
    ├── database.ts     # Database query handlers.
    ├── sendgrid.ts     # SendGrid API integration.
    ├── user.ts         # User authentication and role handling.
```

## Usage

1. **Login:**
   - Use the login page to sign in with valid credentials.

2. **Manage Users:**
   - Navigate to the `/adduser` page to create or manage users.

3. **Send Emails:**
   - Use the dashboard to compose emails, select recipients, and send messages.

4. **Import Data:**
   - Upload event or match data from `.csv` or `.xlsx` files on the "Import Data" tab.

5. **Match Management:**
   - Use the Match Data Uploader to view and upload match results.

## Technologies Used

- **Frontend:**
  - Next.js for the web framework.
  - Tailwind CSS for styling.
  - React Hook Form for form handling.
  
- **Backend:**
  - SendGrid API for email services.
  - JWT for authentication.
  - Node.js and TypeScript for server-side logic.

- **Database:**
  - Connection logic provided in the `database` module.

## License

This project is licensed under the [MIT License](LICENSE).