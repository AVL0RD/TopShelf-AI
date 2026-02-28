"use client"
import React, { useState, useRef, useEffect } from 'react';
import { parseCSV, ProductCSV } from '@/lib/csv-parser';
import { Upload, Zap, Globe, AlertCircle, CheckCircle, Send, User, Bot, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'file' | 'status';
  fileName?: string;
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState({
    companyName: '',
    primaryColor: '#6366f1',
    secondaryColor: '#ec4899'
  });
  const [status, setStatus] = useState<'idle' | 'parsing' | 'generating' | 'success' | 'error'>('idle');
  const [errorLog, setErrorLog] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to TopShelf AI. I'm your Lead Architect. Ready to synthesize your premium storefront. What's the name of your brand?",
      type: 'text'
    }
  ]);

  const [isChatting, setIsChatting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'file' | 'status' = 'text', fileName?: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(), role, content, type, fileName }]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !file) return;

    const userMsg = inputValue;
    const currentFile = file;
    setInputValue('');
    setFile(null);

    if (userMsg) addMessage('user', userMsg);
    if (currentFile) addMessage('user', `Attached: ${currentFile.name}`, 'file', currentFile.name);

    try {
      setIsChatting(true);

      let currentProducts: any[] = products;
      if (currentFile) {
        currentProducts = await parseCSV(currentFile);
        setProducts(currentProducts);
      }

      // Feature: Firecrawl Content Extraction - Detect URL
      const urlMatch = userMsg.match(/https?:\/\/[^\s]+/);
      let scrapedBrandContent = "";
      if (urlMatch) {
        const url = urlMatch[0];
        addMessage('assistant', `Acknowledged. I'm now crawling ${url} to extract your brand essence and core identity...`, 'status');
        try {
          const crawlRes = await fetch('/api/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          if (crawlRes.ok) {
            const data = await crawlRes.ok ? await crawlRes.json() : null;
            scrapedBrandContent = data?.content || "";
            if (data?.title) addMessage('assistant', `Discovery complete. Found: "${data.title}". Adapting synthesis engine to this brand vibe...`, 'status');
          }
        } catch (crawlErr) {
          console.error("Discovery Engine Failed:", crawlErr);
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scrapedBrandContent ? `[SCALED BRAND DATA extracted from website: ${scrapedBrandContent.substring(0, 3000)}] \n\n User instruction: ${userMsg}` : userMsg,
          history: messages.slice(-5),
          context,
          products: currentProducts
        })
      });

      if (!res.ok) throw new Error("Synthesis Brain Offline...");

      const { actions } = await res.json();
      let updatedContext = context;

      for (const action of actions) {
        switch (action.type) {
          case 'set_branding':
            updatedContext = { ...updatedContext, ...action.payload };
            setContext(updatedContext);
            break;
          case 'chat':
            addMessage('assistant', action.payload);
            break;
          case 'trigger_deploy':
            handleDeploy(updatedContext);
            break;
          case 'trigger_launch':
            handleGenerate(updatedContext, currentProducts);
            break;
        }
      }
    } catch (err: any) {
      addMessage('assistant', `Synthesis Brain Malfunction: ${err.message}`, 'status');
    } finally {
      setIsChatting(false);
    }
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      addMessage('user', `Uploaded ${uploadedFile.name}`, 'file', uploadedFile.name);
    }
  };

  const handleDeploy = async (overrideContext?: any) => {
    const finalContext = overrideContext || context;
    if (!finalContext.companyName) {
      addMessage('assistant', "Deployment failed: Company name is missing.", 'status');
      return;
    }

    try {
      addMessage('assistant', `Initiating Zeabur Cloud Orchestration for ${finalContext.companyName}...`, 'status');
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: finalContext.companyName })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || errData.error || "Deployment failed");
      }

      const data = await res.json();
      addMessage('assistant', `🚀 Deployment Successful! Your premium storefront is now live!`, 'text');
      setStatus('success');
    } catch (err: any) {
      addMessage('assistant', `Deployment Error: ${err.message}`, 'status');
      setStatus('error');
    }
  };

  const handleGenerate = async (overrideContext?: any, overrideProducts?: any[]) => {
    const finalContext = overrideContext || context;
    const finalProducts = overrideProducts || products;

    if (!finalContext.companyName || finalProducts.length === 0) {
      addMessage('assistant', "Synthesis aborted: Missing company name or product data.", 'status');
      return;
    }

    try {
      setStatus('generating');
      addMessage('assistant', "Initiating TopShelf Synthesis Engine...", 'status');

      // 1. Get Branding from AI
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: finalContext, products: finalProducts.slice(0, 3) })
      });

      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();

      // 2. WaveSpeed Image Generation Step (Rate Limited: 5 products / 10s)
      addMessage('assistant', "Synthesizing high-aesthetic product imagery via WaveSpeed AI (Processing in batches of 5)...", 'status');

      const hydratedProducts: any[] = [];
      for (let i = 0; i < finalProducts.length; i += 5) {
        const batch = finalProducts.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(async (p) => {
          if (!p.image || p.image.includes('unsplash') || p.image.includes('placehold.co')) {
            try {
              const imgRes = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName: p.name })
              });
              if (imgRes.ok) {
                const imgData = await imgRes.json();
                console.log(`Generated image for ${p.name}:`, imgData.imageUrl);
                return { ...p, image: imgData.imageUrl };
              }
            } catch (e) {
              console.warn("WaveSpeed failed for product:", p.name, e);
            }
          }
          return p;
        }));

        hydratedProducts.push(...batchResults);
        // Live update the products state batch-by-batch for better UI experience
        setProducts(prev => {
          const newProducts = [...prev];
          for (let j = 0; j < batchResults.length; j++) {
            newProducts[i + j] = batchResults[j];
          }
          return newProducts;
        });

        if (i + 5 < finalProducts.length) {
          addMessage('assistant', `Batch complete. Waiting 10s to respect API limits (Progress: ${i + batch.length}/${finalProducts.length})...`, 'status');
          await new Promise(r => setTimeout(r, 10000));
        }
      }

      // 3. Local Product Hydration: Construct products.ts with generated/real images
      const productsFileContent = `
import { Product } from '../types/product';

export const products: Product[] = ${JSON.stringify(hydratedProducts.map((p, idx) => ({
        id: "prod-" + idx,
        name: p.name,
        price: parseFloat(p.price as any) || 0,
        description: p.description,
        category: p.category || 'Essential',
        image: p.image || 'https://images.unsplash.com/photo-1555529669-2269763671c0?q=80&w=1000&auto=format&fit=crop',
        stock: Math.floor(Math.random() * 45) + 5
      })), null, 2)};
      `.trim();

      const finalPayload = {
        ...payload,
        files: {
          ...payload.files,
          "template/data/products.ts": productsFileContent
        }
      };

      console.log("Synthesis Payload with WaveSpeed Ready:", finalPayload);
      setProducts(hydratedProducts); // Update local state for preview

      await new Promise(r => setTimeout(r, 1500));
      setPreviewUrl("preview-ready");
      setStatus('success');
      addMessage('assistant', `Synthesis Complete. Successfully hydrated ${finalProducts.length} products with WaveSpeed imagery.`, 'status');
    } catch (err: any) {
      setErrorLog(err.message);
      setStatus('error');
      addMessage('assistant', `Synthesis Error: ${err.message}`, 'status');
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl shrink-0 px-8 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-purple-500/20" />
          <span className="text-xl font-bold tracking-tighter">TopShelf AI</span>
        </div>
        <div className="flex gap-4">
          <div className="hidden md:flex items-center px-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-gray-400">
            SYSTEM_STATUS: <span className="text-green-400 ml-1">OPTIMAL</span>
          </div>
          <button className="px-4 py-2 rounded-full border border-white/10 text-sm hover:bg-white/5 transition active:scale-95">Docs</button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: AI Chatbot */}
        <div className="w-full lg:w-[450px] xl:w-[500px] border-r border-white/5 flex flex-col bg-[#050505]">
          <div className="p-6 border-b border-white/5 bg-black/20">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Bot size={20} className="text-purple-400" />
              Synthesis Core
            </h2>
            <p className="text-xs text-gray-500">Communicating with lead_architect v1.0</p>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-white/10 border-white/10' : 'bg-purple-500/20 border-purple-500/20 text-purple-400'}`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`space-y-2`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/10'
                        : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                        }`}>
                        {msg.type === 'file' ? (
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <Paperclip size={14} /> {msg.fileName}
                          </div>
                        ) : msg.content}
                      </div>
                      {msg.type === 'status' && (
                        <div className="flex items-center gap-2 px-2 text-[10px] font-mono py-1 rounded bg-black/40 border border-white/5 text-gray-500 uppercase tracking-widest animate-pulse">
                          [Engine] {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(status === 'generating' || isChatting) && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-black/40 border-t border-white/5">
            <div className="relative group">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask TopShelf AI..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-24 outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <label className="p-2 hover:bg-white/5 rounded-lg cursor-pointer text-gray-500 hover:text-white transition">
                  <Paperclip size={18} />
                  <input type="file" className="hidden" accept=".csv" onChange={onFileUpload} />
                </label>
                <button
                  onClick={handleSend}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition active:scale-90"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-gray-600 text-center uppercase tracking-widest font-mono">
              TopShelf Generator Engine v1.0.0_beta
            </p>
          </div>
        </div>

        {/* Right Column: Preview Sandbox */}
        <div className="flex-1 bg-[#020202] p-8 flex flex-col gap-6 overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold tracking-tight">Preview Canvas</h3>
              <p className="text-xs text-gray-500 font-mono">RENDER_MODE: HYDRATED_IFRAME</p>
            </div>
            <div className="flex gap-3">
              <div className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest">Live</div>
              <div className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] uppercase font-mono text-gray-500">
                localhost:3000/preview
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[40px] shadow-[0_0_100px_rgba(168,85,247,0.1)] overflow-hidden relative border-8 border-black/40">
            {!previewUrl ? (
              <div className="absolute inset-0 bg-[#080808] flex flex-col items-center justify-center p-12 text-center text-white">
                <div className="w-24 h-24 border border-dashed border-white/20 rounded-full flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 border border-purple-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                  <Globe className="text-white/40 group-hover:text-purple-400 transition-colors" size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">ENGINE IDLE</h3>
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                  The Synthesis Engine is waiting for your brand data. Feed the chatbot your CSV and brand context to visualize your storefront.
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col bg-white overflow-hidden text-black animate-in fade-in zoom-in-95 duration-700">
                {/* Simplified Preview of the Template */}
                <div className="p-6 border-b flex justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="font-black text-xl tracking-tighter" style={{ color: context.primaryColor }}>{context.companyName || 'STOREFRONT'}</div>
                  <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] items-center">
                    <span className="text-black border-b-2 border-black pb-1">Home</span>
                    <span className="text-gray-400 hover:text-black transition">Archive</span>
                    <span className="text-gray-400 hover:text-black transition">Info</span>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: context.primaryColor }} />
                      <span>Cart (0)</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#fafafa]">
                  <div className="flex flex-col">
                    <div className="h-[500px] flex items-center justify-center text-center p-12 overflow-hidden relative">
                      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${context.primaryColor}, transparent)` }} />
                      <div className="relative z-10 space-y-6">
                        <h2 className="text-7xl font-black tracking-tighter leading-[0.9]">Elevate Your<br />Lifestyle.</h2>
                        <p className="text-gray-500 uppercase tracking-[0.3em] font-medium text-xs">Curated Selections for {context.companyName}</p>
                        <button className="px-10 py-4 bg-black text-white rounded-full font-bold hover:scale-105 transition active:scale-95 shadow-2xl">Shop The Drop</button>
                      </div>
                    </div>

                    <div className="p-12">
                      <div className="flex justify-between items-end mb-12">
                        <h3 className="text-3xl font-black tracking-tighter uppercase italic">The Collection</h3>
                        <span className="text-xs font-mono text-gray-400">Showing {products.length} Items</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {products.map((item, i) => (
                          <div
                            key={i}
                            className="group space-y-4 cursor-pointer"
                            onClick={() => setSelectedProduct(item)}
                          >
                            <div className="aspect-[4/5] bg-[#eee] rounded-[2rem] shadow-sm border border-black/5 group-hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                              )}
                              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                            </div>
                            <div className="flex justify-between items-start pt-2">
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block" style={{ backgroundColor: `${context.primaryColor}22`, color: context.primaryColor }}>
                                  {item.category || 'Essential'}
                                </div>
                                <h4 className="font-bold text-lg leading-tight tracking-tight uppercase">{item.name}</h4>
                                <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                              </div>
                              <span className="font-black italic text-xl whitespace-nowrap">${(parseFloat(item.price) || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <footer className="mt-20 border-t p-12 flex flex-col items-center gap-8 bg-black text-white">
                      <div className="text-4xl font-black italic tracking-tighter">{context.companyName || 'STOREFRONT'}</div>
                      <div className="flex gap-12 text-[10px] uppercase tracking-widest font-bold opacity-60">
                        <span>Instagram</span>
                        <span>Twitter</span>
                        <span>Space</span>
                      </div>
                      <div className="pt-8 border-t border-white/10 w-full flex flex-col items-center gap-2">
                        <p className="text-[10px] opacity-40 uppercase tracking-widest font-mono">&copy; {new Date().getFullYear()} All Rights Reserved</p>
                        <p className="text-[10px] font-black text-white tracking-[0.4em] uppercase hover:text-purple-400 transition bg-white/5 px-4 py-2 rounded-full">Powered by TopShelf AI</p>
                      </div>
                    </footer>
                  </div>
                </div>

                {/* Checkout/Payment Overlay */}
                <AnimatePresence>
                  {selectedProduct && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-8"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
                      >
                        <div className="p-8 border-b flex justify-between items-center">
                          <h4 className="text-xl font-black uppercase italic tracking-tighter">SECURE_CHECKOUT</h4>
                          <button
                            onClick={() => setSelectedProduct(null)}
                            className="bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition"
                          >
                            Close
                          </button>
                        </div>
                        <div className="p-8 space-y-6">
                          <div className="flex gap-6 items-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                              {selectedProduct.image && <img src={selectedProduct.image} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <h5 className="font-bold text-lg uppercase tracking-tight">{selectedProduct.name}</h5>
                              <p className="text-2xl font-black text-purple-600">${(parseFloat(selectedProduct.price) || 0).toFixed(2)}</p>
                              {selectedProduct.options && <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Size/Options: {selectedProduct.options}</p>}
                            </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-dashed">
                            <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                              <span>Subtotal</span>
                              <span>${(parseFloat(selectedProduct.price) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold uppercase tracking-widest opacity-40">
                              <span>Shipping</span>
                              <span>$0.00</span>
                            </div>
                            <div className="flex justify-between text-xl font-black uppercase italic tracking-tighter pt-4 border-t">
                              <span>Total</span>
                              <span style={{ color: context.primaryColor }}>${(parseFloat(selectedProduct.price) || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          <button
                            className="w-full py-4 bg-black text-white rounded-full font-black uppercase tracking-widest hover:bg-gray-900 transition active:scale-[0.98] shadow-xl flex items-center justify-center gap-2"
                            onClick={() => {
                              alert("Checkout simulated! Proceeding to Payment Gateway...");
                              setSelectedProduct(null);
                            }}
                          >
                            <Zap size={14} className="text-yellow-400" />
                            PAY_NOW
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

