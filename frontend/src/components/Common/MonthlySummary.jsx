/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, import/no-anonymous-default-export, jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SalarySlip from './SalarySlip';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const MonthlySummary = ({ role = 'employee' }) => {
  const [summaries, setSummaries] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'manager'
        ? `/monthly-summary/my`
        : `/monthly-summary/my`;

      const res = await api.get(endpoint);
      if (res.data.success) {
        const data = res.data.summaries || [];
        setSummaries(data);
        if (data.length > 0) setSelected(data[0]);
      }
    } catch (err) {
      console.error('Error fetching monthly summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#6b7280', marginTop: 12 }}>Loading summaries...</p>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <h3 style={{ color: '#374151', marginBottom: 8 }}>No Summaries Yet</h3>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Monthly summaries are generated at the end of each month.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>📊 Monthly Attendance Summary</h2>
        <p style={styles.pageSubtitle}>Your attendance records and salary details</p>
      </div>

      {/* Month Tabs */}
      <div style={styles.tabsWrapper}>
        <div style={styles.tabsScroll}>
          {summaries.map(s => {
            const isActive = selected?._id === s._id;
            return (
              <button
                key={`${s.month}-${s.year}`}
                onClick={() => setSelected(s)}
                style={{
                  ...styles.tab,
                  background: isActive ? '#667eea' : 'white',
                  color: isActive ? 'white' : '#374151',
                  border: isActive ? '2px solid #667eea' : '2px solid #e5e7eb',
                }}
              >
                {MONTH_NAMES[s.month - 1].slice(0, 3)} {s.year}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Card */}
      {selected && (
        <div style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              {MONTH_NAMES[selected.month - 1]} {selected.year}
            </h3>
            <span style={{
              ...styles.badge,
              background: selected.totalUnauthorizedAbsences > 0 ? '#fee2e2' : '#d1fae5',
              color: selected.totalUnauthorizedAbsences > 0 ? '#dc2626' : '#059669'
            }}>
              {selected.totalUnauthorizedAbsences > 0
                ? `⚠️ ${selected.totalUnauthorizedAbsences} Absence(s)`
                : '✅ Good Standing'}
            </span>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statBox, borderTop: '3px solid #3b82f6' }}>
              <div style={styles.statIcon}>📅</div>
              <div style={styles.statValue}>{selected.totalWorkingDays}</div>
              <div style={styles.statLabel}>Working Days</div>
            </div>
            <div style={{ ...styles.statBox, borderTop: '3px solid #10b981' }}>
              <div style={styles.statIcon}>✅</div>
              <div style={{ ...styles.statValue, color: '#10b981' }}>{selected.totalPresent}</div>
              <div style={styles.statLabel}>Days Present</div>
            </div>
            <div style={{ ...styles.statBox, borderTop: '3px solid #3b82f6' }}>
              <div style={styles.statIcon}>🏖️</div>
              <div style={{ ...styles.statValue, color: '#3b82f6' }}>{selected.totalApprovedLeaves}</div>
              <div style={styles.statLabel}>Approved Leaves</div>
            </div>
            <div style={{ ...styles.statBox, borderTop: '3px solid #ef4444' }}>
              <div style={styles.statIcon}>❌</div>
              <div style={{ ...styles.statValue, color: '#ef4444' }}>{selected.totalUnauthorizedAbsences}</div>
              <div style={styles.statLabel}>Unauthorized</div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div style={styles.salarySection}>
            <h4 style={styles.sectionTitle}>💰 Salary Breakdown</h4>
            <div style={styles.salaryTable}>
              <div style={styles.salaryRow}>
                <span style={styles.salaryLabel}>Base Salary</span>
                <span style={styles.salaryValue}>Rs. {(selected.baseSalary || 0).toLocaleString()}</span>
              </div>
              <div style={styles.salaryRow}>
                <span style={styles.salaryLabel}>Deduction per Absence</span>
                <span style={styles.salaryValue}>Rs. {selected.deductionPerAbsence}</span>
              </div>
              <div style={styles.salaryRow}>
                <span style={styles.salaryLabel}>
                  Total Absences × Rs. {selected.deductionPerAbsence}
                </span>
                <span style={{ ...styles.salaryValue, color: '#ef4444' }}>
                  − Rs. {(selected.totalDeduction || 0).toLocaleString()}
                </span>
              </div>
              <div style={{ ...styles.salaryRow, ...styles.salaryRowNet }}>
                <span style={{ ...styles.salaryLabel, fontWeight: 700, fontSize: 16 }}>Net Salary</span>
                <span style={{ ...styles.salaryValue, color: '#059669', fontWeight: 700, fontSize: 18 }}>
                  Rs. {(selected.netSalary || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Salary Slip */}
          <SalarySlip summary={selected} />
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '0 0 32px 0' },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' },
  pageSubtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
  tabsWrapper: { marginBottom: 20 },
  tabsScroll: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tab: {
    padding: '8px 18px', borderRadius: 20, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
  },
  summaryCard: {
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden'
  },
  cardHeader: {
    padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
  },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 },
  badge: { padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 0, borderBottom: '1px solid #f3f4f6'
  },
  statBox: {
    padding: '20px 16px', textAlign: 'center',
    borderRight: '1px solid #f3f4f6'
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: 500 },
  salarySection: { padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 16px 0' },
  salaryTable: { display: 'flex', flexDirection: 'column', gap: 0 },
  salaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f9fafb'
  },
  salaryRowNet: {
    background: '#f0fdf4', padding: '14px 16px', borderRadius: 10,
    border: '1px solid #bbf7d0', marginTop: 8, borderBottom: 'none'
  },
  salaryLabel: { fontSize: 14, color: '#6b7280' },
  salaryValue: { fontSize: 15, fontWeight: 600, color: '#111827' },
  loadingContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 20px'
  },
  spinner: {
    width: 40, height: 40, border: '3px solid #f3f4f6',
    borderTop: '3px solid #667eea', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  emptyContainer: {
    textAlign: 'center', padding: '60px 20px',
    background: 'white', borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  }
};

export default MonthlySummary;
