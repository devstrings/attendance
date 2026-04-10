import React from 'react';
import ManagerNavbar from './ManagerNavbar';
import MonthlySummary from '../Common/MonthlySummary';
import '../../styles/Manager.css';

const ManagerMonthlySummaryPage = () => {
  return (
    <div className="manager-container">
      <ManagerNavbar />
      <div className="manager-content" style={{ padding: 24 }}>
        <MonthlySummary role="manager" />
      </div>
    </div>
  );
};

export default ManagerMonthlySummaryPage;