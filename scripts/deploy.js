// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  const Token = await hre.ethers.getContractFactory('Token')

  // deploy token(token1)
  let bmtk = await Token.deploy('BoomToken', 'BMTK', '1000000')
  await bmtk.deployed()
  console.log(`BMTK deployed to: ${bmtk.address}\n`)
  //deploy token2 
  const usd  = await Token.deploy('USD token', 'USD', '1000000')
  await usd.deployed()
  console.log(`USD token deployed to: ${usd.address}\n`)

  const AMM = await hre.ethers.getContractFactory('AMM')
  const amm = await AMM.deploy(bmtk.address, usd.address)

  console.log(`AMM contract deployed to: ${amm.address} \n `)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
