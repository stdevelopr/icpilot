import React from 'react';
import { formatCycles, formatMemorySize } from '../../utils';
import styles from './CanisterList.module.css';

const CanisterList = ({ canisters, canisterCycles = {}, canisterStatus = {} }) => {
  if (!canisters || canisters.length === 0) {
    return (
      <div className="no-canisters">
        <p>You haven't created any canisters yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.canisterList}>
      <h3>Your Canisters</h3>
      <ul>
        {canisters.map((canister, index) => {
          const status = canisterStatus[canister.id];
          
          return (
            <li key={index} className={styles.canisterItem}>
              <div className={styles.canisterHeader}>
                <strong>{canister.metadata.name}</strong> 
                <span className={styles.canisterId}>({canister.id})</span>
                {status && (
                  <span className={`${styles.statusBadge} ${styles[status.status]}`}>
                    {status.status}
                  </span>
                )}
              </div>
              
              <p className={styles.canisterDescription}>{canister.metadata.description}</p>
              
              <div className={styles.canisterDetails}>
                {canisterCycles[canister.id] !== undefined ? (
                  <p>Cycles: {formatCycles(canisterCycles[canister.id])}</p>
                ) : (
                  <p>Cycles: Loading...</p>
                )}
                
                {status ? (
                  <>
                    <p>Memory: {formatMemorySize(status.memory_size)}</p>
                    <p>Freezing Threshold: {formatCycles(status.freezing_threshold)}</p>
                    <p>Idle Burn Rate: {formatCycles(status.idle_cycles_burned_per_day)}/day</p>
                    {status.module_hash && (
                      <p>Module Hash: {status.module_hash.slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('')}...</p>
                    )}
                  </>
                ) : (
                  <p>Status: Loading...</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CanisterList;