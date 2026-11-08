import React, { useState } from 'react';
import { Sparkles, UploadCloud, Link as LinkIcon, X, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

export interface EducationalImagePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  defaultPrompt?: string;
  subject?: string;
  grade?: number | string;
  context?: string;
  compact?: boolean;
}

export const EducationalImagePicker: React.FC<EducationalImagePickerProps> = ({
  label,
  value,
  onChange,
  defaultPrompt = '',
  subject = 'General',
  grade = 4,
  context = 'intro',
  compact = false,
}) => {
  const [mode, setMode] = useState<'ai' | 'upload' | 'url'>('ai');
  const [customPrompt, setCustomPrompt] = useState(defaultPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);

  // Sync default prompt if customPrompt is empty
  React.useEffect(() => {
    if (!customPrompt && defaultPrompt) {
      setCustomPrompt(defaultPrompt);
    }
  }, [defaultPrompt]);

  const handleGenerateAI = async (promptOverride?: string) => {
    const promptToUse = promptOverride || customPrompt || defaultPrompt || 'elementary school lesson';
    if (!promptToUse.trim()) {
      toast.error('Please enter a topic or concept prompt to generate an image.');
      return;
    }

    setIsGenerating(true);
    setHasImgError(false);
    try {
      const res = await apiFetch('/api/lesson/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse.trim(),
          subject,
          grade: typeof grade === 'string' ? parseInt(grade, 10) || 4 : grade,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          onChange(data.imageUrl);
          toast.success('Generated educational visual!');
          return;
        }
      }

      // Client-side fallback to Pollinations directly if backend has network glitch
      const cleanTerm = promptToUse.trim().replace(/[^a-zA-Z0-9\s]/g, '');
      const encoded = encodeURIComponent(`educational diagram illustration of ${cleanTerm} for grade ${grade} elementary school ${subject}, colorful textbook style graphic, clean white background`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`;
      onChange(fallbackUrl);
      toast.success('Generated educational visual!');
    } catch {
      const cleanTerm = promptToUse.trim().replace(/[^a-zA-Z0-9\s]/g, '');
      const encoded = encodeURIComponent(`educational diagram illustration of ${cleanTerm} for grade ${grade} elementary school ${subject}, colorful textbook style graphic, clean white background`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`;
      onChange(fallbackUrl);
      toast.success('Generated educational visual!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setHasImgError(false);
        onChange(reader.result as string);
        toast.success('Image uploaded successfully.');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full min-w-0 transition-all ${compact ? 'text-xs' : ''}`}>
      {/* Header with Label and Source Mode Selector */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon size={13} className="text-[#11428E] dark:text-sky-400" />
          {label}
        </span>

        <div className="flex items-center bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-0.5 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              mode === 'ai'
                ? 'bg-[#11428E] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sparkles size={11} />
            <span>AI Generate</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              mode === 'upload'
                ? 'bg-[#11428E] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <UploadCloud size={11} />
            <span>Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              mode === 'url'
                ? 'bg-[#11428E] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <LinkIcon size={11} />
            <span>Paste Link</span>
          </button>
        </div>
      </div>

      {/* Input depending on mode */}
      <div className="w-full min-w-0">
        {mode === 'ai' && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder={defaultPrompt ? `Prompt (e.g. ${defaultPrompt})` : 'Describe the educational graphic...'}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 py-1.5 px-3 border border-[var(--border-color)] rounded-lg text-xs bg-[var(--bg-main)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#11428E]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateAI();
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleGenerateAI()}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg bg-[#11428E] hover:bg-[#0d3470] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>{value ? 'Regenerate' : 'Generate Visual'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-Pick Verified Curriculum Diagrams */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)]">Curated Diagrams:</span>
            {[
              { label: '🍰 3/4 Fraction Pie', prompt: 'fraction pie divided into 4 slices, 3 shaded' },
              { label: '📊 10x10 Decimals Grid', prompt: 'decimals 10x10 grid model with shaded squares' },
              { label: '📏 Number Line', prompt: 'number line with tick marks from 0 to 10' },
              { label: '📐 Geometric Shapes', prompt: 'geometric shapes triangle square circle rectangle' },
              { label: '💡 Figures of Speech', prompt: 'figures of speech simile metaphor illustration' },
              { label: '🧮 Place Value', prompt: 'place value blocks chart hundreds tens ones' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setCustomPrompt(item.prompt);
                  handleGenerateAI(item.prompt);
                }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-main)] hover:bg-[#11428E]/10 hover:text-[#11428E] border border-[var(--border-color)] text-[var(--text-muted)] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
          </div>
        )}

        {mode === 'upload' && (
          <label className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[#11428E] transition-all cursor-pointer text-center group">
            <UploadCloud size={16} className="text-[var(--text-muted)] group-hover:text-[#11428E] transition-colors" />
            <span className="text-xs font-semibold text-[var(--text-main)]">
              {value && value.startsWith('data:') ? 'Change uploaded image file' : 'Click or drop an image file here'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">PNG, JPG, WebP, or SVG (up to 5MB)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {mode === 'url' && (
          <input
            type="url"
            placeholder="Paste HTTPS image link (e.g. https://...)"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => {
              setHasImgError(false);
              onChange(e.target.value);
            }}
            className="w-full py-1.5 px-3 border border-[var(--border-color)] rounded-lg text-xs bg-[var(--bg-main)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#11428E]"
          />
        )}
      </div>

      {/* Live Preview Container */}
      {value ? (
        <div className="mt-1 flex items-start gap-3 p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] relative">
          {!hasImgError ? (
            <img
              src={value}
              alt="Visual preview"
              onError={() => setHasImgError(true)}
              className="w-24 h-20 object-cover rounded-md border border-[var(--border-color)] shadow-xs shrink-0 bg-white"
            />
          ) : (
            <div className="w-24 h-20 rounded-md border border-red-500/30 bg-red-500/10 flex flex-col items-center justify-center text-red-500 text-center p-1 shrink-0">
              <AlertCircle size={16} />
              <span className="text-[9px] font-bold mt-1">Failed to load</span>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#11428E]/10 text-[#11428E] dark:text-sky-300">
                  {value.startsWith('data:') ? 'Uploaded File' : value.includes('pollinations') ? 'AI Visual' : 'Web Link'}
                </span>
                {hasImgError && (
                  <span className="text-[9px] font-bold text-red-500">
                    Broken URL — Try Regenerating
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-full mt-1 font-mono">
                {value.startsWith('data:') ? 'Embedded image data' : value}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleGenerateAI(defaultPrompt)}
                disabled={isGenerating}
                className="text-[10px] font-bold text-[#11428E] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={10} className={isGenerating ? 'animate-spin' : ''} />
                <span>Regenerate AI Visual</span>
              </button>
              <span className="text-[var(--text-muted)]">•</span>
              <button
                type="button"
                onClick={() => {
                  setHasImgError(false);
                  onChange('');
                }}
                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X size={10} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
