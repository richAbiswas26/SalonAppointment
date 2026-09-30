# Salon Appointment System

A full salon appointment and management system built with **EJS, HTML, CSS, Vanilla JavaScript, Node.js, Express and MongoDB/Mongoose**.

## Structure

- `frontend/views` — EJS pages
- `frontend/public/css` — client/admin styling
- `frontend/public/js` — browser JavaScript
- `frontend/uploads/hero` — admin-uploaded homepage slider images
- `frontend/uploads/categories` — category images
- `frontend/uploads/services` — individual service images
- `backend/models` — MongoDB models
- `backend/controllers` — business logic
- `backend/routes` — Express routes
- `backend/middleware` — authentication and image upload
- `backend/services` — reward logic

## Run locally

1. Install Node.js.
2. Create `.env` in the project root using `.env.example`.
3. Put your MongoDB Atlas connection string in `MONGODB_URI`.
4. Put your Google OAuth Client ID/Secret in the Google fields if Google login is required.
5. Run:

```bash
npm install
npm run dev
```

6. Open `http://localhost:3000`.

## Admin

The first server start creates the single admin account from:

```env
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_EMAIL=
```

The admin dashboard is available at `/admin`.

## Images

Images are uploaded from the admin device. No image URLs are required.

Supported:
- JPG/JPEG
- PNG
- WEBP

Maximum file size: 5 MB.

Admin can upload/delete:
- Homepage slider images
- Category images
- Individual service images

## Appointment flow

Customer:
Home → Category → Services → Cart → Date/Time → Booking → Booking History

Guest booking requires an email OR phone number.

Registered customers get their profile contact information automatically and can edit it.

Slots:
- 09:00 through 21:00
- Admin can close/open an individual slot for a specific date
- Existing booked slots are unavailable
- Customer/admin cancellation makes a slot available again unless the admin has separately closed it

## Billing and rewards

There is **no online payment gateway** in this project.

Admin finalizes the actual services performed at the salon and generates the final bill.

Every completed appointment counts as one visit.

On the **6th completed appointment**, the customer receives the configured 10% reward discount and the visit counter resets to 0. A reward-history record is created.

Admin can:
- Add additional services at billing time
- Change member quantities
- Cancel appointments
- View customer visit progress
- View reward cycles
- View monthly revenue

## Forgot password

The customer login page has a **Forgot password?** link.

For local development, if SMTP is not configured, the reset link is shown on the forgot-password page so the complete workflow can be tested.

For production, configure SMTP in `.env`:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Do not commit `.env` or secrets.

## Google Login

Local callback:

```text
http://localhost:3000/auth/google/callback
```

When deployed, add your production callback URI to Google Cloud and change `BASE_URL` and `GOOGLE_CALLBACK_URL` in the production environment.

## Production notes

For deployment, use environment variables for all secrets, use HTTPS, configure production Google OAuth redirect URIs, configure SMTP for password resets, and use persistent storage for uploaded images (or object storage) instead of relying on ephemeral local disk.
