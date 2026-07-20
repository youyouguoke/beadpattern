"use client";

import { useState } from "react";

interface ClientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ClientImage({ src, alt, className }: ClientImageProps) {
  const [error, setError] = useState(false);
  if (error) {
    const text = encodeURIComponent(alt);
    return (
      <img
        src={`https://placehold.co/400x400/fcf9f8/ad2c4e?text=${text}`}
        alt={alt}
        className={className}
      />
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}
