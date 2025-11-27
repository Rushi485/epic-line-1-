import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ARTIST_NAME, HERO_QUOTE, HERO_SUBTITLE, HERO_YOUTUBE_ID } from '../constants';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-neutral-900">
      
      {/* YouTube Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Dark Overlay for text readability */}
        
        {/* 
           YouTube Iframe Technique:
           1. pointer-events-none: Prevents user interaction (pausing/clicking).
           2. scale-[1.5]: Zooms in to hide YouTube controls/branding/black bars.
           3. playlist={ID}&loop=1: Ensures continuous looping.
           4. Embed URL must be used, not the watch URL.
        */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] min-w-[177.77vh] min-h-[56.25vw]">
            <iframe
            className="w-full h-full scale-[1.35] md:scale-150"
            src={`https://www.youtube.com/embed/${HERO_YOUTUBE_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${HERO_YOUTUBE_ID}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
            title="Hero Background Video"
            allow="autoplay; encrypted-media"
            frameBorder="0"
            />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 text-center px-4">
        
        {/* Artist Name Reveal */}
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          className="font-cinematic text-5xl md:text-8xl lg:text-9xl font-bold tracking-widest mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl"
        >
          {ARTIST_NAME}
        </motion.h1>

        {/* Subtitle Reveal */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="text-lg md:text-xl font-light tracking-[0.3em] uppercase text-white/90 mb-12 text-shadow-sm"
        >
          {HERO_SUBTITLE}
        </motion.p>

        {/* Quote Slide In */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 2.2 }}
          className="max-w-2xl mx-auto bg-black/20 backdrop-blur-sm p-6 rounded-xl border border-white/5"
        >
          <p className="font-serif-elegant italic text-xl md:text-2xl text-white/95 leading-relaxed">
            "{HERO_QUOTE}"
          </p>
        </motion.div>

      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs uppercase tracking-widest shadow-black drop-shadow-md">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown size={24} className="drop-shadow-md" />
        </motion.div>
      </motion.div>

    </section>
  );
};

export default Hero;