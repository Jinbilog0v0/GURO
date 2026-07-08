import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const IMAGES = [
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png', bg: '#F4845F', panel: '#F79B7F' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png', bg: '#6BBF7A', panel: '#85CC92' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png', bg: '#E882B4', panel: '#ED9DC4' },
  { src: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png', bg: '#6EB5FF', panel: '#8DC4FF' },
];

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Update mobile status on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload all 4 images on mount
  useEffect(() => {
    IMAGES.forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  }, []);

  const navigate = (direction: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (direction === 'next') {
      setActiveIndex((prev) => (prev + 1) % 4);
    } else {
      setActiveIndex((prev) => (prev + 3) % 4);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  // Derive roles based on activeIndex
  const center = activeIndex;
  const left = (activeIndex + 3) % 4;
  const right = (activeIndex + 1) % 4;

  const getRole = (idx: number) => {
    if (idx === center) return 'center';
    if (idx === left) return 'left';
    if (idx === right) return 'right';
    return 'back';
  };

  const getStyle = (idx: number): React.CSSProperties => {
    const role = getRole(idx);
    const style: React.CSSProperties = {
      position: 'absolute',
      aspectRatio: '0.6 / 1',
      willChange: 'transform, filter, opacity',
      transition: 'transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1), bottom 650ms cubic-bezier(0.4, 0, 0.2, 1), height 650ms cubic-bezier(0.4, 0, 0.2, 1)',
    };

    if (role === 'center') {
      style.transform = `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`;
      style.filter = 'blur(0px)';
      style.opacity = 1;
      style.zIndex = 20;
      style.left = '50%';
      style.height = isMobile ? '60%' : '92%';
      style.bottom = isMobile ? '22%' : '0';
    } else if (role === 'left') {
      style.transform = 'translateX(-50%) scale(1)';
      style.filter = 'blur(2px)';
      style.opacity = 0.85;
      style.zIndex = 10;
      style.left = isMobile ? '20%' : '30%';
      style.height = isMobile ? '16%' : '28%';
      style.bottom = isMobile ? '32%' : '12%';
    } else if (role === 'right') {
      style.transform = 'translateX(-50%) scale(1)';
      style.filter = 'blur(2px)';
      style.opacity = 0.85;
      style.zIndex = 10;
      style.left = isMobile ? '80%' : '70%';
      style.height = isMobile ? '16%' : '28%';
      style.bottom = isMobile ? '32%' : '12%';
    } else {
      // back
      style.transform = 'translateX(-50%) scale(1)';
      style.filter = 'blur(4px)';
      style.opacity = 1;
      style.zIndex = 5;
      style.left = '50%';
      style.height = isMobile ? '13%' : '22%';
      style.bottom = isMobile ? '32%' : '12%';
    }

    return style;
  };

  return (
    <div
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: 'background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden"
    >
      <div className="relative w-full h-screen overflow-hidden">
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Giant ghost text "3D SHAPE" */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2] font-anton text-white uppercase tracking-[-0.02em] whitespace-nowrap"
          style={{
            top: '18%',
            fontSize: 'clamp(90px, 28vw, 380px)',
            lineHeight: '1',
            fontWeight: 900,
            opacity: 1,
          }}
        >
          3D SHAPE
        </div>

        {/* Top-left brand label "TOONHUB" */}
        <div
          className="absolute top-6 left-4 sm:left-8 z-[60] text-xs font-semibold uppercase text-white tracking-[0.18em]"
          style={{ opacity: 0.9 }}
        >
          TOONHUB
        </div>

        {/* Carousel */}
        <div className="absolute inset-0 z-[3]">
          {IMAGES.map((imgData, idx) => (
            <div style={getStyle(idx)} key={idx}>
              <img
                src={imgData.src}
                alt={`TOONHUB figurine ${idx + 1}`}
                className="w-full h-full object-contain object-bottom select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Bottom-left text + nav buttons */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24 z-[60] flex flex-col justify-end text-white animate-fade-in"
          style={{ maxWidth: '320px' }}
        >
          <p
            className="font-bold uppercase mb-2 sm:mb-3 text-base sm:text-[22px]"
            style={{ opacity: 0.95, letterSpacing: '0.02em' }}
          >
            TOONHUB FIGURINES
          </p>
          <p className="hidden sm:block text-xs sm:text-sm text-white/85 leading-[1.6] mb-4 sm:mb-5">
            The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.
          </p>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate('prev')}
              disabled={isAnimating}
              aria-label="Previous figurine"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center text-white bg-transparent transition-all duration-150 hover:scale-108 hover:bg-white/12 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              onClick={() => navigate('next')}
              disabled={isAnimating}
              aria-label="Next figurine"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center text-white bg-transparent transition-all duration-150 hover:scale-108 hover:bg-white/12 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Bottom-right link "DISCOVER IT" */}
        <a
          href="#"
          className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 z-[60] flex items-center gap-2 sm:gap-4 font-anton text-white uppercase no-underline transition-opacity duration-200 opacity-95 hover:opacity-100 cursor-pointer"
          style={{
            fontSize: 'clamp(20px, 4vw, 56px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          <span>DISCOVER IT</span>
          <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={2.25} />
        </a>
      </div>
    </div>
  );
}

export default App;
