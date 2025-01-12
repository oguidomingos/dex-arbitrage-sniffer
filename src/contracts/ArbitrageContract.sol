// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract ArbitrageContract is FlashLoanSimpleReceiverBase, Ownable {
    address public dexARouter;
    address public dexBRouter;
    uint256 public constant FLASH_LOAN_FEE = 9; // 0.09% fee
    
    constructor(
        address _addressProvider,
        address _dexARouter,
        address _dexBRouter
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) Ownable(msg.sender) {
        dexARouter = _dexARouter;
        dexBRouter = _dexBRouter;
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Decode params
        (address tokenA, address tokenB) = abi.decode(params, (address, address));
        
        // Approve DEX A to spend tokenA
        IERC20(asset).approve(dexARouter, amount);
        
        // Execute first swap on DEX A
        uint256 amountReceived = executeSwap(
            dexARouter,
            asset,
            tokenB,
            amount
        );
        
        // Approve DEX B to spend tokenB
        IERC20(tokenB).approve(dexBRouter, amountReceived);
        
        // Execute second swap on DEX B
        uint256 finalAmount = executeSwap(
            dexBRouter,
            tokenB,
            asset,
            amountReceived
        );
        
        // Verify profit
        uint256 amountToRepay = amount + premium;
        require(finalAmount >= amountToRepay, "Insufficient funds to repay flash loan");
        
        // Approve repayment
        IERC20(asset).approve(address(POOL), amountToRepay);
        
        return true;
    }

    function executeSwap(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amounts = IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            0, // Accept any amount of tokenOut
            path,
            address(this),
            block.timestamp
        );
        
        return amounts[1];
    }

    function requestFlashLoan(
        address token,
        uint256 amount,
        address tokenA,
        address tokenB
    ) external onlyOwner {
        bytes memory params = abi.encode(tokenA, tokenB);
        POOL.flashLoanSimple(address(this), token, amount, params, 0);
    }

    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }

    // Emergency withdrawal function
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        IERC20(token).transfer(owner(), balance);
    }
}