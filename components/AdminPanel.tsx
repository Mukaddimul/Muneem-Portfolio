
import React, { useState, useRef, useEffect } from 'react';
import { PortfolioData, Project, TimelineItem, Skill, Award, NewsPost } from '../types';

interface AdminPanelProps {
  data: PortfolioData;
  onSave: (newData: PortfolioData) => void;
  onLogout: () => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ data, onSave, onLogout, onClose }) => {
  const [editData, setEditData] = useState<PortfolioData>(data);
  const [activeSection, setActiveSection] = useState<string>('general');
  
  const contentRef = useRef<HTMLDivElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const projectLogoInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const newsImageInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const sections = [
    { id: 'general', label: 'General Info', icon: 'fa-id-card' },
    { id: 'skills', label: 'Skills', icon: 'fa-screwdriver-wrench' },
    { id: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
    { id: 'timeline', label: 'Experience', icon: 'fa-timeline' },
    { id: 'awards', label: 'Awards', icon: 'fa-medal' },
    { id: 'news', label: 'News Desk', icon: 'fa-newspaper' },
  ];

  // Prevent background scrolling when admin panel is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(`admin-section-${id}`);
    if (element && contentRef.current) {
      const isMobile = window.innerWidth < 768;
      const offset = isMobile ? 120 : 0; 
      
      const topPos = element.offsetTop - offset;
      contentRef.current.scrollTo({
        top: topPos,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  // Update active section on scroll
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
    setEditData({
      ...editData,
      profile: { ...editData.profile, [name]: value }
    });
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({
          ...editData,
          profile: { ...editData.profile, profilePic: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({
          ...editData,
          profile: { ...editData.profile, coverPhoto: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProjectLogoUpload = (projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProject(projectId, 'logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewsImageUpload = (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNewsPost(postId, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: 'New Project',
      category: 'General',
      description: 'Description here...',
      icon: 'fa-rocket',
      color: 'from-blue-600',
      achievements: []
    };
    setEditData({ ...editData, projects: [...editData.projects, newProject] });
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setEditData({
      ...editData,
      projects: editData.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const deleteProject = (id: string) => {
    setEditData({ ...editData, projects: editData.projects.filter(p => p.id !== id) });
  };

  const addProjectAchievement = (projectId: string) => {
    setEditData({
      ...editData,
      projects: editData.projects.map(p => 
        p.id === projectId ? { ...p, achievements: [...(p.achievements || []), 'New Achievement'] } : p
      )
    });
  };

  const updateProjectAchievement = (projectId: string, index: number, value: string) => {
    setEditData({
      ...editData,
      projects: editData.projects.map(p => {
        if (p.id === projectId) {
          const newAchievements = [...(p.achievements || [])];
          newAchievements[index] = value;
          return { ...p, achievements: newAchievements };
        }
        return p;
      })
    });
  };

  const deleteProjectAchievement = (projectId: string, index: number) => {
    setEditData({
      ...editData,
      projects: editData.projects.map(p => {
        if (p.id === projectId) {
          return { ...p, achievements: (p.achievements || []).filter((_, i) => i !== index) };
        }
        return p;
      })
    });
  };

  const addTimelineItem = () => {
    const newItem: TimelineItem = {
      id: Date.now().toString(),
      date: 'Year',
      title: 'New Milestone',
      subtitle: 'Organization',
      type: 'achievement',
      icon: 'fa-star',
      description: 'Summary of milestone...',
      details: ['Detailed achievement 1']
    };
    setEditData({ ...editData, timeline: [...editData.timeline, newItem] });
  };

  const updateTimelineItem = (id: string, field: keyof TimelineItem, value: any) => {
    setEditData({
      ...editData,
      timeline: editData.timeline.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const deleteTimelineItem = (id: string) => {
    setEditData({ ...editData, timeline: editData.timeline.filter(t => t.id !== id) });
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      title: 'New Skill Category',
      icon: 'fa-lightbulb',
      color: 'border-brand-500',
      items: ['Skill Item 1']
    };
    setEditData({ ...editData, skills: [...editData.skills, newSkill] });
  };

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setEditData({
      ...editData,
      skills: editData.skills.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const deleteSkill = (id: string) => {
    setEditData({ ...editData, skills: editData.skills.filter(s => s.id !== id) });
  };

  const addSkillItem = (skillId: string) => {
    setEditData({
      ...editData,
      skills: editData.skills.map(s => s.id === skillId ? { ...s, items: [...s.items, 'New Skill'] } : s)
    });
  };

  const updateSkillItem = (skillId: string, index: number, value: string) => {
    setEditData({
      ...editData,
      skills: editData.skills.map(s => {
        if (s.id === skillId) {
          const newItems = [...s.items];
          newItems[index] = value;
          return { ...s, items: newItems };
        }
        return s;
      })
    });
  };

  const deleteSkillItem = (skillId: string, index: number) => {
    setEditData({
      ...editData,
      skills: editData.skills.map(s => {
        if (s.id === skillId) {
          return { ...s, items: s.items.filter((_, i) => i !== index) };
        }
        return s;
      })
    });
  };

  const addAward = () => {
    const newAward: Award = {
      id: Date.now().toString(),
      title: 'New Award',
      detail: 'Details here...',
      icon: 'fa-trophy',
    };
    setEditData({ ...editData, awards: [...(editData.awards || []), newAward] });
  };

  const updateAward = (id: string, field: keyof Award, value: string) => {
    setEditData({
      ...editData,
      awards: editData.awards.map(a => a.id === id ? { ...a, [field]: value } : a)
    });
  };

  const deleteAward = (id: string) => {
    setEditData({ ...editData, awards: editData.awards.filter(a => a.id !== id) });
  };

  const addNewsPost = () => {
    const newPost: NewsPost = {
      id: Date.now().toString(),
      title: 'New Article Headline',
      content: 'Start writing the story here...',
      date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
      author: 'Admin',
      likes: 0,
      comments: []
    };
    setEditData({ ...editData, news: [newPost, ...(editData.news || [])] });
  };

  const updateNewsPost = (id: string, field: keyof NewsPost, value: any) => {
    setEditData({
      ...editData,
      news: editData.news.map(n => n.id === id ? { ...n, [field]: value } : n)
    });
  };

  const deleteNewsPost = (id: string) => {
    setEditData({ ...editData, news: editData.news.filter(n => n.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-dark-900/98 backdrop-blur-3xl flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300">
      
      {/* Sidebar Navigation - Sticky/Fixed Left on Desktop, Horizontal Top Bar on Mobile */}
      <aside className="w-full md:w-64 lg:w-72 bg-dark-800/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-auto md:h-full z-20 shadow-2xl shrink-0">
        <div className="p-4 md:p-6 border-b border-slate-700/50 bg-dark-900/50 flex items-center justify-between md:block shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
              <i className="fa-solid fa-user-gear text-sm md:text-base"></i>
            </div>
            <div>
              <h2 className="text-white font-black tracking-tighter text-sm md:text-lg leading-none uppercase">Admin Desk</h2>
              <span className="hidden md:block text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1">Control Center</span>
            </div>
          </div>
          
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-2">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Independent Scrollable Nav Area */}
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

        {/* Action Buttons - Sticky at the bottom of the sidebar */}
        <div className="p-3 md:p-6 border-t border-slate-700/50 bg-dark-900/50 space-y-2 md:space-y-3 shrink-0">
          <button 
            onClick={() => onSave(editData)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 md:py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 md:gap-3"
          >
            <i className="fa-solid fa-floppy-disk"></i> <span className="hidden xs:inline">Save Changes</span><span className="xs:hidden">Save</span>
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="hidden md:block flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 md:py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Close
            </button>
            <button 
              onClick={onLogout}
              className="flex-1 md:w-12 md:h-12 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center border border-red-500/20 py-2.5 md:py-0"
              title="Secure Logout"
            >
              <i className="fa-solid fa-power-off text-xs md:text-sm"></i>
              <span className="md:hidden ml-2 font-bold text-[10px] uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Fully independent scroll track */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto scroll-smooth h-full bg-dark-900/30"
      >
        <div className="max-w-5xl mx-auto p-5 md:p-12 lg:p-16 space-y-24 md:space-y-32 pb-32">
          
          {/* General Section */}
          <section id="admin-section-general" className="scroll-mt-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center gap-4 mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-900/30 flex items-center justify-center text-brand-400">
                <i className="fa-solid fa-id-card text-lg md:text-xl"></i>
              </div>
              <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">General Information</h3>
            </div>
            
            <div className="space-y-8 md:space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest block ml-1">Profile Avatar</label>
                  <div className="relative group cursor-pointer w-32 h-32 md:w-40 md:h-40" onClick={() => profilePicInputRef.current?.click()}>
                    <div className="w-full h-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 border-brand-500/30 p-1 bg-dark-800 shadow-2xl">
                      <img src={editData.profile.profilePic} className="w-full h-full object-cover rounded-[1.5rem] md:rounded-[2rem]" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${editData.profile.name}&background=2563eb&color=fff&size=200`;
                      }} />
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fa-solid fa-camera text-white text-2xl md:text-3xl"></i>
                    </div>
                    <input type="file" ref={profilePicInputRef} onChange={handleProfilePicUpload} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest block ml-1">Banner Image</label>
                  <div className="relative group cursor-pointer w-full h-32 md:h-40" onClick={() => coverPhotoInputRef.current?.click()}>
                    <div className="w-full h-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 border-slate-700/50 p-1 bg-dark-800 shadow-2xl">
                      <img src={editData.profile.coverPhoto} className="w-full h-full object-cover rounded-[1.5rem] md:rounded-[2rem] opacity-50" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2070`;
                      }} />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fa-solid fa-image text-white text-2xl md:text-3xl mr-3"></i>
                      <span className="text-white font-bold uppercase tracking-widest text-[10px] md:text-xs">Upload Banner</span>
                    </div>
                    <input type="file" ref={coverPhotoInputRef} onChange={handleCoverPhotoUpload} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Full Legal Name</label>
                  <input name="fullName" value={editData.profile.fullName} onChange={handleProfileChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-white font-bold focus:border-brand-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Short Display Name</label>
                  <input name="name" value={editData.profile.name} onChange={handleProfileChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-white font-bold focus:border-brand-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Professional Bio</label>
                  <textarea name="bio" rows={4} value={editData.profile.bio} onChange={handleProfileChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-white leading-relaxed focus:border-brand-500 outline-none transition-all resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Primary Email</label>
                  <input name="email" value={editData.profile.email} onChange={handleProfileChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-white focus:border-brand-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Phone Number</label>
                  <input name="phone" value={editData.profile.phone} onChange={handleProfileChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-white focus:border-brand-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Base Location</label>
                  <input name="location" value={editData.profile.location} onChange={handleProfileChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-white focus:border-brand-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section id="admin-section-skills" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between gap-4 mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400">
                  <i className="fa-solid fa-screwdriver-wrench text-lg md:text-xl"></i>
                </div>
                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">Skills & Mastery</h3>
              </div>
              <button onClick={addSkill} className="bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest border border-brand-500/30 transition-all flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">Add Category</span><span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {editData.skills.map((s) => (
                <div key={s.id} className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-700/50 space-y-5 md:space-y-6 relative group overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteSkill(s.id)} className="text-red-500 hover:text-red-400 transition-colors p-2">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">FA Icon</label>
                      <input value={s.icon} onChange={(e) => updateSkill(s.id, 'icon', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Accent Color</label>
                      <input value={s.color} onChange={(e) => updateSkill(s.id, 'color', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Category Title</label>
                    <input value={s.title} onChange={(e) => updateSkill(s.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-xs md:text-sm font-black text-white uppercase tracking-tight" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Competencies</label>
                    {s.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 group/item">
                        <input value={item} onChange={(e) => updateSkillItem(s.id, idx, e.target.value)} className="flex-1 bg-dark-900/30 border border-slate-800 rounded-xl p-2 md:p-2.5 text-[11px] md:text-xs text-slate-300" />
                        <button onClick={() => deleteSkillItem(s.id, idx)} className="text-slate-600 hover:text-red-500 opacity-50 hover:opacity-100 transition-all p-1">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addSkillItem(s.id)} className="text-[9px] md:text-[10px] text-brand-400 hover:text-brand-300 font-black uppercase tracking-[0.2em] pt-1 flex items-center gap-2">
                      <i className="fa-solid fa-plus text-[8px]"></i> New Competency
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects Section */}
          <section id="admin-section-projects" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between gap-4 mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
                  <i className="fa-solid fa-diagram-project text-lg md:text-xl"></i>
                </div>
                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">Featured Projects</h3>
              </div>
              <button onClick={addProject} className="bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest border border-brand-500/30 transition-all flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">New Initiative</span><span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="space-y-6 md:space-y-8">
              {editData.projects.map((p) => (
                <div key={p.id} className="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-700/50 flex flex-col sm:flex-row gap-6 md:gap-10 items-start group relative shadow-2xl">
                  <div className="absolute top-4 right-6 md:top-6 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteProject(p.id)} className="text-red-500 hover:text-red-400 p-2">
                      <i className="fa-solid fa-trash-can text-base md:text-lg"></i>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-4 shrink-0 mx-auto sm:mx-0">
                    <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-gradient-to-br ${p.color} flex items-center justify-center text-4xl md:text-5xl text-white shadow-2xl overflow-hidden relative group/logo`}>
                      {p.logo ? (
                        <img src={p.logo} alt="Project logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <i className={`fa-solid ${p.icon}`}></i>
                      )}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-logo-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-[9px] md:text-[10px]" onClick={() => projectLogoInputRef.current[p.id]?.click()}>
                        <i className="fa-solid fa-upload text-xl mb-1"></i>
                        <span className="font-bold uppercase tracking-widest">Logo</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" ref={el => projectLogoInputRef.current[p.id] = el} onChange={(e) => handleProjectLogoUpload(p.id, e)} />
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Project Name</label>
                        <input value={p.title} onChange={(e) => updateProject(p.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 text-sm md:text-lg font-black text-white focus:border-brand-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Sector / Category</label>
                        <input value={p.category} onChange={(e) => updateProject(p.id, 'category', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 text-xs md:text-sm text-slate-300 focus:border-brand-500 outline-none" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Project Link (URL)</label>
                      <input value={p.link || ''} onChange={(e) => updateProject(p.id, 'link', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 text-[10px] md:text-xs text-brand-400 font-mono focus:border-brand-500 outline-none" placeholder="https://" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Description & Impact</label>
                      <textarea rows={3} value={p.description} onChange={(e) => updateProject(p.id, 'description', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm text-slate-400 leading-relaxed focus:border-brand-500 outline-none resize-none" />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Key Achievements</label>
                      {(p.achievements || []).map((achievement, idx) => (
                        <div key={idx} className="flex gap-2 group/ach">
                          <input value={achievement} onChange={(e) => updateProjectAchievement(p.id, idx, e.target.value)} className="flex-1 bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-2.5 text-[10px] md:text-xs text-emerald-400" />
                          <button onClick={() => deleteProjectAchievement(p.id, idx)} className="text-slate-600 hover:text-red-500 opacity-50 hover:opacity-100 transition-all p-1">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addProjectAchievement(p.id)} className="text-[9px] md:text-[10px] text-brand-400 hover:text-brand-300 font-black uppercase tracking-[0.2em] pt-1 flex items-center gap-2">
                        <i className="fa-solid fa-plus text-[8px]"></i> Add Honor
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline Section */}
          <section id="admin-section-timeline" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between gap-4 mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
                  <i className="fa-solid fa-timeline text-lg md:text-xl"></i>
                </div>
                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">Professional Timeline</h3>
              </div>
              <button onClick={addTimelineItem} className="bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest border border-brand-500/30 transition-all flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">New Milestone</span><span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="space-y-6 md:space-y-8">
              {editData.timeline.map((t) => (
                <div key={t.id} className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-700/50 space-y-5 md:space-y-6 group relative shadow-xl">
                  <div className="absolute top-4 right-6 md:top-6 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteTimelineItem(t.id)} className="text-red-500 hover:text-red-400 p-2">
                      <i className="fa-solid fa-trash-can text-base md:text-lg"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Period / Date</label>
                      <input value={t.date} onChange={(e) => updateTimelineItem(t.id, 'date', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-white" />
                    </div>
                    <div className="sm:col-span-1 md:col-span-2 space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Role / Achievement Title</label>
                      <input value={t.title} onChange={(e) => updateTimelineItem(t.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-sm font-black text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Classification</label>
                      <select value={t.type} onChange={(e) => updateTimelineItem(t.id, 'type', e.target.value as any)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-white outline-none">
                        <option value="education">Education</option>
                        <option value="leadership">Leadership</option>
                        <option value="professional">Professional</option>
                        <option value="creative">Creative</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="achievement">Achievement</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Organization</label>
                      <input value={t.subtitle} onChange={(e) => updateTimelineItem(t.id, 'subtitle', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-brand-400 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">FA Icon Class</label>
                      <input value={t.icon} onChange={(e) => updateTimelineItem(t.id, 'icon', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-white font-mono" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Summary Description</label>
                    <textarea rows={2} value={t.description} onChange={(e) => updateTimelineItem(t.id, 'description', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 md:p-4 text-[11px] md:text-xs text-slate-400 leading-relaxed resize-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Awards Section */}
          <section id="admin-section-awards" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between gap-4 mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-900/30 flex items-center justify-center text-yellow-400">
                  <i className="fa-solid fa-medal text-lg md:text-xl"></i>
                </div>
                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">Awards & Recognition</h3>
              </div>
              <button onClick={addAward} className="bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest border border-brand-500/30 transition-all flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">New Honor</span><span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {(editData.awards || []).map((a) => (
                <div key={a.id} className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-700/50 space-y-5 md:space-y-6 relative group shadow-xl">
                  <div className="absolute top-4 right-6 md:top-6 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteAward(a.id)} className="text-red-500 hover:text-red-400 transition-colors p-2">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Award Title</label>
                      <input value={a.title} onChange={(e) => updateAward(a.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-sm font-black text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Year / Recipient Info</label>
                      <input value={a.detail} onChange={(e) => updateAward(a.id, 'detail', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-brand-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">FA Icon Class</label>
                      <input value={a.icon} onChange={(e) => updateAward(a.id, 'icon', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-2.5 text-[11px] md:text-xs text-white font-mono" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* News Desk Section */}
          <section id="admin-section-news" className="scroll-mt-4 pt-10">
            <div className="flex items-center justify-between gap-4 mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">
                  <i className="fa-solid fa-newspaper text-lg md:text-xl"></i>
                </div>
                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">News Desk</h3>
              </div>
              <button onClick={addNewsPost} className="bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest border border-brand-500/30 transition-all flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">Print New Story</span><span className="sm:hidden">Write</span>
              </button>
            </div>

            <div className="space-y-10 md:space-y-12">
              {editData.news.map((n) => (
                <div key={n.id} className="glass-card p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-700/50 space-y-6 md:space-y-8 group relative shadow-2xl overflow-hidden">
                  <div className="absolute top-4 right-6 md:top-8 md:right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteNewsPost(n.id)} className="text-red-500 hover:text-red-400 flex items-center gap-2 text-[9px] md:text-xs font-black uppercase tracking-widest p-2">
                      <i className="fa-solid fa-trash-can"></i> Kill Story
                    </button>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
                    <div 
                      className="w-full lg:w-64 xl:w-72 h-40 md:h-48 bg-slate-800/50 rounded-2xl md:rounded-[2rem] border-2 border-dashed border-slate-700 shrink-0 relative group/newsimg cursor-pointer flex items-center justify-center overflow-hidden mx-auto lg:mx-0"
                      onClick={() => newsImageInputRef.current[n.id]?.click()}
                    >
                      {n.image ? (
                        <img src={n.image} alt="News" className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700" />
                      ) : (
                        <div className="text-center p-4 space-y-2">
                          <i className="fa-solid fa-camera text-2xl text-slate-600"></i>
                          <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Visual</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-newsimg-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="fa-solid fa-camera text-white text-2xl"></i>
                      </div>
                      <input type="file" ref={el => newsImageInputRef.current[n.id] = el} onChange={(e) => handleNewsImageUpload(n.id, e)} className="hidden" accept="image/*" />
                    </div>

                    <div className="flex-1 w-full space-y-4 md:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Headline</label>
                          <input value={n.title} onChange={(e) => updateNewsPost(n.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-2.5 text-sm md:text-lg font-black text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Byline (Author)</label>
                          <input value={n.author} onChange={(e) => updateNewsPost(n.id, 'author', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-2.5 text-xs md:text-sm text-brand-400 font-bold" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Article Content</label>
                        <textarea rows={5} value={n.content} onChange={(e) => updateNewsPost(n.id, 'content', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl md:rounded-2xl p-3 md:p-4 text-[11px] md:text-sm text-slate-300 leading-relaxed focus:border-brand-500 outline-none transition-all resize-none" />
                      </div>

                      <div className="flex items-center gap-4 md:gap-6 pt-3 md:pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                          <i className="fa-solid fa-heart text-red-500 text-[9px] md:text-[10px]"></i>
                          <span className="text-[9px] md:text-[10px] font-black text-white">{n.likes} LIKES</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                          <i className="fa-solid fa-comment text-brand-400 text-[9px] md:text-[10px]"></i>
                          <span className="text-[9px] md:text-[10px] font-black text-white">{n.comments.length} RESPONSES</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer Decoration */}
          <div className="text-center pt-10 md:pt-20">
            <div className="w-12 md:w-16 h-1 bg-brand-600/30 mx-auto rounded-full mb-4 md:mb-6"></div>
            <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Operational Dossier Ends</p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
