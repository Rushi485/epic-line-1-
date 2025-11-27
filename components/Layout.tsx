import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTIST_NAME } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  // Determine navbar background based on scroll and page
  const navBg = isHome && !isScrolled ? 'bg-transparent' : 'bg-black/90 backdrop-blur-md border-b border-white/10';

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${navBg} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/" className="text-2xl font-cinematic font-bold tracking-widest text-white">
            {ARTIST_NAME}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 text-sm uppercase tracking-widest font-light items-center">
            <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <Link to="/#work" className="hover:text-gray-300 transition-colors">Work</Link>
            <Link to="/admin" className="px-4 py-2 border border-white/30 rounded hover:bg-white hover:text-black transition-all">
              Admin
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center space-y-8"
          >
            <button className="absolute top-6 right-6 text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={32} />
            </button>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-light uppercase tracking-widest">Home</Link>
            <Link to="/#work" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-light uppercase tracking-widest">Work</Link>
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-light uppercase tracking-widest">Admin Login</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {children}
      </main>

      <footer className="bg-black py-12 text-center text-white/40 text-sm">
        <p>&copy; 2025 {ARTIST_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
