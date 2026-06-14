import { useState } from 'react';
import DashboardHome from './DashboardHome';
import Expenses from './Expenses';
import ChitFunds from './ChitFunds';
import Sales from './Sales';
import Dealers from './Dealers';
import Stock from './Stock';
import MonthlyReport from './MonthlyReport';

function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  const pink = '#e11d8a';
  const lightPink = '#fdf2f8';
  const softPink = '#fce7f3';

  const [activeTab, setActiveTab] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: '🏠', component: DashboardHome },
    { name: 'Monthly Report', icon: '📊', component: MonthlyReport },
    { name: 'Chit Funds', icon: '💼', component: ChitFunds },
    { name: 'Sales', icon: '📈', component: Sales },
    { name: 'Dealers', icon: '👥', component: Dealers },
    { name: 'Expenses', icon: '💰', component: Expenses },
    { name: 'Stock', icon: '📦', component: Stock }
  ];

  const CurrentComponent = menuItems.find(item => item.name === activeTab)?.component || DashboardHome;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: '#fafafa', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Sidebar (unchanged except clickable items) */}
      <div style={{ width: '280px', background: 'white', borderRight: `1px solid ${softPink}`, display: 'flex', flexDirection: 'column', boxShadow: '2px 0 12px rgba(225, 29, 138, 0.06)' }}>
        {/* Logo + Nav */}
        <div style={{ padding: '32px 24px', borderBottom: `1px solid ${softPink}` }}>
          <div style={{ fontSize: '34px', fontWeight: '700', color: pink }}>SLVGJ</div>
          <div style={{ fontSize: '13.5px', color: '#777' }}>CHIT FUND MANAGEMENT</div>
        </div>

        <nav style={{ padding: '24px 16px', flex: 1 }}>
          {menuItems.map((item) => (
            <div
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              style={{
                padding: '14px 20px',
                background: activeTab === item.name ? lightPink : 'transparent',
                color: activeTab === item.name ? pink : '#555',
                borderRadius: '16px',
                fontWeight: activeTab === item.name ? '600' : '500',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                  e.currentTarget.style.background = lightPink;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
              {item.icon} {item.name}
            </div>
          ))}
        </nav>

        {/*  Logout */}
        <div style={{ padding: '24px', borderTop: `1px solid ${softPink}` }}>
          <button onClick={handleLogout} style={{ width: '100%', marginTop: '24px', padding: '14px', background: lightPink, color: pink, border: `1px solid ${softPink}`, borderRadius: '14px', fontWeight: '600', cursor: 'pointer' }}>
            ⏻ Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header (unchanged) */}
        <header style={{ height: '76px', background: 'white', borderBottom: `1px solid ${softPink}`, display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
          {/* ... your existing header code (search + notification + avatar) ... */}
        </header>

        {/* Dynamic Page Content */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: '#fafafa' }}>
          <CurrentComponent pink={pink} lightPink={lightPink} softPink={softPink} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;