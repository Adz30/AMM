⚖️ AMM (Automated Market Maker)

A lightweight decentralized exchange (DEX) prototype enabling token swaps and liquidity provisioning, built with React, Solidity, and Hardhat, and deployed on the Ethereum Sepolia Testnet.

🌐 Live Demo
https://amm-rouge.vercel.app/

📌 Project Overview

This Automated Market Maker (AMM) allows users to seamlessly swap between two dummy ERC-20 tokens, provide liquidity, and view live pricing — all powered by a smart contract using the constant product formula (x * y = k).

🚀 Features

🔁 Swap between two deployed ERC-20 tokens (Sepolia testnet)
💧 Add or remove liquidity from the pool
📊 Real-time charts for price and liquidity via ApexCharts
⚙️ On-chain interaction using Hardhat + ethers.js
⚛️ React frontend with Redux state management
🛠 Tech Stack

Frontend
React – UI framework
Redux Toolkit – App state management
React Router – Navigation
ApexCharts – Charting for price/liquidity trends
Bootstrap – Responsive UI components
Smart Contracts & Blockchain
Solidity – Smart contract development
Hardhat – Ethereum development environment
Ethers.js – Blockchain integration
Sepolia Testnet – Deployed test contracts
📦 Installation & Setup

Prerequisites

Node.js & npm installed
npm install 

Sepolia wallet with test ETH (e.g., via faucet)

Clone & Install

git clone https://github.com/Adz30/AMM.git
cd AMM
npm install
Run Frontend
npm start

Deploy Contracts Locally
Start a local Hardhat node:

npx hardhat node

Deploy the contracts:
npx hardhat run scripts/deploy.js --network localhost

📜 Usage

Connect your wallet (Sepolia network)
Swap tokens via the AMM interface
Add/remove liquidity to participate in fee rewards
Watch the price curve update in real time
🧪 Testing

To run contract tests:

npx hardhat test
📄 License

This project is open-source and available under the MIT License.
