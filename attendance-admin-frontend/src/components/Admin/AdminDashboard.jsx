import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import adminService from '../../services/adminService';
import '../../styles/Admin.css';

/**
 * AdminDashboard Component
 * Real-time dashboard with 100% backend data
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      leaveToday: 0
    }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

 const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const response = await adminService.getDashboard();
    
    if (response.success) {
      const totalEmp = response.data.stats?.totalEmployees || 0;
      const present = response.data.stats?.todayAttendance || 0;
      const leave = response.data.stats?.pendingLeaves || 0;
      const absent = response.data.stats?.absentToday || 0;

      setDashboardData({
        stats: {
          totalEmployees: totalEmp,
          presentToday: present,
          absentToday: absent,
          leaveToday: leave
        }
      });
      
      // ✅ NEW: Show working day status
      if (response.data.meta?.isWorkingDay === false) {
        console.log(`🏖️ Today is ${response.data.meta.todayDayName} - Non-working day`);
      }
    }
  } catch (error) {
    console.error('❌ Dashboard error:', error);
  } finally {
    setLoading(false);
  }
};

  // Get attendance percentage from REAL data
  const getAttendancePercentage = () => {
    if (dashboardData.stats.totalEmployees === 0) return 0;
    return Math.round((dashboardData.stats.presentToday / dashboardData.stats.totalEmployees) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-container">
        <AdminNavbar />
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-content">
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading dashboard...</p>
            </div>
            <style>{spinnerAnimation}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNavbar />
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content" style={styles.content}>
          
          {/* Header Section */}
          <div style={styles.header}>
            <div style={styles.welcomeSection}>
              <h1 style={styles.title}>
                <span style={styles.emoji}>👋</span>
                Welcome to Devstrings Attendance System
              </h1>
              <p style={styles.subtitle}>
                Overview of your organization's attendance data and quick actions
              </p>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.primaryButton} onClick={() => navigate('/admin/create-employee')}>
                <span>➕</span> Add Employee
              </button>
              <button style={styles.secondaryButton} onClick={() => navigate('/admin/create-manager')}>
                <span>👥</span> Add Manager
              </button>
            </div>
          </div>

          {/* Stats Cards - 4 Cards with REAL DATA */}
          <div style={styles.statsGrid}>
            {/* Total Employees */}
            <div style={{...styles.statCard, borderLeftColor: '#3b82f6'}}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, background: '#3b82f615'}}>👥</div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>TOTAL EMPLOYEES</div>
                  <div style={styles.statValue}>{dashboardData.stats.totalEmployees}</div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a href="#" style={styles.statLink} onClick={(e) => { e.preventDefault(); navigate('/admin/employees'); }}>
                  View All →
                </a>
              </div>
            </div>

            {/* Present Today */}
            <div style={{...styles.statCard, borderLeftColor: '#10b981'}}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, background: '#10b98115'}}>✅</div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>PRESENT TODAY</div>
                  <div style={styles.statValue}>{dashboardData.stats.presentToday}</div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a href="#" style={styles.statLink} onClick={(e) => { e.preventDefault(); navigate('/admin/attendance-view'); }}>
                  View Details →
                </a>
              </div>
            </div>

            {/* Absent Today */}
            <div style={{...styles.statCard, borderLeftColor: '#ef4444'}}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, background: '#ef444415'}}>❌</div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>ABSENT TODAY</div>
                  <div style={styles.statValue}>{dashboardData.stats.absentToday}</div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a href="#" style={styles.statLink} onClick={(e) => { e.preventDefault(); navigate('/admin/attendance-view'); }}>
                  View Details →
                </a>
              </div>
            </div>

            {/* Leave Today */}
            <div style={{...styles.statCard, borderLeftColor: '#f59e0b'}}>
              <div style={styles.statHeader}>
                <div style={{...styles.statIcon, background: '#f59e0b15'}}>🏖️</div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>LEAVE TODAY</div>
                  <div style={styles.statValue}>{dashboardData.stats.leaveToday}</div>
                </div>
              </div>
              <div style={styles.statFooter}>
                <a href="#" style={styles.statLink} onClick={(e) => { e.preventDefault(); navigate('/admin/attendance-view'); }}>
                  Review →
                </a>
              </div>
            </div>
          </div>

          {/* Widgets Grid - ONLY REAL DATA */}
          <div style={styles.widgetsGrid}>
            
            {/* Today's Attendance Rate Widget */}
            <div style={styles.widget}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>
                  <span style={styles.widgetIcon}>📊</span>
                  Today's Attendance Rate
                </h3>
              </div>
              <div style={styles.widgetContent}>
                <div style={styles.attendanceCircle}>
                  <div style={styles.circleProgress}>
                    <svg width="150" height="150">
                      <circle cx="75" cy="75" r="60" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                      <circle 
                        cx="75" 
                        cy="75" 
                        r="60" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="12"
                        strokeDasharray={`${(getAttendancePercentage() / 100) * 377} 377`}
                        strokeLinecap="round"
                        transform="rotate(-90 75 75)"
                      />
                    </svg>
                    <div style={styles.circleText}>
                      <div style={styles.percentageText}>{getAttendancePercentage()}%</div>
                      <div style={styles.percentageLabel}>Present</div>
                    </div>
                  </div>
                </div>
                <div style={styles.attendanceDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailDot('green')}>●</span>
                    <span style={styles.detailText}>Present: {dashboardData.stats.presentToday}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailDot('red')}>●</span>
                    <span style={styles.detailText}>Absent: {dashboardData.stats.absentToday}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailDot('orange')}>●</span>
                    <span style={styles.detailText}>On Leave: {dashboardData.stats.leaveToday}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Widget */}
            <div style={styles.widget}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>
                  <span style={styles.widgetIcon}>⚡</span>
                  Quick Actions
                </h3>
              </div>
              <div style={styles.widgetContent}>
                <div style={styles.quickActionsList}>
                  {/* ✅ REMOVED: Mark Attendance option hataya */}
                  
                  <div style={styles.quickActionItem} onClick={() => navigate('/admin/attendance-view')}>
                    <div style={{...styles.actionIcon, background: '#10b98115', color: '#10b981'}}>📅</div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>View Records</div>
                      <div style={styles.actionDesc}>Check attendance history</div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  <div style={styles.quickActionItem} onClick={() => navigate('/admin/reports')}>
                    <div style={{...styles.actionIcon, background: '#f59e0b15', color: '#f59e0b'}}>📊</div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Generate Report</div>
                      <div style={styles.actionDesc}>Download attendance reports</div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>

                  <div style={styles.quickActionItem} onClick={() => navigate('/admin/create-employee')}>
                    <div style={{...styles.actionIcon, background: '#3b82f615', color: '#3b82f6'}}>👥</div>
                    <div style={styles.actionInfo}>
                      <div style={styles.actionTitle}>Add Employee</div>
                      <div style={styles.actionDesc}>Register new employee</div>
                    </div>
                    <div style={styles.actionArrow}>→</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = {
  content: {
    padding: '24px',
    background: '#f9fafb',
    minHeight: '100vh'
  },

  // Header
  header: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  welcomeSection: {
    flex: 1,
    minWidth: '300px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  emoji: {
    fontSize: '32px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  secondaryButton: {
    padding: '12px 24px',
    background: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s'
  },

  // Stats Grid (4 cards)
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  statInfo: {
    flex: 1
  },
  statLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827'
  },
  statFooter: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '12px'
  },
  statLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600'
  },

  // Widgets Grid
  widgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px'
  },
  widget: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  widgetHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  widgetTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  widgetIcon: {
    fontSize: '20px'
  },
  widgetContent: {
    padding: '24px'
  },

  // Attendance Circle
  attendanceCircle: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  circleProgress: {
    position: 'relative'
  },
  circleText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  percentageText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827'
  },
  percentageLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  attendanceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  detailDot: (color) => ({
    fontSize: '16px',
    color: color === 'green' ? '#10b981' : color === 'orange' ? '#f59e0b' : '#ef4444'
  }),
  detailText: {
    fontSize: '14px',
    color: '#374151'
  },

  // Quick Actions
  quickActionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  quickActionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '2px solid transparent'
  },
  actionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  actionInfo: {
    flex: 1
  },
  actionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '2px'
  },
  actionDesc: {
    fontSize: '12px',
    color: '#6b7280'
  },
  actionArrow: {
    fontSize: '18px',
    color: '#9ca3af'
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    flexDirection: 'column',
    gap: '20px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#666',
    fontSize: '14px'
  }
};

const spinnerAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default AdminDashboard;