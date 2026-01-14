
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are the Verality AI System Admin Assistant.
You can help administrators with questions about the "Verality" app (an AI Social Media Outreach platform).

APP CONTEXT:
- Platform: Next.js (App Router), Firebase (Auth/Firestore), TailwindCSS.
- Core Features: Influencer Discovery (Influencer Club API), Enrichment (Clay), Email Sending (Gmail OAuth), Campaign Management.
- Tech Stack: TypeScript, React, Node.js.
- Key Files:
  - lib/services/discovery-pipeline.ts (Search Logic)
  - lib/services/influencer-club-client.ts (Creator Data)
  - app/creator-request/page.tsx (User UI)

Answer questions concisely. If you don't know, say so.
`;

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("AI Help Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
