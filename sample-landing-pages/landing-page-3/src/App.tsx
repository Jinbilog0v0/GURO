import { useState } from 'react';
import { Star, Clock, Calendar, Play, ChevronLeft, ChevronRight, Search, User, Menu, X } from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinks = ['Movies', 'TV Series', "Editor's Pick", 'Interviews', 'User Reviews'];

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-hidden">
      
      {/* Background Video */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
      />

      {/* Bottom Blur Overlay (No darkening) */}
      <div
        className="fixed inset-0 pointer-events-none z-10 backdrop-blur-xl"
        style={{
          maskImage: 'linear-gradient(to top, black 0%, transparent 45%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 45%)',
        }}
      />

      {/* Navbar (z-index 50) */}
      <nav className="relative z-50 flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 md:py-6 w-full">
        {/* Brand Logo */}
        <div
          style={{ animationDelay: '0ms' }}
          className="text-xl md:text-2xl font-black tracking-widest text-white animate-blur-fade-up select-none"
        >
          CINEMATIC
        </div>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href="#"
              style={{ animationDelay: `${100 + idx * 50}ms` }}
              className="text-sm font-medium tracking-wide text-white/90 hover:text-gray-300 transition-colors animate-blur-fade-up"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right Nav Action Panel */}
        <div className="flex items-center gap-4">
          {/* Search Button (sm and up) */}
          <button
            style={{ animationDelay: '350ms' }}
            className="hidden sm:flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white liquid-glass cursor-pointer hover:scale-105 active:scale-95 transition-transform animate-blur-fade-up"
          >
            <Search size={18} />
            <span>Search</span>
          </button>

          {/* Profile Button (sm and up) */}
          <button
            style={{ animationDelay: '400ms' }}
            className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-white liquid-glass cursor-pointer hover:scale-105 active:scale-95 transition-transform animate-blur-fade-up"
            aria-label="User profile"
          >
            <User size={18} />
          </button>

          {/* Hamburger Button (below lg) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ animationDelay: '350ms' }}
            className="lg:hidden w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform animate-blur-fade-up"
            aria-label="Toggle navigation menu"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Menu
                className={`absolute w-5 h-5 transition-all duration-500 ease-out ${
                  isMenuOpen ? 'rotate-180 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
              />
              <X
                className={`absolute w-5 h-5 transition-all duration-500 ease-out ${
                  isMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-50 opacity-0'
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown (below lg) */}
      <div
        className={`absolute left-0 right-0 z-40 bg-gray-950/95 border-b border-gray-900 shadow-2xl backdrop-blur-lg px-6 py-6 transition-all duration-500 ease-out lg:hidden flex flex-col gap-4 ${
          isMenuOpen
            ? 'top-[72px] translate-y-0 opacity-100'
            : 'top-[72px] -translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-1">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href="#"
              className={`py-3 px-3 rounded-lg hover:bg-neutral-900/50 transition-all text-sm font-medium block ${
                isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}
              style={{
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: `${idx * 50}ms`,
              }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Dropdown Bottom controls (below sm) */}
        <div className="sm:hidden border-t border-gray-800/60 pt-4 mt-2 flex flex-col gap-3">
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full liquid-glass text-sm font-medium cursor-pointer">
            <Search size={18} />
            <span>Search</span>
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full liquid-glass text-sm font-medium cursor-pointer">
            <User size={18} />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Content (aligned bottom, z-index 10) */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-8 md:pb-16 w-full">
        <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          
          {/* Left Side: Metadata, Title, Description, CTA */}
          <div className="flex-1 flex flex-col max-w-4xl">
            {/* Metadata Row */}
            <div
              style={{ animationDelay: '300ms' }}
              className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 md:mb-6 text-xs sm:text-sm text-gray-300 font-normal animate-blur-fade-up"
            >
              <div className="flex items-center gap-1.5 font-medium text-white">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white shrink-0" />
                <span>8.7/10 IMDB</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span>132 min</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>April, 2025</span>
              </div>
            </div>

            {/* Title */}
            <h1
              style={{ animationDelay: '400ms' }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-[-0.04em] mb-4 md:mb-6 leading-none text-white animate-blur-fade-up"
            >
              Step Through. <br className="hidden sm:inline" />
              Work Smarter.
            </h1>

            {/* Description */}
            <p
              style={{ animationDelay: '500ms' }}
              className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 md:mb-10 max-w-2xl font-light leading-relaxed animate-blur-fade-up"
            >
              A voyage through forgotten realms, where past and future intertwine.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button
                style={{ animationDelay: '600ms' }}
                className="bg-white text-black hover:bg-gray-200 transition-all rounded-full font-semibold px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] animate-blur-fade-up"
              >
                <Play className="w-[18px] h-[18px] fill-black text-black shrink-0" />
                <span>Watch Now</span>
              </button>
              <button
                style={{ animationDelay: '700ms' }}
                className="rounded-full font-semibold px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base text-white liquid-glass cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform animate-blur-fade-up"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right Side: Navigation Arrows */}
          <div className="shrink-0 flex items-center gap-3 self-start md:self-end">
            <button
              style={{ animationDelay: '800ms' }}
              className="rounded-full liquid-glass w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-white cursor-pointer hover:scale-108 active:scale-95 transition-transform animate-blur-fade-up"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              style={{ animationDelay: '900ms' }}
              className="rounded-full liquid-glass w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-white cursor-pointer hover:scale-108 active:scale-95 transition-transform animate-blur-fade-up"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
