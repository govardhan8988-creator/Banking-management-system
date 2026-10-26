import React, { useState } from 'react';
import { accountService } from '../services/api';
import { formatINR } from '../utils/currency';
import { X, ArrowDownRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function DepositModal({ isOpen, onClose, account, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !account) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than ₹0.00.');
      return;
    }

    setLoading(true);
    try {
      const res = await accountService.deposit(account.id, {
        amount: parsedAmount,
        description: description.trim() || 'Online Cash Deposit'
      });

      setSuccess(`Successfully deposited ${formatINR(parsedAmount)} into ${account.accountNumber}!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess('');
        setAmount('');
        setDescription('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge deposit-badge">
              <ArrowDownRight size={20} />
            </div>
            <h3>Deposit Funds</h3>
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

        <div className="account-summary-pill">
          <div>
            <span className="pill-label">Target Account</span>
            <span className="pill-value">{account.accountNumber} ({account.accountType})</span>
          </div>
          <div className="text-right">
            <span className="pill-label">Current Balance</span>
            <span className="pill-value font-mono">{formatINR(account.balance)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Deposit Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 5000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description / Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Salary, Birthday Gift, Savings"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
