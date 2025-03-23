AMM (Automated Market Maker)

📌 Project Overview

This project is a simple Automated Market Maker (AMM) built using React and Solidity. It allows users to swap between two deployed dummy ERC-20 tokens on the Ethereum Sepolia testnet. The AMM operates using a constant product formula (x * y = k) to maintain liquidity and facilitate decentralized token swaps.

🚀 Features

Swap between two deployed dummy ERC-20 tokens.

Liquidity provision functionality (users can add/remove liquidity).

Real-time price updates using React and Redux.

On-chain interactions using Hardhat and ethers.js.

Basic charting for liquidity and price movements using ApexCharts.

🛠 Tech Stack

Frontend

React: UI framework for building the frontend.

Redux Toolkit: State management for handling token balances and UI state.

React Router: Navigation between different views.

ApexCharts: Real-time visualization of price movements and liquidity.

Bootstrap: For responsive UI components.

Smart Contracts & Blockchain

Solidity: Smart contract programming language.

Hardhat: Development and testing framework for Ethereum.

Ethers.js: Blockchain interaction library.

Sepolia Testnet: Contracts are deployed on the Sepolia Ethereum test network.

📦 Installation & Setup (Run Locally)

Prerequisites

Node.js and npm installed.

Hardhat installed globally:

npm install -g hardhat

A Sepolia testnet wallet with some test ETH.

Clone the repository

git clone https://github.com/Adz30/AMM.git
cd AMM

Install dependencies

npm install

Start the development server

npm start

Deploy Smart Contracts Locally

Start a local Hardhat node:

npx hardhat node

Deploy the contracts to the local network:

npx hardhat run scripts/deploy.js --network localhost




📜 Usage

Users can swap between the two dummy tokens on the AMM interface.

Liquidity providers can add or remove liquidity.

The pool price updates dynamically based on swaps.

This project is open-source and available under the MIT License.



