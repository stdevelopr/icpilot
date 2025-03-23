import React from 'react';
import styles from './Message.module.css';

const Message = ({ type, text }) => {
  if (!text) return null;
  
  return (
    <div className={`${styles.message} ${styles[type]}`}>
      {text}
    </div>
  );
};

export default Message;