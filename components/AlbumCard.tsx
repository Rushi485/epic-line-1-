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
      className="group relative w-full bg-neutral-900 overflow-hidden rounded-lg shadow-2xl border border-white/5"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8 }}
      whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
    >
      {/* Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-800">
        <Link to={`/album/${album.id}`} className="block w-full h-full">
          {hasPhotos && currentPhoto ? (
              <>
                <img 
                    src={currentPhoto.url} 
                    alt={album.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              </>
          ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                  <ImageOff size={48} className="mb-4" />
                  <span className="uppercase tracking-widest text-xs font-bold">Empty Album</span>
                  <span className="text-[10px] mt-2 opacity-50">Click to Add Photos</span>
              </div>
          )}
        </Link>

        {/* Navigation Arrows (Only visible on hover/interaction if multiple photos) */}
        {hasPhotos && album.photos.length > 1 && (
          <>
            <button 
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Content Below Image */}
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-cinematic text-xl font-bold text-white tracking-wide">{album.title}</h3>
            <span className="text-xs text-white/40 border border-white/20 px-2 py-1 rounded-full">{album.photos.length} Photos</span>
        </div>
        
        <p className="text-white/50 text-sm mb-6 line-clamp-2 min-h-[2.5em]">
            {album.description}
        </p>

        {/* Dynamic Photo Info */}
        <div className="pt-4 border-t border-white/10 h-[4.5rem]">
            {hasPhotos && currentPhoto ? (
                <>
                    <div className="flex items-center text-xs text-indigo-300 mb-1 gap-1">
                        <MapPin size={12} />
                        <span className="uppercase tracking-wider line-clamp-1">{currentPhoto.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-white/80 italic">
                        <Sparkles size={12} className="text-yellow-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">"{currentPhoto.caption}"</span>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-white/20 text-xs italic">
                    No recent updates
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default AlbumCard;