import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CaptchaChallengeProps {
  onVerify: (success: boolean) => void;
  onClose?: () => void;
}

export const CaptchaChallenge: React.FC<CaptchaChallengeProps> = ({ onVerify, onClose }) => {
  const [challenge, setChallenge] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateChallenge = () => {
    // Generate simple math challenge
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer: number;
    let challengeText: string;
    
    switch (operation) {
      case '+':
        answer = num1 + num2;
        challengeText = `${num1} + ${num2}`;
        break;
      case '-':
        answer = Math.max(num1, num2) - Math.min(num1, num2);
        challengeText = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
        break;
      case '×':
        answer = num1 * num2;
        challengeText = `${num1} × ${num2}`;
        break;
      default:
        answer = num1 + num2;
        challengeText = `${num1} + ${num2}`;
    }
    
    setChallenge(challengeText);
    return answer;
  };

  const [correctAnswer] = useState(() => generateChallenge());

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add noise
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1)`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }
      
      // Draw challenge text
      ctx.font = '24px Arial';
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.textAlign = 'center';
      ctx.fillText(challenge, canvas.width / 2, canvas.height / 2 + 8);
      
      // Add distortion lines
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * canvas.height);
        ctx.lineTo(canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }
    }
  }, [challenge]);

  const handleVerify = () => {
    const userAnswer = parseInt(userInput.trim());
    
    if (isNaN(userAnswer)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (userAnswer === correctAnswer) {
      onVerify(true);
    } else {
      setError('Incorrect answer. Please try again.');
      setUserInput('');
      // Generate new challenge on failure
      const newAnswer = generateChallenge();
      setError('Incorrect answer. Please solve the new challenge.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Security Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Label>Please solve this math problem:</Label>
          <canvas
            ref={canvasRef}
            width={200}
            height={60}
            className="border rounded mt-2 mx-auto block bg-muted/20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="captcha-input">Your Answer:</Label>
          <Input
            id="captcha-input"
            type="number"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter the result"
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleVerify} className="flex-1">
            Verify
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};