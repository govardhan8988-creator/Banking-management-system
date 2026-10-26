import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { Landmark } from 'lucide-react';
import './index.css';

function MainApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  if (loading) {
    return (
      <div className="app-splash-screen">
        <div className="splash-card">
          <div className="splash-logo">
            <Landmark size={40} className="text-primary spin-slow" />
          </div>
          <h2>APEX BANK</h2>
          <p>Connecting to secure banking services...</p>
          <div className="spinner" style={{ margin: '1.5rem auto 0' }}></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <DashboardPage />;
  }

  return authView === 'login' ? (
    <LoginPage onNavigateToRegister={() => setAuthView('register')} />
  ) : (
    <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
