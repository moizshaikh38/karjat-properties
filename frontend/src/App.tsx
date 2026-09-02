import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Properties from './pages/Properties';
import SiteVisits from './pages/SiteVisits';
import Followups from './pages/Followups';
import Campaigns from './pages/Campaigns';
import CampaignWizard from './pages/CampaignWizard';
import Templates from './pages/Templates';
import AIAgent from './pages/AIAgent';
import Automation from './pages/Automation';
import Analytics from './pages/Analytics';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-[var(--color-text)]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inbox/*" element={<Inbox />} />
        <Route path="leads" element={<Leads />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="properties" element={<Properties />} />
        <Route path="site-visits" element={<SiteVisits />} />
        <Route path="followups" element={<Followups />} />
        <Route path="follow-ups" element={<Followups />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<CampaignWizard />} />
        <Route path="templates" element={<Templates />} />
        <Route path="ai-agent" element={<AIAgent />} />
        <Route path="ai" element={<AIAgent />} />
        <Route path="automation" element={<Automation />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="agents" element={<Agents />} />
        <Route path="team" element={<Agents />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)'
              }
            }} 
          />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
