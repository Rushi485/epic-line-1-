import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Grid, LayoutDashboard } from 'lucide-react';
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

  // Frosted Glass Effect logic
  const navBg = isScrolled 
    ? 'bg-black/60 backdrop-blur-xl border-b border-white/5 shadow-lg' 
    : 'bg-transparent border-transparent';

  const linkClass = (path: string) => `
    relative text-sm uppercase tracking-widest font-light transition-colors duration-300
    ${location.pathname === path ? 'text-amber-500' : 'text-white/80 hover:text-white'}
  `;

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-amber-500/30 selection:text-amber-200">
      {/* Global Cinematic Film Grain */}
      <div className="bg-noise" />

      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ease-out px-6 py-4 ${navBg}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/" className="text-2xl font-cinematic font-bold tracking-widest text-white hover:text-amber-500 transition-colors duration-500">
            {ARTIST_NAME}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <NavLink to="/" label="Home" active={location.pathname === '/'} />
            <NavLink to="/#work" label="Albums" active={location.hash === '#work'} />
            <Link to="/admin" className="ml-4 px-5 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-300">
              Admin
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white hover:text-amber-500 transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} strokeWidth={1.5} />
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-10"
          >
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={32} strokeWidth={1} />
            </button>
            
            <MobileLink to="/" onClick={() => setIsMobileMenuOpen(false)} icon={<Home size={20} />}>Home</MobileLink>
            <MobileLink to="/#work" onClick={() => setIsMobileMenuOpen(false)} icon={<Grid size={20} />}>Albums</MobileLink>
            <MobileLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} icon={<LayoutDashboard size={20} />}>Admin</MobileLink>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {children}
      </main>

      <footer className="relative z-10 bg-neutral-950 py-16 text-center border-t border-white/5">
        <h2 className="font-cinematic text-2xl text-white/20 mb-4">{ARTIST_NAME}</h2>
        <p className="text-white/30 text-xs uppercase tracking-widest">&copy; 2025 All rights reserved.</p>
      </footer>
    </div>
  );
};

const NavLink: React.FC<{ to: string; label: string; active: boolean }> = ({ to, label, active }) => (
  <Link to={to} className="relative group py-2">
    <span className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
      {label}
    </span>
    {/* Active Indicator Line */}
    <span className={`absolute bottom-0 left-0 h-[1px] bg-amber-500 transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-1/2'}`} />
  </Link>
);

const MobileLink: React.FC<{ to: string; children: React.ReactNode; onClick: () => void; icon: React.ReactNode }> = ({ to, children, onClick, icon }) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-4 text-3xl font-cinematic font-light text-white/80 hover:text-amber-500 transition-colors">
    <span className="opacity-50 text-lg">{icon}</span>
    {children}
  </Link>
);

export default Layout;