import axios from 'axios';

export const deployToZeabur = async (zipBuffer: Buffer, domain: string) => {
    try {
        const apiKey = process.env.ZEABUR_API_KEY;
        if (!apiKey) {
            throw new Error("ZEABUR_API_KEY is missing in environment variables.");
        }

        const formData = new FormData();
        const zipFile = new Blob([zipBuffer], { type: 'application/zip' });
        formData.append('code', zipFile, 'generated-site.zip');
        formData.append('domain', domain);

        const response = await axios.post('https://api.zeabur.com/v1/projects', formData, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error: any) {
        console.error("Zeabur deployment failed:", error.response?.data || error.message);
        throw new Error(`Zeabur Deployment Error: ${error.message}`);
    }
};
