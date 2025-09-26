import { useState, useEffect } from 'react';
import { extractColorsFromImage, ExtractedColors } from '@/utils/colorExtractor';

export const useLogoColors = (logoUrl?: string) => {
  const [colors, setColors] = useState<ExtractedColors | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logoUrl) {
      setColors(null);
      return;
    }

    setLoading(true);
    extractColorsFromImage(logoUrl)
      .then(setColors)
      .catch((error) => {
        console.warn('Failed to extract colors from logo:', error);
        setColors({
          primary: 'hsl(220, 70%, 50%)',
          secondary: 'hsl(260, 70%, 50%)',
          accent: 'hsl(300, 70%, 50%)'
        });
      })
      .finally(() => setLoading(false));
  }, [logoUrl]);

  return { colors, loading };
};