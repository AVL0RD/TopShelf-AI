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
            {
                "actions": [
                    { "type": "set_branding", "payload": { "companyName": "...", "primaryColor": "..." } },
                    { "type": "acknowledge_products", "payload": { "message": "Confirming products..." } },
                    { "type": "chat", "payload": "Certainly, I've updated your palette..." },
                    { "type": "trigger_launch" },
                    { "type": "trigger_deploy" }
                ]
            }

            DEPLOYMENT LOGIC: Zeabur is the hosting cloud. If the user asks for a 'live link', 'deploy', 'publish', or asks 'can I see it on the web', return { "type": "trigger_deploy" }.
            PROACTIVE BRAIN: If the user says something positive after synth is done, suggest Zeabur deployment in the 'chat' action.
            BRAND ANALYSIS: If you see a website crawl in the message, perform a deep analysis of mission/vision/colors and suggest branding.
        `.trim();

        const prompt = `
            ${systemPrompt}
            
            History: ${JSON.stringify(history)}
            User Message: "${message}"
            New Products Data Count: ${products ? products.length : 0} items.
            Current Context: ${JSON.stringify(context)}
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
