import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ethers } from "ethers";

// Components
import Navigation from "./Navigation";
import Tabs from "./Tabs";
import Swap from "./Swap";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Charts from "./Charts";
import Faucet from "./Faucet";

// Blockchain interactions
import {
  loadAccount,
  loadNetwork,
  loadProvider,
  loadTokens,
  loadAMM,
  loadFaucet,
  loadUserLastRequestTime,
} from "../store/interactions";

function App() {
  const dispatch = useDispatch();
  const [currentAccount, setCurrentAccount] = useState(null);
  const [faucet, setFaucet] = useState(null);

  const loadBlockchainData = async () => {
    try {
      const provider = loadProvider(dispatch);
      const chainId = await loadNetwork(provider, dispatch);

      // Reload page on network or account change
      if (window.ethereum?.on) {
        window.ethereum.on("chainChanged", () => window.location.reload());
        window.ethereum.on("accountsChanged", async () => {
          const account = await loadAccount(dispatch);
          setCurrentAccount(account);
        });
      }

      await loadTokens(provider, chainId, dispatch);
      await loadAMM(provider, chainId, dispatch);

      const faucetContract = await loadFaucet(provider, chainId, dispatch);
      if (!faucetContract) throw new Error("Failed to load faucet");
      setFaucet(faucetContract);

      const account = await loadAccount(dispatch);
      setCurrentAccount(account);
    } catch (error) {
      console.error("❌ Blockchain loading failed:", error.message);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  useEffect(() => {
    if (faucet && currentAccount) {
      loadUserLastRequestTime(faucet, currentAccount, dispatch);
    }
  }, [faucet, currentAccount]);

  return (
    <Container>
      <HashRouter future={{ v7_relativeSplatPath: true }}>
        <Navigation />
        <hr />
        <Tabs />

        <Routes>
          <Route path="/" element={<Swap />} />
          <Route path="/Deposit" element={<Deposit />} />
          <Route path="/Withdraw" element={<Withdraw />} />
          <Route path="/Charts" element={<Charts />} />
        </Routes>

        <div style={{ marginTop: "3rem" }}>
          <Faucet />
        </div>
      </HashRouter>
    </Container>
  );
}

export default App;
