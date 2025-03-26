import React, { useState, useEffect } from 'react';
import { icpilot_backend } from 'declarations/icpilot_backend';
import { formatCycles } from '../../utils';

const CanisterInfo = () => {
  const [canisterInfo, setCanisterInfo] = useState({
    canisterId: '',
    cycles: null,
    icpBalance: null,
    userBalance: null,
    loading: true
  });

  useEffect(() => {
    fetchCanisterInfo();
  }, []);

  async function fetchCanisterInfo() {
    try {
      const principal = await icpilot_backend.getPrincipal();
      const canisterId = principal.split(': ')[1];

      const cyclesResult = await icpilot_backend.getCanisterCycles(canisterId);
      const cycles = 'ok' in cyclesResult ? cyclesResult.ok : null;

      // Get user balance
      const userBalance = await icpilot_backend.userGetBalance();
      
      setCanisterInfo({
        canisterId,
        cycles,
        icpBalance: 0,
        userBalance, // Add user balance
        loading: false
      });
    } catch (error) {
      console.error("Error fetching canister info:", error);
      setCanisterInfo(prev => ({
        ...prev,
        loading: false
      }));
    }
  }

  // Format e8s to ICP with 8 decimal places
  const formatICP = (e8s) => {
    if (e8s === null || e8s === undefined) return 'Unknown';
    // Convert e8s to ICP (1 ICP = 10^8 e8s)
    const icp = Number(e8s) / 100000000;
    return `${icp.toFixed(8)} ICP`;
  };

  if (canisterInfo.loading) {
    return <div className="canister-info-banner">Loading canister information...</div>;
  }

  return (
    <div className="canister-info-banner">
      <div className="canister-info-item">
        <strong>Canister ID:</strong> {canisterInfo.canisterId || 'Unknown'}
      </div>
      <div className="canister-info-item">
        <strong>Cycles:</strong> {canisterInfo.cycles ? formatCycles(canisterInfo.cycles) : 'Unknown'}
      </div>
      <div className="canister-info-item">
        <strong>ICP Balance:</strong> {canisterInfo.icpBalance !== null ? `${canisterInfo.icpBalance} ICP` : 'Unknown'}
      </div>
      <div className="canister-info-item">
        <strong>Your Balance:</strong> {formatICP(canisterInfo.userBalance)}
      </div>
    </div>
  );
};

export default CanisterInfo;