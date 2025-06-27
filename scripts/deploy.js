// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("Token");

  // deploy token(token1)
  let bmtk = await Token.deploy("BoomToken", "BMTK", "1000000");
  await bmtk.deployed();
  console.log(`BMTK deployed to: ${bmtk.address}\n`);
  //deploy token2
  const usd = await Token.deploy("USD token", "USD", "1000000");
  await usd.deployed();
  console.log(`USD token deployed to: ${usd.address}\n`);

  const AMM = await hre.ethers.getContractFactory("AMM");
  const amm = await AMM.deploy(bmtk.address, usd.address);
  console.log(`AMM contract deployed to: ${amm.address} \n `);

  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(bmtk.address, usd.address);
  await faucet.deployed();
  console.log("Faucet deployed to:", faucet.address);

  // Transfer 10,000 tokens to Faucet contract from deployer
  const faucetFundingAmount = ethers.utils.parseUnits("10000", 18);
  await bmtk.transfer(faucet.address, faucetFundingAmount);
  await usd.transfer(faucet.address, faucetFundingAmount);
  console.log(
    `Transferred ${ethers.utils.formatUnits(
      faucetFundingAmount,
      "ether"
    )} bmtk and usd to Faucet`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
