import { ethers } from "ethers";

import { setProvider, setNetwork, setAccount } from "./reducers/provider";
import { setContracts, setSymbols, balancesLoaded } from "./reducers/tokens";
import {
  setAMMContract,
  sharesLoaded,
  swapsLoaded,
  swapRequest,
  swapSuccess,
  swapFail,
  depositRequest,
  depositFail,
  depositSuccess,
  withdrawRequest,
  withdrawFail,
  withdrawSuccess,
} from "./reducers/amm";

import {
  setLoading,
  setError,
  setFaucetContract,
  setTokenAmountA,
  setTokenAmountB,
  setCooldown,
  setLastRequestTimes,
} from "./reducers/Faucet";

import TOKEN_ABI from "../abis/Token.json";
import AMM_ABI from "../abis/AMM.json";
import config from "../config.json";
import Faucet_ABI from "../abis/Faucet.json";

export const loadProvider = (dispatch) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  dispatch(setProvider(provider));

  return provider;
};
export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork();
  dispatch(setNetwork(chainId));

  return chainId;
};

export const loadAccount = async (dispatch) => {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = ethers.utils.getAddress(accounts[0]);
  dispatch(setAccount(account));

  return account;
};
//---------------------------------------------------------------------------
// load contracts
export const loadTokens = async (provider, chainId, dispatch) => {
  const bmtk = new ethers.Contract(
    config[chainId].bmtk.address,
    TOKEN_ABI,
    provider
  );
  const usd = new ethers.Contract(
    config[chainId].usd.address,
    TOKEN_ABI,
    provider
  );

  dispatch(setContracts([bmtk, usd]));
  dispatch(setSymbols([await bmtk.symbol(), await usd.symbol()]));
};

// load contracts
export const loadAMM = async (provider, chainId, dispatch) => {
  const amm = new ethers.Contract(
    config[chainId].amm.address,
    AMM_ABI,
    provider
  );

  dispatch(setAMMContract(amm));

  return amm;
};
//---------------------------------------------------------------------------
// load balances and shares
export const loadBalances = async (amm, tokens, account, dispatch) => {
  const balance1 = await tokens[0].balanceOf(account);
  const balance2 = await tokens[1].balanceOf(account);

  dispatch(
    balancesLoaded([
      ethers.utils.formatUnits(balance1.toString(), "ether"),
      ethers.utils.formatUnits(balance2.toString(), "ether"),
    ])
  );
  const shares = await amm.shares(account);
  dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), "ether")));
};
//------------------------------------------------------------------------------
///// add liquidity
export const addLiquidity = async (
  provider,
  amm,
  tokens,
  amounts,
  dispatch
) => {
  try {
    dispatch(depositRequest());

    const signer = await provider.getSigner();

    let transaction;

    transaction = await tokens[0]
      .connect(signer)
      .approve(amm.address, amounts[0]);
    await transaction.wait();

    transaction = await tokens[1]
      .connect(signer)
      .approve(amm.address, amounts[1]);
    await transaction.wait();

    transaction = await amm
      .connect(signer)
      .addLiquidity(amounts[0], amounts[1]);
    await transaction.wait();

    dispatch(depositSuccess(transaction.hash));
  } catch (error) {
    dispatch(depositFail());
  }
};
//-------------------------------------------------------------------------
//// remove liquidity
export const removeLiquidity = async (provider, amm, shares, dispatch) => {
  try {
    dispatch(withdrawRequest());

    const signer = await provider.getSigner();

    let transaction = await amm.connect(signer).removeLiquidity(shares);
    await transaction.wait();

    dispatch(withdrawSuccess(transaction.hash));
  } catch (error) {
    dispatch(withdrawFail());
  }
};
//-----------------------------------------------------------------------------
///////swap
export const swap = async (provider, amm, token, symbol, amount, dispatch) => {
  try {
    dispatch(swapRequest());
    let transaction;

    const signer = await provider.getSigner();

    transaction = await token.connect(signer).approve(amm.address, amount);
    await transaction.wait;

    if (symbol === "BMTK") {
      transaction = await amm.connect(signer).swapToken1(amount);
      await transaction.wait();
    } else {
      transaction = await amm.connect(signer).swapToken2(amount);
    }
    await transaction.wait();

    dispatch(swapSuccess(transaction.hash));
  } catch (error) {
    dispatch(swapFail());
  }
};
////////---------------------------------------------------------------------
// load all swaps
export const loadAllSwaps = async (provider, amm, dispatch) => {
  const block = await provider.getBlockNumber();

  const swapStream = await amm.queryFilter("Swap", 0, block);
  const swaps = swapStream.map((event) => {
    return { hash: event.transactionHash, args: event.args };
  });
  dispatch(swapsLoaded(swaps));
};

export const loadFaucet = async (provider, chainId, dispatch) => {
  try {
    dispatch(setLoading(true));

    const signer = provider.getSigner();
    const faucetContract = new ethers.Contract(
      config[chainId].Faucet.address,
      Faucet_ABI,
      signer
    );

    // Fetch both token amounts
    const tokenAmountA = await faucetContract.tokenAmountA();
    const tokenAmountB = await faucetContract.tokenAmountB();
    const cooldown = await faucetContract.cooldown();

    dispatch(setFaucetContract(faucetContract));
    dispatch(setTokenAmountA(tokenAmountA.toString()));
    dispatch(setTokenAmountB(tokenAmountB.toString()));
    dispatch(setCooldown(Number(cooldown)));
    return faucetContract;
  } catch (error) {
    console.error("Failed to load faucet contract:", error);
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// --- Load Faucet config values: tokenAmount, cooldown ---
export const loadFaucetConfig = async (contract, dispatch) => {
  try {
    dispatch(setLoading(true));

    const [tokenAmountA, tokenAmountB, cooldown] = await Promise.all([
      contract.tokenAmountA(),
      contract.tokenAmountB(),
      contract.cooldown(),
    ]);

    dispatch(setTokenAmountA(tokenAmountA.toString()));
    dispatch(setTokenAmountB(tokenAmountB.toString()));
    dispatch(setCooldown(Number(cooldown)));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// --- Load user's last request time from Faucet contract ---
export const loadUserLastRequestTime = async (
  contract,
  userAddress,
  dispatch
) => {
  try {
    const lastRequest = await contract.lastRequestTime(userAddress);
    dispatch(setLastRequestTimes({ [userAddress]: lastRequest.toNumber() }));
  } catch (error) {
    dispatch(setError(error.message));
  }
};

// --- Call faucet contract's requestTokens method (send tx) ---
export const requestTokens = async (contract, account, dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const signer = contract.provider.getSigner(account);
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.requestTokens();
    await tx.wait();

    // Optional: reload cooldown/request time
    dispatch(setLoading(false));
  } catch (error) {
    dispatch(setError(error.message));
    dispatch(setLoading(false));
  }
};
