# Booking management updates

- Admin booking table includes edit, restore, cancel and delete actions for non-completed bookings.
- Completed bookings remain protected from editing/deletion because they are linked to finalized revenue and reward records.
- Editing a cancelled booking restores it to booked status after validating its new date/time and slot availability.
- Customer booking history displays completed final items and reward discount details, and retains cancelled bookings in history.
- Booking submission validates that the selected slot has not passed (India Standard Time, UTC+05:30).

Run `npm install` and configure your own `.env` before starting. The archive intentionally excludes `.env`, `.git`, and `node_modules`.
