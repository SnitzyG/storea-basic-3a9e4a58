import { useState, useEffect } from 'react';

export default function StorageAnimation() {
  const items = [
    'PROJECT', 'FILE', 'DRAWING', 'SPECIFICATION', 'PERMIT', 'CONTRACT', 'INVOICE',
    'REPORT', 'CHANGE ORDER', 'RFI', 'SUBMITTAL', 'MILESTONE', 'TASK', 'DEADLINE',
    'SCHEDULE', 'BUDGET', 'COST ESTIMATE', 'ACTUAL COST', 'LABOR COST', 'MATERIAL COST',
    'EQUIPMENT COST', 'CONTINGENCY', 'COST VARIANCE', 'PAYMENT', 'PURCHASE ORDER',
    'LABOURER', 'EQUIPMENT', 'MATERIAL', 'SUBCONTRACTOR', 'VENDOR', 'RESOURCE ALLOCATION',
    'TEAM MEMBER', 'ROLE', 'RESPONSIBILITY', 'CERTIFICATION', 'SAFETY INCIDENT',
    'HAZARD ASSESSMENT', 'INSPECTION', 'SAFETY PLAN', 'TRAINING RECORD', 'TEST RESULT',
    'INSPECTION REPORT', 'DEFECT LOG', 'CORRECTION REQUEST', 'QUALITY STANDARD', 'MEETING',
    'MEETING MINUTES', 'EMAIL', 'NOTIFICATION', 'ISSUE', 'CHANGE REQUEST', 'DAILY REPORT',
    'WEATHERDATA', 'ACCESSLOG', 'INVENTORY', 'WASTERECORD', 'SITEPHOTO', 'SITEVIDEO',
    'PROGRESS METRIC', 'SCHEDULE PERFORMANCE', 'BUDGET PERFORMANCE', 'QUALITY METRIC',
    'SAFETY METRIC', 'PRODUCTIVITY METRIC', 'WARRANTY', 'INSURANCE', 'AMENDMENT',
    'SUSTAINABILITY GOAL', 'WASTE REDUCTION', 'EMISSIONS DATA', 'COMMENT', 'ATTACHMENT',
    'VERSION', 'AUDIT', 'APPROVAL', 'SIGNATURE'
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-16 bg-white" style={{ fontFamily: 'Roboto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
      `}</style>
      <div className="text-center">
        <div className="min-h-32 flex flex-col items-center justify-center">
          <div className="text-gray-800 text-8xl font-bold">STORE <span className="text-black">A</span></div>
          <div className="text-9xl font-normal text-black">
            {items[currentIndex]}
          </div>
        </div>
      </div>
    </div>
  );
}
