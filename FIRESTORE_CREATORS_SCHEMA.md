# Firestore Creators Collection Schema

This document defines the schema for the `creators` collection in Firestore.
This schema is critical for mapping Clay data back to Firestore.

## Schema Definition

Each creator document in the `creators` collection must adhere to the following structure:

```typescript
interface FirestoreCreator {
  verality_id: string; // REQUIRED (primary key) - This is the Firestore Document ID.
  full_name: string;
  company: string;
  title: string;
  linkedin_url?: string;
  email?: string;        // Initially empty, populated by Clay enrichment
  email_status?: string; // Optional status of the email
}
```

## Critical Notes

1.  **verality_id**: This field is mandatory and serves as the Primary Key. It MUST match the Firestore Document ID.
2.  **Clay Integration**: The `verality_id` is used to map enriched data from Clay back to the correct Firestore document.
3.  **Enrichment**: The `email` field is initially empty and will be populated via webhooks or enrichment processes.

## Implementation

The TypeScript interface `FirestoreCreator` has been added to `lib/types.ts`.
Any code interacting with the `creators` collection should respect this schema.
