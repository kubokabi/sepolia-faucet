// src/components/FaucetUI.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  FaEthereum,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import SepoliaFaucetABI from "../contracts/SepoliaFaucet.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function FaucetUI({ account }) {
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState("–");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [amount, setAmount] = useState(null); // <<--- NEW: dynamic AMOUNT
  const [isClaiming, setIsClaiming] = useState(false);
  const [status, setStatus] = useState("");

  // INIT when account changes
  useEffect(() => {
    const init = async () => {
      if (!account || !window.ethereum) return;

      try {
        if (!CONTRACT_ADDRESS) {
          setStatus("❌ CONTRACT_ADDRESS is missing in .env");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          SepoliaFaucetABI,
          signer
        );

        setContract(contract);

        // Read faucet balance
        const bal = await provider.getBalance(CONTRACT_ADDRESS);
        setBalance(ethers.formatEther(bal));

        // Read faucet AMOUNT dynamically
        const rawAmount = await contract.AMOUNT(); // <<----
        setAmount(ethers.formatEther(rawAmount)); // "0.001"

        // Read user cooldown data
        const lastTime = Number(await contract.getLastClaimTime(account));
        const cooldown = Number(await contract.COOLDOWN());
        const now = Math.floor(Date.now() / 1000);

        const timeLeft = lastTime + cooldown - now;
        setCooldownSeconds(timeLeft > 0 ? timeLeft : 0);
      } catch (err) {
        console.error("Init error:", err);
        setStatus(`❌ ${err.reason || err.message}`);
      }
    };

    init();
  }, [account]);

  // Tick timer every second
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((sec) => (sec > 1 ? sec - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // AUTO REFRESH BALANCE SETIAP 5 DETIK
  useEffect(() => {
    if (!contract || !window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    const interval = setInterval(async () => {
      try {
        const bal = await provider.getBalance(CONTRACT_ADDRESS);
        setBalance(ethers.formatEther(bal));
      } catch (err) {
        console.error("Balance polling error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [contract]);

  // AUTO REFRESH AMOUNT (optional)
  useEffect(() => {
    if (!contract) return;

    const interval = setInterval(async () => {
      try {
        const rawAmount = await contract.AMOUNT();
        setAmount(ethers.formatEther(rawAmount));
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [contract]);

  const handleClaim = async () => {
    if (!contract || cooldownSeconds > 0) return;

    try {
      setIsClaiming(true);
      setStatus("⏳ Confirm in MetaMask...");

      const tx = await contract.claim();
      setStatus("📡 Broadcasting...");

      await tx.wait();
      setStatus("✅ Claim successful!");

      // Refresh balance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const newBal = await provider.getBalance(CONTRACT_ADDRESS);
      setBalance(ethers.formatEther(newBal));

      // Refresh cooldown
      const time = Number(await contract.getLastClaimTime(account));
      const cd = Number(await contract.COOLDOWN());
      const now2 = Math.floor(Date.now() / 1000);

      const left = time + cd - now2;
      setCooldownSeconds(left > 0 ? left : 0);

      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error("Claim error:", err);
      setStatus(`❌ ${err.reason || err.message || "Transaction failed"}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return "Ready to claim!";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const isReady = cooldownSeconds <= 0;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4">
          <FaEthereum size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Sepolia Faucet</h1>
        <p className="text-gray-600 mt-1">Get test ETH instantly</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="text-sm text-gray-700">
          <span>Wallet:</span>
          <span className="ml-2 font-mono text-xs bg-gray-200 px-2 py-1 rounded">
            {account?.substring(0, 6)}...{account?.substring(38)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 font-medium">Balance</div>
          <div className="text-lg font-mono text-blue-800">{balance} ETH</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 font-medium">Next Claim</div>
          <div
            className={`text-lg font-mono ${
              isReady ? "text-green-600" : "text-red-600"
            }`}
          >
            {isReady ? "✅ Ready" : `⏳ ${formatTimeLeft(cooldownSeconds)}`}
          </div>
        </div>
      </div>

      <button
        onClick={handleClaim}
        disabled={!isReady || isClaiming}
        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
          !isReady || isClaiming
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:from-cyan-600 hover:to-blue-700 hover:scale-[1.02]"
        }`}
      >
        {isClaiming ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Claiming...
          </>
        ) : isReady ? (
          <>
            <FaEthereum className="text-yellow-400" /> Claim{" "}
            {amount ? amount : "..."} ETH
          </>
        ) : (
          <>
            <FaClock className="text-yellow-500" /> Wait{" "}
            {formatTimeLeft(cooldownSeconds)}
          </>
        )}
      </button>

      {status && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm text-center ${
            status.includes("✅")
              ? "bg-green-100 text-green-700 border border-green-300"
              : status.includes("❌")
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-blue-100 text-blue-700 border border-blue-300"
          }`}
        >
          {status.includes("✅") ? (
            <FaCheckCircle className="inline mr-1" />
          ) : status.includes("❌") ? (
            <FaTimesCircle className="inline mr-1" />
          ) : null}
          {status}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 text-center">
        ⚠️ For testing only. Sepolia Testnet.
      </div>
    </div>
  );
}
