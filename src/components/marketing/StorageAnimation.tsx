import { useState, useEffect, useRef } from 'react';

export default function StorageAnimation() {
  const items = [
    'PLAN', 'SCHEDULE', 'REPORT', 'BUDGET', 'ESTIMATE', 'DRAWING', 'SPECIFICATION', 
    'DOCUMENT', 'FILE', 'CONTRACT', 'INVOICE', 'CHANGE', 'REVISION', 'PHOTO', 'IMAGE', 
    'RECORD', 'CHECKLIST', 'FORM', 'TEMPLATE', 'MODEL', 'DESIGN', 'DIAGRAM', 'BLUEPRINT', 
    'MAP', 'PERMIT', 'LICENSE', 'CERTIFICATE', 'APPROVAL', 'SUBMITTAL', 'RFI', 'LOG', 
    'NOTE', 'COMMENT', 'MESSAGE', 'EMAIL', 'MEMO', 'AGENDA', 'MEETING', 'MINUTE', 
    'SCOPE', 'TIMELINE', 'MILESTONE', 'DELIVERABLE', 'TASK', 'ASSIGNMENT', 'RESOURCE', 
    'MATERIAL', 'EQUIPMENT', 'TOOL', 'SNAPSHOT', 'VIDEO', 'SUMMARY', 'ANALYSIS', 
    'FORECAST', 'RECEIPT', 'PAYMENT', 'TIMESHEET', 'REQUEST', 'ISSUE', 'RISK', 
    'OPPORTUNITY', 'ACTION', 'ITEM', 'UPDATE', 'VERSION', 'BACKUP', 'ARCHIVE', 
    'POLICY', 'PROCEDURE', 'STANDARD', 'LAYOUT', 'SKETCH', 'AGREEMENT', 'PROPOSAL', 
    'BID', 'OFFER', 'SUBMISSION'
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
    <div className="flex items-center justify-center w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
      `}</style>
      <div className="w-full px-8 md:px-16">
        <div className="flex items-center justify-center gap-4">
          <div className="text-gray-800 text-8xl md:text-9xl font-bold whitespace-nowrap" style={{ fontFamily: 'Roboto' }}>
            STOREA
          </div>
          
          <div className="text-8xl md:text-9xl font-bold whitespace-nowrap min-w-[600px] md:min-w-[800px]" style={{ 
            fontFamily: 'Roboto',
            color: isSpinning ? '#d1d5db' : '#000000',
            transition: 'color 0.3s'
          }}>
            {currentWord}
          </div>
        </div>
      </div>
    </div>
  );
}
