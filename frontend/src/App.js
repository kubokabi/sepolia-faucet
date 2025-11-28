// src/App.jsx
import React, { useEffect, useState } from "react";
import "./App.css";
import ConnectWallet from "./components/ConnectWallet";
import FaucetUI from "./components/FaucetUI";

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ------------ AUTO CONNECT + CHECK NETWORK -------------
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        setError("⚠️ MetaMask not detected.");
        setLoading(false);
        return;
      }

      try {
        // Check existing connected accounts
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }

        // Check chain ID
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (chainId !== "0xaa36a7") {
          setError("⚠️ Please switch MetaMask to Sepolia testnet.");
        }
      } catch (err) {
        console.log("Init error:", err);
      }

      setLoading(false);
    };

    init();
  }, []);

  // ------------ METAMASK EVENTS LISTENER -------------
  useEffect(() => {
    if (!window.ethereum) return;

    // When user switches account
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
      } else {
        setAccount(accounts[0]);
      }
      setError("");
    });

    // When user switches network
    window.ethereum.on("chainChanged", (chainId) => {
      if (chainId !== "0xaa36a7") {
        setError("⚠️ Please switch to Sepolia testnet.");
        setAccount(null);
      } else {
        setError("");
        window.location.reload(); // reload untuk update provider
      }
    });

    return () => {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    };
  }, []);

  const handleAccountChange = (wallet) => {
    setAccount(wallet);
    setError("");
  };

  // ------------ LOADING UI -------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  // ------------ MAIN UI -------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-900 rounded-lg text-sm text-center border border-yellow-300">
            {error}
          </div>
        )}

        {account ? (
          <FaucetUI account={account} />
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <header className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.304 3.438 9.8 8.207 11.393.599.111.774-.261.774-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.469-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.48 11.48 0 0 1 12 5.803c1.195 0 2.38.347 3.392.988 2.296-1.552 3.299-1.23 3.299-1.23.662 1.654.248 2.874.126 3.177.77.84 1.236 1.91 1.236 3.22 0 4.61-2.807 5.625-5.47 5.922.43.372.823 1.102.823 2.222v3.293c0 .32.214.694.774.576C20.56 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sepolia Faucet
              </h1>
              <p className="text-gray-600 mt-1">Get test ETH instantly</p>
            </header>

            <ConnectWallet onAccountChange={handleAccountChange} />

            <p className="text-center text-sm text-gray-500 mt-2">
              🔌 Connect MetaMask to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
