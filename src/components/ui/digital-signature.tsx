import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, RotateCcw, Check } from 'lucide-react';

interface DigitalSignatureProps {
  onSignatureCapture: (signature: string | null) => void;
  width?: number;
  height?: number;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureCapture,
  width = 400,
  height = 200,
  disabled = false,
  label = "Digital Signature",
  required = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Add border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // Reset stroke style for drawing
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
  }, [width, height]);

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const pos = getEventPos(e);
    setLastPoint(pos);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const currentPos = getEventPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    setLastPoint(currentPos);
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
    
    if (hasSignature) {
      captureSignature();
    }
  };

  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    onSignatureCapture(dataURL);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Clear and reset canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Add border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // Reset drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    setHasSignature(false);
    onSignatureCapture(null);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative border border-border rounded-lg p-4 bg-background">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`border border-muted rounded cursor-crosshair ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {hasSignature ? 'Signature captured' : 'Click and drag to sign'}
          </p>
          
          <div className="flex items-center gap-2">
            {hasSignature && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Signed
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
              disabled={disabled || !hasSignature}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Your digital signature will be included in the document as verification of your response.
      </p>
    </div>
  );
};