export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const extractColorsFromImage = async (imageUrl: string): Promise<ExtractedColors> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        // Fallback to default colors
        resolve({
          primary: 'hsl(220, 70%, 50%)',
          secondary: 'hsl(260, 70%, 50%)',
          accent: 'hsl(300, 70%, 50%)'
        });
        return;
      }
      
      // Resize image for faster processing
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      try {
        const imageData = ctx.getImageData(0, 0, size, size);
        const colors = extractDominantColors(imageData.data);
        resolve(colors);
      } catch (error) {
        console.warn('Could not extract colors from image:', error);
        // Fallback to default colors
        resolve({
          primary: 'hsl(220, 70%, 50%)',
          secondary: 'hsl(260, 70%, 50%)',
          accent: 'hsl(300, 70%, 50%)'
        });
      }
    };
    
    img.onerror = () => {
      // Fallback to default colors
      resolve({
        primary: 'hsl(220, 70%, 50%)',
        secondary: 'hsl(260, 70%, 50%)',
        accent: 'hsl(300, 70%, 50%)'
      });
    };
    
    img.src = imageUrl;
  });
};

const extractDominantColors = (data: Uint8ClampedArray): ExtractedColors => {
  const colorMap = new Map<string, number>();
  
  // Sample pixels (every 4th pixel for performance)
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent or very light pixels (likely background)
    if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;
    
    // Quantize colors to reduce noise
    const qR = Math.floor(r / 32) * 32;
    const qG = Math.floor(g / 32) * 32;
    const qB = Math.floor(b / 32) * 32;
    
    const colorKey = `${qR},${qG},${qB}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }
  
  // Sort colors by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Take top 5 colors
  
  if (sortedColors.length === 0) {
    return {
      primary: 'hsl(220, 70%, 50%)',
      secondary: 'hsl(260, 70%, 50%)',
      accent: 'hsl(300, 70%, 50%)'
    };
  }
  
  // Convert most dominant colors to HSL
  const dominantColors = sortedColors.map(([colorKey]) => {
    const [r, g, b] = colorKey.split(',').map(Number);
    return rgbToHsl(r, g, b);
  });
  
  return {
    primary: `hsl(${dominantColors[0]?.h || 220}, ${Math.min((dominantColors[0]?.s || 70) + 20, 90)}%, ${Math.max((dominantColors[0]?.l || 50) - 10, 35)}%)`,
    secondary: `hsl(${dominantColors[1]?.h || 260}, ${Math.min((dominantColors[1]?.s || 70) + 15, 85)}%, ${Math.max((dominantColors[1]?.l || 50) - 5, 40)}%)`,
    accent: `hsl(${dominantColors[2]?.h || 300}, ${Math.min((dominantColors[2]?.s || 70) + 10, 80)}%, ${Math.max((dominantColors[2]?.l || 50), 45)}%)`
  };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};