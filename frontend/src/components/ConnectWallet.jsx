// src/components/ConnectWallet.jsx
import { useState, useEffect } from 'react';
import { FaWallet, FaEthereum } from 'react-icons/fa';

export default function ConnectWallet({ onAccountChange }) {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'error'
  const [error, setError] = useState('');

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not detected. Please install it.');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const acc = accounts[0];

      // Optional: switch to Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
        });
      } catch (switchError) {
        // If chain not added, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/iUtQarduBUwJhQ93t_FEH'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } catch (addError) {
            console.warn('Failed to add Sepolia:', addError);
          }
        }
      }

      setAccount(acc);
      setStatus('connected');
      if (onAccountChange) onAccountChange(acc);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'User rejected request.');
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  useEffect(() => {
    // Listen for account change (e.g., switch in MetaMask)
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        if (onAccountChange) onAccountChange(null);
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (onAccountChange) onAccountChange(accounts[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [account, onAccountChange]);

  return (
    <div className="flex flex-col items-center gap-3">
      {!account ? (
        <button
          onClick={connect}
          disabled={status === 'connecting'}
          className="group relative px-5 py-3 rounded-xl font-medium flex items-center gap-2
            bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white
            shadow-lg hover:shadow-xl
            focus:outline-none focus:ring-4 focus:ring-purple-300/50
            transition-all duration-300
            disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <FaWallet />
          {status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-200">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-mono text-sm font-medium text-gray-800">{formatAddress(account)}</span>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 animate-fade-in">
          <FaEthereum className="text-red-500" /> {error}
        </div>
      )}

      {status === 'connected' && !error && (
        <div className="text-green-600 text-sm animate-fade-in">
          ✅ Wallet connected
        </div>
      )}
    </div>
  );
}