import { Product } from '../types';

export default function ProductGrid({ products }: { products: Product[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {products.map(product => (
                <div key={product.id} className="border p-4 rounded-xl shadow-sm hover:shadow-lg transition-transform hover:-translate-y-1">
                    <div className="aspect-square bg-muted rounded-md mb-4 flex items-center justify-center text-muted-foreground">
                        {product.image ? <img src={product.image} alt={product.name} /> : <span>No Image</span>}
                    </div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="font-bold text-lg">${product.price}</span>
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 active:scale-95 transition">Add to Cart</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
