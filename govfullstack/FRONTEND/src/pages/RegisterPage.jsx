import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, User, Mail, Phone, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function RegisterPage({ onNavigateToLogin }) {
  const { register, login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Full name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password
      });

      setSuccess('Account registered successfully! Logging you in...');

      // Auto login immediately
      setTimeout(async () => {
        try {
          await login(email.trim(), password);
        } catch {
          onNavigateToLogin();
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-brand-icon">
            <Landmark size={32} />
          </div>
          <h2>Create Customer Profile</h2>
          <p className="auth-subtitle">Join Apex Bank and manage your accounts seamlessly</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Legal Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                type="text"
                required
                placeholder="e.g. Govardhan Reddy"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                required
                placeholder="e.g. govardhan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number (Optional)</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={18} />
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password (Min. 6 characters)</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Choose a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating Customer Profile...' : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button type="button" className="link-button" onClick={onNavigateToLogin}>
              Log in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
