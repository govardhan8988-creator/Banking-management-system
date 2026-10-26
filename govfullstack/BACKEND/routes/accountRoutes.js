const express = require('express');
const router = express.Router();
const prisma = require('../src/prisma/client');
const { optionalAuthenticate } = require('../middleware/auth');
const { generateUniqueAccountNumber } = require('../utils/accountNumberGenerator');
const { formatAccount, formatTransaction } = require('../utils/formatters');

/**
 * @route   POST /api/accounts
 * @desc    Create a bank account for a customer
 * @access  Public / Authenticated
 */
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    let customerId = req.body.customerId;

    // If authenticated and no customerId explicitly supplied, use logged in customer
    if (!customerId && req.customer && req.customer.id) {
      customerId = req.customer.id;
    }

    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required to create an account.' });
    }

    customerId = parseInt(customerId, 10);
    if (isNaN(customerId) || customerId <= 0) {
      return res.status(400).json({ message: 'Invalid customerId.' });
    }

    // 1. Check customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ message: `Customer with ID ${customerId} does not exist.` });
    }

    // 2. Validate account type
    const allowedTypes = ['SAVINGS', 'CHECKING', 'CURRENT', 'BUSINESS'];
    const accountType = req.body.accountType ? String(req.body.accountType).toUpperCase() : 'SAVINGS';
    if (!allowedTypes.includes(accountType)) {
      return res.status(400).json({
        message: `Invalid accountType. Allowed types are: ${allowedTypes.join(', ')}`
      });
    }

    // 3. Validate initial balance if provided
    let initialBalance = 0;
    if (req.body.initialBalance !== undefined && req.body.initialBalance !== null) {
      initialBalance = parseFloat(req.body.initialBalance);
      if (isNaN(initialBalance) || initialBalance < 0) {
        return res.status(400).json({ message: 'Initial deposit must be greater than or equal to ₹0.00.' });
      }
    }

    // 4. Generate unique account number
    const accountNumber = await generateUniqueAccountNumber();

    // 5. Create account (and initial deposit transaction if initial balance > 0) atomically
    const result = await prisma.$transaction(async (tx) => {
      const createdAccount = await tx.account.create({
        data: {
          accountNumber,
          balance: initialBalance,
          accountType,
          isActive: true,
          customerId
        },
        include: {
          customer: {
            select: { id: true, fullName: true, email: true, phone: true }
          }
        }
      });

      if (initialBalance > 0) {
        await tx.transaction.create({
          data: {
            accountId: createdAccount.id,
            type: 'DEPOSIT',
            amount: initialBalance,
            description: 'Initial deposit upon account opening'
          }
        });
      }

      return createdAccount;
    });

    return res.status(201).json({
      message: 'Bank account created successfully',
      account: formatAccount(result)
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({ message: 'Internal server error while creating account.' });
  }
});

/**
 * @route   GET /api/accounts
 * @desc    Get accounts (optional ?customerId= query or authenticated user)
 * @access  Public / Authenticated
 */
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const filter = {};

    if (req.query.customerId) {
      const cId = parseInt(req.query.customerId, 10);
      if (!isNaN(cId)) {
        filter.customerId = cId;
      }
    } else if (req.customer && req.customer.id) {
      filter.customerId = req.customer.id;
    }

    const accounts = await prisma.account.findMany({
      where: filter,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedAccounts = accounts.map(formatAccount);

    return res.status(200).json({
      count: formattedAccounts.length,
      accounts: formattedAccounts
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({ message: 'Internal server error while fetching accounts.' });
  }
});

/**
 * @route   POST /api/accounts/transfer
 * @desc    Transfer funds between two accounts atomically
 * @access  Public / Authenticated
 * NOTE: Placed BEFORE /:id routes so "transfer" is not matched as an ID
 */
router.post('/transfer', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    // 1. Validate inputs
    const sourceId = parseInt(fromAccountId, 10);
    const destId = parseInt(toAccountId, 10);

    if (isNaN(sourceId) || isNaN(destId)) {
      return res.status(400).json({ message: 'Both fromAccountId and toAccountId must be valid IDs.' });
    }

    if (sourceId === destId) {
      return res.status(400).json({ message: 'Source and destination accounts must be different.' });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: 'Transfer amount must be greater than ₹0.00.' });
    }

    // 2. Perform atomic Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find source account
      const sourceAccount = await tx.account.findUnique({
        where: { id: sourceId }
      });

      if (!sourceAccount) {
        throw new Error(`Source account with ID ${sourceId} not found.`);
      }

      if (!sourceAccount.isActive) {
        throw new Error(`Source account (${sourceAccount.accountNumber}) is inactive or suspended.`);
      }

      // Check balance
      const currentBalance = Number(sourceAccount.balance);
      if (currentBalance < transferAmount) {
        const balStr = currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const reqStr = transferAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        throw new Error(`Insufficient funds. Available balance: ₹${balStr}, required: ₹${reqStr}.`);
      }

      // Find destination account
      const destAccount = await tx.account.findUnique({
        where: { id: destId }
      });

      if (!destAccount) {
        throw new Error(`Destination account with ID ${destId} not found.`);
      }

      if (!destAccount.isActive) {
        throw new Error(`Destination account (${destAccount.accountNumber}) is inactive.`);
      }

      // Deduct from source
      const updatedSource = await tx.account.update({
        where: { id: sourceId },
        data: {
          balance: {
            decrement: transferAmount
          }
        }
      });

      // Add to destination
      const updatedDest = await tx.account.update({
        where: { id: destId },
        data: {
          balance: {
            increment: transferAmount
          }
        }
      });

      // Create TRANSFER_OUT transaction on source
      const transferOutTx = await tx.transaction.create({
        data: {
          accountId: sourceId,
          type: 'TRANSFER_OUT',
          amount: transferAmount,
          description: description || `Transfer to account ${destAccount.accountNumber}`
        }
      });

      // Create TRANSFER_IN transaction on destination
      const transferInTx = await tx.transaction.create({
        data: {
          accountId: destId,
          type: 'TRANSFER_IN',
          amount: transferAmount,
          description: description || `Transfer from account ${sourceAccount.accountNumber}`
        }
      });

      return {
        sourceAccount: updatedSource,
        destAccount: updatedDest,
        transferOutTx,
        transferInTx
      };
    });

    return res.status(200).json({
      message: 'Transfer completed successfully',
      transfer: {
        amount: transferAmount,
        fromAccount: formatAccount(result.sourceAccount),
        toAccount: formatAccount(result.destAccount),
        transactions: {
          out: formatTransaction(result.transferOutTx),
          in: formatTransaction(result.transferInTx)
        }
      }
    });
  } catch (error) {
    console.error('Error during transfer:', error.message);
    if (error.message.includes('not found') || error.message.includes('inactive') || error.message.includes('Insufficient funds') || error.message.includes('different')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error during transfer.' });
  }
});

