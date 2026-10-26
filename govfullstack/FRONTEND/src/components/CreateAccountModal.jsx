import React, { useState } from 'react';
import { accountService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import { X, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateAccountModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState('SAVINGS');
  const [initialBalance, setInitialBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (initialBalance !== '' && (isNaN(parseFloat(initialBalance)) || parseFloat(initialBalance) < 0)) {
      setError('Initial deposit amount must be greater than or equal to ₹0.00.');
      return;
    }

    setLoading(true);

    try {
      const parsedBalance = initialBalance ? parseFloat(initialBalance) : 0;
      const payload = {
        customerId: user.id,
        accountType,
        initialBalance: parsedBalance
      };

      const res = await accountService.createAccount(payload);
      setSuccess(`Account ${res.data.account.accountNumber} opened successfully!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess('');
        setInitialBalance('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <PlusCircle className="modal-icon text-primary" size={22} />
            <h3>Open New Bank Account</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Account Holder</label>
            <input
              type="text"
              className="input-disabled"
              value={`${user?.fullName} (Customer ID: #${user?.id})`}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="select-field"
            >
              <option value="SAVINGS">Savings Account</option>
              <option value="CURRENT">Current Account</option>
            </select>
          </div>

          <div className="form-group">
            <label>Initial Opening Deposit (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="₹0.00 (Optional)"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="input-field"
            />
            <small className="form-hint">Enter 0 or leave empty for zero-balance opening.</small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Confirm & Open Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
