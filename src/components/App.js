import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container } from "react-bootstrap";
import { ethers } from "ethers";

// Components
import Navigation from "./Navigation";
import Tabs from './Tabs';
import Swap from "./Swap";
import Deposit from "./Deposit";
import Withdraw from "./withdraw";
import Charts from "./Charts";

import {
  loadAccount,
  loadNetwork,
  loadProvider,
  loadTokens,
  loadAMM,
} from "../store/interactions";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = loadProvider(dispatch);

    const chainId = await loadNetwork(provider, dispatch);

    //reload page when network changes s
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    // Fetch accounts
    window.ethereum.on("accountsChanged", async () => {
      await loadAccount(dispatch);
    });

    // initate contracts
    await loadTokens(provider, chainId, dispatch);

    await loadAMM(provider, chainId, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <Container>
      <HashRouter>

        <Navigation />

          <hr />

          <Tabs />

          <Routes>
            <Route exact path="/" element={<Swap />} />
            <Route  path="/Deposit" element={<Deposit />} />
            <Route  path="/Withdraw" element={<Withdraw />} /> 
            <Route  path="/Charts" element={<Charts />} />  
          </Routes>

      </HashRouter>
    </Container>
  );
}

export default App;
