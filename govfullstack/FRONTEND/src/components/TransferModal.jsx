import React, { useState } from 'react';
import { accountService } from '../services/api';
import { formatINR } from '../utils/currency';
import { X, SendHorizontal, CheckCircle, AlertCircle } from 'lucide-react';

export default function TransferModal({ isOpen, onClose, accounts = [], selectedAccount, onSuccess }) {
  const [fromAccountId, setFromAccountId] = useState(() => selectedAccount?.id || (accounts[0]?.id || ''));
  const [destinationMode, setDestinationMode] = useState('internal'); // 'internal' or 'custom'
  const [toAccountId, setToAccountId] = useState('');
  const [customToAccountId, setCustomToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const currentSourceAccount = accounts.find(a => a.id === Number(fromAccountId)) || selectedAccount;
  const currentSourceBal = currentSourceAccount ? Number(currentSourceAccount.balance) : 0;
  const otherAccounts = accounts.filter(a => a.id !== Number(fromAccountId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedFrom = parseInt(fromAccountId, 10);
    const targetId = destinationMode === 'internal' ? parseInt(toAccountId, 10) : parseInt(customToAccountId, 10);

    if (isNaN(parsedFrom)) {
      setError('Please select a source account.');
      return;
    }

    if (isNaN(targetId)) {
      setError('Please select or specify a valid destination account ID.');
      return;
    }

    if (parsedFrom === targetId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than ₹0.00.');
      return;
    }

    if (parsedAmount > currentSourceBal) {
      setError(`Insufficient balance. Source account has ${formatINR(currentSourceBal)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await accountService.transfer({
        fromAccountId: parsedFrom,
        toAccountId: targetId,
        amount: parsedAmount,
        description: description.trim() || `Fund transfer to Account #${targetId}`
      });

      setSuccess(`Transfer of ${formatINR(parsedAmount)} completed successfully!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess('');
        setAmount('');
        setDescription('');
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed. Please check account details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge transfer-badge">
              <SendHorizontal size={20} />
            </div>
            <h3>Transfer Funds</h3>
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
            <label>From Account (Source)</label>
            <select
              value={fromAccountId}
              onChange={(e) => {
                setFromAccountId(e.target.value);
                if (toAccountId === e.target.value) {
                  setToAccountId('');
                }
              }}
              className="select-field"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountNumber} ({acc.accountType}) — Bal: {formatINR(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          <div className="transfer-dest-toggle">
            <button
              type="button"
              className={`toggle-tab ${destinationMode === 'internal' ? 'active' : ''}`}
              onClick={() => setDestinationMode('internal')}
            >
              My Other Accounts
            </button>
            <button
              type="button"
              className={`toggle-tab ${destinationMode === 'custom' ? 'active' : ''}`}
              onClick={() => setDestinationMode('custom')}
            >
              Other Account (By ID)
            </button>
          </div>

          {destinationMode === 'internal' ? (
            <div className="form-group">
              <label>To Account (Destination)</label>
              {otherAccounts.length > 0 ? (
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="select-field"
                  required
                >
                  <option value="">-- Select Destination Account --</option>
                  {otherAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.accountType}) — Bal: {formatINR(acc.balance)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="form-notice">
                  You only have one account. Switch to "Other Account (By ID)" to transfer to another customer.
                </p>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>Destination Account ID</label>
              <input
                type="number"
                min="1"
                required
                placeholder="Enter recipient Account ID (e.g. 2)"
                value={customToAccountId}
                onChange={(e) => setCustomToAccountId(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          <div className="form-group">
            <label>Transfer Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={currentSourceBal}
              required
              placeholder="e.g. 2500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
            <small className="form-hint">
              Max available: {formatINR(currentSourceBal)}
            </small>
          </div>

          <div className="form-group">
            <label>Transfer Description / Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Payment for invoice, Split bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing Transfer...' : 'Confirm & Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
