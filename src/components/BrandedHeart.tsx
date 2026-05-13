import React from "react";

interface BrandedHeartProps {
  className?: string;
  size?: number;
  color?: string;
  useGradient?: boolean;
}

export default function BrandedHeart({ 
  className = "", 
  size = 24, 
  color = "currentColor",
  useGradient = false 
}: BrandedHeartProps) {
  const gradientId = `heartGradient-${Math.random().toString(36).substr(2, 9)}`;
  const maskId = `heartMask-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {useGradient && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D81B60" />
            <stop offset="100%" stopColor="#FFA726" />
          </linearGradient>
        )}
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <path 
            d="M12 18.5l-0.8-0.7C7.5 14.5 5 12.2 5 9.5 5 7.6 6.4 6.2 8.2 6.2c1.1 0 2.1 0.6 2.8 1.5 0.7-0.9 1.7-1.5 2.8-1.5 1.8 0 3.2 1.4 3.2 3.3 0 2.7-2.5 5-6.2 8.3l-0.8 0.7z" 
            fill="black" 
          />
        </mask>
      </defs>
      <path 
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
        fill={useGradient ? `url(#${gradientId})` : color} 
        mask={`url(#${maskId})`} 
      />
    </svg>
  );
}
