import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hls from 'hls.js';
import { ArrowRight } from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// HLS Stream Source
const VIDEO_SRC = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8';

// Image preloads and cards data
const PROJECTS = [
  {
    title: 'Automotive Motion',
    src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-7',
    aspect: 'aspect-[4/3] sm:aspect-[16/10]',
  },
  {
    title: 'Urban Architecture',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-5',
    aspect: 'aspect-square md:aspect-auto md:h-full',
  },
  {
    title: 'Human Perspective',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-5',
    aspect: 'aspect-square md:aspect-auto md:h-full',
  },
  {
    title: 'Brand Identity',
    src: 'https://images.unsplash.com/photo-1541462608141-2f68c48a17ef?auto=format&fit=crop&w=800&q=80',
    colSpan: 'md:col-span-7',
    aspect: 'aspect-[4/3] sm:aspect-[16/10]',
  },
];

const JOURNAL_ENTRIES = [
  {
    title: 'Designing with Intention: The Minimalist Shift',
    src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&q=80',
    readTime: '4 min read',
    date: 'Jun 12, 2026',
  },
  {
    title: 'Fluid Motion: Navigating Spatial UI Constraints',
    src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80',
    readTime: '6 min read',
    date: 'May 28, 2026',
  },
  {
    title: 'Interactive Realism: Using HLS for High-Fidelity Previews',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    readTime: '5 min read',
    date: 'Apr 15, 2026',
  },
  {
    title: 'Creative Code & Clean Architectures in 2026',
    src: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=200&q=80',
    readTime: '8 min read',
    date: 'Mar 02, 2026',
  },
];

