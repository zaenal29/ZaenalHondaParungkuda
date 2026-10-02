import React, { useState } from 'react';
import { Bike } from 'lucide-react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className = '',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 text-slate-600 p-6 text-center ${className}`}
        role="img"
        aria-label={alt || fallbackTitle || 'Honda Motorcycle'}
      >
        <Bike className="w-10 h-10 text-red-600 mb-2 opacity-80" />
        <span className="text-xs font-semibold tracking-tight text-slate-700 line-clamp-2">
          {fallbackTitle || alt || 'Zaenal Abidin Honda Parungkuda'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || fallbackTitle || 'Honda Motorcycle'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...rest}
    />
  );
};
