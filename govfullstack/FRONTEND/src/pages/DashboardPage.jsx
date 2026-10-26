import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountService } from '../services/api';
import { formatINR } from '../utils/currency';
import Navbar from '../components/Navbar';
import CreateAccountModal from '../components/CreateAccountModal';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import TransferModal from '../components/TransferModal';
import TransactionHistory from '../components/TransactionHistory';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  SendHorizontal,
  PlusCircle,
  CreditCard,
  Building,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const fetchAccounts = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await accountService.getAccounts(user.id);
      const accList = res.data.accounts || [];
      setAccounts(accList);

      if (accList.length > 0) {
        // Keep currently selected if exists, otherwise default to first
        setSelectedAccountId(prev => {
          const exists = accList.some(a => a.id === prev);
          return exists ? prev : accList[0].id;
        });
      } else {
        setSelectedAccountId(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user?.id, refreshTrigger]);

  const handleActionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    refreshUser();
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

  return (
    <div className="dashboard-layout">
      <Navbar />

      <main className="dashboard-content">
        <div className="container">
          {/* Welcome & Customer Overview */}
          <section className="welcome-banner">
            <div className="welcome-text">
              <h2>Welcome back, {user?.fullName}!</h2>
              <p className="text-muted">Manage your personal finances, accounts, and transactions with ease.</p>
            </div>

            <div className="customer-info-pills">
              <div className="info-pill">
                <User size={14} className="pill-icon" />
                <span>Customer ID: <strong>#{user?.id}</strong></span>
              </div>
              <div className="info-pill">
                <Mail size={14} className="pill-icon" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="info-pill">
                  <Phone size={14} className="pill-icon" />
                  <span>{user?.phone}</span>
                </div>
              )}
              <div className="info-pill status-verified">
                <ShieldCheck size={14} className="pill-icon text-success" />
                <span>Verified Customer</span>
              </div>
            </div>
          </section>

          {/* Quick Metrics */}
          <section className="metrics-grid">
            <div className="metric-card total-balance-card">
              <div className="metric-header">
                <span className="metric-title">Total Balance</span>
                <div className="metric-icon-wrap bg-primary-soft">
                  <Wallet size={22} className="text-primary" />
                </div>
              </div>
              <div className="metric-value font-mono">
                {formatINR(totalBalance)}
              </div>
              <span className="metric-footer text-muted">Combined across {accounts.length} active account(s)</span>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Available Balance</span>
                <div className="metric-icon-wrap bg-success-soft">
                  <CreditCard size={22} className="text-success" />
                </div>
              </div>
              <div className="metric-value font-mono">
                {formatINR(selectedAccount ? selectedAccount.balance : 0)}
              </div>
              <span className="metric-footer text-success">
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                {selectedAccount ? `Account #${selectedAccount.accountNumber}` : 'Select an account'}
              </span>
            </div>

            <div className="metric-card action-hub-card">
              <div className="metric-header">
                <span className="metric-title">Quick Actions</span>
                <button className="btn-icon-subtle" onClick={fetchAccounts} title="Refresh Data">
                  <RefreshCw size={15} />
                </button>
              </div>
              <div className="quick-action-buttons">
                <button
                  className="btn btn-sm btn-primary-light"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <PlusCircle size={15} />
                  <span>New Account</span>
                </button>
                <button
                  className="btn btn-sm btn-success-light"
                  disabled={!selectedAccount}
                  onClick={() => setIsDepositOpen(true)}
                >
                  <ArrowDownRight size={15} />
                  <span>Deposit</span>
                </button>
                <button
                  className="btn btn-sm btn-warning-light"
                  disabled={!selectedAccount || Number(selectedAccount.balance) <= 0}
                  onClick={() => setIsWithdrawOpen(true)}
                >
                  <ArrowUpRight size={15} />
                  <span>Withdraw</span>
                </button>
                <button
                  className="btn btn-sm btn-indigo-light"
                  disabled={accounts.length === 0 || totalBalance <= 0}
                  onClick={() => setIsTransferOpen(true)}
                >
                  <SendHorizontal size={15} />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Accounts & Transactions Split View */}
          <div className="dashboard-main-grid">
            {/* Left Column: Accounts List */}
            <section className="accounts-column">
              <div className="section-header flex-between">
                <div className="flex-center gap-2">
                  <Building size={20} className="text-primary" />
                  <h3>Your Bank Accounts</h3>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <PlusCircle size={15} />
                  <span>Open Account</span>
                </button>
              </div>

              {loading && accounts.length === 0 ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading accounts...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="card empty-account-card text-center">
                  <CreditCard size={48} className="empty-icon" />
                  <h4>No bank accounts yet</h4>
                  <p className="text-muted">Open your first Savings or Current account to start banking.</p>
                  <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                    <PlusCircle size={16} />
                    <span>Open First Account</span>
                  </button>
                </div>
              ) : (
                <div className="accounts-list">
                  {accounts.map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    const bal = Number(acc.balance);
                    const typeLabel = acc.accountType === 'SAVINGS' ? 'Savings Account' : acc.accountType === 'CURRENT' ? 'Current Account' : acc.accountType;
                    return (
                      <div
                        key={acc.id}
                        className={`account-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedAccountId(acc.id)}
                      >
                        <div className="account-card-top flex-between">
                          <span className="account-type-badge">{typeLabel}</span>
                          <span className={`status-pill ${acc.isActive ? 'active' : 'inactive'}`}>
                            {acc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="account-number-wrap">
                          <span className="account-label">Account Number</span>
                          <span className="account-num font-mono">{acc.accountNumber}</span>
                        </div>

                        <div className="account-balance-wrap flex-between">
                          <div>
                            <span className="account-label">Available Balance</span>
                            <div className="account-bal-amount font-mono">
                              {formatINR(bal)}
                            </div>
                          </div>
                          <div className="account-id-chip">
                            ID: #{acc.id}
                          </div>
                        </div>

                        <div className="account-card-actions flex-between" onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-xs btn-outline-success"
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setIsDepositOpen(true);
                            }}
                          >
                            <ArrowDownRight size={13} />
                            Deposit
                          </button>
                          <button
                            className="btn btn-xs btn-outline-warning"
                            disabled={bal <= 0}
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setIsWithdrawOpen(true);
                            }}
                          >
                            <ArrowUpRight size={13} />
                            Withdraw
                          </button>
                          <button
                            className="btn btn-xs btn-outline-primary"
                            disabled={bal <= 0}
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setIsTransferOpen(true);
                            }}
                          >
                            <SendHorizontal size={13} />
                            Transfer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Right Column: Selected Account Transactions */}
            <section className="transactions-column">
              {selectedAccount ? (
                <TransactionHistory
                  accountId={selectedAccount.id}
                  refreshTrigger={refreshTrigger}
                />
              ) : (
                <div className="card text-center empty-state-box">
                  <CreditCard size={48} className="empty-icon" />
                  <h4>Select an account</h4>
                  <p className="text-muted">Choose an account on the left to inspect its transaction history and statements.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleActionSuccess}
      />

      {selectedAccount && (
        <>
          <DepositModal
            isOpen={isDepositOpen}
            onClose={() => setIsDepositOpen(false)}
            account={selectedAccount}
            onSuccess={handleActionSuccess}
          />

          <WithdrawModal
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            account={selectedAccount}
            onSuccess={handleActionSuccess}
          />
        </>
      )}

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
