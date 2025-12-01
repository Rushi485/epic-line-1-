import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateImageInfo } from '../services/geminiService';
import { uploadImageToStorage } from '../services/storageService';
import { Upload, Loader2, CheckCircle, Image as ImageIcon, Sparkles, Plus, Edit2, X, FolderPlus } from 'lucide-react';
import { Photo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPage: React.FC = () => {
  const { albums, addPhotoToAlbum, createAlbum, updateAlbum } = useApp();
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id || "");
  
  // Media Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    caption: string;
    location: string;
    tags: string[];
    dominantColors: string[];
  } | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Album Management State
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [albumMode, setAlbumMode] = useState<'create' | 'edit'>('create');
  const [albumForm, setAlbumForm] = useState({ title: '', subtitle: '', description: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selected album ID if albums change (e.g. after creation)
  useEffect(() => {
    if (!albums.find(a => a.id === selectedAlbumId) && albums.length > 0) {
        setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setImageUrl(base64String);
            setAnalysisResult(null);
            setUploadSuccess(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    
    setIsAnalyzing(true);
    // Remove header from base64 string for API
    const base64Data = imageUrl.split(',')[1];
    
    try {
        const result = await generateImageInfo(base64Data);
        setAnalysisResult(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!analysisResult || !imageUrl || !selectedFile) return;
    
    setIsUploading(true);

    try {
        const uploadedUrl = await uploadImageToStorage(selectedFile);

        const newPhoto: Photo = {
            id: `p-${Date.now()}`,
            url: uploadedUrl,
            caption: analysisResult.caption,
            location: analysisResult.location,
            tags: analysisResult.tags,
            dominantColors: analysisResult.dominantColors,
            date: new Date().toISOString().split('T')[0]
        };

        addPhotoToAlbum(selectedAlbumId, newPhoto);
        setUploadSuccess(true);
        
        // Reset after delay
        setTimeout(() => {
            setUploadSuccess(false);
            setAnalysisResult(null);
            setImageUrl('');
            setSelectedFile(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }, 3000);
    } catch (error) {
        console.error("Failed to upload/save:", error);
        alert("Upload failed.");
    } finally {
        setIsUploading(false);
    }
  };

  // --- Album Management Logic ---
  const openCreateAlbum = () => {
    setAlbumMode('create');
    setAlbumForm({ title: '', subtitle: '', description: '' });
    setIsAlbumModalOpen(true);
  };

  const openEditAlbum = () => {
    const album = albums.find(a => a.id === selectedAlbumId);
    if (!album) return;
    setAlbumMode('edit');
    setAlbumForm({ title: album.title, subtitle: album.subtitle, description: album.description });
    setIsAlbumModalOpen(true);
  };

  const handleSaveAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (albumMode === 'create') {
        createAlbum(albumForm.title, albumForm.subtitle, albumForm.description);
    } else {
        updateAlbum(selectedAlbumId, albumForm);
    }
    setIsAlbumModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-28 px-6 pb-20">
        <div className="max-w-5xl mx-auto">
            <header className="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="font-cinematic text-4xl text-white mb-2">Admin Dashboard</h1>
                    <p className="text-white/40 text-sm">Content Management System</p>
                </div>
                <div className="px-4 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs border border-amber-500/20 uppercase tracking-widest">
                    Pro Access
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Left Column: Upload */}
                <div className="space-y-8">
                    {/* Album Selector & Controls */}
                    <div className="bg-neutral-900/50 p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Target Collection</label>
                            <button 
                                onClick={openCreateAlbum}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-500 hover:text-amber-400"
                            >
                                <Plus size={12} /> New Collection
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select 
                                    value={selectedAlbumId} 
                                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                                    className="w-full bg-black border border-white/10 text-white rounded-lg p-4 pr-10 focus:border-amber-500 outline-none transition-colors appearance-none"
                                >
                                    {albums.map(a => (
                                        <option key={a.id} value={a.id}>{a.title}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                    <FolderPlus size={16} />
                                </div>
                            </div>
                            
                            <button 
                                onClick={openEditAlbum}
                                className="p-4 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                title="Edit Album Details"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Image Input */}
                    <div 
                        className={`border border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative overflow-hidden group ${imageUrl ? 'border-amber-500/50 bg-black' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imageUrl ? (
                            <img src={imageUrl} alt="Preview" className="max-h-64 mx-auto rounded shadow-2xl relative z-10" />
                        ) : (
                            <div className="flex flex-col items-center text-white/30 group-hover:text-white/60 transition-colors">
                                <ImageIcon size={40} strokeWidth={1} className="mb-4" />
                                <span className="uppercase tracking-widest text-xs font-bold">Upload High-Res</span>
                                <span className="text-[10px] mt-2 opacity-50">Click or drag file</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    </div>

                    {/* Action Button */}
                    {imageUrl && !analysisResult && (
                        <button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full py-4 bg-white text-black hover:bg-amber-400 rounded-lg font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="animate-spin" /> Processing Media...</>
                            ) : (
                                <><Sparkles size={18} /> Run AI Analysis</>
                            )}
                        </button>
                    )}
                </div>

                {/* Right Column: AI Results */}
                <div>
                    {analysisResult ? (
                        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8 shadow-2xl animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-purple-600"></div>
                            
                            <h3 className="text-white text-lg font-cinematic mb-6 flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-500" /> Analysis Complete
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Generated Caption</label>
                                    <textarea 
                                        rows={2}
                                        value={analysisResult.caption}
                                        onChange={(e) => setAnalysisResult({...analysisResult, caption: e.target.value})}
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white font-serif-elegant italic focus:border-amber-500/50 outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Detected Location</label>
                                    <input 
                                        type="text" 
                                        value={analysisResult.location}
                                        onChange={(e) => setAnalysisResult({...analysisResult, location: e.target.value})}
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500/50 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Tags</label>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">Palette</label>
                                        <div className="flex gap-2">
                                            {analysisResult.dominantColors.map((c, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{backgroundColor: c}} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSavePhoto}
                                disabled={isUploading}
                                className="w-full mt-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : "Publish to Portfolio"}
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center border border-white/5 rounded-xl bg-white/[0.02] text-white/20 text-center p-8">
                            <div>
                                <Sparkles size={48} strokeWidth={0.5} className="mx-auto mb-4 opacity-50" />
                                <p className="uppercase tracking-widest text-xs">Waiting for media input</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            {uploadSuccess && (
                <div className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
                    <CheckCircle size={24} />
                    <span className="font-bold">Published Successfully</span>
                </div>
            )}
        </div>

        {/* Create/Edit Album Modal */}
        <AnimatePresence>
            {isAlbumModalOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                >
                    <motion.div 
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="bg-neutral-900 w-full max-w-md border border-white/10 rounded-xl shadow-2xl p-8 relative"
                    >
                        <button 
                            onClick={() => setIsAlbumModalOpen(false)}
                            className="absolute top-4 right-4 text-white/30 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="font-cinematic text-2xl text-white mb-6">
                            {albumMode === 'create' ? 'Create Collection' : 'Edit Collection'}
                        </h2>

                        <form onSubmit={handleSaveAlbum} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={albumForm.title}
                                    onChange={e => setAlbumForm({...albumForm, title: e.target.value})}
                                    placeholder="e.g. Neon Nights"
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Subtitle</label>
                                <input 
                                    type="text" 
                                    value={albumForm.subtitle}
                                    onChange={e => setAlbumForm({...albumForm, subtitle: e.target.value})}
                                    placeholder="e.g. Tokyo 2024"
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    value={albumForm.description}
                                    onChange={e => setAlbumForm({...albumForm, description: e.target.value})}
                                    placeholder="Brief description of the collection..."
                                    rows={3}
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                                {albumMode === 'create' ? 'Create' : 'Save Changes'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminPage;