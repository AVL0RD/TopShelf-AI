export default function Hero() {
    return (
        <section className="relative h-[60vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse duration-10000" />
            <div className="z-10 p-6 max-w-2xl bg-background/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6">Elevate Your Lifestyle</h1>
                <p className="text-xl text-muted-foreground mb-8">Premium selections, curated for your unique taste.</p>
                <div className="flex gap-4 justify-center">
                    <button className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:shadow-xl hover:-translate-y-1 transition active:scale-95">Shop Now</button>
                    <button className="px-8 py-3 bg-secondary text-secondary-foreground font-bold rounded-full hover:shadow-xl hover:-translate-y-1 transition active:scale-95">Discover More</button>
                </div>
            </div>
        </section>
    );
}
