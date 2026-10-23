import { AbiCoder, concat, getCreate2Address, id, keccak256, toBeHex } from 'ethers'

// Order rules, in the exact order Escrow.rules() decodes them
export const encodeRules = ({ usdt, mint, builder, feeTo, fee }) =>
  AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'address', 'address', 'uint256'],
    [usdt, mint, builder, feeTo, fee]
  )

export const orderSalt = (orderId) => id(orderId)

// Mirrors OpenZeppelin Clones._cloneCodeWithImmutableArgs (v5.1+)
const cloneCode = (implementation, args) =>
  concat([
    '0x61',
    toBeHex((args.length - 2) / 2 + 45, 2),
    '0x3d81600a3d39f3363d3d373d3d3d363d73',
    implementation,
    '0x5af43d82803e903d91602b57fd5bf3',
    args
  ])

// Offline: the backend uses it to issue the address, the wallet to verify it before signing
export const predictEscrow = ({ factory, implementation, rules, orderId }) =>
  getCreate2Address(factory, orderSalt(orderId), keccak256(cloneCode(implementation, encodeRules(rules))))

// EIP-712 payload the builder's wallet signs: signer.signTypedData(domain, types, message)
export const settleTypedData = ({ escrow, chainId, data, amount, nonce, deadline }) => ({
  domain: { name: 'PeahaEscrow', version: '1', chainId, verifyingContract: escrow },
  types: {
    Settle: [
      { name: 'dataHash', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  },
  message: { dataHash: keccak256(data), amount, nonce, deadline }
})
