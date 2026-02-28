import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import { products } from './data/products';
import { CartProvider } from './context/CartContext';

export default function TemplateApp() {
    return (
        <CartProvider>
            <main className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-500">
                <Hero />
                <div id="shop" className="container mx-auto py-20 px-6">
                    <h2 className="text-4xl font-bold mb-10 text-center tracking-tight">Our Collection</h2>
                    <ProductGrid products={products} />
                </div>
                <Footer />
            </main>
        </CartProvider>
    );
}
