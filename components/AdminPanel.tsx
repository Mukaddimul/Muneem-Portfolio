
import React, { useState, useRef, useEffect } from 'react';
import { PortfolioData, Project, TimelineItem, Skill, Award, NewsPost, ContactInquiry } from '../types';
import { supabase } from '../supabaseClient';

interface AdminPanelProps {
  data: PortfolioData;
  onSave: (newData: PortfolioData) => void;
  onLogout: () => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ data, onSave, onLogout, onClose }) => {
  const [editData, setEditData] = useState<PortfolioData>(data);
  const [activeSection, setActiveSection] = useState<string>('general');
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiryError, setInquiryError] = useState<{message: string, isMissingTable: boolean} | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const sections = [
    { id: 'general', label: 'General Info', icon: 'fa-id-card' },
    { id: 'skills', label: 'Skills', icon: 'fa-screwdriver-wrench' },
    { id: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
    { id: 'timeline', label: 'Experience', icon: 'fa-timeline' },
    { id: 'awards', label: 'Awards', icon: 'fa-medal' },
    { id: 'news', label: 'News Desk', icon: 'fa-newspaper' },
    { id: 'messages', label: 'Visitor Entries', icon: 'fa-inbox' },
  ];

  // Utility to compress images to keep payload size small
  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64);
    });
  };

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    fetchInquiries();
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    setInquiryError(null);
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        const isMissing = error.code === '42P01' || 
                          error.message?.toLowerCase().includes('schema cache') || 
                          error.message?.toLowerCase().includes('not found');
        throw { 
          message: error.message || "Failed to fetch data from Supabase", 
          isMissingTable: isMissing 
        };
      }
      setInquiries(data || []);
    } catch (err: any) {
      const errorMessage = (err && typeof err.message === 'string') 
        ? err.message 
        : (typeof err === 'string' ? err : JSON.stringify(err));
      
      console.error("Failed to fetch entries:", errorMessage);
      setInquiryError({
        message: errorMessage,
        isMissingTable: !!(err && err.isMissingTable)
      });
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  const deleteInquiry = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setInquiries(inquiries.filter(i => i.id !== id));
    } catch (err: any) {
      alert("Failed to delete entry: " + (err.message || JSON.stringify(err)));
    }
  };

  const updateInquiryStatus = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      setInquiries(inquiries.map(i => i.id === id ? { ...i, status: status as any } : i));
    } catch (err: any) {
      console.error("Update failed:", err.message || JSON.stringify(err));
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`admin-section-${id}`);
    if (element && contentRef.current) {
      const isMobile = window.innerWidth < 768;
      const offset = isMobile ? 120 : 0; 
      const topPos = element.offsetTop - offset;
      contentRef.current.scrollTo({ top: topPos, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const scrollPosition = contentRef.current.scrollTop + 150;
      for (const section of sections) {
        const element = document.getElementById(`admin-section-${section.id}`);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
          }
        }
      }
    };
    const currentContentRef = contentRef.current;
    if (currentContentRef) {
      currentContentRef.addEventListener('scroll', handleScroll);
    }
    return () => currentContentRef?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData({ ...editData, profile: { ...editData.profile, [name]: value } });
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 500, 500);
        setEditData({ ...editData, profile: { ...editData.profile, profilePic: compressed } });
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setEditData({ ...editData, projects: editData.projects.map(p => p.id === id ? { ...p, [field]: value } : p) });
  };

  const handleProjectLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 400);
        updateProject(id, 'logo', compressed);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateNewsPost = (id: string, field: keyof NewsPost, value: any) => {
    setEditData({ ...editData, news: editData.news.map(n => n.id === id ? { ...n, [field]: value } : n) });
  };

  const handleNewsImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 1200, 800, 0.6);
        updateNewsPost(id, 'image', compressed);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProject = () => {
    const newProject: Project = { id: Date.now().toString(), title: 'New Project', category: 'General', description: 'Description here...', icon: 'fa-rocket', color: 'from-blue-600', achievements: [] };
    setEditData({ ...editData, projects: [...editData.projects, newProject] });
  };
  const deleteProject = (id: string) => {
    setEditData({ ...editData, projects: editData.projects.filter(p => p.id !== id) });
  };

  const addTimelineItem = () => {
    const newItem: TimelineItem = { id: Date.now().toString(), date: 'Year', title: 'New Milestone', subtitle: 'Organization', type: 'achievement', icon: 'fa-star', description: 'Summary...', details: ['Detail'] };
    setEditData({ ...editData, timeline: [...editData.timeline, newItem] });
  };
  const updateTimelineItem = (id: string, field: keyof TimelineItem, value: any) => {
    setEditData({ ...editData, timeline: editData.timeline.map(t => t.id === id ? { ...t, [field]: value } : t) });
  };

  const handleTimelineLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 300, 300);
        updateTimelineItem(id, 'logo', compressed);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteTimelineItem = (id: string) => {
    setEditData({ ...editData, timeline: editData.timeline.filter(t => t.id !== id) });
  };

  const addSkill = () => {
    const newSkill: Skill = { id: Date.now().toString(), title: 'New Category', icon: 'fa-lightbulb', color: 'border-brand-500', items: ['Skill 1'] };
    setEditData({ ...editData, skills: [...editData.skills, newSkill] });
  };
  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setEditData({ ...editData, skills: editData.skills.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };
  const deleteSkill = (id: string) => {
    setEditData({ ...editData, skills: editData.skills.filter(s => s.id !== id) });
  };
  const addSkillItem = (skillId: string) => {
    setEditData({ ...editData, skills: editData.skills.map(s => s.id === skillId ? { ...s, items: [...s.items, 'New Skill'] } : s) });
  };
  const updateSkillItem = (skillId: string, index: number, value: string) => {
    setEditData({ ...editData, skills: editData.skills.map(s => { if (s.id === skillId) { const items = [...s.items]; items[index] = value; return { ...s, items }; } return s; }) });
  };
  const deleteSkillItem = (skillId: string, index: number) => {
    setEditData({ ...editData, skills: editData.skills.map(s => { if (s.id === skillId) { return { ...s, items: s.items.filter((_, i) => i !== index) }; } return s; }) });
  };

  const addAward = () => {
    const newAward: Award = { id: Date.now().toString(), title: 'New Award', detail: 'Details...', icon: 'fa-trophy' };
    setEditData({ ...editData, awards: [...(editData.awards || []), newAward] });
  };
  const updateAward = (id: string, field: keyof Award, value: string) => {
    setEditData({ ...editData, awards: editData.awards.map(a => a.id === id ? { ...a, [field]: value } : a) });
  };
  const deleteAward = (id: string) => {
    setEditData({ ...editData, awards: editData.awards.filter(a => a.id !== id) });
  };

  const addNewsPost = () => {
    const newPost: NewsPost = { id: Date.now().toString(), title: 'New Headline', content: 'Story...', date: new Date().toLocaleDateString(), author: 'Admin', likes: 0, comments: [] };
    setEditData({ ...editData, news: [newPost, ...(editData.news || [])] });
  };
  const deleteNewsPost = (id: string) => {
    setEditData({ ...editData, news: editData.news.filter(n => n.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-dark-900/98 backdrop-blur-3xl flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300">
      
      {isProcessingImage && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold text-xs uppercase tracking-widest">Optimizing Asset...</p>
          </div>
        </div>
      )}

      <aside className="w-full md:w-64 lg:w-72 bg-dark-800/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-auto md:h-full z-20 shadow-2xl shrink-0">
        <div className="p-4 md:p-6 border-b border-slate-700/50 bg-dark-900/50 flex items-center justify-between md:block shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
              <i className="fa-solid fa-user-gear text-sm md:text-base"></i>
            </div>
            <div>
              <h2 className="text-white font-black tracking-tighter text-sm md:text-lg leading-none uppercase">Admin Desk</h2>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-2"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>

        <nav className="flex-1 overflow-x-auto md:overflow-y-auto p-3 md:p-6 flex flex-row md:flex-col gap-1.5 md:gap-2 no-scrollbar scrollbar-hide">
          {sections.map((section) => (
            <button 
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                activeSection === section.id 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <i className={`fa-solid ${section.icon} w-4 md:w-5 text-center text-xs md:text-sm`}></i>
              <span className="font-bold text-[11px] md:text-sm tracking-tight">{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 md:p-6 border-t border-slate-700/50 bg-dark-900/50 space-y-2 md:space-y-3 shrink-0">
          <button onClick={() => onSave(editData)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 md:gap-3">
            <i className="fa-solid fa-floppy-disk"></i> Save Changes
          </button>
          <div className="flex gap-2">
            <button onClick={onLogout} className="flex-1 md:w-full h-10 md:h-12 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center border border-red-500/20 py-2.5 md:py-0">
              <i className="fa-solid fa-power-off text-xs md:text-sm"></i>
              <span className="md:hidden ml-2 font-bold text-[10px] uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth h-full bg-dark-900/30">
        <div className="max-w-5xl mx-auto p-5 md:p-12 lg:p-16 space-y-24 md:space-y-32 pb-32">
          
          <section id="admin-section-general" className="scroll-mt-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
              <div className="w-12 h-12 rounded-full bg-brand-900/30 flex items-center justify-center text-brand-400"><i className="fa-solid fa-id-card text-xl"></i></div>
              <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">General Info</h3>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Avatar</label>
                  <div className="relative group cursor-pointer w-32 h-32" onClick={() => profilePicInputRef.current?.click()}>
                    <img src={editData.profile.profilePic} className="w-full h-full object-cover rounded-[2rem] border-4 border-brand-500/30 p-1 bg-dark-800" />
                    <input type="file" ref={profilePicInputRef} onChange={handleProfilePicUpload} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="fullName" value={editData.profile.fullName} onChange={handleProfileChange} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" placeholder="Full Name" />
                <input name="name" value={editData.profile.name} onChange={handleProfileChange} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none" placeholder="Short Name" />
                <textarea name="bio" rows={3} value={editData.profile.bio} onChange={handleProfileChange} className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:border-brand-500 outline-none resize-none" placeholder="Bio" />
              </div>
            </div>
          </section>

          <section id="admin-section-skills" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
              <h3 className="text-xl md:text-3xl font-black text-white uppercase">Skills</h3>
              <button onClick={addSkill} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase"><i className="fa-solid fa-plus mr-2"></i> Add</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {editData.skills.map((s) => (
                <div key={s.id} className="glass-card p-6 rounded-[2rem] border border-slate-700/50 space-y-4 relative group">
                  <button onClick={() => deleteSkill(s.id)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                  <input value={s.title} onChange={(e) => updateSkill(s.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-white font-black uppercase" />
                  {s.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={item} onChange={(e) => updateSkillItem(s.id, idx, e.target.value)} className="flex-1 bg-dark-900/30 border border-slate-800 rounded-xl p-2 text-xs text-slate-300" />
                      <button onClick={() => deleteSkillItem(s.id, idx)} className="text-slate-600"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                  ))}
                  <button onClick={() => addSkillItem(s.id)} className="text-[10px] text-brand-400 font-black uppercase">+ New Competency</button>
                </div>
              ))}
            </div>
          </section>

          <section id="admin-section-projects" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
              <h3 className="text-xl md:text-3xl font-black text-white uppercase">Projects</h3>
              <button onClick={addProject} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase">+ Project</button>
            </div>
            {editData.projects.map((p) => (
              <div key={p.id} className="glass-card p-8 rounded-[2.5rem] border border-slate-700/50 mb-8 relative group">
                <button onClick={() => deleteProject(p.id)} className="absolute top-6 right-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Project Logo</label>
                    <div className="flex items-center gap-6">
                      <div className="relative group cursor-pointer w-24 h-24 bg-dark-900/50 rounded-2xl border-2 border-slate-700/50 flex items-center justify-center overflow-hidden transition-all hover:border-brand-500/50">
                        {p.logo ? (
                          <img src={p.logo} className="w-full h-full object-contain p-2" />
                        ) : (
                          <i className={`fa-solid ${p.icon} text-3xl text-slate-600`}></i>
                        )}
                        <div 
                          onClick={() => document.getElementById(`project-logo-input-${p.id}`)?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <i className="fa-solid fa-camera text-white"></i>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => document.getElementById(`project-logo-input-${p.id}`)?.click()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] text-white font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          Change Logo
                        </button>
                        {p.logo && (
                          <button 
                            onClick={() => updateProject(p.id, 'logo', '')}
                            className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-[10px] text-red-500 hover:text-white font-black uppercase tracking-widest rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input 
                        type="file" 
                        id={`project-logo-input-${p.id}`} 
                        onChange={(e) => handleProjectLogoUpload(p.id, e)} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Identification</label>
                    <input value={p.title} onChange={(e) => updateProject(p.id, 'title', e.target.value)} className="bg-dark-900/50 border border-slate-700 rounded-xl p-4 text-white font-bold w-full focus:border-brand-500 outline-none" placeholder="Project Title" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Categorization</label>
                    <input value={p.category} onChange={(e) => updateProject(p.id, 'category', e.target.value)} className="bg-dark-900/50 border border-slate-700 rounded-xl p-4 text-white w-full focus:border-brand-500 outline-none" placeholder="Category" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Site Link (Optional)</label>
                    <input value={p.link || ''} onChange={(e) => updateProject(p.id, 'link', e.target.value)} className="bg-dark-900/50 border border-slate-700 rounded-xl p-4 text-brand-400 w-full focus:border-brand-500 outline-none" placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Project Overview</label>
                    <textarea value={p.description} onChange={(e) => updateProject(p.id, 'description', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-4 text-white resize-none focus:border-brand-500 outline-none" rows={3} placeholder="Describe the mission and impact..." />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section id="admin-section-timeline" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
              <h3 className="text-xl md:text-3xl font-black text-white uppercase">Experience</h3>
              <button onClick={addTimelineItem} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase">+ Milestone</button>
            </div>
            {editData.timeline.map((t) => (
              <div key={t.id} className="glass-card p-8 rounded-[2.5rem] border border-slate-700/50 mb-8 relative group">
                <button onClick={() => deleteTimelineItem(t.id)} className="absolute top-6 right-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                  {/* Logo Upload for Timeline Item */}
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Org/Institute Logo</label>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group cursor-pointer w-20 h-20 bg-dark-900/50 rounded-2xl border-2 border-slate-700/50 flex items-center justify-center overflow-hidden transition-all hover:border-brand-500/50">
                        {t.logo ? (
                          <img src={t.logo} className="w-full h-full object-contain p-2" />
                        ) : (
                          <i className={`fa-solid ${t.icon} text-2xl text-slate-600`}></i>
                        )}
                        <div 
                          onClick={() => document.getElementById(`timeline-logo-input-${t.id}`)?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <i className="fa-solid fa-camera text-white text-xs"></i>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        id={`timeline-logo-input-${t.id}`} 
                        onChange={(e) => handleTimelineLogoUpload(t.id, e)} 
                        className="hidden" 
                        accept="image/*" 
                      />
                      {t.logo && (
                        <button 
                          onClick={() => updateTimelineItem(t.id, 'logo', '')}
                          className="text-[9px] text-red-500 font-bold uppercase tracking-widest hover:underline"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-2">Duration</label>
                        <input value={t.date} onChange={(e) => updateTimelineItem(t.id, 'date', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-white text-xs" placeholder="e.g. 2024 - Present" />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block mb-2">Category</label>
                        <select value={t.type} onChange={(e) => updateTimelineItem(t.id, 'type', e.target.value as any)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none">
                          <option value="education">Education</option>
                          <option value="professional">Professional</option>
                          <option value="leadership">Leadership</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="creative">Creative</option>
                          <option value="achievement">Achievement</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Identification</label>
                      <input value={t.title} onChange={(e) => updateTimelineItem(t.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-white text-xs" placeholder="Position or Degree" />
                      <input value={t.subtitle} onChange={(e) => updateTimelineItem(t.id, 'subtitle', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-brand-400 text-xs" placeholder="Institution or Organization" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section id="admin-section-awards" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
              <h3 className="text-xl md:text-3xl font-black text-white uppercase">Awards</h3>
              <button onClick={addAward} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase">+ Award</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editData.awards.map((a) => (
                <div key={a.id} className="glass-card p-6 rounded-[2rem] border border-slate-700/50 relative group">
                  <button onClick={() => deleteAward(a.id)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                  <input value={a.title} onChange={(e) => updateAward(a.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-white font-bold mb-2" />
                  <input value={a.detail} onChange={(e) => updateAward(a.id, 'detail', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-brand-400 text-xs" />
                </div>
              ))}
            </div>
          </section>

          <section id="admin-section-news" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
              <h3 className="text-xl md:text-3xl font-black text-white uppercase">News Desk</h3>
              <button onClick={addNewsPost} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase">+ Post</button>
            </div>
            {editData.news.map((n) => (
              <div key={n.id} className="glass-card p-8 rounded-[2rem] border border-slate-700/50 mb-8 relative group">
                <button onClick={() => deleteNewsPost(n.id)} className="absolute top-6 right-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash"></i></button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Cover Image</label>
                    <div className="flex items-center gap-6">
                      <div className="relative group cursor-pointer w-full h-32 bg-dark-900/50 rounded-2xl border-2 border-slate-700/50 flex items-center justify-center overflow-hidden transition-all hover:border-brand-500/50">
                        {n.image ? (
                          <img src={n.image} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fa-solid fa-newspaper text-3xl text-slate-600"></i>
                        )}
                        <div 
                          onClick={() => document.getElementById(`news-image-input-${n.id}`)?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <i className="fa-solid fa-camera text-white"></i>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button 
                          onClick={() => document.getElementById(`news-image-input-${n.id}`)?.click()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] text-white font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          Upload
                        </button>
                        {n.image && (
                          <button 
                            onClick={() => updateNewsPost(n.id, 'image', '')}
                            className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-[10px] text-red-500 hover:text-white font-black uppercase tracking-widest rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input 
                        type="file" 
                        id={`news-image-input-${n.id}`} 
                        onChange={(e) => handleNewsImageUpload(n.id, e)} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Headline</label>
                    <input value={n.title} onChange={(e) => updateNewsPost(n.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-4 text-white font-black uppercase focus:border-brand-500 outline-none" placeholder="News Title" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Story Content</label>
                  <textarea value={n.content} onChange={(e) => updateNewsPost(n.id, 'content', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-4 text-slate-300 resize-none focus:border-brand-500 outline-none" rows={4} placeholder="Write the main story..." />
                </div>
              </div>
            ))}
          </section>

          <section id="admin-section-messages" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400"><i className="fa-solid fa-inbox text-xl"></i></div>
                <h3 className="text-xl md:text-3xl font-black text-white uppercase">Visitor Entries</h3>
              </div>
              <button 
                onClick={fetchInquiries} 
                disabled={isLoadingInquiries}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              >
                <i className={`fa-solid fa-rotate ${isLoadingInquiries ? 'animate-spin' : ''}`}></i>
              </button>
            </div>

            {inquiryError && (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl mt-1"></i>
                  <div className="flex-1">
                    <h4 className="text-red-400 font-black uppercase tracking-tight">Database Synchronization Error</h4>
                    <p className="text-sm text-red-400/70 mb-4">{String(inquiryError.message)}</p>
                  </div>
                </div>
                
                {inquiryError.isMissingTable && (
                  <div className="bg-black/40 rounded-xl p-4 border border-red-500/20">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Supabase SQL Editor Patch:</p>
                    <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- Robust Table Creation
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, 
  email TEXT NOT NULL,
  subject TEXT, 
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'unread'
);

-- Enable RLS and Policies
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.contact_inquiries;
CREATE POLICY "Allow all access" ON public.contact_inquiries FOR ALL TO anon USING (true) WITH CHECK (true);`}
                    </pre>
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => {
                          const sql = `CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL, email TEXT NOT NULL,
  subject TEXT, message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'unread'
);
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.contact_inquiries;
CREATE POLICY "Allow all access" ON public.contact_inquiries FOR ALL TO anon USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sql);
                          alert("SQL copied to clipboard!");
                        }}
                        className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors border border-slate-700"
                      >
                        Copy SQL Script
                      </button>
                      <button onClick={fetchInquiries} className="flex-1 bg-white text-dark-900 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">
                        Retry Connection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {inquiries.length > 0 ? inquiries.map((entry) => (
                <div key={entry.id} className={`glass-card p-6 rounded-[1.5rem] border ${entry.status === 'unread' ? 'border-brand-500/50 bg-brand-500/5' : 'border-slate-700/50'} transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold">{entry.name}</h4>
                      <p className="text-[10px] text-brand-400 font-mono">{entry.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {entry.status === 'unread' && (
                        <button onClick={() => updateInquiryStatus(entry.id, 'read')} title="Mark as Read" className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><i className="fa-solid fa-check"></i></button>
                      )}
                      <button onClick={() => deleteInquiry(entry.id)} title="Delete Entry" className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </div>
                  <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Subject: {entry.subject}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{entry.message}</p>
                  </div>
                  <div className="mt-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">Received: {new Date(entry.created_at).toLocaleString()}</div>
                </div>
              )) : !isLoadingInquiries && !inquiryError && (
                <div className="text-center py-16 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <i className="fa-solid fa-inbox text-4xl text-slate-700 mb-4 block"></i>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No entries found yet.</p>
                </div>
              )}
              {isLoadingInquiries && (
                <div className="text-center py-16 animate-pulse">
                  <i className="fa-solid fa-circle-notch animate-spin text-brand-400 text-2xl mb-4 block mx-auto"></i>
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">Querying Operational Database...</p>
                </div>
              )}
            </div>
          </section>

          <div className="text-center pt-20">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Operational Dossier Ends</p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
