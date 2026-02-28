export default function Footer() {
    return (
        <footer className="py-12 border-t mt-20 bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-6 text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-10 text-left">
                    <div>
                        <h4 className="font-bold text-xl mb-4">About Us</h4>
                        <p className="text-muted-foreground">Premium experiences, artisanal products, curated with care.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-xl mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition">Shop All</a></li>
                            <li><a href="#" className="hover:text-primary transition">Shipping Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition">Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-xl mb-4">Newsletter</h4>
                        <p className="text-muted-foreground mb-4">Stay updated with our latest releases.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email" className="px-4 py-2 border rounded-md w-full bg-background" />
                            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition">Join</button>
                        </div>
                    </div>
                </div>
                <div className="pt-8 border-t flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Store Name. All rights reserved.</p>
                    <p className="text-xs font-semibold tracking-widest text-primary hover:scale-110 transition cursor-default">Powered by TopShelf AI</p>
                </div>
            </div>
        </footer>
    );
}
