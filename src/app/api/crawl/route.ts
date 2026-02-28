import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'FIRECRAWL_API_KEY is not configured.' }, { status: 500 });
        }

        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: 'No URL provided.' }, { status: 400 });
        }

        const app = new FirecrawlApp({ apiKey });

        // Scrape a website using the SDK:
        const scrapeResponse = await app.scrape(url, {
            formats: ['markdown'],
            onlyMainContent: true
        });

        if (!scrapeResponse) {
            throw new Error('Firecrawl Error: No response received.');
        }

        // Return cleaned markdown content for the model to parse
        return NextResponse.json({
            content: (scrapeResponse as any).markdown || "No content extracted.",
            title: (scrapeResponse as any).metadata?.title || ""
        });

    } catch (error: any) {
        console.error("Scraping Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
