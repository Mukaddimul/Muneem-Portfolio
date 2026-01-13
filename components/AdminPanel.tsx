import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
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
  const [isSaving, setIsSaving] = useState(false);
  
  // Cropping State
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; image: string; field: 'profilePic' | 'coverPhoto' }>({
    isOpen: false,
    image: '',
    field: 'profilePic'
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const sections = [
    { id: 'general', label: 'General Info', icon: 'fa-id-card' },
    { id: 'skills', label: 'Skills', icon: 'fa-screwdriver-wrench' },
    { id: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
    { id: 'timeline', label: 'Experience', icon: 'fa-timeline' },
    { id: 'awards', label: 'Awards', icon: 'fa-medal' },
    { id: 'news', label: 'News Desk', icon: 'fa-newspaper' },
    { id: 'messages', label: 'Visitor Entries', icon: 'fa-inbox' },
  ];

  const handleSaveClick = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(editData);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
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
        throw { message: error.message, isMissingTable: error.code === '42P01' };
      }
      setInquiries(data || []);
    } catch (err: any) {
      setInquiryError({
        message: err.message || "Failed to fetch data",
        isMissingTable: !!err.isMissingTable
      });
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`admin-section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  // General Handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData({ ...editData, profile: { ...editData.profile, [name]: value } });
  };

  const handleImageUploadTrigger = (field: 'profilePic' | 'coverPhoto', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropModal({
          isOpen: true,
          image: reader.result as string,
          field
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !cropModal.image) return;
    setIsProcessingImage(true);
    try {
      const croppedBase64 = await getCroppedImg(cropModal.image, croppedAreaPixels);
      const compressed = await compressImage(
        croppedBase64, 
        cropModal.field === 'profilePic' ? 500 : 1600, 
        cropModal.field === 'profilePic' ? 500 : 900
      );
      setEditData({ ...editData, profile: { ...editData.profile, [cropModal.field]: compressed } });
      setCropModal({ ...cropModal, isOpen: false });
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Project Handlers
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

  // Skill Handlers
  const addSkill = () => {
    const newSkill: Skill = { id: Date.now().toString(), title: 'New Category', icon: 'fa-lightbulb', color: 'border-brand-500', items: ['Skill 1'] };
    setEditData({ ...editData, skills: [...editData.skills, newSkill] });
  };

  // Timeline Handlers
  const addTimelineItem = () => {
    const newItem: TimelineItem = { id: Date.now().toString(), date: '2024 - Present', title: 'New Milestone', subtitle: 'Organization Name', type: 'professional', icon: 'fa-briefcase', description: 'Overview of role...', details: ['Key achievement 1'] };
    setEditData({ ...editData, timeline: [newItem, ...editData.timeline] });
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

  // Award Handlers
  const addAward = () => {
    const newAward: Award = { id: Date.now().toString(), title: 'International Excellence', detail: '2024 Recipient', icon: 'fa-trophy' };
    setEditData({ ...editData, awards: [...editData.awards, newAward] });
  };

  // News Handlers
  const addNewsPost = () => {
    const newPost: NewsPost = { id: Date.now().toString(), title: 'Breaking News Headline', content: 'Story details...', date: new Date().toISOString().split('T')[0], author: editData.profile.name, likes: 0, comments: [] };
    setEditData({ ...editData, news: [newPost, ...editData.news] });
  };

  const handleNewsImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 1200, 800, 0.6);
        setEditData({ ...editData, news: editData.news.map(n => n.id === id ? { ...n, image: compressed } : n) });
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-dark-900/98 backdrop-blur-3xl flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300"
    >
      
      {(isProcessingImage || isSaving) && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold text-xs uppercase tracking-widest">{isSaving ? "Syncing Workspace..." : "Optimizing Asset..."}</p>
          </div>
        </div>
      )}

      {/* Cropping Modal Overlay */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[400px] md:h-[500px] bg-dark-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl mb-6">
            <Cropper
              image={cropModal.image}
              crop={crop}
              zoom={zoom}
              aspect={cropModal.field === 'profilePic' ? 1 : 16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape={cropModal.field === 'profilePic' ? 'round' : 'rect'}
              showGrid={true}
            />
          </div>
          <div className="w-full max-w-md space-y-6 px-4">
            <div className="flex items-center gap-4">
              <i className="fa-solid fa-magnifying-glass-plus text-slate-400"></i>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-brand-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setCropModal({ ...cropModal, isOpen: false })}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleCropSave}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-brand-600/20"
              >
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Fixed on the left for desktop, top for mobile */}
      <aside className="w-full md:w-72 bg-dark-800/90 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl z-20 relative overflow-y-auto no-scrollbar h-auto md:h-full">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-dark-800/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <h2 className="text-white font-black tracking-tighter text-lg uppercase">Admin Desk</h2>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div className="p-4 space-y-2 flex flex-col h-full">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button 
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === section.id 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <i className={`fa-solid ${section.icon} w-5 text-center`}></i>
                <span className="font-bold text-sm tracking-tight">{section.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-4 mb-6 border-t border-slate-700/50 space-y-3">
            <button onClick={handleSaveClick} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3">
              <i className="fa-solid fa-floppy-disk"></i> Save & Sync
            </button>
            <button onClick={onLogout} className="w-full h-12 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center border border-red-500/20">
              <i className="fa-solid fa-power-off text-sm mr-2"></i> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace - Scrollable independently */}
      <main className="flex-1 h-full overflow-y-auto bg-dark-900/50 scroll-smooth">
        <div className="max-w-4xl mx-auto p-8 md:p-16 space-y-24 pb-32">
          
          {/* General Info */}
          <section id="admin-section-general" className="scroll-mt-24">
            <h3 className="text-2xl font-black text-white uppercase mb-8 border-b border-slate-800 pb-4">General Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Full Name</label>
                  <input name="fullName" value={editData.profile.fullName} onChange={handleProfileChange} className="w-full bg-dark-800 border border-slate-700 rounded-xl p-3.5 text-white focus:border-brand-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Short Name</label>
                  <input name="name" value={editData.profile.name} onChange={handleProfileChange} className="w-full bg-dark-800 border border-slate-700 rounded-xl p-3.5 text-white focus:border-brand-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Location</label>
                  <input name="location" value={editData.profile.location} onChange={handleProfileChange} className="w-full bg-dark-800 border border-slate-700 rounded-xl p-3.5 text-white focus:border-brand-500 outline-none transition-colors" />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Profile Picture (Crops to Circle)</label>
                  <div className="flex items-center gap-4">
                    <img src={editData.profile.profilePic} className="w-16 h-16 rounded-full object-cover border-2 border-brand-500/50" />
                    <input type="file" onChange={(e) => handleImageUploadTrigger('profilePic', e)} className="text-[10px] text-slate-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700" accept="image/*" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Cover Photo (Crops to 16:9)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-12 bg-dark-800 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                      <img src={editData.profile.coverPhoto} className="w-full h-full object-cover" />
                    </div>
                    <input type="file" onChange={(e) => handleImageUploadTrigger('coverPhoto', e)} className="text-[10px] text-slate-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700" accept="image/*" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Bio</label>
                <textarea name="bio" value={editData.profile.bio} onChange={handleProfileChange} rows={4} className="w-full bg-dark-800 border border-slate-700 rounded-xl p-3.5 text-white resize-none focus:border-brand-500 outline-none transition-colors" />
              </div>
            </div>
          </section>

          {/* Expertise Matrix */}
          <section id="admin-section-skills" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white uppercase">Expertise Matrix</h3>
              <button onClick={addSkill} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest">+ Category</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {editData.skills.map((skill) => (
                <div key={skill.id} className="glass-card p-6 rounded-2xl border border-slate-800 relative group">
                  <button onClick={() => setEditData({ ...editData, skills: editData.skills.filter(s => s.id !== skill.id) })} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                  <input value={skill.title} onChange={(e) => setEditData({ ...editData, skills: editData.skills.map(s => s.id === skill.id ? { ...s, title: e.target.value } : s) })} className="bg-transparent text-white font-bold text-lg border-b border-slate-700 w-full mb-4 outline-none focus:border-brand-500" />
                  <div className="space-y-2">
                    {skill.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input value={item} onChange={(e) => {
                          const newItems = [...skill.items];
                          newItems[idx] = e.target.value;
                          setEditData({ ...editData, skills: editData.skills.map(s => s.id === skill.id ? { ...s, items: newItems } : s) });
                        }} className="flex-1 bg-dark-900/50 border border-slate-700 rounded-lg p-2 text-xs text-slate-300" />
                        <button onClick={() => {
                          const newItems = skill.items.filter((_, i) => i !== idx);
                          setEditData({ ...editData, skills: editData.skills.map(s => s.id === skill.id ? { ...s, items: newItems } : s) });
                        }} className="text-slate-500 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newItems = [...skill.items, 'New Skill'];
                      setEditData({ ...editData, skills: editData.skills.map(s => s.id === skill.id ? { ...s, items: newItems } : s) });
                    }} className="text-[10px] text-brand-400 font-black uppercase mt-2 hover:text-brand-300">+ Add Skill</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Initiatives */}
          <section id="admin-section-projects" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white uppercase">Featured Initiatives</h3>
              <button onClick={() => setEditData({ ...editData, projects: [{ id: Date.now().toString(), title: 'Project Title', category: 'Category', description: 'Impact description...', icon: 'fa-rocket', color: 'from-blue-600', achievements: [] }, ...editData.projects] })} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest">+ Project</button>
            </div>
            <div className="space-y-12">
              {editData.projects.map((project) => (
                <div key={project.id} className="glass-card p-8 rounded-3xl border border-slate-800 relative group">
                  <button onClick={() => setEditData({ ...editData, projects: editData.projects.filter(p => p.id !== project.id) })} className="absolute top-6 right-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can text-lg"></i></button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div className="space-y-4">
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Main Brand Logo</label>
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${project.color} flex items-center justify-center p-2 border border-white/10`}>
                          {project.logo ? <img src={project.logo} className="w-full h-full object-contain" /> : <i className={`fa-solid ${project.icon} text-3xl text-white`}/ >}
                        </div>
                        <input type="file" onChange={(e) => handleProjectLogoUpload(project.id, e)} className="text-[10px] text-slate-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Category</label>
                        <input value={project.category} onChange={(e) => updateProject(project.id, 'category', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-brand-400 font-bold" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Project Title</label>
                        <input value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-white font-black uppercase text-xl" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Launch Link (URL)</label>
                        <input value={project.link || ''} onChange={(e) => updateProject(project.id, 'link', e.target.value)} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-blue-400 text-xs" placeholder="https://..." />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Description</label>
                    <textarea value={project.description} onChange={(e) => updateProject(project.id, 'description', e.target.value)} rows={3} className="w-full bg-dark-900/50 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm" />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-3">Verified Achievements</label>
                    <div className="space-y-2">
                      {(project.achievements || []).map((ach, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input value={ach} onChange={(e) => {
                            const newAch = [...(project.achievements || [])];
                            newAch[idx] = e.target.value;
                            updateProject(project.id, 'achievements', newAch);
                          }} className="flex-1 bg-dark-900/50 border border-slate-700 rounded-lg p-2.5 text-xs text-brand-100" />
                          <button onClick={() => {
                            const newAch = (project.achievements || []).filter((_, i) => i !== idx);
                            updateProject(project.id, 'achievements', newAch);
                          }} className="text-slate-500 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                      ))}
                      <button onClick={() => updateProject(project.id, 'achievements', [...(project.achievements || []), 'New Milestone'])} className="text-[10px] text-emerald-400 font-black uppercase hover:text-emerald-300">+ Add Milestone</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Experience History */}
          <section id="admin-section-timeline" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white uppercase">Experience History</h3>
              <button onClick={addTimelineItem} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest">+ Milestone</button>
            </div>
            <div className="space-y-8">
              {editData.timeline.map((item) => (
                <div key={item.id} className="glass-card p-6 rounded-2xl border border-slate-800 relative group">
                  <button onClick={() => setEditData({ ...editData, timeline: editData.timeline.filter(t => t.id !== item.id) })} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 space-y-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                        {item.logo ? <img src={item.logo} className="w-full h-full object-contain p-1.5" /> : <i className={`fa-solid ${item.icon} text-2xl text-slate-500`}/ >}
                      </div>
                      <input type="file" onChange={(e) => handleTimelineLogoUpload(item.id, e)} className="text-[8px] text-slate-600 w-full" />
                      <input value={item.date} onChange={(e) => updateTimelineItem(item.id, 'date', e.target.value)} className="w-full bg-dark-900 text-[10px] text-brand-400 font-black p-2 rounded border border-slate-800" placeholder="Year" />
                    </div>
                    <div className="md:col-span-9 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input value={item.title} onChange={(e) => updateTimelineItem(item.id, 'title', e.target.value)} className="w-full bg-dark-900 border border-slate-700 rounded-lg p-3 text-white font-bold" placeholder="Title" />
                        <input value={item.subtitle} onChange={(e) => updateTimelineItem(item.id, 'subtitle', e.target.value)} className="w-full bg-dark-900 border border-slate-700 rounded-lg p-3 text-brand-400 font-medium" placeholder="Organization" />
                      </div>
                      <textarea value={item.description} onChange={(e) => updateTimelineItem(item.id, 'description', e.target.value)} className="w-full bg-dark-900 border border-slate-700 rounded-lg p-3 text-slate-400 text-xs" rows={2} placeholder="Summary..." />
                      <div className="space-y-2">
                        {item.details.map((detail, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input value={detail} onChange={(e) => {
                              const newDetails = [...item.details];
                              newDetails[idx] = e.target.value;
                              updateTimelineItem(item.id, 'details', newDetails);
                            }} className="flex-1 bg-dark-900/30 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300" />
                            <button onClick={() => updateTimelineItem(item.id, 'details', item.details.filter((_, i) => i !== idx))} className="text-slate-600"><i className="fa-solid fa-xmark"></i></button>
                          </div>
                        ))}
                        <button onClick={() => updateTimelineItem(item.id, 'details', [...item.details, 'New Task Detail'])} className="text-[9px] text-slate-500 uppercase font-black">+ Add Detail</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Awards & Accolades */}
          <section id="admin-section-awards" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white uppercase">Awards & Accolades</h3>
              <button onClick={addAward} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest">+ Award</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editData.awards.map((award) => (
                <div key={award.id} className="glass-card p-6 rounded-xl border border-slate-800 relative group">
                  <button onClick={() => setEditData({ ...editData, awards: editData.awards.filter(a => a.id !== award.id) })} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-white"><i className={`fa-solid ${award.icon}`}></i></div>
                    <div className="flex-1 space-y-2">
                      <input value={award.title} onChange={(e) => setEditData({ ...editData, awards: editData.awards.map(a => a.id === award.id ? { ...a, title: e.target.value } : a) })} className="w-full bg-dark-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-sm" />
                      <input value={award.detail} onChange={(e) => setEditData({ ...editData, awards: editData.awards.map(a => a.id === award.id ? { ...a, detail: e.target.value } : a) })} className="w-full bg-dark-900 border border-slate-700 rounded-lg p-2 text-brand-400 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* News Desk Archive */}
          <section id="admin-section-news" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white uppercase">News Desk Archive</h3>
              <button onClick={addNewsPost} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest">+ News Post</button>
            </div>
            <div className="space-y-8">
              {editData.news.map((post) => (
                <div key={post.id} className="glass-card p-8 rounded-3xl border border-slate-800 relative group">
                  <button onClick={() => setEditData({ ...editData, news: editData.news.filter(n => n.id !== post.id) })} className="absolute top-6 right-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <div className="w-full h-40 bg-dark-800 rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center group/newsimg relative">
                        {post.image ? <img src={post.image} className="w-full h-full object-cover" /> : <i className="fa-solid fa-newspaper text-4xl text-slate-700"></i>}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/newsimg:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <i className="fa-solid fa-camera text-white"></i>
                          <input type="file" onChange={(e) => handleNewsImageUpload(post.id, e)} className="hidden" accept="image/*" />
                        </label>
                      </div>
                      <input type="date" value={post.date} onChange={(e) => setEditData({ ...editData, news: editData.news.map(n => n.id === post.id ? { ...n, date: e.target.value } : n) })} className="w-full bg-dark-900 border border-slate-700 rounded-xl p-3 text-brand-400 font-black text-xs" />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <input value={post.title} onChange={(e) => setEditData({ ...editData, news: editData.news.map(n => n.id === post.id ? { ...n, title: e.target.value } : n) })} className="w-full bg-dark-900 border border-slate-700 rounded-xl p-4 text-white font-black text-xl uppercase italic" placeholder="Headline" />
                      <textarea value={post.content} onChange={(e) => setEditData({ ...editData, news: editData.news.map(n => n.id === post.id ? { ...n, content: e.target.value } : n) })} className="w-full bg-dark-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm leading-relaxed" rows={5} placeholder="Full Story Body..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inquiry Inbox */}
          <section id="admin-section-messages" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h3 className="text-2xl font-black text-white uppercase">Inquiry Inbox</h3>
              <button onClick={fetchInquiries} className="text-slate-400 hover:text-white transition-colors"><i className="fa-solid fa-rotate"></i> Refresh</button>
            </div>
            <div className="space-y-4">
              {inquiries.length > 0 ? inquiries.map((entry) => (
                <div key={entry.id} className="glass-card p-6 rounded-2xl border border-slate-700/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold text-lg">{entry.name}</h4>
                      <p className="text-brand-400 text-xs font-medium">{entry.email}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-dark-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{entry.message}"</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-dark-800/50 rounded-3xl border border-dashed border-slate-800">
                  <i className="fa-solid fa-inbox text-4xl text-slate-700 mb-4 block"></i>
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Communication records clear.</p>
                </div>
              )}
            </div>
          </section>

          <div className="text-center pt-20 border-t border-slate-800">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.6em]">End of Operational Registry</p>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;