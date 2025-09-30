import React from 'react';
import { TenderComparisonDashboard } from '@/components/tenders/TenderComparisonDashboard';

const TenderComparisonDemo = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <TenderComparisonDashboard tenderId="demo-tender-1" />
    </div>
  );
};

export default TenderComparisonDemo;