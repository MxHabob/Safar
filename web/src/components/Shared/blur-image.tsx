"use client";

import { useState, memo } from "react";
import Image, { ImageProps } from "next/image";
import { Blurhash } from "react-blurhash";

interface BlurImageProps extends Omit<ImageProps, "onLoad"> {
  blurhash: string;
  priority?: boolean; // For LCP images
  unoptimized?: boolean; // For external URLs with query params
}

/**
 * Optimized BlurImage component with Next.js 16 best practices.
 * 
 * Performance optimizations:
 * - Uses next/image for automatic WebP/AVIF conversion
 * - Blurhash placeholder for zero CLS
 * - Lazy loading by default (use priority=true for LCP images)
 * - Memoized to prevent unnecessary re-renders
 *
 * @param {string} src - The source of the image.
 * @param {string} alt - The alt text of the image (required for accessibility).
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {boolean} fill - Use fill instead of width/height.
 * @param {string} className - Optional className for the component.
 * @param {string} blurhash - The blurhash of the image.
 * @param {boolean} priority - Set to true for LCP images (above the fold).
 * @returns {JSX.Element} - The optimized BlurImage component.
 */
const BlurImage = memo(function BlurImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  blurhash,
  priority = false,
  loading = priority ? undefined : "lazy",
  unoptimized,
  ...props
}: BlurImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine if we should use unoptimized based on URL
  // External URLs with query parameters (like Unsplash) should be unoptimized
  // to avoid Next.js Image optimization issues
  const shouldUnoptimize = unoptimized !== undefined 
    ? unoptimized 
    : typeof src === 'string' && (
        // Unoptimize external URLs that already have query parameters (like Unsplash)
        (src.includes('?') && (src.startsWith('http://') || src.startsWith('https://'))) ||
        // Unoptimize data URLs
        src.startsWith('data:')
      );

  const containerStyle = fill ? "absolute inset-0" : "relative w-full h-full";

  // Fallback to regular img tag if there's an error
  if (hasError && typeof src === 'string') {
    return (
      <div className={containerStyle}>
        {!imageLoaded && blurhash && (
          <div className={`absolute inset-0 ${className}`} aria-hidden="true">
            <Blurhash
              hash={blurhash}
              width="100%"
              height="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} transition-opacity duration-500 ease-in-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setHasError(true)}
          style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined}
        />
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      {!imageLoaded && blurhash && (
        <div className={`absolute inset-0 ${className}`} aria-hidden="true">
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        loading={loading}
        unoptimized={shouldUnoptimize}
        className={`${className} transition-opacity duration-500 ease-in-out ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          // Only set error state - fallback to regular img tag will handle it
          setHasError(true);
        }}
        {...props}
      />
    </div>
  );
});

export default BlurImage;
