import React from 'react';

const CanisterList = ({ canisters }) => {
  if (!canisters || canisters.length === 0) {
    return (
      <div className="no-canisters">
        <p>You haven't created any canisters yet.</p>
      </div>
    );
  }

  return (
    <div className="canister-list">
      <h3>Your Canisters</h3>
      <ul>
        {canisters.map((canister, index) => (
          <li key={index} className="canister-item">
            <strong>{canister.metadata.name}</strong> ({canister.id})
            <p>{canister.metadata.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CanisterList;