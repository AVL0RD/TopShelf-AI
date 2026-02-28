import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.warn("GOOGLE_API_KEY not found in environment variables. Gemini calls will fail.");
        }

        const { context, products } = await req.json();

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Missing or empty products list' }, { status: 400 });
        }

        const systemInstruction = `
            You are a specialized code-transformer. You have access to a standard E-commerce Boilerplate. 
            Your task is to personalize this boilerplate using the provided CSV data. 
            Do not change the core architecture. Only update the data layer and style configurations.
        `.trim();

        const prompt = `
            User Context: ${JSON.stringify(context)}
            Parsed Products: ${JSON.stringify(products)}
            
            Return a JSON object mapped to file paths, including:
            - "template/data/products.ts": with the product data.
            - "template/styles/theme.json": with brand colors and fonts derived from context.
            - "template/components/Footer.tsx": with the personalized footer (must include 'Powered by TopShelf AI').
        `.trim();

        // Gemini API integration would go here. For now returning a mock payload.
        const mockPayload = {
            files: {
                "template/data/products.ts": `export const products = ${JSON.stringify(products, null, 2)};`,
                "template/styles/theme.json": JSON.stringify({
                    primary: context.primaryColor || "#000000",
                    secondary: context.secondaryColor || "#FFFFFF",
                    font: "Inter"
                }, null, 2),
                "template/components/Footer.tsx": `
                    export default function Footer() {
                        return (
                            <footer className="py-6 text-center border-t">
                                <p>&copy; {new Date().getFullYear()} ${context.companyName}. All rights reserved.</p>
                                <p className="text-xs text-muted-foreground mt-2">Powered by TopShelf AI</p>
                            </footer>
                        );
                    }
                `.trim()
            }
        };

        return NextResponse.json(mockPayload);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
