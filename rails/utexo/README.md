# @ara-peaha-ai/utexo

Non-custodial per-order escrow for USDT on EVM chains, settling into USDT on Bitcoin (RGB) through the [UTEXO Mint](https://docs.utexo.com/product-suite/mint).

**Stage:** draft, not audited. Do not use with real funds.

## Problem

- A buyer receives a payment request and may pay days or weeks later.
- A fixed fee, computed off-chain, must be deducted from the first funds received.
- The remainder must go to the UTEXO Mint, which needs a fresh `opId` per mint (`ttlSeconds`, e.g. 1800). It cannot be prepared when the payment request is issued.
- Nobody, the orchestrator included, may hold or redirect the funds. There is no hot wallet.

## How it works

Each order gets its own escrow: an [OpenZeppelin clone with immutable args](https://docs.openzeppelin.com/contracts/5.x/api/proxy#Clones) deployed through CREATE2. The clone address is the hash of the factory, the salt (`keccak256(orderId)`) and the rules. It is a commitment to the rules, like a P2SH address is a commitment to its script. Nobody holds a private key for it, and a different rule set lands on a different address.

| Rule (clone arg) | Meaning |
|---|---|
| `usdt` | token on this chain |
| `mint` | UTEXO bridge (`fundsIn` on Arbitrum) or entrypoint contract on this chain |
| `builder` | address of a secp256k1 key derived in the builder's wallet for this sale contract only, used only to sign |
| `feeTo` | fee recipient |
| `fee` | total fee in token base units |

### Flow

1. **Issue (off-chain, no gas), at sale contract signing:** the builder's wallet derives a fresh key for this contract and sends its address (`builder`). The orchestrator computes the escrow address with `predictEscrow()`. The wallet recomputes it from the same rules and must confirm it before the request reaches the buyer. This check is what stops a compromised server from swapping in its own key.
2. **Pay:** the buyer sends USDT to the address. The contract does not exist yet. The address is registered in BTCPay (USDt plugin) for tracking and webhooks.
3. **Fee:** anyone can call `collectFee()` once the contract is deployed. It sends `min(balance, fee - feePaid)` to `feeTo`.
4. **Settle:** the builder taps "cash out". The orchestrator calls `POST /mint/op-id` (operator key) and sends the resulting calldata to the wallet. The wallet signs `settleTypedData()` (EIP-712) and returns the signature. The orchestrator then relays:
   - `factory.deploy(args, salt)` on the first settle only;
   - `escrow.settle(data, amount, deadline, sig)`, with `msg.value` set to the LayerZero `nativeFee` on non-Arbitrum routes.
5. **Inside `settle`:** the contract checks the builder's signature, collects the fee, approves `amount` to `mint`, calls `mint` with the signed calldata and resets the approval. The call can target only `mint`.

### Guarantees

| Actor | Can | Cannot |
|---|---|---|
| Orchestrator | relay, pay gas | move funds, change rules, forge calldata |
| Builder | choose the mint calldata (`opId`) | skip the fee, call anything other than `mint` |
| Anyone | deploy, `collectFee()` | anything else |

## UTEXO facts this relies on

From the UTEXO docs ([Mint](https://docs.utexo.com/product-suite/mint), [API reference](https://docs.utexo.com/product-suite/mint-api-reference.md)):

- Arbitrum is the hub. Ethereum, Polygon PoS, Plasma and Tron reach it through USDT0/LayerZero via UTEXO entrypoint contracts. No bridge of our own is needed. BNB is not listed; check `GET /networks`.
- A deposit is a contract call, not a transfer: `approve` + `fundsIn()` with the ABI-encoded `opId` as `settlementData`, or the entrypoint call built from `depositParams`.
- Fee: 0.03%, plus the LayerZero `nativeFee` on entrypoint routes.
- At the time of writing, the docs say the only tested route is Arbitrum mainnet → Bitcoin (Utexo signet).

## Gas (measured, local, with the mock mint)

| Step | Gas |
|---|---|
| Clone deploy | ~100k |
| First `settle` (fee + mint call) | ~176k |

The real UTEXO call, especially on entrypoint routes, will cost more. Measure on a fork before relying on these numbers.

## Open points

1. **`opId` ↔ RGB invoice binding:** `POST /mint/op-id` goes through the orchestrator. The wallet must be able to verify independently that the `opId` mints to its own invoice. Ask UTEXO whether `settlementData` commits to the invoice, or whether status can be queried without the operator key.
2. **Mint contract address is fixed per order:** if UTEXO replaces the contract before settlement, the funds are stuck. An escape hatch (for example, a builder-signed free destination after N days) is a business decision that is still pending.
3. **`refundTo` in `depositParams`:** it must be the escrow or the builder. It is not checked on-chain yet, because the entrypoint calldata layout is undocumented.
4. **Entrypoint routes:** the calldata format is not documented. Only the Arbitrum `fundsIn` shape is mocked.
5. **Tron:** TVM supports CREATE2 and `ecrecover`, but addresses and USDT behaviour differ. It needs a separate pass.
6. **No Nuxt module yet:** this rail only exports `lib/escrow.js`. Handlers (issue, relay) come next.

## Usage

```js
import { predictEscrow, encodeRules, orderSalt, settleTypedData } from '@ara-peaha-ai/utexo'

const escrow = predictEscrow({ factory, implementation, rules, orderId })
// wallet side
const { domain, types, message } = settleTypedData({ escrow, chainId, data, amount, nonce, deadline })
const sig = await signer.signTypedData(domain, types, message)
```

## Development

```bash
pnpm --filter @ara-peaha-ai/utexo test
```
