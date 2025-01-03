const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("AMM", () => {
  let accounts, deployer, liquidityProvider, investor1, investor2;

  let token1, token2, amm;

  beforeEach(async () => {
    //setup accounts
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    liquidityProvider = accounts[1];
    investor1 = accounts[2]
    investor2 = accounts[3]


    // deploy token
    const Token = await ethers.getContractFactory("Token");
    token1 = await Token.deploy("Dapp University", "DAPP", "1000000");
    token2 = await Token.deploy("USD Token", "USD", "1000000");

    // send tokens to liquidity provider
    let transaction = await token1
      .connect(deployer)
      .transfer(liquidityProvider.address, tokens(100000));
    await transaction.wait();
    transaction = await token2
      .connect(deployer)
      .transfer(liquidityProvider.address, tokens(100000));
    await transaction.wait();
    // send token1 to investor1
    transaction = await token1
      .connect(deployer)
      .transfer(investor1.address, tokens(100000));
    await transaction.wait();
    // send token2 to investor2
    transaction = await token2
      .connect(deployer)
      .transfer(investor2.address, tokens(100000));
    await transaction.wait();

    //deploy AMM
    const AMM = await ethers.getContractFactory("AMM");
    amm = await AMM.deploy(token1.address, token2.address);
  });

  describe("Deployment", () => {
    it("has an address", async () => {
      expect(amm.address).to.not.equal(0x0);
    });
    it("tracks token1 address", async () => {
      expect(await amm.token1()).to.equal(token1.address);
    });
    it("tracks token2 address", async () => {
      expect(await amm.token2()).to.equal(token2.address);
    });
  });

  describe("swapping tokens", () => {
    let amount, transaction, result, estimate, balance;
    it("facilitates swaps", async () => {
      // deployer approves 100k tokens
      let amount = tokens(100000);

      transaction = await token1.connect(deployer).approve(amm.address, amount);
      await transaction.wait();

      transaction = await token2.connect(deployer).approve(amm.address, amount);
      await transaction.wait();
      //deployer adds liquidity
      transaction = await amm.connect(deployer).addLiquidity(amount, amount);
      await transaction.wait();
      // check amm receives tokens

      expect(await token1.balanceOf(amm.address)).to.equal(amount);
      expect(await token2.balanceOf(amm.address)).to.equal(amount);

      expect(await amm.token1Balance()).to.equal(amount);
      expect(await amm.token2Balance()).to.equal(amount);

      //check deployer has 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100));

      //check pool has 100 total shares
      expect(await amm.totalShares()).to.equal(tokens(100));

      ///////////////////////////////// LP adds more liquidity

      //LP approves 50k
      amount = tokens(50000);

      transaction = await token1
        .connect(liquidityProvider)
        .approve(amm.address, amount);
      await transaction.wait();

      transaction = await token2
        .connect(liquidityProvider)
        .approve(amm.address, amount);
      await transaction.wait();

      //calculate token2 deposit amount
      let token2Deposit = await amm.calculateToken2Deposit(amount);

      // LP adds liquidity
      transaction = await amm
        .connect(liquidityProvider)
        .addLiquidity(amount, token2Deposit);
      await transaction.wait();

      //LP should have 50 shares
      expect(await amm.shares(liquidityProvider.address)).to.equal(tokens(50));

      // deployer should still have 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100));
      // total shares should be 150 shares
      expect(await amm.totalShares()).to.equal(tokens(150));

      /////////////////////////////////////////////////////////////////////////
      //////////////////////////// investor1 swaps
      //approve tokens
      transaction = await token1.connect(investor1).approve(amm.address, tokens(100000))
      await transaction.wait()

      //check balance before swap

      balance = await token2.balanceOf(investor1.address)
      console.log(`investor 1 token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)

      //estimate amount of tokens investor 1 will receive including slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(`Token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}\n`)


      // investor 1 swap token 1 
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      result = await transaction.wait()

      //check swap event
      await expect(transaction).to.emit(amm, 'Swap')
      .withArgs(
        investor1.address,
        token1.address,
        tokens(1),
        token2.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp

      )



      //check investor 1 balace after swap

      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance after swap: ${ethers.utils.formatEther(balance)}\n`)
      expect(estimate).to.equal(balance)

      //check amm token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      //check price after swapping
      console.log(`Price: ${await amm.token2Balance()/ await amm.token1Balance()} \n`)

      /////////////////////////////////////////////
      ///// investor 1 swaps again

      //swap somre more tokens to see what happens
      balance = await token2.balanceOf(investor1.address)
      console.log(`investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)} \n`)

      //estimate amount of tokens investor1 will receive after swapping token 1: includes slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(` token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)} \n`)

      //investor swaps 1 token
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      await transaction.wait()

      //check investor 1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`investor1 token2 balance after sawp: ${ethers.utils.formatEther(balance)} \n`)
      
        //check amm token balances are in sync
       expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
       expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

       //check price after swapping 
       console.log(`Price: ${await amm.token2Balance()/ await amm.token1Balance()} \n`)

           /////////////////////////////////////////////
      ///// investor 1 swaps again

      //swap somre more tokens to see what happens
      balance = await token2.balanceOf(investor1.address)
      console.log(`investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)} \n`)

      //estimate amount of tokens investor1 will receive after swapping token 1: includes slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(` token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)} \n`)

      //investor swaps 1 token
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      await transaction.wait()

      //check investor 1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`investor1 token2 balance after sawp: ${ethers.utils.formatEther(balance)} \n`)
      
        //check amm token balances are in sync
       expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
       expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

       //check price after swapping 
       console.log(`Price: ${await amm.token2Balance()/ await amm.token1Balance()} \n`)

          /////////////////////////////////////////////
      ///// investor 1 swaps a large amount

      //swap somre more tokens to see what happens
      balance = await token2.balanceOf(investor1.address)
      console.log(`investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)} \n`)

      //estimate amount of tokens investor1 will receive after swapping token 1: includes slippage
      estimate = await amm.calculateToken1Swap(tokens(100))
      console.log(` token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)} \n`)

      //investor swaps 1 token
      transaction = await amm.connect(investor1).swapToken1(tokens(100))
      await transaction.wait()

      //check investor 1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`investor1 token2 balance after sawp: ${ethers.utils.formatEther(balance)} \n`)
      
        //check amm token balances are in sync
       expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
       expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

       //check price after swapping 
       console.log(`Price: ${await amm.token2Balance()/ await amm.token1Balance()} \n`)

          /////////////////////////////////
          /// investor 2 swaps 
       
          //investor 2 approves all tokens 
      transaction = await token2.connect(investor2).approve(amm.address, tokens(100000))
      await transaction.wait()

      //check investor 2 token 1 balance before swap

      balance = await token1.balanceOf(investor2.address)
      console.log(`investor 2 token1 balance before swap: ${ethers.utils.formatEther(balance)}\n`)

      //estimate amount of tokens investor2 will receive after swapping token2 including slippage
      estimate = await amm.calculateToken2Swap(tokens(1))
      console.log(` token1 amount investor2 will receive after swap: ${ethers.utils.formatEther(estimate)} \n`)

      //  investor2 swaps 1 token
      transaction = await amm.connect(investor2).swapToken2(tokens(1))
      await transaction.wait()

      //check swap event
      await expect(transaction).to.emit(amm, 'Swap')
      .withArgs(
        investor2.address,
        token2.address,
        tokens(1),
        token1.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp

      )

       //check investor 2 token 1 balance after swap

       balance = await token1.balanceOf(investor2.address)
       console.log(`investor 2 token1 balance after swap: ${ethers.utils.formatEther(balance)}\n`)
       expect(estimate).to.equal(balance)

           //check amm token balances are in sync
           expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
           expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())
    
           //check price after swapping 
           console.log(`Price: ${await amm.token2Balance()/ await amm.token1Balance()} \n`)


    });
  });
});
