export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    stock: number;
}

export interface StoreContext {
    name: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
}
