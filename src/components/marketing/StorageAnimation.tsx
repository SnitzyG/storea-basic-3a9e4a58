import { useState, useEffect, useRef } from 'react';

export default function StorageAnimation() {
  const items = [
    'BUDGET', 'DRAWING', 'PROJECT', 'LAYOUT', 'PAYMENT', 'INVOICE', 'REQUEST', 
    'MEETING', 'MESSAGE', 'COMMENT', 'DIAGRAM', 'DESIGN', 'MODEL', 'RECORD', 
    'VERSION', 'SCHEDULE', 'RESOURCE', 'MATERIAL', 'FORECAST', 'ANALYSIS', 
    'TEMPLATE', 'DOCUMENT', 'CONTRACT', 'APPROVAL', 'TIMELINE', 'REVISION', 
    'STANDARD', 'ESTIMATE', 'PROPOSAL', 'DATABASE', 'REGISTER', 'CALENDAR', 
    'STRATEGY', 'TRACKING', 'CONCRETE', 'BUILDING', 'WORKFLOW', 'PROGRESS', 
    'TRAINING', 'FEEDBACK', 'INCIDENT', 'SUMMARY', 'DELIVERY'
  ];
  
  const [currentWord, setCurrentWord] = useState(items[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinWords, setSpinWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    // Start first spin after 1 second
    setTimeout(() => {
      startSpin();
    }, 1000);
    
    const interval = setInterval(() => {
      startSpin();
    }, 13000);
    
    return () => clearInterval(interval);
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
    <div className="flex items-center justify-center w-full min-h-screen px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
      `}</style>
      <div className="flex items-center justify-center gap-6 w-full max-w-full">
        <div className="text-gray-800 text-8xl md:text-[10rem] lg:text-[12rem] font-bold whitespace-nowrap" style={{ fontFamily: 'Roboto' }}>
          STOREA
        </div>
        
        <div className="text-8xl md:text-[10rem] lg:text-[12rem] font-bold whitespace-nowrap flex-1 max-w-[800px]" style={{ 
          fontFamily: 'Roboto',
          color: isSpinning ? '#d1d5db' : '#000000',
          transition: 'color 0.3s'
        }}>
          {currentWord}
        </div>
      </div>
    </div>
  );
}
