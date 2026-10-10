// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Per-order escrow. Deployed as a CREATE2 clone whose immutable args are the order rules,
/// so the clone address is a commitment to those rules and buyers can pay it before it exists.
/// Rules: the fee always leaves first, the remainder can only go to the UTEXO mint contract,
/// and only with calldata signed by the builder.
contract Escrow is EIP712 {
    using SafeERC20 for IERC20;

    bytes32 private constant SETTLE_TYPEHASH =
        keccak256("Settle(bytes32 dataHash,uint256 amount,uint256 nonce,uint256 deadline)");

    uint256 public feePaid;
    uint256 public nonce;

    constructor() EIP712("PeahaEscrow", "1") {}

    /// @return usdt token, mint UTEXO bridge/entrypoint, builder signer, feeTo fee recipient, fee total fee
    function rules() public view returns (address usdt, address mint, address builder, address feeTo, uint256 fee) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (address, address, address, address, uint256));
    }

    /// @notice Permissionless: the fee is owed as soon as funds arrive, no signature needed.
    function collectFee() public {
        (address usdt,,, address feeTo, uint256 fee) = rules();
        uint256 due = Math.min(IERC20(usdt).balanceOf(address(this)), fee - feePaid);
        if (due == 0) return;
        feePaid += due;
        IERC20(usdt).safeTransfer(feeTo, due);
    }

    /// @param data calldata for the UTEXO mint contract (fundsIn / entrypoint deposit with the OpId)
    /// @param amount USDT the mint contract may pull (UTEXO depositAmount)
    /// @dev msg.value covers the LayerZero native fee on non-Arbitrum routes, paid by the relayer
    function settle(bytes calldata data, uint256 amount, uint256 deadline, bytes calldata sig) external payable {
        (address usdt, address mint, address builder,,) = rules();
        require(block.timestamp <= deadline, "expired");
        bytes32 digest =
            _hashTypedDataV4(keccak256(abi.encode(SETTLE_TYPEHASH, keccak256(data), amount, nonce, deadline)));
        require(ECDSA.recover(digest, sig) == builder, "bad sig");
        nonce += 1;

        collectFee();

        IERC20(usdt).forceApprove(mint, amount); // USDT on Ethereum needs approve-to-zero first
        (bool ok,) = mint.call{value: msg.value}(data);
        require(ok, "mint call failed");
        IERC20(usdt).forceApprove(mint, 0);
    }
}

contract EscrowFactory {
    address public immutable implementation;

    constructor() {
        implementation = address(new Escrow());
    }

    /// @param args abi.encode(usdt, mint, builder, feeTo, fee)
    /// @param salt keccak256(orderId)
    function deploy(bytes calldata args, bytes32 salt) external returns (address) {
        return Clones.cloneDeterministicWithImmutableArgs(implementation, args, salt);
    }

    function predict(bytes calldata args, bytes32 salt) external view returns (address) {
        return Clones.predictDeterministicAddressWithImmutableArgs(implementation, args, salt);
    }
}
