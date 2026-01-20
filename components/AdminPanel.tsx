
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { PortfolioData, Project, TimelineItem, Skill, Award, NewsPost, ContactInquiry, Achievement } from '../types';
import { supabase, checkCloudHealth } from '../supabaseClient';

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudOk, setCloudOk] = useState(true);
  
  // Cropping State
  const [cropModal, setCropModal] = useState<{ 
    isOpen: boolean; 
    image: string; 
    field: 'profilePic' | 'coverPhoto' | { type: 'project' | 'experience', id: string } 
  }>({
    isOpen: false,
    image: '',
    field: 'profilePic'
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'general', label: 'General Info', icon: 'fa-id-card' },
    { id: 'skills', label: 'Skills', icon: 'fa-screwdriver-wrench' },
    { id: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
    { id: 'experience', label: 'Experience', icon: 'fa-timeline' },
    { id: 'awards', label: 'Awards', icon: 'fa-medal' },
    { id: 'news', label: 'News Archive', icon: 'fa-newspaper' },
    { id: 'messages', label: 'Visitor Entries', icon: 'fa-inbox' },
  ];

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    fetchInquiries();
    
    // Check cloud health on open
    checkCloudHealth().then(res => setCloudOk(res.ok));

    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error("Failed to fetch inquiries", err);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

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
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.5): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
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

  const handleImageUploadTrigger = (field: typeof cropModal.field, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropModal({ isOpen: true, image: reader.result as string, field });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleNewsPhotoUpload = (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setEditData(prev => ({
          ...prev,
          news: prev.news.map(n => {
            if (n.id === postId) {
              const currentImages = n.images || [];
              if (currentImages.length >= 6) return n;
              return { ...n, images: [...currentImages, base64] };
            }
            return n;
          })
        }));
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
      const isSquare = cropModal.field === 'profilePic' || (typeof cropModal.field === 'object' && (cropModal.field.type === 'experience' || cropModal.field.type === 'project'));
      const compressed = await compressImage(croppedBase64, isSquare ? 400 : 1200, isSquare ? 400 : 675);
      
      if (typeof cropModal.field === 'string') {
        setEditData({ ...editData, profile: { ...editData.profile, [cropModal.field]: compressed } });
      } else {
        const { type, id } = cropModal.field;
        if (type === 'project') {
          setEditData({ ...editData, projects: editData.projects.map(p => p.id === id ? { ...p, logo: compressed } : p) });
        } else if (type === 'experience') {
          setEditData({ ...editData, timeline: editData.timeline.map(t => t.id === id ? { ...t, logo: compressed } : t) });
        }
      }
      
      setCropModal({ ...cropModal, isOpen: false });
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`admin-section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const deleteNewsImage = (postId: string, imgIndex: number) => {
    setEditData({
      ...editData,
      news: editData.news.map(n => n.id === postId ? { ...n, images: n.images.filter((_, i) => i !== imgIndex) } : n)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#111827] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300 font-sans selection:bg-blue-600/30 selection:text-white">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-[#1e293b]/50 border-r border-slate-800 p-8 flex flex-col shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="w-12 h-12 bg-[#2563eb] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
            <i className="fa-solid fa-user-gear text-white text-xl"></i>
          </div>
          <h2 className="text-white font-black uppercase tracking-tight text-2xl">Admin Desk</h2>
        </div>

        {/* Sync Indicator */}
        <div className={`mx-2 mb-6 p-3 rounded-xl border flex items-center gap-3 transition-colors ${cloudOk ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/5 border-orange-500/20 text-orange-400'}`}>
          <div className={`w-2 h-2 rounded-full ${cloudOk ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest">{cloudOk ? 'Cloud Sync Active' : 'Offline Mode (Local Only)'}</span>
        </div>

        <nav className="flex-1 space-y-2 mb-10 overflow-y-auto no-scrollbar pr-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-base ${
                activeSection === s.id ? 'bg-[#2563eb] text-white shadow-xl shadow-blue-600/20 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
              }`}
            >
              <i className={`fa-solid ${s.icon} w-6 text-xl`}></i>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4 pt-8 border-t border-slate-800/80">
          <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 disabled:opacity-50 uppercase tracking-widest active:scale-95">
            {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-lock text-sm"></i>}
            {cloudOk ? 'Save & Sync' : 'Save Locally'}
          </button>
          <button onClick={onLogout} className="w-full border-2 border-red-500/20 hover:bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 active:scale-95">
            <i className="fa-solid fa-power-off"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={mainScrollRef}
        className="flex-1 overflow-y-auto p-8 md:p-16 space-y-32 bg-gradient-to-br from-[#111827] via-[#111827] to-[#1e293b] custom-scrollbar pb-48"
      >
        {/* General Profile */}
        <section id="admin-section-general" className="scroll-mt-20">
          <div className="mb-12">
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">General Profile</h3>
            <div className="h-[2px] w-full bg-slate-800"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Full Name</label>
                <input 
                  value={editData.profile.fullName} 
                  onChange={(e) => setEditData({...editData, profile: {...editData.profile, fullName: e.target.value}})} 
                  className="w-full bg-[#1e293b] border-2 border-slate-800/40 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Short Name</label>
                <input 
                  value={editData.profile.name} 
                  onChange={(e) => setEditData({...editData, profile: {...editData.profile, name: e.target.value}})} 
                  className="w-full bg-[#1e293b] border-2 border-slate-800/40 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Location</label>
                <input 
                  value={editData.profile.location} 
                  onChange={(e) => setEditData({...editData, profile: {...editData.profile, location: e.target.value}})} 
                  className="w-full bg-[#1e293b] border-2 border-slate-800/40 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Bio</label>
                <textarea 
                  value={editData.profile.bio} 
                  onChange={(e) => setEditData({...editData, profile: {...editData.profile, bio: e.target.value}})} 
                  rows={5} 
                  className="w-full bg-[#1e293b] border-2 border-slate-800/40 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-all resize-none leading-relaxed shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-12">
              <div className="p-8 bg-[#1e293b]/30 rounded-[2.5rem] border border-slate-800/50">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 block">Profile Picture (Crops to Circle)</label>
                <div className="flex items-center gap-8">
                  <div className="w-28 h-28 rounded-full border-4 border-blue-500/50 p-1 shadow-2xl shadow-blue-600/10 shrink-0">
                    <img src={editData.profile.profilePic} className="w-full h-full object-cover rounded-full" alt="Profile" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <input type="file" id="pPicInput" className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger('profilePic', e)} />
                    <label htmlFor="pPicInput" className="inline-block bg-[#1e293b] hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-colors border-2 border-slate-700 active:scale-95 shadow-lg">Choose File</label>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">Recommended: Square Aspect Ratio</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-[#1e293b]/30 rounded-[2.5rem] border border-slate-800/50">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 block">Cover Photo (Crops to 16:9)</label>
                <div className="flex items-center gap-8">
                  <div className="w-40 h-24 rounded-2xl border-4 border-blue-500/50 overflow-hidden shrink-0 bg-slate-900 shadow-2xl">
                    <img src={editData.profile.coverPhoto} className="w-full h-full object-cover" alt="Cover" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <input type="file" id="cPhotoInput" className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger('coverPhoto', e)} />
                    <label htmlFor="cPhotoInput" className="inline-block bg-[#1e293b] hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-colors border-2 border-slate-700 active:scale-95 shadow-lg">Choose File</label>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">Recommended: 1920x1080px</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Matrix */}
        <section id="admin-section-skills" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Expertise Matrix</h3>
              <div className="h-[2px] w-48 bg-slate-800"></div>
            </div>
            <button 
              onClick={() => {
                const newSkill: Skill = { id: Date.now().toString(), title: 'New Category', icon: 'fa-star', color: 'border-blue-500', items: ['Skill 1'] };
                setEditData({ ...editData, skills: [...editData.skills, newSkill] });
              }}
              className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              + Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {editData.skills.map((skill, idx) => (
              <div key={skill.id} className="bg-[#1e293b] p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl group relative hover:border-blue-500/20 transition-all duration-500">
                <button 
                  onClick={() => setEditData({...editData, skills: editData.skills.filter(s => s.id !== skill.id)})}
                  className="absolute top-8 right-8 text-slate-700 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-trash-can text-lg"></i>
                </button>
                <div className="flex items-center gap-4 mb-8">
                   <input 
                    value={skill.title} 
                    onChange={(e) => {
                      const newSkills = [...editData.skills];
                      newSkills[idx].title = e.target.value;
                      setEditData({ ...editData, skills: newSkills });
                    }}
                    className="bg-transparent border-none text-2xl font-black text-white p-0 focus:outline-none flex-1"
                    placeholder="Category Name"
                  />
                </div>
                
                <div className="space-y-4 mb-8">
                  {skill.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-4 group/item">
                      <input 
                        value={item}
                        onChange={(e) => {
                          const newSkills = [...editData.skills];
                          newSkills[idx].items[itemIdx] = e.target.value;
                          setEditData({ ...editData, skills: newSkills });
                        }}
                        className="flex-1 bg-[#111827]/50 border-2 border-slate-800/50 rounded-xl px-5 py-3 text-sm text-slate-300 font-bold outline-none focus:border-blue-500/50 transition-all"
                      />
                      <button 
                        onClick={() => {
                          const newSkills = [...editData.skills];
                          newSkills[idx].items = newSkills[idx].items.filter((_, i) => i !== itemIdx);
                          setEditData({ ...editData, skills: newSkills });
                        }}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => {
                    const newSkills = [...editData.skills];
                    newSkills[idx].items.push('New Skill');
                    setEditData({ ...editData, skills: newSkills });
                  }}
                  className="text-blue-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  + Add Skill
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Initiatives */}
        <section id="admin-section-projects" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Featured Initiatives</h3>
              <div className="h-[2px] w-48 bg-slate-800"></div>
            </div>
            <button 
              onClick={() => {
                const newProj: Project = { id: Date.now().toString(), title: 'New Initiative', category: 'General', description: 'Brief description...', icon: 'fa-rocket', color: 'from-blue-600' };
                setEditData({ ...editData, projects: [...editData.projects, newProj] });
              }}
              className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              + Project
            </button>
          </div>

          <div className="space-y-12">
            {editData.projects.map((proj, pIdx) => (
              <div key={proj.id} className="bg-[#1e293b] p-10 md:p-14 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative">
                <button 
                  onClick={() => setEditData({...editData, projects: editData.projects.filter(p => p.id !== proj.id)})}
                  className="absolute top-10 right-10 text-red-500 hover:text-red-400 transition-colors"
                >
                  <i className="fa-solid fa-trash-can text-xl"></i>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4 space-y-8">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Main Brand Logo</label>
                      <div className="flex flex-col gap-4">
                        <div className="w-32 h-32 rounded-[1.5rem] bg-[#111827] border-2 border-slate-800 flex items-center justify-center overflow-hidden p-4 shadow-inner">
                          {proj.logo ? (
                            <img src={proj.logo} className="w-full h-full object-contain" alt="Logo" />
                          ) : (
                            <i className={`fa-solid ${proj.icon} text-4xl text-slate-700`}></i>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                           <input type="file" id={`pLogo-${proj.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger({type: 'project', id: proj.id}, e)} />
                           <label htmlFor={`pLogo-${proj.id}`} className="bg-[#1e293b] hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors border border-slate-700">Choose File</label>
                           <span className="text-[9px] text-slate-600 font-bold uppercase truncate max-w-[100px]">No file chosen</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Category</label>
                      <input 
                        value={proj.category} 
                        onChange={(e) => {
                          const newProjects = [...editData.projects];
                          newProjects[pIdx].category = e.target.value;
                          setEditData({ ...editData, projects: newProjects });
                        }}
                        className="w-full bg-[#111827]/50 border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500/50 transition-all text-sm" 
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Project Title</label>
                        <input 
                          value={proj.title} 
                          onChange={(e) => {
                            const newProjects = [...editData.projects];
                            newProjects[pIdx].title = e.target.value;
                            setEditData({ ...editData, projects: newProjects });
                          }}
                          className="w-full bg-[#111827] border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-blue-500 transition-all text-xl uppercase tracking-tighter" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Launch Link (URL)</label>
                        <input 
                          value={proj.link || ''} 
                          onChange={(e) => {
                            const newProjects = [...editData.projects];
                            newProjects[pIdx].link = e.target.value;
                            setEditData({ ...editData, projects: newProjects });
                          }}
                          className="w-full bg-[#111827]/50 border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-blue-400 font-bold outline-none focus:border-blue-500 transition-all text-sm font-mono" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Description</label>
                      <textarea 
                        value={proj.description} 
                        onChange={(e) => {
                          const newProjects = [...editData.projects];
                          newProjects[pIdx].description = e.target.value;
                          setEditData({ ...editData, projects: newProjects });
                        }}
                        rows={3} 
                        className="w-full bg-[#111827]/50 border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-slate-300 font-bold outline-none focus:border-blue-500 transition-all text-sm leading-relaxed shadow-inner" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Verified Achievements</label>
                      <div className="space-y-3 mb-4">
                        {(proj.achievements || []).map((ach, aIdx) => {
                          const text = typeof ach === 'string' ? ach : ach.text;
                          return (
                            <div key={aIdx} className="flex items-center gap-4">
                              <input 
                                value={text} 
                                onChange={(e) => {
                                  const newProjects = [...editData.projects];
                                  const achievements = [...(newProjects[pIdx].achievements || [])];
                                  if (typeof ach === 'string') achievements[aIdx] = e.target.value;
                                  else achievements[aIdx] = { ...ach, text: e.target.value };
                                  newProjects[pIdx].achievements = achievements;
                                  setEditData({ ...editData, projects: newProjects });
                                }}
                                className="flex-1 bg-[#111827]/80 border border-slate-800/80 rounded-xl px-5 py-3 text-xs text-slate-200 font-bold outline-none focus:border-blue-500/50" 
                              />
                              <button 
                                onClick={() => {
                                  const newProjects = [...editData.projects];
                                  newProjects[pIdx].achievements = newProjects[pIdx].achievements?.filter((_, i) => i !== aIdx);
                                  setEditData({ ...editData, projects: newProjects });
                                }}
                                className="text-slate-600 hover:text-slate-400 transition-colors"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <button 
                        onClick={() => {
                          const newProjects = [...editData.projects];
                          newProjects[pIdx].achievements = [...(newProjects[pIdx].achievements || []), 'New Achievement'];
                          setEditData({ ...editData, projects: newProjects });
                        }}
                        className="text-emerald-500 hover:text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors"
                      >
                        + Add Milestone
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience History */}
        <section id="admin-section-experience" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Experience History</h3>
              <div className="h-[2px] w-48 bg-slate-800"></div>
            </div>
            <button 
              onClick={() => {
                const newItem: TimelineItem = { id: Date.now().toString(), date: 'New Date', title: 'New Role', subtitle: 'Organization', type: 'professional', icon: 'fa-briefcase', description: 'Summary...', details: ['Key detail...'] };
                setEditData({ ...editData, timeline: [newItem, ...editData.timeline] });
              }}
              className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              + Milestone
            </button>
          </div>

          <div className="space-y-12">
            {editData.timeline.map((item, tIdx) => (
              <div key={item.id} className="bg-[#1e293b] p-10 md:p-14 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative">
                <button 
                  onClick={() => setEditData({...editData, timeline: editData.timeline.filter(t => t.id !== item.id)})}
                  className="absolute top-10 right-10 text-red-500 hover:text-red-400 transition-colors"
                >
                  <i className="fa-solid fa-trash-can text-xl"></i>
                </button>

                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-56 shrink-0 space-y-6">
                    <div className="w-24 h-24 rounded-2xl bg-[#111827] border-2 border-slate-800 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                      {item.logo ? (
                        <img src={item.logo} alt="Org Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <i className={`fa-solid ${item.icon} text-3xl text-slate-700`}></i>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <input type="file" id={`tLogo-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger({type: 'experience', id: item.id}, e)} />
                      <label htmlFor={`tLogo-${item.id}`} className="bg-[#1e293b] hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-colors border border-slate-700 text-center">Choose File</label>
                      <span className="text-[8px] text-slate-600 font-bold uppercase truncate text-center">No file chosen</span>
                    </div>
                    <input 
                      value={item.date} 
                      onChange={(e) => {
                        const newTimeline = [...editData.timeline];
                        newTimeline[tIdx].date = e.target.value;
                        setEditData({ ...editData, timeline: newTimeline });
                      }}
                      className="w-full bg-[#111827] border border-slate-800/50 rounded-xl px-4 py-3 text-blue-400 font-black uppercase text-[10px] tracking-widest text-center shadow-inner" 
                    />
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <input 
                        value={item.title} 
                        onChange={(e) => {
                          const newTimeline = [...editData.timeline];
                          newTimeline[tIdx].title = e.target.value;
                          setEditData({ ...editData, timeline: newTimeline });
                        }}
                        className="flex-1 bg-[#111827] border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-blue-500 transition-all text-xl tracking-tight" 
                        placeholder="Degree/Role"
                      />
                      <input 
                        value={item.subtitle} 
                        onChange={(e) => {
                          const newTimeline = [...editData.timeline];
                          newTimeline[tIdx].subtitle = e.target.value;
                          setEditData({ ...editData, timeline: newTimeline });
                        }}
                        className="flex-1 bg-[#111827]/40 border border-slate-800/50 rounded-2xl px-6 py-4 text-blue-400 font-bold outline-none focus:border-blue-500/50 transition-all text-lg" 
                        placeholder="Institution"
                      />
                    </div>
                    
                    <textarea 
                      value={item.description} 
                      onChange={(e) => {
                        const newTimeline = [...editData.timeline];
                        newTimeline[tIdx].description = e.target.value;
                        setEditData({ ...editData, timeline: newTimeline });
                      }}
                      rows={3} 
                      className="w-full bg-[#111827]/50 border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-slate-300 font-bold outline-none focus:border-blue-500 transition-all text-sm leading-relaxed" 
                      placeholder="Overall description..."
                    />

                    <div className="space-y-3">
                      {item.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-4">
                          <input 
                            value={detail} 
                            onChange={(e) => {
                              const newTimeline = [...editData.timeline];
                              const details = [...newTimeline[tIdx].details];
                              details[dIdx] = e.target.value;
                              newTimeline[tIdx].details = details;
                              setEditData({ ...editData, timeline: newTimeline });
                            }}
                            className="flex-1 bg-[#111827]/80 border border-slate-800/80 rounded-xl px-5 py-3 text-[11px] text-slate-300 font-bold outline-none focus:border-blue-500/50" 
                          />
                          <button 
                            onClick={() => {
                              const newTimeline = [...editData.timeline];
                              newTimeline[tIdx].details = newTimeline[tIdx].details.filter((_, i) => i !== dIdx);
                              setEditData({ ...editData, timeline: newTimeline });
                            }}
                            className="text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newTimeline = [...editData.timeline];
                          newTimeline[tIdx].details.push('New Key Milestone');
                          setEditData({ ...editData, timeline: newTimeline });
                        }}
                        className="text-blue-500 hover:text-blue-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-colors mt-2"
                      >
                        + Add Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Awards & Accolades */}
        <section id="admin-section-awards" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Awards & Accolades</h3>
              <div className="h-[2px] w-48 bg-slate-800"></div>
            </div>
            <button 
              onClick={() => {
                const newAward: Award = { id: Date.now().toString(), title: 'New Award', detail: 'Description', icon: 'fa-award' };
                setEditData({ ...editData, awards: [...editData.awards, newAward] });
              }}
              className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              + Award
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {editData.awards.map((award, aIdx) => (
              <div key={award.id} className="bg-[#1e293b] p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative flex gap-8 items-center group">
                <button 
                  onClick={() => setEditData({...editData, awards: editData.awards.filter(a => a.id !== award.id)})}
                  className="absolute top-6 right-6 text-red-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
                <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-center text-2xl text-slate-500 shrink-0 shadow-inner">
                  <i className={`fa-solid ${award.icon}`}></i>
                </div>
                <div className="flex-1 space-y-3">
                  <input 
                    value={award.title} 
                    onChange={(e) => {
                      const newAwards = [...editData.awards];
                      newAwards[aIdx].title = e.target.value;
                      setEditData({ ...editData, awards: newAwards });
                    }}
                    className="w-full bg-[#111827] border-2 border-slate-800/50 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-blue-500 transition-all shadow-inner" 
                    placeholder="Award Title"
                  />
                  <input 
                    value={award.detail} 
                    onChange={(e) => {
                      const newAwards = [...editData.awards];
                      newAwards[aIdx].detail = e.target.value;
                      setEditData({ ...editData, awards: newAwards });
                    }}
                    className="w-full bg-[#111827] border-2 border-slate-800/50 rounded-xl px-4 py-3 text-blue-400 font-bold outline-none focus:border-blue-500 shadow-inner" 
                    placeholder="Recipient/Details"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* News Desk Archive */}
        <section id="admin-section-news" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">News Archive</h3>
              <div className="h-[2px] w-48 bg-slate-800"></div>
            </div>
            <button 
              onClick={() => {
                const newPost: NewsPost = { id: Date.now().toString(), title: 'Breaking News Headline', content: 'Story details...', author: 'News Desk', date: new Date().toISOString(), likes: 0, comments: [], images: [] };
                setEditData({ ...editData, news: [newPost, ...editData.news] });
              }}
              className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              + News Post
            </button>
          </div>

          <div className="space-y-12">
            {editData.news.map((post, nIdx) => (
              <div key={post.id} className="bg-[#1e293b] p-10 md:p-14 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative">
                <button 
                  onClick={() => setEditData({...editData, news: editData.news.filter(p => p.id !== post.id)})}
                  className="absolute top-10 right-10 text-red-500 hover:text-red-400 transition-colors"
                >
                  <i className="fa-solid fa-trash-can text-xl"></i>
                </button>

                <div className="space-y-6 mb-8">
                  {/* Headline Row */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2">Headline</label>
                    <input 
                      value={post.title} 
                      onChange={(e) => {
                        const newNews = [...editData.news];
                        newNews[nIdx].title = e.target.value;
                        setEditData({ ...editData, news: newNews });
                      }}
                      className="w-full bg-[#111827] border-2 border-slate-800/50 rounded-2xl px-6 py-4 text-white font-black italic uppercase tracking-tighter outline-none focus:border-blue-500 transition-all text-xl shadow-inner" 
                      placeholder="Headline..."
                    />
                  </div>

                  {/* Author and Date Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2">Author</label>
                      <input 
                        value={post.author} 
                        onChange={(e) => {
                          const newNews = [...editData.news];
                          newNews[nIdx].author = e.target.value;
                          setEditData({ ...editData, news: newNews });
                        }}
                        className="w-full bg-[#111827] border-2 border-slate-800/50 rounded-xl px-5 py-3 text-sm text-slate-200 font-bold outline-none focus:border-blue-500/50 shadow-inner" 
                        placeholder="e.g. News Desk"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2">Publication Date</label>
                      <input 
                        type="date"
                        value={post.date.split('T')[0]} 
                        onChange={(e) => {
                          const newNews = [...editData.news];
                          // Convert the date picker YYYY-MM-DD to ISO string while preserving the time if possible or just fresh ISO
                          newNews[nIdx].date = new Date(e.target.value).toISOString();
                          setEditData({ ...editData, news: newNews });
                        }}
                        className="w-full bg-[#111827] border-2 border-slate-800/50 rounded-xl px-5 py-3 text-sm text-blue-400 font-bold outline-none focus:border-blue-500/50 shadow-inner [color-scheme:dark]" 
                      />
                    </div>
                  </div>

                  {/* Content Row */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2">Article Content</label>
                    <textarea 
                      value={post.content} 
                      onChange={(e) => {
                        const newNews = [...editData.news];
                        newNews[nIdx].content = e.target.value;
                        setEditData({ ...editData, news: newNews });
                      }}
                      rows={6} 
                      className="w-full bg-[#111827]/50 border-2 border-slate-800/50 rounded-[1.5rem] px-6 py-4 text-slate-300 font-bold outline-none focus:border-blue-500 transition-all text-sm leading-relaxed shadow-inner" 
                      placeholder="Article text..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Photo Gallery (Direct Upload - Max 6 photos)</label>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">{(post.images || []).length} / 6</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {(post.images || []).map((img, iIdx) => (
                      <div key={iIdx} className="relative aspect-square rounded-xl bg-[#111827] border border-slate-800 group overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" alt={`Post image ${iIdx + 1}`} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          <button 
                            onClick={() => deleteNewsImage(post.id, iIdx)}
                            className="text-white hover:text-red-400 transition-colors w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center backdrop-blur-md"
                          >
                            <i className="fa-solid fa-trash text-sm"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    {(post.images || []).length < 6 && (
                      <label className="aspect-square rounded-xl bg-slate-800/50 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-all group">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => handleNewsPhotoUpload(post.id, e)} 
                        />
                        <i className="fa-solid fa-plus text-slate-500 mb-2 group-hover:scale-125 transition-transform"></i>
                        <span className="text-[9px] font-black text-slate-600 uppercase">Add Photo</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inquiry Inbox */}
        <section id="admin-section-messages" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Inquiry Inbox</h3>
              <div className="h-[2px] w-48 bg-slate-800"></div>
            </div>
            <button onClick={fetchInquiries} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">
              <i className={`fa-solid fa-arrows-rotate ${isLoadingInquiries ? 'animate-spin' : ''}`}></i> Refresh
            </button>
          </div>

          <div className="space-y-6">
            {inquiries.length > 0 ? inquiries.map((inq) => (
              <div key={inq.id} className="bg-[#1e293b] p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col gap-6 relative group hover:border-blue-500/20 transition-all duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-black text-xl mb-1">{inq.name}</h4>
                    <p className="text-blue-400 font-bold text-sm font-mono">{inq.email}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(inq.created_at).toLocaleDateString()}</span>
                </div>
                <div className="bg-[#111827]/50 border border-slate-800/50 rounded-2xl p-6 italic text-slate-400 font-medium text-base shadow-inner">
                  "{inq.message}"
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-800">
                <i className="fa-solid fa-inbox text-4xl text-slate-800 mb-6 block"></i>
                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">The vault is empty</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modern Cropper Modal - Only for profile/experience/project images */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0f172a] flex flex-col p-4 md:p-10">
          <div className="flex-1 relative rounded-[3rem] overflow-hidden border-4 border-slate-800 shadow-2xl">
            <Cropper
              image={cropModal.image}
              crop={crop}
              zoom={zoom}
              aspect={cropModal.field === 'profilePic' || (typeof cropModal.field === 'object' && (cropModal.field.type === 'experience' || cropModal.field.type === 'project')) ? 1 : 16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="p-8 bg-[#1e293b] border-2 border-slate-800 mt-6 rounded-[2.5rem] flex flex-col md:flex-row gap-8 justify-center items-center shadow-2xl">
             <div className="flex-1 max-w-sm">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block text-center">Adjust Zoom Level</label>
                <input 
                  type="range" value={zoom} min={1} max={3} step={0.1} 
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
             </div>
             <div className="flex gap-4">
                <button onClick={() => setCropModal({ ...cropModal, isOpen: false } as any)} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-700 transition-colors border border-slate-700 active:scale-95">Cancel</button>
                <button onClick={handleCropSave} disabled={isProcessingImage} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-blue-500 shadow-xl shadow-blue-600/30 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-3">
                  {isProcessingImage ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                  Finalize & Save
                </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; border: 3px solid #111827; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type="range"] {
          height: 6px;
          -webkit-appearance: none;
          background: #334155;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
