import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateImageInfo } from '../services/geminiService';
import { Upload, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Photo } from '../types';

const AdminPage: React.FC = () => {
  const { albums, addPhotoToAlbum } = useApp();
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0].id);
  const [imageUrl, setImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{caption: string, location: string} | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setImageUrl(base64String);
            // Reset states
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
    
    const result = await generateImageInfo(base64Data);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (!analysisResult || !imageUrl) return;

    const newPhoto: Photo = {
        id: `p-${Date.now()}`,
        url: imageUrl,
        caption: analysisResult.caption,
        location: analysisResult.location,
        date: new Date().toISOString().split('T')[0]
    };

    addPhotoToAlbum(selectedAlbumId, newPhoto);
    setUploadSuccess(true);
    
    // Reset after delay
    setTimeout(() => {
        setUploadSuccess(false);
        setAnalysisResult(null);
        setImageUrl('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-900 pt-28 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
            <h1 className="font-cinematic text-4xl text-white mb-8">Admin Dashboard</h1>
            
            <div className="bg-neutral-800 rounded-xl p-8 border border-white/10 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Upload size={20} /> Upload New Photo
                </h2>

                {/* 1. Select Album */}
                <div className="mb-6">
                    <label className="block text-white/60 text-sm mb-2 uppercase tracking-wider">Select Target Album</label>
                    <select 
                        value={selectedAlbumId} 
                        onChange={(e) => setSelectedAlbumId(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/20 text-white rounded-lg p-3 focus:border-indigo-500 outline-none transition-colors"
                    >
                        {albums.map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Image Input */}
                <div className="mb-6">
                    <label className="block text-white/60 text-sm mb-2 uppercase tracking-wider">Choose Image</label>
                    <div 
                        className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-neutral-900/50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imageUrl ? (
                            <img src={imageUrl} alt="Preview" className="max-h-64 mx-auto rounded shadow-lg" />
                        ) : (
                            <div className="flex flex-col items-center text-white/40">
                                <ImageIcon size={48} className="mb-2" />
                                <span>Click to select an image</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* 3. AI Action */}
                {imageUrl && !analysisResult && (
                    <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" /> Analyzing with Gemini AI...
                            </>
                        ) : (
                            <>
                                <SparklesIcon /> Generate AI Caption & Location
                            </>
                        )}
                    </button>
                )}

                {/* 4. Review & Save */}
                {analysisResult && (
                    <div className="animate-fade-in mt-6 p-6 bg-neutral-900 rounded-lg border border-indigo-500/30">
                        <h3 className="text-indigo-400 text-sm font-bold uppercase mb-4">AI Generated Details</h3>
                        
                        <div className="mb-4">
                            <label className="block text-white/40 text-xs mb-1">Caption</label>
                            <input 
                                type="text" 
                                value={analysisResult.caption}
                                onChange={(e) => setAnalysisResult({...analysisResult, caption: e.target.value})}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-white/40 text-xs mb-1">Location</label>
                            <input 
                                type="text" 
                                value={analysisResult.location}
                                onChange={(e) => setAnalysisResult({...analysisResult, location: e.target.value})}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-green-900/20"
                        >
                            Save to Portfolio
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {uploadSuccess && (
                    <div className="mt-4 p-4 bg-green-500/10 text-green-400 rounded-lg flex items-center gap-2 justify-center">
                        <CheckCircle size={20} /> Photo added successfully!
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export default AdminPage;
