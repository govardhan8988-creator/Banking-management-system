const prisma = require('../src/prisma/client');

/**
 * Generate a unique 10-digit bank account number
 * Format: 10 + 8 digits (e.g. 1048291038)
 */
async function generateUniqueAccountNumber() {
  let unique = false;
  let accountNumber = '';

  while (!unique) {
    // Generate 10-digit number starting with 10
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
    accountNumber = `10${randomDigits}`;

    const existing = await prisma.account.findUnique({
      where: { accountNumber }
    });

    if (!existing) {
      unique = true;
    }
  }

  return accountNumber;
}

module.exports = {
  generateUniqueAccountNumber
};
