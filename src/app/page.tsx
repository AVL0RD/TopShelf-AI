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
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to TopShelf AI. I'm your Lead Architect. Ready to synthesize your premium storefront. What's the name of your brand?",
      type: 'text'
    }
  ]);

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
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    addMessage('user', userMsg);

    // Basic logic to simulate "intelligence" without a backend yet
    setTimeout(() => {
      if (!context.companyName) {
        setContext(prev => ({ ...prev, companyName: userMsg }));
        addMessage('assistant', `Acknowledged. **${userMsg}** sounds like a powerhouse brand. Now, please upload your product CSV (name, price, description) or drag it here.`);
      } else if (userMsg.toLowerCase().includes('color')) {
        addMessage('assistant', "I'll update the style configurations. What specific hex codes are we looking at?");
      } else if (userMsg.toLowerCase().includes('generate') || userMsg.toLowerCase().includes('launch')) {
        if (!file) {
          addMessage('assistant', "I need the product data first. Please attach your CSV.");
        } else {
          handleGenerate();
        }
      } else {
        addMessage('assistant', "I'm processing that. You can also upload your CSV or tell me to 'Launch Storefront' when ready.");
      }
    }, 600);
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      addMessage('user', `Uploaded ${uploadedFile.name}`, 'file', uploadedFile.name);
      addMessage('assistant', "Product data received and validated. We are ready for synthesis. Should I launch the storefront now?");
    }
  };

  const handleGenerate = async () => {
    if (!file || !context.companyName) {
      addMessage('assistant', "Synthesis aborted: Missing company name or product data.", 'status');
      return;
    }

    try {
      setStatus('generating');
      addMessage('assistant', `Initiating TopShelf Synthesis Engine using GOOGLE_API_KEY...`, 'status');

      const products = await parseCSV(file);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, products })
      });

      if (!res.ok) throw new Error(await res.text());

      await new Promise(r => setTimeout(r, 1500)); // Simulating effort
      setPreviewUrl("preview-ready");
      setStatus('success');
      addMessage('assistant', "Synthesis Complete. Your storefront is now live in the sandbox.", 'status');
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
            {status === 'generating' && (
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
                        <span className="text-xs font-mono text-gray-400">Showing 3 Items</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="group space-y-4 cursor-pointer">
                            <div className="aspect-[4/5] bg-[#eee] rounded-[2rem] shadow-sm border border-black/5 group-hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                            </div>
                            <div className="flex justify-between items-start pt-2">
                              <div className="space-y-1">
                                <div className="h-4 w-12 rounded" style={{ backgroundColor: `${context.primaryColor}22`, color: context.primaryColor }} />
                                <h4 className="font-bold text-lg leading-tight tracking-tight uppercase">Premium SKU_{i}</h4>
                                <p className="text-sm text-gray-400">Refined materiality and form.</p>
                              </div>
                              <span className="font-black italic text-xl">$149.00</span>
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

