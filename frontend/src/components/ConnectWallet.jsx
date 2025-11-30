// src/components/ConnectWallet.jsx
import { useState, useEffect } from "react";
import { FaWallet, FaEthereum, FaQrcode, FaSpinner } from "react-icons/fa";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

const formatAddress = (addr) =>
  addr ? `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}` : "";

export default function ConnectWallet({ onAccountChange }) {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState({
    metaMask: false,
    walletConnect: false,
  });

  // 🔌 MetaMask (hanya jalan di Chrome/Brave dengan ekstensi)
  const connectMetaMask = async () => {
    setLoading((prev) => ({ ...prev, metaMask: true }));
    setError("");

    if (!window?.ethereum) {
      setError(
        "MetaMask not found. Try WalletConnect (works on Safari & iOS)."
      );
      setLoading((prev) => ({ ...prev, metaMask: false }));
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const acc = accounts[0];
      setAccount(acc);
      onAccountChange?.(acc);
    } catch (err) {
      setError("Connection rejected.");
    } finally {
      setLoading((prev) => ({ ...prev, metaMask: false }));
    }
  };

  // 📱 WalletConnect (works everywhere: Safari, iOS, Android, desktop)
  const connectWalletConnect = async () => {
    setLoading((prev) => ({ ...prev, walletConnect: true }));
    setError("");

    try {
      const provider = await EthereumProvider.init({
        projectId: "2f19360761d84238a6b1375529db7d54",
        chains: [11155111], // Sepolia
        showQrModal: true,
        rpcMap: {
          11155111:
            "https://eth-sepolia.g.alchemy.com/v2/iUtQarduBUwJhQ93t_FEH", // ← hapus spasi trailing!
        },
        metadata: {
          name: "Sepolia Faucet",
          description: "Request Sepolia ETH",
          url: "http://localhost:3000",
          icons: ["https://i.imgur.com/7kO7U4y.png"],
        },
      });

      await provider.connect();
      const accounts = await provider.request({ method: "eth_accounts" });
      const acc = accounts[0];
      setAccount(acc);
      onAccountChange?.(acc);

      provider.on("accountsChanged", (accounts) => {
        const newAcc = accounts[0];
        setAccount(newAcc);
        onAccountChange?.(newAcc);
      });
    } catch (err) {
      if (!err.message?.includes("User closed modal")) {
        setError("WalletConnect failed. Try again.");
      }
    } finally {
      setLoading((prev) => ({ ...prev, walletConnect: false }));
    }
  };

  // Auto-detect existing accounts (e.g., after refresh)
  useEffect(() => {
    const checkAccounts = async () => {
      if (window?.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            onAccountChange?.(accounts[0]);
          }
        } catch (e) {
          console.warn("Failed to auto-detect accounts:", e);
        }
      }
    };
    checkAccounts();
  }, [onAccountChange]);

  return (
    <div className="flex flex-col items-center gap-4">
      {!account ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={connectMetaMask}
            disabled={loading.metaMask}
            className="px-5 py-3 rounded-xl font-medium flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-95 disabled:opacity-70 transition"
          >
            {loading.metaMask ? (
              <>
                <FaSpinner className="animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <FaWallet /> MetaMask
              </>
            )}
          </button>

          <button
            onClick={connectWalletConnect}
            disabled={loading.walletConnect}
            className="px-5 py-3 rounded-xl font-medium flex items-center gap-2 bg-gray-800 text-white hover:opacity-90 disabled:opacity-70 transition"
          >
            {loading.walletConnect ? (
              <>
                <FaSpinner className="animate-spin" /> Loading…
              </>
            ) : (
              <>
                <FaQrcode /> WalletConnect
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-mono text-sm font-medium">
            {formatAddress(account)}
          </span>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1">
          <FaEthereum /> {error}
        </div>
      )}

      {/* Info tip for Safari users */}
      {!account && typeof window !== "undefined" && !window.ethereum && (
        <p className="text-gray-500 text-sm text-center max-w-md">
          💡 Using Safari or iOS? MetaMask Mobile works via{" "}
          <strong>WalletConnect</strong> — scan QR with your MetaMask app.
        </p>
      )}
    </div>
  );
}
