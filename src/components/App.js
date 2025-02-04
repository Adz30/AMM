import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Container } from "react-bootstrap";
import { ethers } from "ethers";

// Components
import Navigation from "./Navigation";
import Loading from "./Loading";
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
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

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
      <Navigation />

      <h1 className="my-4 text-center">React Hardhat Template</h1>

      <>
        <p className="text-centre">
          <strong> your eth balance:</strong> 0 ETH
        </p>
      </>
    </Container>
  );
}

export default App;
