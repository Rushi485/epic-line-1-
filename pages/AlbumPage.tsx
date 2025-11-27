import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, X, MapPin, Plus, Upload, Sparkles, Loader2, 
  CheckCircle, Trash2, CheckSquare, Square, MousePointer2 
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
  status: 'pending' | 'analyzing' | 'complete' | 'error';
}

const AlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addPhotosToAlbum, deletePhotosFromAlbum, albums } = useApp();
  
  // DERIVED STATE: Always get the latest album data directly from context
  const album = albums.find(a => a.id === id);
  
  // View State
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  
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
      setSelectedPhotoId(null); // Close lightbox
    }
  };

  // --- Bulk Upload Logic ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      
      // 1. Create queue items immediately with placeholder state
      const newItems: UploadItem[] = await Promise.all(files.map(async (file) => ({
        tempId: Math.random().toString(36).substr(2, 9),
        file,
        preview: await readFileAsBase64(file), // Full quality for preview
        caption: '',
        location: '',
        status: 'analyzing'
      })));

      setUploadQueue(prev => [...prev, ...newItems]);

      // 2. Process AI Analysis in background using compressed images
      newItems.forEach(async (item) => {
        try {
            // Resize specifically for AI payload (Fast)
            const compressedBase64 = await resizeForAI(item.file);
            const base64Data = compressedBase64.split(',')[1];
            
            const result = await generateImageInfo(base64Data);
            
            setUploadQueue(prev => prev.map(p => 
                p.tempId === item.tempId 
                ? { ...p, caption: result.caption, location: result.location, status: 'complete' }
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
        url: item.preview, // Save the High Quality URL
        caption: item.caption || "Uploaded Image",
        location: item.location || "Unknown",
        date: new Date().toISOString().split('T')[0]
    }));

    addPhotosToAlbum(album.id, newPhotos);
    
    // Cleanup
    setUploadQueue([]);
    setIsUploadOpen(false);
  };

  const removeUploadItem = (tempId: string) => {
    setUploadQueue(prev => prev.filter(i => i.tempId !== tempId));
  };

  if (!album) {
    return <div className="h-screen flex items-center justify-center text-white">Album not found</div>;
  }

  const selectedPhoto = album.photos.find(p => p.id === selectedPhotoId);

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-6 relative">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <Link to="/" className="inline-flex items-center text-white/50 hover:text-white transition-colors group">
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
            </Link>
            
            <div className="flex items-center gap-3">
                {/* Selection Mode Toggle */}
                {album.photos.length > 0 && (
                    <button 
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedForDeletion(new Set());
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                            isSelectionMode 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-transparent border-white/20 text-white/60 hover:text-white hover:border-white'
                        }`}
                    >
                        <MousePointer2 size={18} /> 
                        {isSelectionMode ? 'Done Selecting' : 'Manage Photos'}
                    </button>
                )}

                {/* Bulk Delete Action */}
                {isSelectionMode && selectedForDeletion.size > 0 && (
                    <button 
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse cursor-pointer shadow-lg shadow-red-900/20"
                    >
                        <Trash2 size={18} /> Delete ({selectedForDeletion.size})
                    </button>
                )}

                {/* Add Photo Button */}
                {!isSelectionMode && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer shadow-lg shadow-white/10"
                    >
                        <Plus size={20} /> Add Photos
                    </motion.button>
                )}
            </div>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <h1 className="font-cinematic text-4xl md:text-6xl font-bold mb-2 text-white">{album.title}</h1>
            <p className="text-xl text-white/60 font-serif-elegant italic">{album.subtitle}</p>
        </motion.div>
      </div>

      {/* Masonry Grid */}
      {album.photos.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <p className="text-white/50 mb-4">This album is empty.</p>
            <button onClick={() => setIsUploadOpen(true)} className="text-indigo-400 hover:text-white underline cursor-pointer">Upload the first photo</button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {album.photos.map((photo, index) => (
            <motion.div 
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`break-inside-avoid relative rounded-lg overflow-hidden bg-neutral-900 group ${isSelectionMode ? 'cursor-pointer' : 'cursor-zoom-in'}`}
                onClick={() => {
                    if (isSelectionMode) {
                        toggleSelection(photo.id);
                    } else {
                        setSelectedPhotoId(photo.id);
                    }
                }}
            >
                <img 
                    src={photo.url} 
                    alt={photo.caption} 
                    className={`w-full h-auto transition-transform duration-700 ${
                        isSelectionMode ? '' : 'group-hover:scale-125'
                    }`}
                    loading="lazy"
                />
                
                {/* Selection Overlay */}
                {isSelectionMode && (
                    <div className={`absolute inset-0 transition-colors duration-200 flex items-start justify-end p-4 ${selectedForDeletion.has(photo.id) ? 'bg-indigo-900/40 ring-4 ring-inset ring-indigo-500' : 'hover:bg-white/10'}`}>
                        {selectedForDeletion.has(photo.id) 
                            ? <CheckSquare className="text-indigo-400 fill-black" size={24} /> 
                            : <Square className="text-white/70 shadow-sm" size={24} />
                        }
                    </div>
                )}

                {/* Hover Info (Only when not selecting) */}
                {!isSelectionMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
                        <p className="text-white text-lg font-serif-elegant italic mb-1">"{photo.caption}"</p>
                        <div className="flex items-center text-indigo-300 text-xs tracking-wider uppercase">
                            <MapPin size={12} className="mr-1"/> {photo.location}
                        </div>
                    </div>
                )}
            </motion.div>
            ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedPhoto && !isSelectionMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoId(null)}
          >
            {/* Top Controls */}
            <div className="absolute top-6 right-6 flex items-center gap-4 z-[110]">
                <button 
                    className="text-white/50 hover:text-red-500 p-3 transition-colors bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handleSingleDelete(selectedPhoto.id); }}
                    title="Delete Photo"
                >
                    <Trash2 size={20} />
                </button>
                <button 
                    className="text-white/70 hover:text-white p-3 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 rounded-full"
                    onClick={() => setSelectedPhotoId(null)}
                >
                    <X size={24} />
                </button>
            </div>

            <div 
                className="max-w-6xl w-full max-h-[95vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <motion.img 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.caption}
                  className="max-h-[80vh] object-contain rounded shadow-2xl mb-8"
                />
                
                <div className="text-center max-w-2xl">
                    <h3 className="text-2xl md:text-3xl font-serif-elegant italic text-white mb-3">"{selectedPhoto.caption}"</h3>
                    <div className="flex items-center justify-center gap-6 text-white/50 text-sm uppercase tracking-widest">
                        <span className="flex items-center gap-2"><MapPin size={16} className="text-indigo-400" /> {selectedPhoto.location}</span>
                        <span className="opacity-30">|</span>
                        <span>{selectedPhoto.date}</span>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            >
                <div className="bg-neutral-900 border border-white/10 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neutral-900">
                        <div>
                            <h2 className="font-cinematic text-2xl text-white mb-1">Add Photos</h2>
                            <p className="text-white/50 text-sm">AI will automatically caption and locate your photos.</p>
                        </div>
                        <button onClick={() => setIsUploadOpen(false)} className="text-white/50 hover:text-white cursor-pointer">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {uploadQueue.length === 0 ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-full min-h-[300px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/40 hover:text-white hover:border-indigo-500 hover:bg-white/5 transition-all cursor-pointer group"
                            >
                                <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={40} />
                                </div>
                                <span className="uppercase tracking-widest text-sm font-bold">Click to select photos</span>
                                <span className="text-xs mt-2 opacity-50">Support JPG, PNG (Max 50 files)</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Upload Card for Adding More */}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-6 text-white/40 hover:text-white hover:border-indigo-500 cursor-pointer min-h-[120px]"
                                >
                                    <Plus size={32} />
                                    <span className="text-xs mt-2 uppercase">Add More</span>
                                </div>

                                {/* Queued Items */}
                                {uploadQueue.map((item) => (
                                    <div key={item.tempId} className="bg-neutral-800 rounded-xl p-3 flex gap-4 relative group border border-white/5">
                                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-black">
                                            <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            {item.status === 'analyzing' ? (
                                                <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold animate-pulse">
                                                    <Loader2 size={16} className="animate-spin" /> AI Analyzing...
                                                </div>
                                            ) : item.status === 'error' ? (
                                                <div className="text-red-400 text-sm font-bold mb-1">Analysis Failed</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input 
                                                        value={item.caption}
                                                        onChange={(e) => setUploadQueue(prev => prev.map(i => i.tempId === item.tempId ? {...i, caption: e.target.value} : i))}
                                                        className="w-full bg-black/20 border-none rounded p-1 text-sm text-white font-serif-elegant italic placeholder:text-white/20 focus:ring-1 focus:ring-indigo-500"
                                                        placeholder="Caption..."
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={12} className="text-white/40" />
                                                        <input 
                                                            value={item.location}
                                                            onChange={(e) => setUploadQueue(prev => prev.map(i => i.tempId === item.tempId ? {...i, location: e.target.value} : i))}
                                                            className="w-full bg-black/20 border-none rounded p-1 text-xs text-white/70 placeholder:text-white/20 focus:ring-1 focus:ring-indigo-500"
                                                            placeholder="Location..."
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Remove Item Button */}
                                        <button 
                                            onClick={() => removeUploadItem(item.tempId)}
                                            className="absolute top-2 right-2 text-white/20 hover:text-red-500 p-1 cursor-pointer"
                                        >
                                            <X size={16} />
                                        </button>

                                        {/* Success Indicator */}
                                        {item.status === 'complete' && (
                                            <div className="absolute bottom-2 right-2 text-green-500">
                                                <Sparkles size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            accept="image/*" 
                            multiple // ENABLE BULK
                            className="hidden" 
                        />
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-white/10 bg-neutral-900 flex justify-between items-center">
                        <span className="text-white/40 text-sm">
                            {uploadQueue.length > 0 && `${uploadQueue.filter(i => i.status === 'complete').length} / ${uploadQueue.length} ready`}
                        </span>
                        
                        <div className="flex gap-4">
                            {uploadQueue.length > 0 && (
                                <button 
                                    onClick={() => setUploadQueue([])}
                                    className="px-6 py-3 text-white/60 hover:text-white transition-colors cursor-pointer"
                                >
                                    Clear All
                                </button>
                            )}
                            <button 
                                onClick={handleSaveAll}
                                disabled={uploadQueue.length === 0 || uploadQueue.some(i => i.status === 'analyzing')}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 flex items-center gap-2 cursor-pointer"
                            >
                                {uploadQueue.some(i => i.status === 'analyzing') ? (
                                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                ) : (
                                    <><CheckCircle size={18} /> Save {uploadQueue.length} Photos</>
                                )}
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