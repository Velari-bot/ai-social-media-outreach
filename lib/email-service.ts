
// EMAIL SERVICE REMOVED PER USER REQUEST
// The functions below are stubs to prevent import errors but do not execute any logic.

// import nodemailer from 'nodemailer'; // REMOVED
import { createEvent } from 'ics';
import { BookingDetails } from './types';
// import { google } from 'googleapis'; // REMOVED
// import { db } from './firebase-admin'; // REMOVED

export async function sendBookingEmails(booking: BookingDetails & { start: Date, end: Date, meetLink?: string }) {
    console.log("[Email] Email service is DISABLED. No email sent.");
    return;
}
