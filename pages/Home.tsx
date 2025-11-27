import React from 'react';
import Hero from '../components/Hero';
import AlbumCard from '../components/AlbumCard';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  const { albums } = useApp();

  return (
    <div className="pb-32">
      <Hero />

      {/* Transition Quote Section */}
      <section className="py-24 bg-neutral-950 overflow-hidden">
        <motion.div 
          className="max-w-4xl mx-auto text-center px-6"
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif-elegant text-3xl md:text-4xl text-white/90 leading-normal">
            "Every picture is a poem without words. Welcome to my journey."
          </h2>
        </motion.div>
      </section>

      {/* Albums Grid Section */}
      <section id="work" className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center">
            <h3 className="text-sm font-bold tracking-[0.5em] text-indigo-500 uppercase mb-4">Selected Works</h3>
            <h2 className="font-cinematic text-4xl md:text-5xl text-white">The Collections</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
