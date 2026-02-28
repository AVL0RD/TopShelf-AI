import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

        const genAI = new GoogleGenerativeAI(apiKey);
        const { message, history, context, products } = await req.json();

        // Using gemini-3-flash-preview for the low-latency orchestration
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPrompt = `
            You are the Brain of TopShelf AI. You orchestrate the synthesis process.
            You receive a User Message, Conversation History, Current Brand Context, and Parsed Product Data.
            
            YOUR TOOLS (Actions to return in JSON):
            1. set_branding: Update companyName, primaryColor, or secondaryColor.
            2. acknowledge_products: Confirm you've seen the products (if provided).
            3. trigger_launch: If the user wants to "launch", "generate", or "build" the store.
            4. chat: A polite, luxury-toned response to the user.
            
            Current Context: ${JSON.stringify(context)}
            Products Available: ${products ? products.length : 0} items.
            
            Return a JSON object:
            {
                "actions": [
                    { "type": "set_branding", "payload": { "companyName": "...", "primaryColor": "..." } },
                    { "type": "chat", "payload": "Certainly, I've updated your palette..." },
                    { "type": "trigger_launch" }
                ]
            }
        `;

        const prompt = `
            ${systemPrompt}
            
            History: ${JSON.stringify(history)}
            User Message: "${message}"
            New Products Data Count: ${products ? products.length : 0}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean markdown if present
        const jsonMatch = responseText.match(/```json?\s*([\s\S]*?)\s*```/);
        const cleaned = jsonMatch ? jsonMatch[1] : responseText;

        return NextResponse.json(JSON.parse(cleaned.trim()));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
