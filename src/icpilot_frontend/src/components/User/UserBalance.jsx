import React, { useState, useEffect } from 'react';
import { icpilot_backend } from 'declarations/icpilot_backend';
import Message from '../UI/Message';
import styles from './UserBalance.module.css';

const UserBalance = () => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      setLoading(true);
      const userBalance = await icpilot_backend.get_user_balance();
      setBalance(userBalance);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user balance:", error);
      setMessage({ type: 'error', text: `Error fetching balance: ${error.message}` });
      setLoading(false);
    }
  };

  // Format e8s to ICP with 8 decimal places
  const formatICP = (e8s) => {
    if (e8s === null || e8s === undefined) return 'Unknown';
    // Convert e8s to ICP (1 ICP = 10^8 e8s)
    const icp = Number(e8s) / 100000000;
    return `${icp.toFixed(8)} ICP`;
  };

  return (
    <div className={styles.userBalanceContainer}>
      <h3>Your ICP Balance</h3>
      
      {message && <Message type={message.type} text={message.text} />}
      
      {loading ? (
        <p>Loading your balance...</p>
      ) : (
        <div className={styles.balanceInfo}>
          <div className={styles.balanceAmount}>
            <span className={styles.balanceValue}>{formatICP(balance)}</span>
          </div>
          <div className={styles.balanceDetails}>
            <p>Raw value: {balance !== null ? `${balance} e8s` : 'Unknown'}</p>
            <button 
              className={styles.refreshButton}
              onClick={fetchUserBalance}
            >
              Refresh Balance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBalance;