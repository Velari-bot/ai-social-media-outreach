# Clay Enrichment Setup Guide (Callback Version)

You have successfully set up the **Input** (Webhook). Now you need to set up the **Output** (Callback) so Clay can send the emails back to your app.

## What we are doing
We are telling Clay: "When you find an email, POST it to this URL."

## Step 1: Create the "Callback" Column

1.  Open your **"Verality Enrichment"** table in Clay.
2.  Click **"Add Column"**.
3.  Search for **"HTTP API"** (specifically the one for *sending* requests/enriching via HTTP).
    *   *Note: This is different from the Import one you used earlier.*
    *   It might be called "Enrich Data" > "HTTP API".

## Step 2: Configure the Callback

Fill in these details exactly:

1.  **Method**: `POST`
2.  **Endpoint URL**: 
    *   If you are testing **Locally**: You cannot use `localhost`. You need a tunnel (like ngrok) or just manually export for now.
    *   If you are **Deployed** (verality-app.com): Use `https://verality-app.com/api/webhooks/clay`
    *   *If you don't have a live URL yet, skip this step and manually export data for now.*
3.  **Body**: Select "JSON" and paste this structure:
    ```json
    {
      "verality_id": "/",
      "email": "/",
      "status": "success",
      "clay_row_id": "/"
    }
    ```
    *   **CRITICAL**: You need to "map" the values.
    *   For `verality_id`: Click the `/` and select the **verality_id** column (from your input).
    *   For `email`: Click the `/` and select the **Work Email** column (from the "Find Work Email" enrichment result).
    *   For `clay_row_id`: Select the generic Row ID if available.

4.  **Run Settings**:
    *   Condition: "Run only if `Work Email` is not empty".
    *   Auto-run: **Enabled**.

## Step 3: Test It

1.  Add a row manually to your table (e.g. your own LinkedIn/YouTube).
2.  Wait for the "Find Work Email" to finish.
3.  Wait for the "HTTP API" column to run.
4.  Check your App's database (or logs) to see if the email appeared.

---

## IMPORTANT NOTE ON LOCALHOST
Since Clay is in the cloud, it cannot see your computer's `localhost`.
*   To test the full loop, you must deploy your app to Vercel first.
*   Once deployed, the `/api/webhooks/clay` route will be live and ready to receive data.
