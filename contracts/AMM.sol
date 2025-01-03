// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

//manage pool
//manage deposit
//facilitate swaps
//manage withdraws

contract AMM {
    Token public token1;
    Token public token2;

    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public k;

    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 constant PRECISION = 10 ** 18;

    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );

    constructor(Token _token1, Token _token2) {
        token1 = _token1;
        token2 = _token2;
    }

    function addLiquidity(
        uint256 _token1Amount,
        uint256 _token2Amount
    ) external {
        //deposit tokens
        require(
            token1.transferFrom((msg.sender), address(this), _token1Amount),
            "failed to transfer token 1"
        );
        require(
            token2.transferFrom((msg.sender), address(this), _token2Amount),
            "failed to transfer token 2"
        );

        //issue shares
        uint256 share;
        //if first time adding liquidity, make sare 100
        if (totalShares == 0) {
            share = 100 * PRECISION;
        } else {
            uint256 share1 = (totalShares * _token1Amount) / token1Balance;
            uint256 share2 = (totalShares * _token2Amount) / token2Balance;
            require(
                (share1 / 10 ** 3) == (share2 / 10 ** 3),
                "must provide equal token amounts"
            );
            share = share1;
        }

        //manage pool
        token1Balance += _token1Amount;
        token2Balance += _token2Amount;
        k = token1Balance * token2Balance;

        //update shares
        totalShares += share;
        shares[msg.sender] += share;
    }

    //determine how many token2 tokens must be deposited when depositing liquidity for token1
    function calculateToken2Deposit(
        uint256 _token1Amount
    ) public view returns (uint256 token2Amount) {
        token2Amount = (token2Balance * _token1Amount) / token1Balance;
    }
    //determine how many token1 tokens must be deposited when depositing liquidity for token2
    function calculateToken1Deposit(
        uint256 _token2Amount
    ) public view returns (uint256 token1Amount) {
        token1Amount = (token1Balance * _token2Amount) / token2Balance;
    }
    // returns amount of token2 received when swapping token1
    function calculateToken1Swap(
        uint256 _token1Amount
    ) public view returns (uint256 token2Amount) {
        uint256 token1After = token1Balance + _token1Amount;
        uint token2After = k / token1After;
        token2Amount = token2Balance - token2After;

        //dont let pool go to 0
        if (token2Amount == token2Balance) {
            token2Amount--;
        }
        require(
            token2Amount < token2Balance,
            "swap cannot exceed pool balance"
        );
    }

    function swapToken1(
        uint256 _token1Amount
    ) external returns (uint256 token2Amount) {
        // calcualte token 2 amount
        token2Amount = calculateToken1Swap(_token1Amount);

        // do swap
        //transfer tokens out of user wallet
        token1.transferFrom(msg.sender, address(this), _token1Amount);
        //update token1 balance in the contract
        token1Balance += _token1Amount;
        //update token 2 balance in the contract
        token2Balance -= token2Amount;
        //transfer token2 tokens from contract to user wallet
        token2.transfer(msg.sender, token2Amount);

        //emit an event
        emit Swap(
            msg.sender,
            address(token1),
            _token1Amount,
            address(token2),
            token2Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

    function calculateToken2Swap(
        uint256 _token2Amount
    ) public view returns (uint256 token1Amount) {
        uint256 token2After = token2Balance + _token2Amount;
        uint token1After = k / token2After;
        token1Amount = token1Balance - token1After;

        //dont let pool go to 0
        if (token1Amount == token1Balance) {
            token1Amount--;
        }
        require(
            token1Amount < token1Balance,
            "swap cannot exceed pool balance"
        );
    }

    function swapToken2(
        uint256 _token2Amount
    ) external returns (uint256 token1Amount) {
        // calcualte token 2 amount
        token1Amount = calculateToken2Swap(_token2Amount);

        // do swap
        //transfer tokens out of user wallet
        token2.transferFrom(msg.sender, address(this), _token2Amount);
        //update token1 balance in the contract
        token2Balance += _token2Amount;
        //update token 2 balance in the contract
        token1Balance -= token1Amount;
        //transfer token2 tokens from contract to user wallet
        token1.transfer(msg.sender, token1Amount);

        //emit an event
        emit Swap(
            msg.sender,
            address(token2),
            _token2Amount,
            address(token1),
            token1Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }
}
