PartSphere:
PartSphere is a full-stack e-commerce web application which enables users to exchange, rent, or buy heavy machineries or its spare parts from other users and companies. It has many features which are required in real-world marketplaces.

Tech Stack:
Frontend: React.js (Vite), Tailwind CSS, Lucide Icons

Backend: Node.js, Express.js

Database: PostgreSQL (Production) / SQLite (Local Fallback) via Sequelize ORM

Authentication: JSON Web Tokens (JWT) & bcryptjs

Storage: Supabase (Cloud) / Multer (Local Fallback)

Features:
Demo money that can be added to the user's account through an OTP system connected to the server terminal.

Rent/purchase of heavy equipment and spare parts.

Mandatory KYC verification required for users to upload and buy listed items.

Users are verified in the admin panel after logging in as an admin.

Admin panel that can only be accessed if you log in with username Admin and password admin123, and then add /admin to the home page URL.

Filters listed items by location.

Real-time chat is integrated for users and admin support.

Secure JWT-based login and registration.

Supports cloud storage (Supabase) with an automatic fallback to local disk storage if cloud keys are missing.

The backend automatically detects your environment and switches between a robust PostgreSQL database or a lightweight local SQLite file.

Purchases are done in an escrow manner where the amount is blocked until both parties verify that they have received their end of the bargain.

Instructions and Tips:

1. Install Dependencies
   You will need to install the required packages for both the client and the server.

Navigate to the client folder and run npm install

Navigate to the server folder and run npm install

2. Run the Application
   You need two terminals open to run this project:

To run the frontend/client: npm run dev

To run the backend/server: node index.js (or npm run dev)

3. Database & Storage Notes

Note that this project is designed to fall back to local storage (SQLite and local file uploads) in case you do not configure your own PostgreSQL and Supabase environment variables.

If you face an error after using the local SQLite database for a while (like a schema crash), just delete the database.sqlite file located in the server folder. Restarting the backend will automatically generate a fresh, clean database.
