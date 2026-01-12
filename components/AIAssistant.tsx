
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, PortfolioData } from '../types';

interface MultimodalMessage extends ChatMessage {
  image?: string; // base64 data
}

interface AIAssistantProps {
  portfolioData: PortfolioData;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ portfolioData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MultimodalMessage[]>([
    { role: 'model', text: `Greetings! I'm Muneem's Digital Representative. I have full access to his professional dossier. How can I assist you with his work in Biomedical Engineering or Creative Design today?` }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedPrompts = [
    "Tell me about Medilink X",
    "What are his core BME skills?",
    "Recent achievements?",
    "How can I collaborate?"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  /**
   * IMPORTANT: Strips base64 image strings from the data object to prevent 
   * "Token count exceeds maximum" errors. LLMs don't need raw bytes in text prompts.
   */
  const sanitizeDataForAI = (data: PortfolioData) => {
    return {
      profile: { 
        ...data.profile, 
        profilePic: '[IMAGE_DATA_REMOVED]', 
        coverPhoto: '[IMAGE_DATA_REMOVED]' 
      },
      projects: data.projects.map(p => ({ 
        ...p, 
        logo: p.logo ? '[LOGO_DATA_REMOVED]' : undefined 
      })),
      skills: data.skills,
      timeline: data.timeline.map(t => ({ 
        ...t, 
        logo: t.logo ? '[LOGO_DATA_REMOVED]' : undefined 
      })),
      awards: data.awards
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (textOverride?: string) => {
    const finalInput = textOverride || input;
    if ((!finalInput.trim() && !selectedImage) || isTyping) return;

    const userText = finalInput.trim();
    const userImage = selectedImage;
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userText || (userImage ? "Sent an image for analysis." : ""),
      image: userImage ? `data:${userImage.mimeType};base64,${userImage.data}` : undefined
    }]);
    
    setInput('');
    setSelectedImage(null);
    setGroundingLinks([]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const cleanData = sanitizeDataForAI(portfolioData);
      
      const parts: any[] = [];
      if (userImage) {
        parts.push({
          inlineData: {
            data: userImage.data,
            mimeType: userImage.mimeType
          }
        });
      }
      
      const systemPrompt = `
        You are the "Intelligent Representative" for ${cleanData.profile.fullName}, a high-achieving Biomedical Engineering student and tech innovator.
        
        YOUR KNOWLEDGE BASE (TEXT ONLY):
        - Profile: ${JSON.stringify(cleanData.profile)}
        - Projects: ${JSON.stringify(cleanData.projects)}
        - Skills: ${JSON.stringify(cleanData.skills)}
        - Timeline: ${JSON.stringify(cleanData.timeline)}
        - Awards: ${JSON.stringify(cleanData.awards)}
        
        YOUR PERSONA:
        - Professional, innovative, and slightly technical.
        - You represent Muneem's vision of merging medical science with creative technology.
        - If asked about his contact info, provide his email (${cleanData.profile.email}) or phone (${cleanData.profile.phone}).
        - If an image is sent, analyze it professionally. If it's a medical device, UI mockup, or project screenshot, provide insights based on Muneem's expertise areas.
        
        TOOLS:
        - Use Google Search for general technical questions about BME or trending tech to provide better context.
        
        User Message: ${userText || "Please analyze this image."}
      `;

      parts.push({ text: systemPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          temperature: 0.7,
          tools: [{ googleSearch: {} }]
        }
      });

      const responseText = response.text || "I've processed your request. How else can I help you today?";
      
      // Extract grounding sources if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks
          .filter(c => c.web)
          .map(c => ({ title: c.web?.title || 'Source', uri: c.web?.uri || '' }))
          .filter(l => l.uri);
        setGroundingLinks(links);
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Gemini Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a bit of a sync issue with my core database (likely a payload size or network limit). Could you try a shorter question?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] print:hidden">
      {isOpen ? (
        <div className="glass-card w-[350px] md:w-[450px] h-[650px] flex flex-col rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-700/50 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <i className="fa-solid fa-bolt-lightning text-white text-xl animate-pulse"></i>
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Digital Agent</h3>
                <span className="text-[9px] text-brand-100 flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span> ONLINE • MULTIMODAL
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-10 h-10 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-all flex items-center justify-center"
            >
              <i className="fa-solid fa-chevron-down"></i>
            </button>
          </div>

          {/* Chat Body */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-dark-900/40 custom-scrollbar"
          >
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {m.image && (
                  <div className="max-w-[80%] rounded-2xl overflow-hidden mb-2 border border-slate-700 shadow-2xl">
                    <img src={m.image} alt="User data" className="w-full h-auto" />
                  </div>
                )}
                <div className={`max-w-[90%] p-4 rounded-3xl text-sm leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-tr-none shadow-xl' 
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50 shadow-md backdrop-blur-md'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <i className="fa-solid fa-robot text-[10px] text-brand-400"></i>
                </div>
                <div className="bg-slate-800/50 px-4 py-2.5 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}

            {groundingLinks.length > 0 && !isTyping && (
              <div className="pt-2 animate-in fade-in duration-500">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 px-1">Verified Sources</p>
                <div className="flex flex-wrap gap-2">
                  {groundingLinks.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-dark-900/80 border border-slate-700 px-3 py-1.5 rounded-lg text-brand-400 hover:text-white hover:border-brand-500 transition-all flex items-center gap-2 max-w-[150px] truncate"
                    >
                      <i className="fa-solid fa-link text-[8px]"></i>
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions (Suggested Prompts) */}
          {!isTyping && messages.length < 5 && (
            <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-dark-900/20 border-t border-slate-800/50">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="whitespace-nowrap px-4 py-2 bg-slate-800/50 hover:bg-brand-600/20 border border-slate-700 hover:border-brand-500/50 rounded-full text-[11px] font-bold text-slate-300 transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 bg-dark-900 border-t border-slate-800">
            {selectedImage && (
              <div className="relative inline-block mb-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-2xl">
                  <img 
                    src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-xl hover:scale-110 transition-transform"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg border ${selectedImage ? 'bg-brand-900 border-brand-500 text-brand-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                title="Attach Document or Image"
              >
                <i className="fa-solid fa-plus text-lg"></i>
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Ask Muneem's AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 transition-all placeholder:text-slate-500"
                />
              </div>
              
              <button 
                onClick={() => handleSend()}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/30 disabled:opacity-50 disabled:shadow-none active:scale-90"
              >
                <i className="fa-solid fa-paper-plane text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 bg-brand-600 text-white rounded-3xl shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-brand-500 rounded-3xl animate-ping opacity-20"></div>
          <i className="fa-solid fa-bolt-lightning text-2xl relative z-10 group-hover:rotate-12 transition-transform"></i>
          
          <div className="absolute right-full mr-6 bg-dark-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-[11px] font-black text-white whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none uppercase tracking-[0.2em] shadow-2xl">
            Portfolio Agent
          </div>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
