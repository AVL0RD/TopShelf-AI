import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.WAVESPEED_API_KEY;
        if (!apiKey || apiKey === 'YOUR_WAVESPEED_API_KEY_HERE') {
            return NextResponse.json({ error: 'Wavespeed API key not configured. Using fallback images.' }, { status: 401 });
        }

        const { productName } = await req.json();

        const prompt = `Professional e-commerce product photography of ${productName}. Shot perfectly centered on a pure white seamless background. Soft, diffused, high-key studio lighting that eliminates harsh shadows. A very subtle, natural-looking drop shadow grounding the object. Photorealistic, macro lens, sharp edge-to-edge focus, highly detailed, 8k resolution. Clean, premium, and clinical aesthetic.`;

        // Updated to the user's verified working model and endpoint
        const url = `https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                enable_base64_output: false,
                enable_sync_mode: true, // Keep sync for immediate storefront hydration
                output_format: "png",
                prompt: prompt,
                resolution: "1k"
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Wavespeed API Error: ${errText}`);
        }

        const result = await response.json();
        console.log(`Wavespeed Response for ${productName}:`, JSON.stringify(result, null, 2));

        // Broad-spectrum URL extraction
        const findUrl = (obj: any): string | null => {
            if (!obj) return null;
            if (typeof obj === 'string' && (obj.startsWith('http') || obj.startsWith('data:image'))) return obj;

            // Check common priority fields
            const prio = obj.url || obj.imageUrl || obj.image_url || obj.image || (obj.data && obj.data.url) || (obj.results && obj.results[0]?.url);
            if (prio && typeof prio === 'string') return prio;

            // Deep search
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    const found = findUrl(obj[key]);
                    if (found) return found;
                } else if (typeof obj[key] === 'string' && obj[key].startsWith('http') && (obj[key].includes('webp') || obj[key].includes('png') || obj[key].includes('jpg') || obj[key].includes('jpeg') || obj[key].includes('asset') || obj[key].includes('storage'))) {
                    return obj[key];
                }
            }
            return null;
        };

        const imageUrl = findUrl(result);
        if (!imageUrl) {
            console.error("Failed to extract URL from result:", result);
            throw new Error('No image URL found in Wavespeed response');
        }

        return NextResponse.json({ imageUrl });
    } catch (error: any) {
        console.error("Image Generation Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
