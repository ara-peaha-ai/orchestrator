// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// Stand-in for the UTEXO Arbitrum bridge: pulls the approved USDT and records the OpId.
contract MockMint {
    IERC20 public immutable usdt;
    bytes32 public lastOpId;

    constructor(IERC20 _usdt) {
        usdt = _usdt;
    }

    function fundsIn(uint256 amount, bytes32 opId) external {
        usdt.transferFrom(msg.sender, address(this), amount);
        lastOpId = opId;
    }
}
