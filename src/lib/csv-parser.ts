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
            complete: (results: Papa.ParseResult<any>) => {
                const rawData = results.data as any[];

                const validData: ProductCSV[] = rawData.map(row => {
                    // Flexible mapping for User's specific headers
                    const name = row['Product Name'] || row['name'] || row['Name'] || row['Title'] || row['product'];
                    // Sanitize price: remove currency symbols, commas, etc.
                    let rawPrice = row['Price'] || row['price'] || row['Cost'] || row['Rate'] || '0';
                    const sanitizedPrice = rawPrice.toString().replace(/[^0-9.]/g, '');
                    const numericPrice = parseFloat(sanitizedPrice) || 0;

                    const description = row['Brief Description'] || row['description'] || row['Description'] || row['Brief'] || row['About'];
                    const options = row['Options/Size'] || row['Options'] || row['Size'];
                    const category = row['Category'] || row['category'] || row['Type'];
                    const image = row['Image'] || row['image'] || row['Photo'] || row['URL'];

                    return {
                        name: name?.toString().trim(),
                        price: numericPrice,
                        description: description?.toString().trim(),
                        category: category?.toString().trim() || 'General',
                        image: image?.toString().trim() || '',
                        options: options?.toString().trim()
                    };
                }).filter(item =>
                    item.name &&
                    item.price !== undefined &&
                    item.description
                );

                if (validData.length === 0) {
                    const headers = results.meta.fields?.join(', ') || 'unknown';
                    reject(new Error(`No valid products found. Detected headers: [${headers}]. Please ensure columns for name, price, and description exist.`));
                } else {
                    resolve(validData);
                }
            },
            error: (error: Error) => reject(error)
        });
    });
};
