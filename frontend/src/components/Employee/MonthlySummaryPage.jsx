import React from 'react';
import EmployeeNavbar from './EmployeeNavbar';
import MonthlySummary from '../Common/MonthlySummary';
import '../../styles/Employee.css';

const MonthlySummaryPage = () => {
  return (
    <div className="employee-container">
      <EmployeeNavbar />
      <div className="employee-content" style={{ padding: 24 }}>
        <MonthlySummary role="employee" />
      </div>
    </div>
  );
};

export default MonthlySummaryPage;