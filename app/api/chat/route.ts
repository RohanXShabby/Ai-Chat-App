import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY, // store in .env.local
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000", // or your deployed site
        "X-Title": "My Chat App",
    },
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const completion = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: messages },
            ],
            max_tokens: 1000,
        });

        return NextResponse.json({
            content: completion.choices[0].message.content,
        });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error("Error generating chat completion:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