/**
 * @route   GET /api/accounts/:id
 * @desc    Get account details by ID
 * @access  Public / Authenticated
 */
router.get('/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID.' });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    return res.status(200).json({
      account: {
        ...formatAccount(account),
        transactions: account.transactions.map(formatTransaction)
      }
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return res.status(500).json({ message: 'Internal server error while fetching account.' });
  }
});

/**
 * @route   POST /api/accounts/:id/deposit
 * @desc    Deposit funds into an account
 * @access  Public / Authenticated
 */
router.post('/:id/deposit', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID.' });
    }

    const depositAmount = parseFloat(req.body.amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: 'Deposit amount must be greater than ₹0.00.' });
    }

    const description = req.body.description || 'Funds Deposit';

    // Perform atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found.');
      }

      if (!account.isActive) {
        throw new Error('Account is inactive.');
      }

      // Update balance
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: depositAmount
          }
        }
      });

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          accountId,
          type: 'DEPOSIT',
          amount: depositAmount,
          description
        }
      });

      return { updatedAccount, transaction };
    });

    return res.status(200).json({
      message: 'Deposit successful',
      account: formatAccount(result.updatedAccount),
      transaction: formatTransaction(result.transaction)
    });
  } catch (error) {
    console.error('Error during deposit:', error.message);
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error while processing deposit.' });
  }
});

/**
 * @route   POST /api/accounts/:id/withdraw
 * @desc    Withdraw funds from an account
 * @access  Public / Authenticated
 */
router.post('/:id/withdraw', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID.' });
    }

    const withdrawAmount = parseFloat(req.body.amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ message: 'Withdrawal amount must be greater than ₹0.00.' });
    }

    const description = req.body.description || 'Funds Withdrawal';

    // Perform atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found.');
      }

      if (!account.isActive) {
        throw new Error('Account is inactive.');
      }

      const currentBalance = Number(account.balance);
      if (currentBalance < withdrawAmount) {
        const balStr = currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        throw new Error(`Insufficient balance. Current balance is ₹${balStr}.`);
      }

      // Update balance
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            decrement: withdrawAmount
          }
        }
      });

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          accountId,
          type: 'WITHDRAW',
          amount: withdrawAmount,
          description
        }
      });

      return { updatedAccount, transaction };
    });

    return res.status(200).json({
      message: 'Withdrawal successful',
      account: formatAccount(result.updatedAccount),
      transaction: formatTransaction(result.transaction)
    });
  } catch (error) {
    console.error('Error during withdrawal:', error.message);
    if (error.message.includes('not found') || error.message.includes('inactive') || error.message.includes('Insufficient balance')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error while processing withdrawal.' });
  }
});

/**
 * @route   GET /api/accounts/:id/transactions
 * @desc    Get transaction history for an account (newest first)
 * @access  Public / Authenticated
 */
router.get('/:id/transactions', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID.' });
    }

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, accountNumber: true, accountType: true, balance: true, isActive: true }
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true
      }
    });

    const formattedTransactions = transactions.map(formatTransaction);

    return res.status(200).json({
      account: formatAccount(account),
      count: formattedTransactions.length,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Internal server error while fetching transactions.' });
  }
});

module.exports = router;
