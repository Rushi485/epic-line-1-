import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ARTIST_NAME, HERO_QUOTE, HERO_SUBTITLE, HERO_IMAGE_URL } from '../constants';

const Hero: React.FC = () => {
  // Parallax Text Effect
  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 500], [0, 250]); // Text moves slower than scroll
  const opacityText = useTransform(scrollY, [0, 400], [1, 0]); // Text fades out

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black">
      
      {/* Cinematic Image Background with Ken Burns Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            scale: { duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" },
            opacity: { duration: 1.5 } 
          }}
          src={HERO_IMAGE_URL}
          alt="Cinematic Photography Background"
          className="w-full h-full object-cover opacity-60"
        />
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      {/* Content with Parallax */}
      <motion.div 
        style={{ y: yText, opacity: opacityText }}
        className="relative z-20 text-center px-6 max-w-5xl mx-auto"
      >
        
        {/* Artist Name Reveal */}
        <div className="overflow-hidden mb-2">
            <motion.h1 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="font-cinematic text-5xl md:text-8xl lg:text-9xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 drop-shadow-2xl"
            >
              {ARTIST_NAME}
            </motion.h1>
        </div>

        {/* Subtitle Reveal */}
        <motion.div 
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 2, delay: 1 }}
          className="text-sm md:text-lg font-light uppercase text-amber-500/80 mb-10 text-shadow-sm flex items-center justify-center gap-4"
        >
          <span className="h-px w-8 bg-amber-500/50 hidden md:block"></span>
          {HERO_SUBTITLE}
          <span className="h-px w-8 bg-amber-500/50 hidden md:block"></span>
        </motion.div>

        {/* Quote Slide In */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.5, delay: 1.8 }}
          className="max-w-xl mx-auto"
        >
          <p className="font-serif-elegant italic text-xl md:text-3xl text-white/90 leading-relaxed font-light">
            "{HERO_QUOTE}"
          </p>
        </motion.div>

      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown size={20} strokeWidth={1} />
        </motion.div>
      </motion.div>

    </section>
  );
};

export default Hero;