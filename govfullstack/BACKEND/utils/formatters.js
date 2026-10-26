/**
 * Safely format Decimal objects to JavaScript numbers or fixed strings
 */
function formatAccount(account) {
  if (!account) return null;
  return {
    ...account,
    balance: Number(account.balance)
  };
}

function formatTransaction(transaction) {
  if (!transaction) return null;
  return {
    ...transaction,
    amount: Number(transaction.amount)
  };
}

module.exports = {
  formatAccount,
  formatTransaction
};
