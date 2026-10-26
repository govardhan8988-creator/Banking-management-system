import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/api';
import { Landmark, LogOut, User, Activity } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    customerService.getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <Landmark size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">APEX BANK</span>
            <span className="brand-subtitle">Management System</span>
          </div>
        </div>

        {user && (
          <div className="navbar-actions">
            <div className="api-badge" title={apiOnline ? 'Backend API connected' : 'Backend API disconnected'}>
              <span className={`status-indicator ${apiOnline ? 'online' : 'offline'}`}></span>
              <span className="api-badge-text">API {apiOnline ? 'Online' : 'Offline'}</span>
            </div>

            <div className="user-profile-badge">
              <div className="avatar">
                <User size={16} />
              </div>
              <div className="user-info">
                <span className="user-name">{user.fullName}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>

            <button className="btn btn-outline btn-sm logout-btn" onClick={logout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