const EXPLORATIONS = [
  { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' },
  { src: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
  { src: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80' },
  { src: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=600&q=80' },
  { src: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=600&q=80' },
  { src: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80' },
];

// Reusable HLS Video Background Component
function HlsVideo({ flipped = false, overlayOpacity = 'bg-black/20' }: { flipped?: boolean; overlayOpacity?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(VIDEO_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.log('HLS video play error:', err));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_SRC;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((err) => console.log('Native video play error:', err));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        className="absolute left-1/2 top-1/2 min-w-full min-h-full object-cover"
        style={{
          transform: `translate(-50%, -50%) ${flipped ? 'scaleY(-1)' : ''}`,
        }}
      />
      <div className={`absolute inset-0 ${overlayOpacity}`} />
    </div>
  );
}

// Section 1: Loading Screen Component
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const words = ['Design', 'Create', 'Inspire'];

  // Counter from 0 to 100 over 2700ms
  useEffect(() => {
    const duration = 2700;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * 100));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, []);

  // Words cycle every 900ms
  useEffect(() => {
    const wordTimer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 900);
    return () => clearInterval(wordTimer);
  }, []);

  // Finish trigger
  useEffect(() => {
    if (count === 100) {
      const delayTimer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(delayTimer);
    }
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-bg flex flex-col justify-between p-8 md:p-12 select-none">
      {/* Top Left */}
      <div>
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-xs text-muted uppercase tracking-[0.3em] inline-block font-semibold"
        >
          Portfolio
        </motion.span>
      </div>

      {/* Center Word Cycler */}
      <div className="flex justify-center items-center h-40">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-4xl md:text-6xl lg:text-7xl font-display italic text-text-primary/80"
          >
            {words[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Bottom Right and Progress Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-end items-end">
          <span className="text-6xl md:text-8xl lg:text-9xl font-display text-text-primary tabular-nums leading-none">
            {String(count).padStart(3, '0')}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-[3px] bg-stroke/50 relative overflow-hidden">
          <div
            className="h-full accent-gradient origin-left transition-transform duration-75 ease-out"
            style={{
              transform: `scaleX(${count / 100})`,
              boxShadow: '0 0 8px rgba(137, 170, 204, 0.35)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [activeNav, setActiveNav] = useState('home');
  const [logoHovered, setLogoHovered] = useState(false);
  const [sayHiHovered, setSayHiHovered] = useState(false);

  // Hero cycler state
  const roles = ['Creative', 'Fullstack', 'Founder', 'Scholar'];
  const [roleIndex, setRoleIndex] = useState(0);

  // Parallax Gallery Refs
  const parallaxSectionRef = useRef<HTMLDivElement>(null);
  const pinContentRef = useRef<HTMLDivElement>(null);
  const colLeftRef = useRef<HTMLDivElement>(null);
  const colRightRef = useRef<HTMLDivElement>(null);

  // Marquee Ref
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Role Line cycling every 2s
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Track scroll position for navbar background and hash highlights
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Section highlighters
      const sections = ['home', 'work', 'explorations', 'contact'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Entrance (Name, Eyebrow, Buttons)
  useLayoutEffect(() => {
    let contextInstance: gsap.Context | null = null;

    if (!isLoading) {
      contextInstance = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
        });

        tl.fromTo(
          '.name-reveal',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1.2 },
          0.1
        );

        tl.fromTo(
          '.blur-in',
          { opacity: 0, filter: 'blur(10px)', y: 20 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1, stagger: 0.1 },
          0.3
        );
      });
    }

    return () => {
      if (contextInstance) contextInstance.revert();
    };
  }, [isLoading]);

  // GSAP ScrollTrigger (Visual Playground Pinning & Column Scroll Parallax)
  useLayoutEffect(() => {
    let contextInstance: gsap.Context | null = null;
    let pinTrigger: ScrollTrigger | null = null;

    if (!isLoading && parallaxSectionRef.current && pinContentRef.current) {
      // Pin visual playground text
      pinTrigger = ScrollTrigger.create({
        trigger: parallaxSectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: pinContentRef.current,
        pinSpacing: false,
      });

      // Parallax columns
      contextInstance = gsap.context(() => {
        gsap.fromTo(
          colLeftRef.current,
          { y: '5vh' },
          {
            y: '-20vh',
            ease: 'none',
            scrollTrigger: {
              trigger: parallaxSectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );

        gsap.fromTo(
          colRightRef.current,
          { y: '-10vh' },
          {
            y: '15vh',
            ease: 'none',
            scrollTrigger: {
              trigger: parallaxSectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });
    }

    return () => {
      if (pinTrigger) pinTrigger.kill();
      if (contextInstance) contextInstance.revert();
    };
  }, [isLoading]);

  // GSAP Marquee (Footer)
  useLayoutEffect(() => {
    let anim: gsap.core.Tween | null = null;

    if (!isLoading && marqueeRef.current) {
      anim = gsap.to(marqueeRef.current, {
        x: '-50%',
        duration: 35,
        ease: 'none',
        repeat: -1,
      });
    }

    return () => {
      if (anim) anim.kill();
    };
  }, [isLoading]);

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && (
        <div className="relative w-full bg-bg text-text-primary font-body overflow-x-hidden">
          
          {/* Navigation Bar */}
          <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4 pointer-events-none">
            <div
              className={`inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface/85 px-3 py-2 pointer-events-auto transition-all duration-300 ${
                scrollY > 100 ? 'shadow-lg shadow-black/30 bg-surface/95 scale-98' : ''
              }`}
            >
              {/* Logo Ring */}
              <div
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
                onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-9 h-9 rounded-full p-[1.5px] transition-transform duration-300 hover:scale-110 flex items-center justify-center cursor-pointer relative"
                style={{
                  background: logoHovered
                    ? 'linear-gradient(270deg, #89AACC 0%, #4E85BF 100%)'
                    : 'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
                }}
              >
                <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-white">
                  <span className="font-display italic text-[13px] tracking-tight font-semibold">JA</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-stroke mx-3 hidden sm:block" />

              {/* Links */}
              <div className="flex items-center gap-1.5 mr-2">
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-xs sm:text-sm font-medium rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all cursor-pointer ${
                    activeNav === 'home'
                      ? 'text-text-primary bg-stroke/50'
                      : 'text-muted hover:text-text-primary hover:bg-stroke/50'
                  }`}
                >
                  Home
                </a>
                <a
                  href="#work"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-xs sm:text-sm font-medium rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all cursor-pointer ${
                    activeNav === 'work'
                      ? 'text-text-primary bg-stroke/50'
                      : 'text-muted hover:text-text-primary hover:bg-stroke/50'
                  }`}
                >
                  Work
                </a>
                <a
                  href="#explorations"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('explorations')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-xs sm:text-sm font-medium rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all cursor-pointer ${
                    activeNav === 'explorations'
                      ? 'text-text-primary bg-stroke/50'
                      : 'text-muted hover:text-text-primary hover:bg-stroke/50'
                  }`}
                >
                  Resume
                </a>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-stroke mr-3" />

              {/* Say Hi Button */}
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onMouseEnter={() => setSayHiHovered(true)}
                onMouseLeave={() => setSayHiHovered(false)}
                className="relative inline-flex items-center justify-center text-xs sm:text-sm rounded-full text-text-primary cursor-pointer px-4 py-2"
              >
                {/* Accent Gradient Border behind */}
                <span
                  className={`absolute inset-[-1.5px] rounded-full transition-opacity duration-300 ${
                    sayHiHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    background: 'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
                  }}
                />
                <span className="absolute inset-0 rounded-full bg-surface border border-white/10" />
                <span className="relative flex items-center gap-1 z-10 font-medium text-white">
                  Say hi <span className="text-[10px]">↗</span>
                </span>
              </a>
            </div>
          </nav>

          {/* Section 2: Hero */}
          <section id="home" className="relative w-full h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
            {/* Background HLS Video */}
            <HlsVideo overlayOpacity="bg-black/40" />

            {/* Bottom Fade Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />

            {/* Hero Main Content */}
            <div className="relative z-10 max-w-4xl flex flex-col items-center pt-16">
              {/* Eyebrow */}
              <span className="blur-in text-xs text-muted uppercase tracking-[0.3em] mb-6 font-semibold block">
                COLLECTION '26
              </span>

              {/* Name */}
              <h1 className="name-reveal text-6xl md:text-8xl lg:text-9xl font-display italic leading-[0.85] tracking-tight text-text-primary mb-6">
                Michael Smith
              </h1>

              {/* Role word cycler line */}
              <p className="blur-in text-lg md:text-2xl text-text-primary/90 font-light mb-8">
                A{' '}
                <span
                  key={roleIndex}
                  className="font-display italic text-text-primary animate-role-fade-in inline-block border-b border-white/20 px-1 font-medium"
                >
                  {roles[roleIndex]}
                </span>{' '}
                lives in Chicago.
              </p>

              {/* Description */}
              <p className="blur-in text-sm md:text-base text-muted max-w-md mb-10 leading-relaxed font-light">
                Designing seamless digital interactions by focusing on the unique nuances which bring systems to life.
              </p>

              {/* CTA Buttons */}
              <div className="blur-in flex flex-col sm:flex-row gap-4 items-center justify-center">
                <a
                  href="#work"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative group inline-flex items-center justify-center p-[2px] rounded-full hover:scale-105 active:scale-98 transition-all duration-150"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#89AACC] to-[#4E85BF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative px-7 py-3.5 rounded-full bg-text-primary text-bg font-semibold text-sm group-hover:bg-bg group-hover:text-text-primary transition-all">
                    See Works
                  </span>
                </a>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative group inline-flex items-center justify-center p-[2px] rounded-full hover:scale-105 active:scale-98 transition-all duration-150"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#89AACC] to-[#4E85BF] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-shift bg-[length:200%_200%]" />
                  <span className="relative px-7 py-3.5 rounded-full bg-bg border-2 border-stroke text-text-primary font-semibold text-sm group-hover:border-transparent transition-all">
                    Reach out...
                  </span>
                </a>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
              <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-medium opacity-80">SCROLL</span>
              <div className="w-[1px] h-10 bg-stroke/60 relative overflow-hidden rounded-full">
                <div className="absolute left-0 top-0 w-full h-[60%] accent-gradient animate-scroll-down rounded-full" />
              </div>
            </div>
          </section>

          {/* Section 3: Selected Works */}
          <section id="work" className="bg-bg py-24 border-t border-stroke/20">
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
              
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-[1px] bg-stroke" />
                    <span className="text-xs text-muted uppercase tracking-[0.3em] font-semibold">Selected Work</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-none mb-4">
                    Featured <span className="font-display italic font-normal">projects</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted max-w-md font-light">
                    A selection of projects I've worked on, from concept to launch.
                  </p>
                </div>

                <a
                  href="#work"
                  className="hidden md:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary px-6 py-3 rounded-full border border-stroke hover:border-transparent relative group transition-all duration-300"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#89AACC] to-[#4E85BF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    View all work <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
              </motion.div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {PROJECTS.map((project, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={`${project.colSpan} relative bg-surface border border-stroke rounded-3xl overflow-hidden group cursor-pointer aspect-video md:aspect-auto`}
                  >
                    {/* Background Image Container */}
                    <div className={`w-full h-full relative overflow-hidden ${project.aspect}`}>
                      <img
                        src={project.src}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Halftone Dot Overlay */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply"
                        style={{
                          backgroundImage: 'radial-gradient(circle, #000 1.2px, transparent 1.2px)',
                          backgroundSize: '4px 4px',
                        }}
                      />

                      {/* Hover Overlay Panel */}
                      <div className="absolute inset-0 bg-bg/75 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-center justify-center p-6 text-center">
                        <div
                          className="relative p-[1.5px] rounded-full overflow-hidden shadow-xl animate-gradient-shift bg-[length:200%_200%]"
                          style={{
                            background: 'linear-gradient(90deg, #89AACC, #4E85BF, #89AACC)',
                          }}
                        >
                          <div className="bg-white text-black px-6 py-2.5 rounded-full font-medium text-xs flex items-center gap-1.5">
                            <span>View —</span>
                            <span className="font-display italic font-semibold">{project.title}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: Journal */}
          <section className="bg-bg py-24 border-t border-stroke/20">
            <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
              
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-[1px] bg-stroke" />
                    <span className="text-xs text-muted uppercase tracking-[0.3em] font-semibold">Insights</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-none mb-4">
                    Recent <span className="font-display italic font-normal">thoughts</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted max-w-md font-light">
                    Exploration of design mechanics, coding standards, and project post-mortems.
                  </p>
                </div>

                <a
                  href="#work"
                  className="hidden md:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary px-6 py-3 rounded-full border border-stroke hover:border-transparent relative group transition-all duration-300"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#89AACC] to-[#4E85BF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    View all thoughts <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
              </motion.div>

              {/* Journal List as Horizontal Pills */}
              <div className="flex flex-col gap-4">
                {JOURNAL_ENTRIES.map((entry, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-4 sm:p-5 bg-surface/30 hover:bg-surface border border-stroke rounded-[2rem] sm:rounded-full group transition-all duration-300 cursor-pointer hover:border-white/10"
                  >
                    <div className="flex items-center gap-5">
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-stroke/60 shrink-0">
                        <img src={entry.src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      {/* Title */}
                      <h3 className="font-display italic font-medium text-lg sm:text-2xl text-text-primary/90 group-hover:text-white transition-colors leading-tight">
                        {entry.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-8 text-xs sm:text-sm text-muted/70 shrink-0 self-end sm:self-center pl-16 sm:pl-0">
                      <span>{entry.readTime}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-stroke" />
                      <span>{entry.date}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Explorations (Parallax Gallery) */}
          <section id="explorations" ref={parallaxSectionRef} className="relative w-full min-h-[300vh] bg-bg border-t border-stroke/20">
            {/* Layer 1: Pinned Center (z-10) */}
            <div ref={pinContentRef} className="absolute inset-0 h-screen w-full flex items-center justify-center z-10 pointer-events-none">
              <div className="max-w-2xl px-6 text-center flex flex-col items-center pointer-events-auto">
                <span className="text-xs text-muted uppercase tracking-[0.3em] mb-4 font-semibold">EXPLORATIONS</span>
                <h2 className="text-5xl md:text-7xl font-bold text-text-primary leading-none mb-4">
                  Visual <span className="font-display italic font-normal">playground</span>
                </h2>
                <p className="text-sm text-muted max-w-sm mb-8 leading-relaxed font-light">
                  A constant stream of 3D research, creative coding experiments, and interface concepts.
                </p>

                {/* Styled Dribbble link */}
                <a
                  href="https://dribbble.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group inline-flex items-center justify-center p-[1px] rounded-full hover:scale-105 active:scale-98 transition-all"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#89AACC] to-[#4E85BF] transition-all" />
                  <span className="relative px-6 py-2.5 rounded-full bg-surface text-xs font-semibold tracking-wider text-white group-hover:text-white/80 transition-all flex items-center gap-1.5">
                    Explore Dribbble <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
            </div>

            {/* Layer 2: Parallax Columns (z-20) */}
            <div className="relative w-full max-w-[1400px] mx-auto px-6 md:px-12 z-20 flex justify-between pt-[25vh] pb-[25vh] pointer-events-none">
              {/* Left Column (Parallaxes upwards) */}
              <div ref={colLeftRef} className="w-[45%] flex flex-col gap-24 md:gap-40 items-start pointer-events-auto">
                {EXPLORATIONS.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImage(item.src)}
                    className={`group aspect-square w-full max-w-[320px] bg-surface border border-stroke rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-transform duration-300 hover:scale-[1.03] ${
                      idx === 0 ? '-rotate-3' : idx === 1 ? 'rotate-2' : '-rotate-1'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt="Exploration concept"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>

              {/* Right Column (Parallaxes downwards) */}
              <div ref={colRightRef} className="w-[45%] flex flex-col gap-24 md:gap-40 items-end pt-[30vh] pointer-events-auto">
                {EXPLORATIONS.slice(3, 6).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImage(item.src)}
                    className={`group aspect-square w-full max-w-[320px] bg-surface border border-stroke rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-transform duration-300 hover:scale-[1.03] ${
                      idx === 0 ? 'rotate-3' : idx === 1 ? '-rotate-2' : 'rotate-1'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt="Exploration concept"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Stats */}
          <section className="bg-bg py-24 border-t border-stroke/20">
            <div className="max-w-[1200px] mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
              <div className="flex flex-col gap-2 border-l border-stroke/30 pl-6">
                <span className="text-5xl md:text-7xl font-display italic text-text-primary">20+</span>
                <span className="text-xs text-muted uppercase tracking-[0.2em] font-semibold">Years Experience</span>
              </div>
              <div className="flex flex-col gap-2 border-l border-stroke/30 pl-6">
                <span className="text-5xl md:text-7xl font-display italic text-text-primary">95+</span>
                <span className="text-xs text-muted uppercase tracking-[0.2em] font-semibold">Projects Done</span>
              </div>
              <div className="flex flex-col gap-2 border-l border-stroke/30 pl-6">
                <span className="text-5xl md:text-7xl font-display italic text-text-primary">200%</span>
                <span className="text-xs text-muted uppercase tracking-[0.2em] font-semibold">Satisfied Clients</span>
              </div>
            </div>
          </section>

          {/* Section 7: Contact / Footer */}
          <section id="contact" className="relative bg-bg pt-24 pb-12 overflow-hidden border-t border-stroke/20">
            {/* Background HLS Video (flipped and heavier overlay) */}
            <HlsVideo flipped overlayOpacity="bg-black/65" />

            <div className="relative z-10 max-w-[1200px] mx-auto px-6 flex flex-col items-center text-center">
              
              {/* Email CTA */}
              <div className="mb-20">
                <span className="text-xs text-muted uppercase tracking-[0.3em] font-semibold mb-6 block">GET IN TOUCH</span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8">
                  Let's make something <br />
                  <span className="font-display italic font-normal">extraordinary</span>
                </h2>

                <a
                  href="mailto:hello@michaelsmith.com"
                  className="relative inline-flex items-center justify-center p-[1px] rounded-full group cursor-pointer text-sm sm:text-base font-semibold transition-transform duration-200 hover:scale-105"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#89AACC] to-[#4E85BF] transition-all" />
                  <span className="relative px-8 py-4 rounded-full bg-bg border border-transparent text-text-primary hover:text-white transition-all">
                    hello@michaelsmith.com
                  </span>
                </a>
              </div>

              {/* GSAP Scrolling Marquee */}
              <div className="overflow-hidden w-screen relative py-8 border-y border-stroke/20 mb-20 pointer-events-none">
                <div ref={marqueeRef} className="flex whitespace-nowrap text-7xl md:text-9xl font-display uppercase tracking-widest text-text-primary/5 italic select-none">
                  <span className="pr-4">BUILDING THE FUTURE • BUILDING THE FUTURE • BUILDING THE FUTURE • BUILDING THE FUTURE • </span>
                  <span className="pr-4">BUILDING THE FUTURE • BUILDING THE FUTURE • BUILDING THE FUTURE • BUILDING THE FUTURE • </span>
                </div>
              </div>

              {/* Footer Bar */}
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 border-t border-stroke/20 pt-8 mt-4 text-xs sm:text-sm text-muted">
                {/* Available Indicator */}
                <div className="flex items-center gap-3 order-2 md:order-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span>Available for projects</span>
                </div>

                {/* Socials */}
                <div className="flex items-center gap-6 order-1 md:order-2">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="hidden sm:inline">Twitter</span>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span className="hidden sm:inline">LinkedIn</span>
                  </a>
                  <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm8.01 9.47c-.247-.074-2.51-.726-5.068-.337.892 2.41 1.258 4.67 1.34 5.253 2.12-1.39 3.447-3.69 3.728-4.916zm-5.053 6.13c-.092-.662-.486-3.003-1.428-5.467-2.484.773-4.664.81-4.96.81-.07 0-.138-.002-.203-.005.158.435.342.875.556 1.317 1.83 3.79 2.593 6.195 2.7 6.55 1.455-.49 2.656-1.49 3.335-3.205zm-7.653 1.2c-.08-.344-.792-2.613-2.535-6.173-.06-.123-.122-.245-.184-.367-1.897.55-3.774.55-3.896.55H2.61c.42 2.772 2.128 5.122 4.498 6.4 1.01-1.396 1.15-1.397 1.2-.41zm-6.27-8.15c.083 0 1.637-.02 3.435-.487-1.077-2.45-2.222-4.14-2.45-4.46-1.583 1.28-2.64 3.237-2.73 5.424.62 0 1.18.006 1.745-.477zm4.27-5.03c.224.316 1.385 1.996 2.463 4.444 2.29-.854 3.27-2.186 3.435-2.42-1.306-1.12-2.998-1.8-4.85-1.8-1.026 0-1.998.204-2.89.544zm7.394 1.196c-.198.28-.198.28-2.504 2.062 2.3 2.27 2.3 2.27 4.5 2.27.008 0 .016 0 .024-.002C20.672 6.446 17.585 3.328 12.96 4.3z" />
                    </svg>
                    <span className="hidden sm:inline">Dribbble</span>
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Lightbox Modal overlay */}
          <AnimatePresence>
            {lightboxImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxImage(null)}
                className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[99999] cursor-zoom-out p-4"
              >
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  src={lightboxImage}
                  alt="Exploration full size"
                  className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                />
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </>
  );
}
