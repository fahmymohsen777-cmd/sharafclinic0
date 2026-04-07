'use strict';

const db = require('../db'); // Assume we have a db module to interact with our database

/**
 * Creates a booking for a specified time slot.
 * Uses database-level locking to prevent race conditions.
 *
 * @param {String} userId - The ID of the user making the booking.
 * @param {Date} timeSlot - The time slot to be booked.
 * @returns {Promise<Object>} - The created booking object.
 */
async function createBooking(userId, timeSlot) {
    const client = await db.getClient(); // Get a database client
    try {
        await client.query('BEGIN'); // Start a transaction

        // Lock the time slot in the database to prevent race conditions
        const lockQuery = 'SELECT * FROM bookings WHERE time_slot = $1 FOR UPDATE';
        const existingBooking = await client.query(lockQuery, [timeSlot]);

        if (existingBooking.rows.length) {
            throw new Error('This time slot is already booked.');
        }

        // Now we can safely insert the new booking
        const insertQuery = 'INSERT INTO bookings (user_id, time_slot) VALUES ($1, $2) RETURNING *';
        const res = await client.query(insertQuery, [userId, timeSlot]);
        await client.query('COMMIT'); // Commit the transaction
        return res.rows[0]; // Return the created booking
    } catch (err) {
        await client.query('ROLLBACK'); // Rollback transaction in case of error
        throw err; // Rethrow the error
    } finally {
        client.release(); // Release the database client
    }
}

module.exports = { createBooking };