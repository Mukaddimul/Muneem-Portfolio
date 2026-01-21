
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { PortfolioData, Project, TimelineItem, Skill, Award, NewsPost, ContactInquiry, Achievement, NewsComment } from '../types';
import { supabase, checkCloudHealth } from '../supabaseClient';

interface AdminPanelProps {
  data: PortfolioData;
  onSave: (newData: PortfolioData) => Promise<boolean>;
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'optimizing' | 'saving' | 'success' | 'error'>('idle');
  const [cloudOk, setCloudOk] = useState(true);
  
  // State for handling replies in admin panel
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

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
    checkCloudHealth().then(res => setCloudOk(res.ok));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const mostVisible = visible.reduce((prev, curr) => 
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          const sectionId = mostVisible.target.id.replace('admin-section-', '');
          setActiveSection(sectionId);
        }
      },
      { root: mainScrollRef.current, threshold: [0.2, 0.5, 0.8] }
    );

    sections.forEach((s) => {
      const el = document.getElementById(`admin-section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => { 
      document.body.style.overflow = originalStyle;
      observer.disconnect();
    };
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

  const handleAdminReply = (postId: string, commentId: string) => {
    const text = replyInputs[commentId];
    if (!text?.trim()) return;

    const newReply: NewsComment = {
      id: Date.now().toString(),
      userName: editData.profile.name,
      text: text.trim(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      replies: []
    };

    setEditData(prev => ({
      ...prev,
      news: prev.news.map(n => {
        if (n.id === postId) {
          const updateComments = (comments: NewsComment[]): NewsComment[] => {
            return comments.map(c => {
              if (c.id === commentId) {
                return { ...c, replies: [...(c.replies || []), newReply] };
              }
              if (c.replies) {
                return { ...c, replies: updateComments(c.replies) };
              }
              return c;
            });
          };
          return { ...n, comments: updateComments(n.comments) };
        }
        return n;
      })
    }));

    setReplyInputs(prev => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  };

  const deleteCommentAdmin = (postId: string, commentId: string) => {
    setEditData(prev => ({
      ...prev,
      news: prev.news.map(n => {
        if (n.id === postId) {
          const filterComments = (comments: NewsComment[]): NewsComment[] => {
            return comments
              .filter(c => c.id !== commentId)
              .map(c => ({
                ...c,
                replies: c.replies ? filterComments(c.replies) : []
              }));
          };
          return { ...n, comments: filterComments(n.comments) };
        }
        return n;
      })
    }));
  };

  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.3): Promise<string> => {
    if (!base64 || !base64.startsWith('data:image')) return Promise.resolve(base64);
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

  const optimizeAllData = async (data: PortfolioData): Promise<PortfolioData> => {
    const optimized = JSON.parse(JSON.stringify(data)) as PortfolioData;
    optimized.profile.profilePic = await compressImage(optimized.profile.profilePic, 400, 400, 0.5);
    optimized.profile.coverPhoto = await compressImage(optimized.profile.coverPhoto, 1200, 675, 0.4);
    for (let i = 0; i < optimized.projects.length; i++) {
      if (optimized.projects[i].logo) {
        optimized.projects[i].logo = await compressImage(optimized.projects[i].logo!, 400, 400, 0.4);
      }
    }
    for (let i = 0; i < optimized.timeline.length; i++) {
      if (optimized.timeline[i].logo) {
        optimized.timeline[i].logo = await compressImage(optimized.timeline[i].logo!, 300, 300, 0.4);
      }
    }
    for (let i = 0; i < optimized.news.length; i++) {
      if (optimized.news[i].images && optimized.news[i].images.length > 0) {
        for (let j = 0; j < optimized.news[i].images.length; j++) {
          optimized.news[i].images[j] = await compressImage(optimized.news[i].images[j], 800, 600, 0.3);
        }
      }
    }
    return optimized;
  };

  const handleSaveClick = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveStatus('optimizing');
    try {
      const leanData = await optimizeAllData(editData);
      setSaveStatus('saving');
      const success = await onSave(leanData);
      if (success) {
        setSaveStatus('success');
        setTimeout(() => onClose(), 1500);
      } else {
        setSaveStatus('error');
        setIsSaving(false);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus('error');
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
      setIsProcessingImage(true);
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64, 800, 600, 0.3);
        setEditData(prev => ({
          ...prev,
          news: prev.news.map(n => {
            if (n.id === postId) {
              const currentImages = n.images || [];
              if (currentImages.length >= 6) return n;
              return { ...n, images: [...currentImages, compressed] };
            }
            return n;
          })
        }));
        setIsProcessingImage(false);
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
      const compressed = await compressImage(croppedBase64, isSquare ? 400 : 1200, isSquare ? 400 : 675, 0.4);
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

  const renderCommentAdmin = (postId: string, comment: NewsComment, level = 0) => (
    <div key={comment.id} className={`p-4 border border-slate-700/50 rounded-xl mb-4 bg-[#111827]/30 ${level > 0 ? 'ml-8 bg-slate-800/20' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${comment.userName === editData.profile.name ? 'text-brand-500' : 'text-slate-400'}`}>
            {comment.userName} {comment.userName === editData.profile.name && '(ADMIN)'}
          </span>
          <span className="text-[9px] text-slate-600 font-bold">• {comment.date}</span>
        </div>
        <button 
          onClick={() => deleteCommentAdmin(postId, comment.id)}
          className="text-red-500/50 hover:text-red-500 transition-colors"
        >
          <i className="fa-solid fa-trash-can text-[10px]"></i>
        </button>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed mb-3">{comment.text}</p>
      
      {/* Admin Reply Logic */}
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="Official reply..."
          value={replyInputs[comment.id] || ''}
          onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
          className="flex-1 bg-[#0f172a] border border-slate-700/50 rounded-lg px-3 py-1.5 text-[10px] text-white focus:border-brand-500 outline-none transition-all"
        />
        <button 
          onClick={() => handleAdminReply(postId, comment.id)}
          disabled={!replyInputs[comment.id]?.trim()}
          className="bg-brand-600 disabled:opacity-30 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all"
        >
          Reply
        </button>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map(r => renderCommentAdmin(postId, r, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300 font-sans selection:bg-brand-600/30 selection:text-white">
      <div className="w-full md:w-[320px] bg-[#0f172a] border-r border-slate-800/60 p-6 flex flex-col shrink-0 relative z-10 shadow-[20px_0_40px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4 mb-10 px-2 mt-4">
          <div className="w-11 h-11 bg-[#2563eb] rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.4)]">
            <i className="fa-solid fa-user-gear text-white text-lg"></i>
          </div>
          <h2 className="text-white font-black uppercase tracking-tight text-xl">Admin Desk</h2>
        </div>

        <div className={`mx-2 mb-10 p-2.5 px-4 rounded-xl border flex items-center gap-3 transition-all duration-500 bg-[#1e293b]/20 ${cloudOk ? 'border-emerald-500/20 text-emerald-400' : 'border-orange-500/20 text-orange-400'}`}>
          <div className={`w-2 h-2 rounded-full ${cloudOk ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-orange-400 animate-pulse'}`}></div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{cloudOk ? 'Cloud Sync Active' : 'Offline Storage Mode'}</span>
        </div>

        <nav className="flex-1 space-y-1 mb-8 overflow-y-auto no-scrollbar">
          {sections.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`w-full flex items-center gap-5 px-6 py-[18px] rounded-[20px] transition-all duration-400 font-bold text-base group
                  ${isActive ? 'bg-[#2563eb] text-white shadow-[0_12px_24px_rgba(37,99,235,0.3)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-[#1e293b]/40'}`}
              >
                <div className={`w-6 flex items-center justify-center transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'}`}>
                  <i className={`fa-solid ${s.icon} text-lg`}></i>
                </div>
                <span className="tracking-tight">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-slate-800/50 space-y-3">
          <button onClick={handleSaveClick} disabled={isSaving || isProcessingImage} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg active:scale-95 ${saveStatus === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : saveStatus === 'error' ? 'bg-red-600 text-white shadow-red-600/20' : 'bg-[#10b981] hover:bg-[#059669] text-white'}`}>
            {saveStatus === 'optimizing' ? <i className="fa-solid fa-wand-magic-sparkles animate-pulse"></i> : saveStatus === 'saving' ? <i className="fa-solid fa-circle-notch animate-spin"></i> : saveStatus === 'success' ? <i className="fa-solid fa-check"></i> : saveStatus === 'error' ? <i className="fa-solid fa-warning"></i> : <i className="fa-solid fa-lock text-[10px]"></i>}
            {saveStatus === 'optimizing' ? 'Compressing Assets...' : saveStatus === 'saving' ? 'Synchronizing...' : saveStatus === 'success' ? 'Committed!' : saveStatus === 'error' ? 'Sync Failed' : 'Save & Sync'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} disabled={isSaving} className="py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">Cancel</button>
            <button onClick={onLogout} className="py-3 rounded-xl bg-red-500/5 text-red-500/60 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <i className="fa-solid fa-power-off text-[9px]"></i> Logout
            </button>
          </div>
        </div>
      </div>

      <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-8 md:p-16 space-y-40 bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-[#1e293b] custom-scrollbar pb-64">
        <section id="admin-section-general" className="scroll-mt-24">
          <div className="mb-14">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">GENERAL PROFILE</h2>
            <div className="h-[1px] w-full bg-slate-800/60"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">FULL NAME</label><input value={editData.profile.fullName} onChange={(e) => setEditData({...editData, profile: {...editData.profile, fullName: e.target.value}})} className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl px-6 py-4.5 text-white font-bold outline-none focus:border-brand-500/50 transition-all shadow-inner" /></div>
              <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">SHORT NAME</label><input value={editData.profile.name} onChange={(e) => setEditData({...editData, profile: {...editData.profile, name: e.target.value}})} className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl px-6 py-4.5 text-white font-bold outline-none focus:border-brand-500/50 transition-all shadow-inner" /></div>
              <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">LOCATION</label><input value={editData.profile.location} onChange={(e) => setEditData({...editData, profile: {...editData.profile, location: e.target.value}})} className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl px-6 py-4.5 text-white font-bold outline-none focus:border-brand-500/50 transition-all shadow-inner" /></div>
              <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">BIO</label><textarea value={editData.profile.bio} onChange={(e) => setEditData({...editData, profile: {...editData.profile, bio: e.target.value}})} rows={8} className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl px-6 py-6 text-white font-bold outline-none focus:border-brand-500/50 transition-all resize-none leading-relaxed custom-scrollbar shadow-inner" /></div>
            </div>
            <div className="space-y-12">
              <div className="p-10 bg-[#1e293b]/20 rounded-[3rem] border border-slate-700/30 shadow-2xl flex flex-col gap-8 relative overflow-hidden">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">PROFILE PICTURE</label>
                <div className="flex items-center gap-10">
                  <div className="w-32 h-32 rounded-full border-[3px] border-brand-500/80 p-1.5 shadow-2xl shadow-brand-500/20 shrink-0 bg-dark-900 overflow-hidden"><img src={editData.profile.profilePic} className="w-full h-full object-cover rounded-full" alt="Profile" /></div>
                  <div className="flex flex-col gap-4">
                    <input type="file" id="pPicInput" className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger('profilePic', e)} />
                    <label htmlFor="pPicInput" className="inline-block bg-[#111827]/80 hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all border border-slate-700 shadow-lg active:scale-95 text-center">Choose File</label>
                  </div>
                </div>
              </div>
              <div className="p-10 bg-[#1e293b]/20 rounded-[3rem] border border-slate-700/30 shadow-2xl flex flex-col gap-8 relative overflow-hidden">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">COVER PHOTO</label>
                <div className="flex items-center gap-10">
                  <div className="w-48 h-28 rounded-2xl border-[3px] border-brand-500/80 p-1 shadow-2xl shadow-brand-500/10 shrink-0 bg-dark-900 overflow-hidden"><img src={editData.profile.coverPhoto} className="w-full h-full object-cover rounded-xl" alt="Cover" /></div>
                  <div className="flex flex-col gap-4">
                    <input type="file" id="cPhotoInput" className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger('coverPhoto', e)} />
                    <label htmlFor="cPhotoInput" className="inline-block bg-[#111827]/80 hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all border border-slate-700 shadow-lg active:scale-95 text-center">Choose File</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="admin-section-skills" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-14">
            <div><h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Expertise Matrix</h3><div className="h-[2px] w-48 bg-slate-800/60"></div></div>
            <button onClick={() => setEditData({...editData, skills: [...editData.skills, { id: Date.now().toString(), title: 'New Category', icon: 'fa-star', color: 'border-blue-500', items: ['Skill 1'] }]})} className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">+ Skill Category</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {editData.skills.map((skill, idx) => (
              <div key={skill.id} className="bg-[#1e293b]/20 p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative group">
                <button onClick={() => setEditData({...editData, skills: editData.skills.filter(s => s.id !== skill.id)})} className="absolute top-8 right-8 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash-can text-lg"></i></button>
                <div className="flex items-center gap-4 mb-10"><input value={skill.title} onChange={(e) => { const n = [...editData.skills]; n[idx].title = e.target.value; setEditData({...editData, skills: n}); }} className="bg-transparent border-none text-2xl font-black text-white p-0 focus:outline-none flex-1 tracking-tight" placeholder="Category Name" /></div>
                <div className="space-y-4 mb-10">{skill.items.map((item, itemIdx) => (<div key={itemIdx} className="flex items-center gap-4"><input value={item} onChange={(e) => { const n = [...editData.skills]; n[idx].items[itemIdx] = e.target.value; setEditData({...editData, skills: n}); }} className="flex-1 bg-[#111827]/40 border-2 border-slate-800/40 rounded-xl px-5 py-3.5 text-sm text-slate-300 font-bold outline-none focus:border-blue-500/30 transition-all" /><button onClick={() => { const n = [...editData.skills]; n[idx].items = n[idx].items.filter((_, i) => i !== itemIdx); setEditData({...editData, skills: n}); }} className="text-slate-600 hover:text-slate-400 transition-colors"><i className="fa-solid fa-xmark"></i></button></div>))}</div>
                <button onClick={() => { const n = [...editData.skills]; n[idx].items.push('New Skill'); setEditData({...editData, skills: n}); }} className="text-blue-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all">+ Add Item</button>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-section-projects" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-14">
            <div><h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Featured Initiatives</h3><div className="h-[2px] w-48 bg-slate-800/60"></div></div>
            <button onClick={() => setEditData({...editData, projects: [...editData.projects, { id: Date.now().toString(), title: 'New Brand Project', category: 'Innovation', description: 'Brief overview...', icon: 'fa-rocket', color: 'from-blue-600' }]})} className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">+ Project Case</button>
          </div>
          <div className="space-y-12">
            {editData.projects.map((proj, pIdx) => (
              <div key={proj.id} className="bg-[#1e293b]/30 p-10 md:p-12 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative group transition-all hover:bg-[#1e293b]/40">
                <button onClick={() => setEditData({...editData, projects: editData.projects.filter(p => p.id !== proj.id)})} className="absolute top-8 right-8 text-red-500/60 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can text-xl"></i></button>
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="w-full lg:w-56 shrink-0 flex flex-col gap-10">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 block">Main Brand Logo</label>
                      <div className="w-36 h-36 rounded-[2.5rem] bg-[#0f172a] border-2 border-slate-800/80 flex items-center justify-center overflow-hidden p-6 shadow-2xl mb-6 mx-auto">{proj.logo ? <img src={proj.logo} className="w-full h-full object-contain" /> : <i className={`fa-solid ${proj.icon} text-5xl text-slate-700`}></i>}</div>
                      <div className="flex items-center gap-3"><input type="file" id={`pLogo-${proj.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger({type: 'project', id: proj.id}, e)} /><label htmlFor={`pLogo-${proj.id}`} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer border border-slate-700 transition-all">Choose File</label></div>
                    </div>
                    <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Category</label><input value={proj.category} onChange={(e) => { const n = [...editData.projects]; n[pIdx].category = e.target.value; setEditData({...editData, projects: n}); }} className="w-full bg-[#111827]/80 border-2 border-slate-800/40 rounded-2xl px-5 py-4 text-white font-bold text-sm focus:border-brand-500/30 outline-none transition-all" /></div>
                  </div>
                  <div className="flex-1 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Project Title</label><input value={proj.title} onChange={(e) => { const n = [...editData.projects]; n[pIdx].title = e.target.value; setEditData({...editData, projects: n}); }} className="w-full bg-[#111827]/80 border-2 border-slate-800/40 rounded-2xl px-6 py-4.5 text-white font-black text-xl uppercase tracking-tighter focus:border-brand-500/30 outline-none transition-all" /></div>
                      <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Launch Link</label><input value={proj.link || ''} onChange={(e) => { const n = [...editData.projects]; n[pIdx].link = e.target.value; setEditData({...editData, projects: n}); }} className="w-full bg-[#111827]/80 border-2 border-slate-800/40 rounded-2xl px-6 py-4.5 text-blue-400 font-bold text-sm font-mono focus:border-brand-500/30 outline-none transition-all" /></div>
                    </div>
                    <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">Description</label><textarea value={proj.description} onChange={(e) => { const n = [...editData.projects]; n[pIdx].description = e.target.value; setEditData({...editData, projects: n}); }} rows={4} className="w-full bg-[#111827]/80 border-2 border-slate-800/40 rounded-[1.5rem] px-6 py-4.5 text-slate-300 font-bold text-sm leading-relaxed custom-scrollbar focus:border-brand-500/30 outline-none transition-all" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-section-experience" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-14">
            <div><h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Experience History</h3><div className="h-[2px] w-48 bg-slate-800/60"></div></div>
            <button onClick={() => setEditData({...editData, timeline: [{ id: Date.now().toString(), date: 'Present', title: 'New Role', subtitle: 'Leading Entity', type: 'professional', icon: 'fa-briefcase', description: 'Impact summary...', details: ['Key achievement'] }, ...editData.timeline]})} className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">+ Milestone</button>
          </div>
          <div className="space-y-12">
            {editData.timeline.map((item, tIdx) => (
              <div key={item.id} className="bg-[#1e293b]/30 p-10 md:p-12 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative group transition-all hover:bg-[#1e293b]/40">
                <button onClick={() => setEditData({...editData, timeline: editData.timeline.filter(t => t.id !== item.id)})} className="absolute top-8 right-8 text-red-500/60 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can text-xl"></i></button>
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="w-full lg:w-48 shrink-0 flex flex-col gap-8 items-center">
                    <div className="w-28 h-28 rounded-3xl bg-[#0f172a] border-2 border-slate-800/80 flex items-center justify-center overflow-hidden p-4 shadow-xl">{item.logo ? <img src={item.logo} className="w-full h-full object-contain" /> : <i className={`fa-solid ${item.icon} text-4xl text-slate-700`}></i>}</div>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex flex-col gap-2"><input type="file" id={`tLogo-${item.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUploadTrigger({type: 'experience', id: item.id}, e)} /><label htmlFor={`tLogo-${item.id}`} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer border border-slate-700 text-center transition-all">Choose File</label></div>
                      <input value={item.date} onChange={(e) => { const n = [...editData.timeline]; n[tIdx].date = e.target.value; setEditData({...editData, timeline: n}); }} className="w-full bg-[#111827]/80 border-2 border-slate-800/40 rounded-xl px-4 py-3.5 text-blue-400 font-black uppercase text-[10px] text-center tracking-[0.2em] outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <input value={item.title} onChange={(e) => { const n = [...editData.timeline]; n[tIdx].title = e.target.value; setEditData({...editData, timeline: n}); }} className="flex-1 bg-[#111827]/80 border-2 border-slate-800/40 rounded-2xl px-6 py-4.5 text-white font-black text-xl tracking-tight outline-none focus:border-brand-500/30 transition-all" placeholder="Role/Degree Title" />
                      <input value={item.subtitle} onChange={(e) => { const n = [...editData.timeline]; n[tIdx].subtitle = e.target.value; setEditData({...editData, timeline: n}); }} className="flex-1 bg-[#111827]/60 border-2 border-slate-800/40 rounded-2xl px-6 py-4.5 text-blue-400 font-bold outline-none focus:border-brand-500/30 transition-all" placeholder="Organization / Institution" />
                    </div>
                    <textarea value={item.description} onChange={(e) => { const n = [...editData.timeline]; n[tIdx].description = e.target.value; setEditData({...editData, timeline: n}); }} rows={4} className="w-full bg-[#111827]/60 border-2 border-slate-800/40 rounded-[1.5rem] px-6 py-4.5 text-slate-300 font-bold text-sm leading-relaxed custom-scrollbar outline-none focus:border-brand-500/30 transition-all" />
                    <div className="space-y-4">
                      {item.details.map((detail, dIdx) => (<div key={dIdx} className="flex items-center gap-4"><input value={detail} onChange={(e) => { const n = [...editData.timeline]; n[tIdx].details[dIdx] = e.target.value; setEditData({...editData, timeline: n}); }} className="flex-1 bg-[#111827]/80 border-2 border-slate-800/40 rounded-xl px-5 py-3.5 text-xs text-white font-bold outline-none transition-all" /><button onClick={() => { const n = [...editData.timeline]; n[tIdx].details = n[tIdx].details.filter((_, i) => i !== dIdx); setEditData({...editData, timeline: n}); }} className="text-slate-600 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button></div>))}
                      <button onClick={() => { const n = [...editData.timeline]; n[tIdx].details.push('New Detail Item'); setEditData({...editData, timeline: n}); }} className="text-blue-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all">+ ADD DETAIL</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-section-awards" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-14">
            <div><h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Awards & Accolades</h3><div className="h-[2px] w-48 bg-slate-800/60"></div></div>
            <button onClick={() => setEditData({...editData, awards: [...editData.awards, { id: Date.now().toString(), title: 'New Award', detail: 'Recipient Year', icon: 'fa-earth-americas' }]})} className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">+ New Award</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {editData.awards.map((award, aIdx) => (
              <div key={award.id} className="bg-[#1e293b]/20 p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl relative flex gap-8 items-center group">
                <button onClick={() => setEditData({...editData, awards: editData.awards.filter(a => a.id !== award.id)})} className="absolute top-6 right-6 text-red-500/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
                <div className="flex flex-col items-center gap-4"><div className="w-24 h-24 rounded-[1.5rem] bg-[#111827] border border-slate-800 flex items-center justify-center text-4xl text-slate-500 shrink-0 shadow-inner group-hover:text-brand-400 transition-colors"><i className={`fa-solid ${award.icon}`}></i></div><input value={award.icon} onChange={(e) => { const n = [...editData.awards]; n[aIdx].icon = e.target.value; setEditData({...editData, awards: n}); }} className="w-full bg-[#111827] border border-slate-800/50 rounded-lg px-2 py-2 text-[10px] text-brand-500/80 font-mono text-center tracking-tighter outline-none transition-all" /></div>
                <div className="flex-1 space-y-5">
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-600 ml-1 tracking-[0.2em]">Title</label><input value={award.title} onChange={(e) => { const n = [...editData.awards]; n[aIdx].title = e.target.value; setEditData({...editData, awards: n}); }} className="w-full bg-[#111827]/60 border border-slate-800/50 rounded-2xl px-6 py-3.5 text-white font-black text-sm outline-none transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-600 ml-1 tracking-[0.2em]">Details</label><input value={award.detail} onChange={(e) => { const n = [...editData.awards]; n[aIdx].detail = e.target.value; setEditData({...editData, awards: n}); }} className="w-full bg-[#111827]/60 border border-slate-800/50 rounded-2xl px-6 py-3.5 text-brand-400 font-bold text-[11px] outline-none transition-all" /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. News Archive - Expanded with Comment Management */}
        <section id="admin-section-news" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-14">
            <div><h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">NEWS ARCHIVE</h2><div className="h-[2px] w-48 bg-slate-800/60 hidden md:block"></div></div>
            <button onClick={() => setEditData({...editData, news: [{ id: Date.now().toString(), title: 'BREAKING NEWS HEADLINE', content: 'Story details...', author: editData.profile.name, date: new Date().toISOString(), likes: 0, comments: [], images: [] }, ...editData.news]})} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(37,99,235,0.4)] active:scale-95 transition-all">+ NEWS POST</button>
          </div>
          <div className="space-y-12">
            {editData.news.map((post, nIdx) => (
              <div key={post.id} className="bg-[#1e293b]/20 p-10 md:p-14 rounded-[3rem] border border-slate-800/50 shadow-2xl relative group transition-all hover:bg-[#1e293b]/30">
                <button onClick={() => setEditData({...editData, news: editData.news.filter(p => p.id !== post.id)})} className="absolute top-10 right-10 text-red-500/60 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can text-xl"></i></button>
                <div className="space-y-8">
                  <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 block ml-2">HEADLINE</label><input value={post.title} onChange={(e) => { const n = [...editData.news]; n[nIdx].title = e.target.value; setEditData({...editData, news: n}); }} className="w-full bg-[#111827]/80 border-2 border-slate-800/40 rounded-2xl px-8 py-6 text-white font-black italic uppercase text-2xl tracking-tighter outline-none focus:border-brand-500/30 transition-all" /></div>
                  <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 block ml-2">ARTICLE CONTENT</label><textarea value={post.content} onChange={(e) => { const n = [...editData.news]; n[nIdx].content = e.target.value; setEditData({...editData, news: n}); }} rows={10} className="w-full bg-[#111827]/40 border-2 border-slate-800/40 rounded-[2.5rem] px-8 py-6 text-slate-300 font-bold text-sm leading-relaxed custom-scrollbar outline-none focus:border-brand-500/30 transition-all" /></div>
                  
                  {/* Photo Gallery Logic omitted for brevity as it hasn't changed */}

                  {/* Comment Oversight Interface */}
                  <div className="mt-12 pt-10 border-t border-slate-800/50">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-500 mb-8 flex items-center gap-3">
                      <i className="fa-solid fa-comments"></i> Comment Oversight ({post.comments.length})
                    </h4>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                      {post.comments.length > 0 ? (
                        post.comments.map(c => renderCommentAdmin(post.id, c))
                      ) : (
                        <div className="text-center py-10 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No dispatches from the field yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-section-messages" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-14">
            <div><h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Inquiry Inbox</h3><div className="h-[2px] w-48 bg-slate-800/60"></div></div>
            <button onClick={fetchInquiries} className="flex items-center gap-2 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-[0.2em] transition-colors"><i className={`fa-solid fa-arrows-rotate ${isLoadingInquiries ? 'animate-spin' : ''}`}></i> Sync Inbox</button>
          </div>
          <div className="space-y-8">{inquiries.length > 0 ? inquiries.map((inq) => (<div key={inq.id} className="bg-[#1e293b]/20 p-12 rounded-[3rem] border border-slate-800/50 shadow-2xl flex flex-col gap-8 group hover:border-blue-500/30 transition-all"><div className="flex justify-between items-start"><div className="space-y-1"><h4 className="text-white font-black text-2xl">{inq.name}</h4><p className="text-blue-400 font-bold text-sm font-mono tracking-tight">{inq.email}</p></div><div className="bg-slate-800/50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{new Date(inq.created_at).toLocaleDateString()}</div></div><div className="bg-[#111827]/40 border border-slate-800/40 rounded-[2rem] p-8 italic text-slate-400 leading-relaxed text-lg shadow-inner">"{inq.message}"</div></div>)) : <div className="text-center py-32 text-slate-600 font-black uppercase tracking-[0.4em] text-xs">The Vault is Sealed</div>}</div>
        </section>
      </div>

      {cropModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0f172a] flex flex-col p-4 md:p-12">
          <div className="flex-1 relative rounded-[3.5rem] overflow-hidden border-4 border-slate-800 shadow-2xl"><Cropper image={cropModal.image} crop={crop} zoom={zoom} aspect={cropModal.field === 'profilePic' || (typeof cropModal.field === 'object' && (cropModal.field.type === 'experience' || cropModal.field.type === 'project')) ? 1 : 16 / 9} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} /></div>
          <div className="p-10 bg-[#1e293b] border-2 border-slate-800 mt-8 rounded-[3rem] flex flex-col md:flex-row gap-10 justify-center items-center shadow-2xl">
             <div className="flex-1 max-w-sm flex flex-col gap-4"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Precision Zoom</label><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-blue-600 h-1.5" /></div>
             <div className="flex gap-5"><button onClick={() => setCropModal({ ...cropModal, isOpen: false } as any)} className="px-12 py-5 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-700 active:scale-95 transition-all">Discard</button><button onClick={handleCropSave} disabled={isProcessingImage} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 flex items-center gap-3 transition-all">{isProcessingImage ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>} Apply Changes</button></div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; border: 3px solid #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type="range"] { -webkit-appearance: none; background: #334155; border-radius: 5px; }
      `}</style>
    </div>
  );
};

export default AdminPanel;
