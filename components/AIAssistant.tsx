
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, Profile } from '../types';

interface MultimodalMessage extends ChatMessage {
  image?: string; // base64 data
}

interface AIAssistantProps {
  profile: Profile;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MultimodalMessage[]>([
    { role: 'model', text: `Hello! I'm ${profile.name}'s AI assistant. You can now send me images or text! Ask me about ${profile.name}'s work, or show me something to analyze.` }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isTyping) return;

    const userText = input.trim();
    const userImage = selectedImage;
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userText || (userImage ? "Sent an image" : ""),
      image: userImage ? `data:${userImage.mimeType};base64,${userImage.data}` : undefined
    }]);
    
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      // Corrected: Initialize GoogleGenAI with the API_KEY directly from process.env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [];
      if (userImage) {
        parts.push({
          inlineData: {
            data: userImage.data,
            mimeType: userImage.mimeType
          }
        });
      }
      
      parts.push({
        text: `
          You are a professional portfolio assistant for ${profile.fullName}. 
          Context about ${profile.name}:
          - Bio: ${profile.bio}
          - Contact: ${profile.email}, ${profile.phone}
          - Location: ${profile.location}
          - You can analyze images sent by the user. If they send a project screenshot or an medical image, offer professional BME insights.
          
          User Message: ${userText || "Please analyze this image."}
        `
      });

      // Corrected: Updated generateContent call to follow multimodal structure and include thinkingBudget
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          thinkingConfig: { thinkingBudget: 500 },
        }
      });

      // Corrected: Accessing .text property directly (not a method)
      const responseText = response.text || "I've analyzed the request, but I couldn't generate a specific response. How else can I help?";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error processing that. Please try again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="glass-card w-80 md:w-96 h-[550px] flex flex-col rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-brand-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-robot text-white text-xs"></i>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{profile.name}'s Assistant</h3>
                <span className="text-[10px] text-brand-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Multimodal Active
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-brand-100">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/50"
          >
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.image && (
                  <img src={m.image} alt="User upload" className="max-w-[70%] rounded-xl mb-2 border border-slate-700 shadow-lg" />
                )}
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-tr-none shadow-lg' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-dark-900 border-t border-slate-800 space-y-3">
            {selectedImage && (
              <div className="relative inline-block animate-in fade-in zoom-in duration-200">
                <img 
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border-2 border-brand-500"
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg"
                >
                  <i className="fa-solid fa-x"></i>
                </button>
              </div>
            )}
            
            <div className="relative flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${selectedImage ? 'bg-brand-900 text-brand-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Upload image"
              >
                <i className="fa-solid fa-paperclip"></i>
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                />
              </div>
              
              <button 
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50 shrink-0"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition duration-300 group relative"
        >
          <i className="fa-solid fa-message text-xl"></i>
          <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-dark-900"></span>
          <div className="absolute right-full mr-4 bg-dark-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Multimodal Assistant
          </div>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
