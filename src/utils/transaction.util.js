const mongoose = require('mongoose');

/**
 * Execute a unit of work within a MongoDB transaction if replica set is enabled,
 * or gracefully fallback to direct execution for standalone MongoDB instances.
 * 
 * @param {Function} workFn - async function(session) that takes optional session
 * @returns {Promise<any>}
 */
const runTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Ignored if abort fails
      }
    }

    // Check if error is due to standalone MongoDB not supporting transactions
    const isStandaloneError = 
      error.message && 
      (error.message.includes('Transaction numbers are only allowed on a replica set member') ||
       error.message.includes('Transactions are not supported'));

    if (isStandaloneError) {
      // Gracefully run without transaction session
      return await workFn(null);
    }

    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  runTransaction
};
