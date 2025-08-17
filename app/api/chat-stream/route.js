import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://your-site-url.com",
        "X-Title": "My Portfolio Chatbot",           
    },
});

export async function POST(req) {
    try {
        const { messages } = await req.json();

        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o", // or another OpenRouter model
            messages,
            max_tokens: 500,
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (error) {
        console.error("Streaming error:", error);
        return new Response("Error while streaming", { status: 500 });
    }
}
