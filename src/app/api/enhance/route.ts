import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        if (!prompt) {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;
        const cohereKey = process.env.COHERE_API_KEY;
        const mistralKey = process.env.MISTRAL_API_KEY;
        const openRouterKey = process.env.OPENROUTER_API_KEY;

        const tryGemini = async () => {
            const ai = new GoogleGenAI({ apiKey: geminiKey as string });
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.7,
                }
            });
            return response.text;
        };

        const tryGroq = async () => {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
                body: JSON.stringify({
                    model: "llama3-70b-8192",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });
            if (!response.ok) throw new Error(`Groq error: ${response.status}`);
            const data = await response.json();
            return data.choices[0].message.content;
        };

        const tryMistral = async () => {
            const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mistralKey}` },
                body: JSON.stringify({
                    model: "mistral-large-latest",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });
            if (!response.ok) throw new Error(`Mistral error: ${response.status}`);
            const data = await response.json();
            return data.choices[0].message.content;
        };

        const tryOpenRouter = async () => {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openRouterKey}` },
                body: JSON.stringify({
                    model: "meta-llama/llama-3-70b-instruct",
                    messages: [{ role: "user", content: prompt + "\n\nRespond with ONLY valid JSON." }],
                    temperature: 0.7
                })
            });
            if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
            const data = await response.json();
            return data.choices[0].message.content;
        };

        const tryCohere = async () => {
            const response = await fetch("https://api.cohere.ai/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cohereKey}` },
                body: JSON.stringify({
                    model: "command-r-plus",
                    message: prompt + "\n\nRespond with ONLY valid JSON.",
                    temperature: 0.7
                })
            });
            if (!response.ok) throw new Error(`Cohere error: ${response.status}`);
            const data = await response.json();
            return data.text;
        };

        const strategies = [
            { name: "Gemini", fn: tryGemini, key: geminiKey },
            { name: "Groq", fn: tryGroq, key: groqKey },
            { name: "Mistral", fn: tryMistral, key: mistralKey },
            { name: "OpenRouter", fn: tryOpenRouter, key: openRouterKey },
            { name: "Cohere", fn: tryCohere, key: cohereKey }
        ];

        let lastError = null;
        for (const strategy of strategies) {
            if (strategy.key) {
                try {
                    console.log(`Attempting AI generation with ${strategy.name}...`);
                    const text = await strategy.fn();
                    if (text) {
                        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        const json = JSON.parse(cleanText);
                        return NextResponse.json(json);
                    }
                } catch (err: any) {
                    console.error(`${strategy.name} failed:`, err.message);
                    lastError = err;
                }
            }
        }

        return NextResponse.json({ error: "All configured AI models failed or none are configured.", details: lastError?.message }, { status: 500 });
    } catch (e: any) {
        return NextResponse.json({ error: "Internal Server Error", details: e.message }, { status: 500 });
    }
}
