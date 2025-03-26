import React, { useState, useEffect } from 'react';
import { icpilot_backend } from 'declarations/icpilot_backend';
import Message from '../UI/Message';
import { convertBigIntValues } from '../../utils';
import styles from './UserProfile.module.css';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState({
    principal: '',
    principalText: '',
    icpBalance: null,
    canisterCount: 0,
    filesCount: 0,
    lastActive: null
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      
      // Try to get all user info in a single call
      try {
        const info = await icpilot_backend.get_user_info();
        const processedInfo = convertBigIntValues(info);
        console.log("All user info:", processedInfo);
        setUserInfo({
          principal: processedInfo.principal,
          principalText: processedInfo.principalText,
          icpBalance: processedInfo.icpBalance,
          canisterCount: processedInfo.canisterCount,
          filesCount: processedInfo.filesCount,
          lastActive: Date.now() // Use client-side timestamp for last active
        });
      } catch (e) {
        console.log("Falling back to individual calls:", e);
        
        // Get principal - use the existing function
        const principal = await icpilot_backend.getPrincipal();
        // Extract just the principal text from the returned string
        const principalText = principal.includes(":") ? 
          principal.split(": ")[1] : principal;
        
        // Get balance
        const icpBalance = await icpilot_backend.userGetBalance();
        
        // Get canisters
        const canisters = await icpilot_backend.get_caller_canisters();
        const canisterCount = canisters.length;
        
        // Get files
        const files = await icpilot_backend.getMyFiles();
        const filesCount = files.length;
        
        setUserInfo({
          principal: principalText,
          principalText: principalText,
          icpBalance: icpBalance,
          canisterCount: canisterCount,
          filesCount: filesCount,
          lastActive: Date.now()
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user info:", error);
      setMessage({ type: 'error', text: `Error fetching user information: ${error.message}` });
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

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(Number(timestamp)).toLocaleString();
  };

  return (
    <div className={styles.userProfileContainer}>
      <h2>User Profile</h2>
      
      {message && <Message type={message.type} text={message.text} />}
      
      {loading ? (
        <p>Loading your profile information...</p>
      ) : (
        <div className={styles.profileInfo}>
          <div className={styles.profileSection}>
            <h3>Identity</h3>
            <p><strong>Principal ID:</strong> {userInfo.principalText}</p>
            <p><strong>Last Active:</strong> {formatDate(userInfo.lastActive)}</p>
          </div>
          
          <div className={styles.profileSection}>
            <h3>Assets</h3>
            <p><strong>ICP Balance:</strong> {formatICP(userInfo.icpBalance)}</p>
            <p><strong>Canisters:</strong> {userInfo.canisterCount}</p>
            <p><strong>Files:</strong> {userInfo.filesCount}</p>
          </div>
          
          <button 
            className={styles.refreshButton}
            onClick={fetchUserInfo}
          >
            Refresh Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;