import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Sparkles, ImageOff } from 'lucide-react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const hasPhotos = album.photos.length > 0;
  const currentPhoto = hasPhotos ? album.photos[photoIndex] : null;

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasPhotos) {
        setPhotoIndex((prev) => (prev + 1) % album.photos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasPhotos) {
        setPhotoIndex((prev) => (prev - 1 + album.photos.length) % album.photos.length);
    }
  };

  return (
    <motion.div 
      className="group relative w-full perspective-1000"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8 }}
      whileHover={{ y: -8, rotate: 0.5 }}
    >
      <div className="bg-neutral-900 overflow-hidden rounded-sm shadow-2xl border border-white/5 transition-all duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
        
        {/* Image Area */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-800">
            <Link to={`/album/${album.id}`} className="block w-full h-full">
            {hasPhotos && currentPhoto ? (
                <>
                    <motion.img 
                        initial={false}
                        key={currentPhoto.url}
                        src={currentPhoto.url} 
                        alt={album.title} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                    {/* Inner Shadow / Vignette */}
                    <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] z-10 pointer-events-none" />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-10 pointer-events-none" />
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/20 group-hover:text-white/40 transition-colors bg-neutral-900">
                    <ImageOff size={48} strokeWidth={1} className="mb-4" />
                    <span className="uppercase tracking-widest text-xs font-bold">Empty Album</span>
                    <span className="text-[10px] mt-2 opacity-50">Click to Add Photos</span>
                </div>
            )}
            </Link>

            {/* Navigation Arrows */}
            {hasPhotos && album.photos.length > 1 && (
            <>
                <button 
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <button 
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                <ChevronRight size={24} strokeWidth={1.5} />
                </button>
            </>
            )}

            {/* Content Overlay (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-amber-500 border border-amber-500/30 px-2 py-1 rounded-sm backdrop-blur-sm">
                        {album.photos.length} Photos
                    </span>
                    {currentPhoto && (
                        <span className="flex items-center text-[10px] text-white/60 tracking-wider uppercase">
                            <MapPin size={10} className="mr-1" /> {currentPhoto.location}
                        </span>
                    )}
                </div>
                
                <h3 className="font-cinematic text-2xl md:text-3xl font-bold text-white tracking-wide mb-1 drop-shadow-lg">
                    {album.title}
                </h3>
                <p className="font-serif-elegant italic text-white/70 text-sm opacity-80 group-hover:text-amber-100/80 transition-colors">
                    {album.subtitle}
                </p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AlbumCard;