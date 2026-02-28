import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY is not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { context, products } = await req.json();

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Missing or empty products list' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });

        const systemInstruction = `
            You are the Lead Architect for TopShelf AI. You have access to a standard E-commerce Boilerplate. 
            Your task is to synthesize a high-aesthetic theme and branding based on the User Context.
            
            CORE DIRECTIVES:
            1. BRANDING: Derive colors from the User Context. Ensure theme.json reflects a design language.
            2. OUTPUT: Return a JSON object mapped to file paths for branding and UI components.
        `.trim();

        const prompt = `
            ${systemInstruction}

            User Context: ${JSON.stringify(context, null, 2)}
            Parsed Products Data (CSV Source): ${JSON.stringify(products, null, 2)}
            
            Return exactly this JSON format (do not include Markdown blocks):
            {
                "files": {
                    "template/styles/theme.json": "JSON configuration for primary, secondary colors and font",
                    "template/components/Footer.tsx": "tsx source code for Footer component with 'Powered by TopShelf AI' and the user's brand name"
                }
            }
        `.trim();

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Robust JSON extraction to prevent "Unexpected token" errors
        const cleanJsonResponse = (text: string) => {
            // Remove markdown code blocks if present
            const jsonMatch = text.match(/```json?\s*([\s\S]*?)\s*```/);
            const content = jsonMatch ? jsonMatch[1] : text;

            // Basic cleanup: remove leading/trailing whitespace
            return content.trim();
        };

        try {
            const sanitizedText = cleanJsonResponse(responseText);
            const payload = JSON.parse(sanitizedText);
            return NextResponse.json(payload);
        } catch (parseError: any) {
            console.error("JSON Parse Error. Raw Response:", responseText);
            // Fallback: If it still fails, try to return a more informative error for the UI
            return NextResponse.json({
                error: "The AI returned malformed data. This usually happens with very large product lists. Try uploading fewer items or check the CSV formatting.",
                raw: responseText.substring(0, 500) + "..."
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
