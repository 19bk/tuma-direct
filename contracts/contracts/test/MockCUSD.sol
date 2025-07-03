// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockCUSD
 * @dev Mock cUSD token for testing TumaDirect
 * @author TumaDirect Team
 */
contract MockCUSD is ERC20, Ownable {
    uint8 private _decimals = 18; // cUSD has 18 decimals

    constructor() ERC20("Celo Dollar", "cUSD") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M cUSD
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
} 