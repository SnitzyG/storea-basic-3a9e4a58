import { useState, useEffect, useRef } from 'react';

export default function StorageAnimation() {
  const items = [
    'PLAN', 'BUDGET', 'PROJECT', 'LAYOUT', 'PAYMENT', 'INVOICE', 'REQUEST', 
    'MEETING', 'MESSAGE', 'COMMENT', 'DIAGRAM', 'DESIGN', 'MODEL', 'RECORD', 
    'VERSION', 'CONTRACT', 'DRAWING', 'SUMMARY', 'DELIVERY', 'REPORT', 
    'CHANGE', 'PHOTO', 'POLICY', 'MANUAL', 'PERMIT', 'ACTION', 'ISSUE', 
    'MEMO', 'UPDATE', 'NOTICE', 'AGENDA', 'VENDOR', 'WORKER', 'CLIENT', 
    'ASSET', 'BACKUP', 'SKETCH', 'METRIC', 'DETAIL', 'RESULT', 'STATUS', 
    'MODULE', 'SAMPLE', 'FOLDER', 'TENDER', 'SUPPLY', 'REVIEW', 'OUTPUT', 
    'SCOPE', 'TOOL', 'FORM', 'LOG', 'RFI', 'MAP', 'NOTE', 'EMAIL', 'TASK'
  ];
  
  const [currentWord, setCurrentWord] = useState(items[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinWords, setSpinWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Start first spin after 1 second
    timeoutRef.current = setTimeout(() => {
      startSpin();
    }, 1000);
    
    intervalRef.current = setInterval(() => {
      startSpin();
    }, 13000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  const startSpin = () => {
    // Select 16 random words
    const selected = [];
    for (let i = 0; i < 16; i++) {
      const randomIdx = Math.floor(Math.random() * items.length);
      selected.push(items[randomIdx]);
    }
    setSpinWords(selected);
    setIsSpinning(true);
    setCurrentIndex(0);
    
    // Spin through words
    let index = 0;
    const totalDuration = 8000;
    const wordCount = 16;
    
    const spinThroughWords = () => {
      if (index < wordCount) {
        setCurrentWord(selected[index]);
        setCurrentIndex(index);
        
        // Slow down over time
        const progress = index / wordCount;
        const delay = 100 + (progress * 700); // Start at 100ms, end at 800ms
        
        index++;
        setTimeout(spinThroughWords, delay);
      } else {
        // Stop spinning
        setIsSpinning(false);
        setCurrentWord(selected[wordCount - 1]);
      }
    };
    
    spinThroughWords();
  };
  
  return (
    <div className="flex items-center justify-center w-full h-full px-4">
      <div className="flex flex-col items-center gap-4 md:gap-6">
        <div className="text-foreground text-6xl sm:text-7xl md:text-[10rem] lg:text-[14rem] xl:text-[16rem] font-bold whitespace-nowrap leading-none font-roboto">
          STORE A
        </div>
        
        <div 
          className={`text-6xl sm:text-7xl md:text-[10rem] lg:text-[14rem] xl:text-[16rem] font-bold whitespace-nowrap leading-none font-roboto transition-colors duration-300 ${
            isSpinning ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {currentWord}
        </div>
      </div>
    </div>
  );
}
