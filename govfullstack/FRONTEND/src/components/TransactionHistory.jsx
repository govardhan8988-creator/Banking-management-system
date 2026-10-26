import React, { useState, useEffect } from 'react';
import { accountService } from '../services/api';
import { formatINR, formatIndianDateTime } from '../utils/currency';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  History,
  AlertCircle
} from 'lucide-react';

export default function TransactionHistory({ accountId, refreshTrigger }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    if (!accountId) return;
    setLoading(true);
    setError('');
    try {
      const res = await accountService.getTransactions(accountId);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [accountId, refreshTrigger]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch = !searchQuery ||
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(tx.amount).includes(searchQuery);
    return matchesType && matchesSearch;
  });

  const getBadgeClass = (type) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return 'badge-positive';
      case 'WITHDRAW':
      case 'TRANSFER_OUT':
        return 'badge-negative';
      default:
        return 'badge-neutral';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return <ArrowDownLeft size={16} className="text-success" />;
      case 'WITHDRAW':
      case 'TRANSFER_OUT':
        return <ArrowUpRight size={16} className="text-danger" />;
      default:
        return <History size={16} />;
    }
  };

  const isPositive = (type) => type === 'DEPOSIT' || type === 'TRANSFER_IN';

  return (
    <div className="card transaction-card">
      <div className="card-header flex-between">
        <div className="card-title-group">
          <History className="text-primary" size={20} />
          <h3>Transaction History</h3>
          <span className="badge-count">{transactions.length}</span>
        </div>
        <button
          className="btn-icon"
          onClick={fetchTransactions}
          disabled={loading}
          title="Refresh Transactions"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="transaction-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Types</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAW">Withdrawals</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <History size={40} className="empty-icon" />
          <p className="empty-text">No transactions found for this account.</p>
          <span className="empty-sub">Make a deposit or transfer to see your activity here.</span>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Date & Time</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div className="type-cell">
                      {getIcon(tx.type)}
                      <span className={`badge ${getBadgeClass(tx.type)}`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="tx-description">{tx.description || '—'}</span>
                  </td>
                  <td>
                    <span className="tx-date">
                      {formatIndianDateTime(tx.createdAt)}
                    </span>
                  </td>
                  <td className="text-right font-mono">
                    <span className={`tx-amount ${isPositive(tx.type) ? 'amount-positive' : 'amount-negative'}`}>
                      {isPositive(tx.type) ? '+' : '-'}{formatINR(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
