import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, X, MapPin, Plus, Upload, Sparkles, Loader2, 
  CheckCircle, Trash2, CheckSquare, Square, MousePointer2, Tag, Palette,
  LayoutGrid, Grid as GridIcon, Columns, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { generateImageInfo } from '../services/geminiService';
import { Photo } from '../types';

// Helper to read file as base64 for Display (High Quality)
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to resize image for AI Analysis (Low Quality, Fast Upload)
const resizeForAI = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 800; // Max dimension for AI analysis
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Returns base64 string
                resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality is enough for captioning
            };
        };
    });
};

interface UploadItem {
  tempId: string;
  file: File;
  preview: string;
  caption: string;
  location: string;
  tags: string[];
  dominantColors: string[];
  status: 'pending' | 'analyzing' | 'complete' | 'error';
}

type ViewMode = 'masonry' | 'grid' | 'wide';

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addPhotosToAlbum, deletePhotosFromAlbum, albums } = useApp();
  
  // DERIVED STATE
  const album = albums.find(a => a.id === id);
  
  // View State
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  
  // Selection/Deletion State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());

  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhotoId || !album) return;
      
      const currentIndex = album.photos.findIndex(p => p.id === selectedPhotoId);
      
      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % album.photos.length;
        setSelectedPhotoId(album.photos[nextIndex].id);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + album.photos.length) % album.photos.length;
        setSelectedPhotoId(album.photos[prevIndex].id);
      } else if (e.key === 'Escape') {
        setSelectedPhotoId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, album]);

  // --- Selection Logic ---
  const toggleSelection = (photoId: string) => {
    const newSet = new Set(selectedForDeletion);
    if (newSet.has(photoId)) {
      newSet.delete(photoId);
    } else {
      newSet.add(photoId);
    }
    setSelectedForDeletion(newSet);
  };

  const handleBulkDelete = () => {
    if (!album) return;
    if (window.confirm(`Are you sure you want to delete ${selectedForDeletion.size} photos?`)) {
      deletePhotosFromAlbum(album.id, Array.from(selectedForDeletion));
      setSelectedForDeletion(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleSingleDelete = (photoId: string) => {
    if (!album) return;
    if (window.confirm("Delete this photo?")) {
      deletePhotosFromAlbum(album.id, [photoId]);
      setSelectedPhotoId(null); 
    }
  };

  // --- Bulk Upload Logic ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      
      const newItems: UploadItem[] = await Promise.all(files.map(async (file) => ({
        tempId: Math.random().toString(36).substr(2, 9),
        file,
        preview: await readFileAsBase64(file),
        caption: '',
        location: '',
        tags: [],
        dominantColors: [],
        status: 'analyzing'
      })));

      setUploadQueue(prev => [...prev, ...newItems]);

      newItems.forEach(async (item) => {
        try {
            const compressedBase64 = await resizeForAI(item.file);
            const base64Data = compressedBase64.split(',')[1];
            
            const result = await generateImageInfo(base64Data);
            
            setUploadQueue(prev => prev.map(p => 
                p.tempId === item.tempId 
                ? { 
                    ...p, 
                    caption: result.caption, 
                    location: result.location, 
                    tags: result.tags, 
                    dominantColors: result.dominantColors, 
                    status: 'complete' 
                  }
                : p
            ));
        } catch (error) {
            console.error("Analysis failed for", item.file.name, error);
            setUploadQueue(prev => prev.map(p => 
                p.tempId === item.tempId ? { ...p, status: 'error', caption: 'Error analyzing', location: 'Unknown' } : p
            ));
        }
      });
    }
  };

  const handleSaveAll = () => {
    if (!album) return;
    const completedItems = uploadQueue.filter(i => i.status === 'complete' || i.status === 'error');
    
    if (completedItems.length === 0) return;

    const newPhotos: Photo[] = completedItems.map(item => ({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url: item.preview,
        caption: item.caption || "Uploaded Image",
        location: item.location || "Unknown",
        tags: item.tags || [],
        dominantColors: item.dominantColors || [],
        date: new Date().toISOString().split('T')[0]
    }));

    addPhotosToAlbum(album.id, newPhotos);
    setUploadQueue([]);
    setIsUploadOpen(false);
  };

  const removeUploadItem = (tempId: string) => {
    setUploadQueue(prev => prev.filter(i => i.tempId !== tempId));
  };

  if (!album) {
    return <div className="h-screen flex items-center justify-center text-white">Album not found</div>;
  }

  const selectedPhotoIndex = album.photos.findIndex(p => p.id === selectedPhotoId);
  const selectedPhoto = album.photos[selectedPhotoIndex];

  // Grid classes based on view mode
  const gridClass = {
    masonry: "columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
    wide: "grid grid-cols-1 md:grid-cols-2 gap-8"
  }[viewMode];

  return (
    <div className="min-h-screen bg-neutral-950 pt-28 pb-20 px-6 relative">
      
      {/* Album Header */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/10 pb-8">
            <div className="w-full">
                <Link to="/" className="inline-flex items-center text-xs uppercase tracking-widest text-white/40 hover:text-amber-500 transition-colors mb-6 group">
                    <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-cinematic text-5xl md:text-7xl text-white mb-2"
                >
                    {album.title}
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-white/50 font-serif-elegant italic"
                >
                    {album.subtitle}
                </motion.p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 shrink-0">
                
                {/* View Toggles */}
                <div className="hidden md:flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><GridIcon size={18} /></button>
                    <button onClick={() => setViewMode('masonry')} className={`p-2 rounded ${viewMode === 'masonry' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><LayoutGrid size={18} /></button>
                    <button onClick={() => setViewMode('wide')} className={`p-2 rounded ${viewMode === 'wide' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}><Columns size={18} /></button>
                </div>

                {/* Selection Toggle */}
                {album.photos.length > 0 && (
                    <button 
                        onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedForDeletion(new Set()); }}
                        className={`p-3 rounded-lg border transition-all ${isSelectionMode ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'}`}
                        title="Manage Photos"
                    >
                        <MousePointer2 size={20} />
                    </button>
                )}

                {/* Main Action Button */}
                {isSelectionMode && selectedForDeletion.size > 0 ? (
                    <button onClick={handleBulkDelete} className="flex items-center gap-2 px-6 py-3 bg-red-600/90 text-white rounded-lg hover:bg-red-700 font-medium">
                        <Trash2 size={18} /> Delete ({selectedForDeletion.size})
                    </button>
                ) : (
                    <button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-white/5">
                        <Plus size={18} /> <span className="hidden sm:inline">Add Photos</span>
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Grid Display */}
      {album.photos.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-32 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center mx-auto mb-6 text-white/30">
                <Upload size={32} strokeWidth={1} />
            </div>
            <h3 className="text-xl text-white mb-2 font-cinematic">This Collection is Empty</h3>
            <p className="text-white/40 mb-8">Start your journey by adding the first memory.</p>
            <button onClick={() => setIsUploadOpen(true)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors">
                Upload Photos
            </button>
        </div>
      ) : (
        <div className={`max-w-7xl mx-auto ${gridClass}`}>
            {album.photos.map((photo, index) => (
            <motion.div 
                key={photo.id}
                layoutId={`photo-${photo.id}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "100px" }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={`break-inside-avoid relative rounded-sm overflow-hidden bg-neutral-900 group ${isSelectionMode ? 'cursor-pointer' : 'cursor-zoom-in'}`}
                onClick={() => isSelectionMode ? toggleSelection(photo.id) : setSelectedPhotoId(photo.id)}
            >
                <img 
                    src={photo.url} 
                    alt={photo.caption} 
                    className={`w-full h-auto transition-all duration-700 ease-out ${
                        isSelectionMode ? '' : 'group-hover:scale-[1.03] group-hover:brightness-110'
                    } ${viewMode === 'grid' ? 'aspect-square object-cover' : ''}`}
                    loading="lazy"
                />
                
                {/* Selection Overlay */}
                {isSelectionMode && (
                    <div className={`absolute inset-0 transition-colors duration-200 flex items-start justify-end p-4 ${selectedForDeletion.has(photo.id) ? 'bg-indigo-900/40 ring-2 ring-inset ring-indigo-500' : 'hover:bg-white/10'}`}>
                        {selectedForDeletion.has(photo.id) 
                            ? <CheckSquare className="text-indigo-400 fill-black" size={24} /> 
                            : <Square className="text-white/70 drop-shadow-md" size={24} />
                        }
                    </div>
                )}

                {/* Hover Info (Hidden in selection mode) */}
                {!isSelectionMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
                        <p className="text-white text-base font-serif-elegant italic mb-1 line-clamp-2">"{photo.caption}"</p>
                        <div className="flex items-center text-amber-500/80 text-[10px] tracking-widest uppercase">
                            <MapPin size={10} className="mr-1"/> {photo.location}
                        </div>
                    </div>
                )}
            </motion.div>
            ))}
        </div>
      )}

      {/* PRO LIGHTBOX */}
      <AnimatePresence>
        {selectedPhoto && !isSelectionMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl flex flex-col"
            onClick={() => setSelectedPhotoId(null)}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-[110]" onClick={(e) => e.stopPropagation()}>
                <span className="text-white/40 text-xs uppercase tracking-widest">
                    {selectedPhotoIndex + 1} / {album.photos.length}
                </span>
                <div className="flex gap-4">
                    <button className="text-white/50 hover:text-white transition-colors" title="Download">
                        <Download size={20} strokeWidth={1.5} />
                    </button>
                    <button 
                        className="text-white/50 hover:text-red-500 transition-colors"
                        onClick={() => handleSingleDelete(selectedPhoto.id)}
                        title="Delete"
                    >
                        <Trash2 size={20} strokeWidth={1.5} />
                    </button>
                    <button 
                        className="text-white hover:text-amber-500 transition-colors ml-4"
                        onClick={() => setSelectedPhotoId(null)}
                    >
                        <X size={28} strokeWidth={1} />
                    </button>
                </div>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 flex items-center justify-center relative px-4 md:px-20">
                {/* Navigation Buttons (Desktop) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); const i = (selectedPhotoIndex - 1 + album.photos.length) % album.photos.length; setSelectedPhotoId(album.photos[i].id); }}
                    className="hidden md:block absolute left-8 p-4 text-white/30 hover:text-white transition-colors"
                >
                    <ChevronLeft size={48} strokeWidth={0.5} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); const i = (selectedPhotoIndex + 1) % album.photos.length; setSelectedPhotoId(album.photos[i].id); }}
                    className="hidden md:block absolute right-8 p-4 text-white/30 hover:text-white transition-colors"
                >
                    <ChevronRight size={48} strokeWidth={0.5} />
                </button>

                <motion.img 
                  key={selectedPhoto.id}
                  layoutId={`photo-${selectedPhoto.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.caption}
                  className="max-h-[75vh] max-w-full object-contain shadow-2xl"
                />
            </div>

            {/* Bottom Info Bar */}
            <div className="w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-8 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={selectedPhoto.id}
                    className="max-w-3xl mx-auto"
                >
                    <h3 className="font-serif-elegant italic text-2xl md:text-3xl text-white/90 mb-3">
                        "{selectedPhoto.caption}"
                    </h3>
                    
                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/40 mb-6">
                        <span className="flex items-center gap-2 text-amber-500/80"><MapPin size={12} /> {selectedPhoto.location}</span>
                        <span>{selectedPhoto.date}</span>
                        {selectedPhoto.tags?.length > 0 && (
                            <span className="flex items-center gap-2"><Tag size={12} /> {selectedPhoto.tags[0]}</span>
                        )}
                    </div>

                    {/* Color Palette */}
                    {selectedPhoto.dominantColors?.length > 0 && (
                        <div className="flex justify-center gap-3">
                            {selectedPhoto.dominantColors.map((color, idx) => (
                                <div 
                                    key={idx} 
                                    className="w-3 h-3 rounded-full shadow border border-white/10"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dashboard Modal */}
      <AnimatePresence>
        {isUploadOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            >
                <div className="bg-neutral-900 w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border border-white/10 flex overflow-hidden">
                    
                    {/* Sidebar / Info */}
                    <div className="hidden md:flex w-64 bg-neutral-950 p-6 flex-col justify-between border-r border-white/5">
                        <div>
                            <h2 className="font-cinematic text-2xl text-white mb-2">Studio</h2>
                            <p className="text-white/30 text-xs mb-8">Upload & AI Processing</p>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-white/60 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Upload size={14} /></div>
                                    <span>Select Files</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center"><Sparkles size={14} /></div>
                                    <span>AI Enhancing</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/60 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><CheckCircle size={14} /></div>
                                    <span>Review</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-xs text-white/20">
                            <p>Supported: JPG, PNG</p>
                            <p>Max: 50MB / Batch</p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-neutral-900">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-white text-lg font-light">
                                Upload Queue <span className="text-white/30 ml-2">{uploadQueue.length} items</span>
                            </h3>
                            <button onClick={() => setIsUploadOpen(false)} className="text-white/30 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {uploadQueue.length === 0 ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-full border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30 hover:text-white hover:border-amber-500/50 hover:bg-white/5 transition-all cursor-pointer gap-4 group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="uppercase tracking-widest text-sm font-bold">Drop photos here</p>
                                        <p className="text-xs mt-2 opacity-50">or click to browse</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {uploadQueue.map((item) => (
                                        <div key={item.tempId} className="bg-neutral-950 border border-white/5 p-3 rounded-lg flex items-center gap-4 group hover:border-white/10 transition-colors">
                                            <div className="w-16 h-16 bg-neutral-900 rounded overflow-hidden shrink-0 relative">
                                                <img src={item.preview} className="w-full h-full object-cover" alt="" />
                                                {item.status === 'complete' && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center"><CheckCircle size={16} className="text-green-400" /></div>}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                {item.status === 'analyzing' ? (
                                                    <div className="flex items-center gap-2 text-amber-500 text-xs uppercase tracking-wider font-bold animate-pulse">
                                                        <Loader2 size={12} className="animate-spin" /> Generative AI Processing...
                                                    </div>
                                                ) : item.status === 'error' ? (
                                                    <span className="text-red-400 text-xs font-bold">Analysis Failed</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <input 
                                                            value={item.caption}
                                                            onChange={(e) => setUploadQueue(prev => prev.map(i => i.tempId === item.tempId ? {...i, caption: e.target.value} : i))}
                                                            className="w-full bg-transparent border-b border-white/10 focus:border-white/50 text-sm text-white font-serif-elegant italic placeholder:text-white/20 outline-none pb-1"
                                                            placeholder="Caption..."
                                                        />
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1 text-white/40 text-[10px] uppercase tracking-wider">
                                                                <MapPin size={10} />
                                                                <input 
                                                                    value={item.location}
                                                                    onChange={(e) => setUploadQueue(prev => prev.map(i => i.tempId === item.tempId ? {...i, location: e.target.value} : i))}
                                                                    className="bg-transparent border-none text-white/60 focus:text-white outline-none w-24"
                                                                    placeholder="Location"
                                                                />
                                                            </div>
                                                            {item.tags.length > 0 && (
                                                                <span className="text-[10px] text-white/20 border border-white/10 px-1 rounded">{item.tags[0]}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => removeUploadItem(item.tempId)} className="text-white/10 hover:text-red-500 p-2">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="py-4 border border-dashed border-white/10 rounded-lg text-center text-xs text-white/30 hover:text-white hover:border-white/30 cursor-pointer uppercase tracking-wider"
                                    >
                                        + Add More Photos
                                    </div>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-neutral-950 flex justify-between items-center">
                            <button onClick={() => setUploadQueue([])} className="text-xs uppercase tracking-widest text-white/30 hover:text-white">Clear Queue</button>
                            <button 
                                onClick={handleSaveAll}
                                disabled={uploadQueue.length === 0 || uploadQueue.some(i => i.status === 'analyzing')}
                                className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploadQueue.some(i => i.status === 'analyzing') ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                <span>Save to Portfolio</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlbumPage;