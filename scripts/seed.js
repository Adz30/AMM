const hre = require("hardhat");
const config = require("../src/config.json");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;
const shares = ether;

async function main() {
  //fetch accounts
  console.log("fethching accounts & network \n ");
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const investor1 = accounts[1];
  const investor2 = accounts[2];
  const investor3 = accounts[3];
  const investor4 = accounts[4];

  // fetch network
  const { chainId } = await ethers.provider.getNetwork();
  
  console.log(`Fetching token and transferring to accounts... \n`);

  console.log("Network config:", config);
  console.log("Chain ID:", chainId);
  
  // Ensure network config exists for the given chainId
  const currentNetworkConfig = config[chainId];
  if (!currentNetworkConfig) {
    console.error(`Error: Configuration for chainId ${chainId} not found.`);
    return;
  }

  console.log("Network Config Loaded:", currentNetworkConfig);

  // Ensure bmtk token exists
  const bmtkConfig = currentNetworkConfig.bmtk;
  if (!bmtkConfig || !bmtkConfig.address) {
    console.error("Error: bmtk token address not found in config.");
    return;
  }
  
  const bmtk = await ethers.getContractAt("Token", bmtkConfig.address);
  console.log(`bmtk Token fetched: ${bmtk.address} \n`);
  
  // Same for usd token
  const usdConfig = currentNetworkConfig.usd;
  if (!usdConfig || !usdConfig.address) {
    console.error("Error: usd token address not found in config.");
    return;
  }
  
  const usd = await ethers.getContractAt("Token", usdConfig.address);
  console.log(`usd Token fetched: ${usd.address} \n`);
  
  // distribute tokens to investors
  let transaction;

  //send bmtk tokens to investor 1
  transaction = await bmtk
    .connect(deployer)
    .transfer(investor1.address, tokens(10));
  await transaction.wait();
  
  // send usd tokens to investor 2
  transaction = await usd
    .connect(deployer)
    .transfer(investor2.address, tokens(10));
  await transaction.wait();

  //send bmtk tokens to investor 3
  transaction = await bmtk
    .connect(deployer)
    .transfer(investor3.address, tokens(10));
  await transaction.wait();

  //send usd token to investor 4
  transaction = await usd
    .connect(deployer)
    .transfer(investor4.address, tokens(10));
  await transaction.wait();

  ////////////////////
  // adding liquidity
  let amount = tokens(100);

  console.log(`fetching AMM.... \n`);
  // fetch amm
  const amm = await ethers.getContractAt("AMM", currentNetworkConfig.amm.address);
  console.log(`amm Token fetched: ${amm.address} \n`);

  transaction = await bmtk.connect(deployer).approve(amm.address, amount);
  await transaction.wait();

  transaction = await usd.connect(deployer).approve(amm.address, amount);
  await transaction.wait();

  // deployer adds liquidity
  console.log(`adding liquidity...\n`);
  transaction = await amm.connect(deployer).addLiquidity(amount, amount);
  await transaction.wait();

  /////////1 investor 1 swap :bmtk --> usd
  console.log(`investor1 swaps ..... \n`);
  //investor approves all tokens
  transaction = await bmtk.connect(investor1).approve(amm.address, tokens(10));

  // investor swaps 1 token
  transaction = await amm.connect(investor1).swapToken1(tokens(1));
  await transaction.wait();

  ///////////investor 2 swaps : usd bmtk
  console.log(`investor2 swaps ..... \n`);
  //investor approves all tokens
  transaction = await usd.connect(investor2).approve(amm.address, tokens(10));

  // investor swaps 1 token
  transaction = await amm.connect(investor2).swapToken2(tokens(1));
  await transaction.wait();

  ///////////investor 3 swaps :bmtk -- > usd
  console.log(`investor3 swaps ..... \n`);
  //investor approves all tokens
  transaction = await bmtk.connect(investor3).approve(amm.address, tokens(10));

  // investor swaps 5 token
  transaction = await amm.connect(investor3).swapToken1(tokens(5));
  await transaction.wait();

  ///////////investor 4 swaps :usd -- > bmtk
  console.log(`investor4 swaps ..... \n`);
  //investor approves all tokens
  transaction = await usd.connect(investor4).approve(amm.address, tokens(10));

  // investor swaps 5 token
  transaction = await amm.connect(investor4).swapToken2(tokens(5));
  await transaction.wait();

  console.log(`finished.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
