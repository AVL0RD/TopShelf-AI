import Papa from 'papaparse';

export interface ProductCSV {
    name: string;
    price: string | number;
    description: string;
    category?: string;
    image?: string;
}

export const parseCSV = (file: File): Promise<ProductCSV[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as ProductCSV[];
                const validData = data.filter(item =>
                    item.name &&
                    item.price &&
                    item.description
                );

                if (validData.length === 0) {
                    reject(new Error("No valid products found. Ensure columns 'name', 'price', and 'description' exist."));
                } else {
                    resolve(validData);
                }
            },
            error: (error: Error) => reject(error)
        });
    });
};
