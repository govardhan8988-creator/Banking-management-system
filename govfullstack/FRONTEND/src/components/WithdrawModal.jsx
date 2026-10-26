import React, { useState } from 'react';
import { accountService } from '../services/api';
import { formatINR } from '../utils/currency';
import { X, ArrowUpRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function WithdrawModal({ isOpen, onClose, account, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !account) return null;

  const currentBal = Number(account.balance);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than ₹0.00.');
      return;
    }

    if (parsedAmount > currentBal) {
      setError(`Insufficient funds. Your current balance is ${formatINR(currentBal)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await accountService.withdraw(account.id, {
        amount: parsedAmount,
        description: description.trim() || 'Online Cash Withdrawal'
      });

      setSuccess(`Successfully withdrew ${formatINR(parsedAmount)} from ${account.accountNumber}!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess('');
        setAmount('');
        setDescription('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge withdraw-badge">
              <ArrowUpRight size={20} />
            </div>
            <h3>Withdraw Funds</h3>
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
            <span className="pill-label">Source Account</span>
            <span className="pill-value">{account.accountNumber} ({account.accountType})</span>
          </div>
          <div className="text-right">
            <span className="pill-label">Available Balance</span>
            <span className="pill-value font-mono">{formatINR(currentBal)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Withdrawal Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={currentBal}
              required
              placeholder="e.g. 1000.00"
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
              placeholder="e.g. ATM, Rent, Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
