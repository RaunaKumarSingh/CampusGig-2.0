import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ImageWithFallback({ src, alt, className = '', fallbackLabel }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 via-slate-100 to-violet-50 dark:from-violet-950 dark:via-slate-900 dark:to-slate-800 text-violet-800 dark:text-violet-300 ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-5 h-5 opacity-60 mb-1" />
        {fallbackLabel && (
          <span className="text-xs font-medium px-2 text-center">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
