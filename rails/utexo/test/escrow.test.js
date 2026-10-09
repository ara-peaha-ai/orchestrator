import { expect } from 'chai'
import { network } from 'hardhat'
import { encodeRules, orderSalt, predictEscrow, settleTypedData } from '../lib/escrow.js'

const { ethers } = await network.create()
const usd = (n) => ethers.parseUnits(String(n), 6)

const setup = async () => {
  const [relayer, buyer, builder, feeTo, server] = await ethers.getSigners()
  const usdt = await ethers.deployContract('MockUSDT')
  const mint = await ethers.deployContract('MockMint', [await usdt.getAddress()])
  const factory = await ethers.deployContract('EscrowFactory')

  const rules = {
    usdt: await usdt.getAddress(),
    mint: await mint.getAddress(),
    builder: builder.address,
    feeTo: feeTo.address,
    fee: usd(3400)
  }
  const orderId = 'order-2026-0042'
  const escrowAddress = predictEscrow({
    factory: await factory.getAddress(),
    implementation: await factory.implementation(),
    rules,
    orderId
  })

  const pay = async (amount) => {
    await usdt.mint(buyer.address, amount)
    await usdt.connect(buyer).transfer(escrowAddress, amount)
  }
  const deploy = async () => {
    await factory.deploy(encodeRules(rules), orderSalt(orderId))
    return ethers.getContractAt('Escrow', escrowAddress)
  }
  const signSettle = async (signer, escrow, amount, opId) => {
    const data = mint.interface.encodeFunctionData('fundsIn', [amount, opId])
    const deadline = (await ethers.provider.getBlock('latest')).timestamp + 1800
    const { chainId } = await ethers.provider.getNetwork()
    const { domain, types, message } = settleTypedData({
      escrow: escrowAddress, chainId, data, amount, nonce: await escrow.nonce(), deadline
    })
    return [data, amount, deadline, await signer.signTypedData(domain, types, message)]
  }

  return { usdt, mint, factory, rules, orderId, escrowAddress, builder, feeTo, server, relayer, pay, deploy, signSettle }
}

describe('Escrow', () => {
  it('JS prediction matches the on-chain factory', async () => {
    const { factory, rules, orderId, escrowAddress } = await setup()
    expect(await factory.predict(encodeRules(rules), orderSalt(orderId))).to.equal(escrowAddress)
  })

  it('takes the fee first, sends the rest only to the mint, no fee on later installments', async () => {
    const { usdt, mint, feeTo, builder, pay, deploy, signSettle } = await setup()

    await pay(usd(50000)) // buyer pays before the contract exists
    const escrow = await deploy()
    await escrow.settle(...(await signSettle(builder, escrow, usd(46600), ethers.id('op-1'))))

    expect(await usdt.balanceOf(feeTo.address)).to.equal(usd(3400))
    expect(await usdt.balanceOf(await mint.getAddress())).to.equal(usd(46600))
    expect(await mint.lastOpId()).to.equal(ethers.id('op-1'))

    await pay(usd(100000))
    await escrow.settle(...(await signSettle(builder, escrow, usd(100000), ethers.id('op-2'))))
    expect(await usdt.balanceOf(feeTo.address)).to.equal(usd(3400))
    expect(await usdt.balanceOf(await mint.getAddress())).to.equal(usd(146600))
  })

  it('collects the fee without any signature, even when the first installment is smaller', async () => {
    const { usdt, feeTo, pay, deploy } = await setup()
    await pay(usd(1000))
    const escrow = await deploy()
    await escrow.collectFee()
    expect(await usdt.balanceOf(feeTo.address)).to.equal(usd(1000))

    await pay(usd(5000))
    await escrow.collectFee()
    expect(await usdt.balanceOf(feeTo.address)).to.equal(usd(3400))
    expect(await escrow.feePaid()).to.equal(usd(3400))
  })

  it('rejects a signature that is not the builder, and replays', async () => {
    const { builder, server, pay, deploy, signSettle } = await setup()
    await pay(usd(50000))
    const escrow = await deploy()

    await expect(escrow.settle(...(await signSettle(server, escrow, usd(46600), ethers.id('x')))))
      .to.be.revertedWith('bad sig')

    const args = await signSettle(builder, escrow, usd(10000), ethers.id('op-1'))
    await escrow.settle(...args)
    await expect(escrow.settle(...args)).to.be.revertedWith('bad sig')
  })

  it('cannot let a different rule set land on the issued address', async () => {
    const { factory, rules, orderId, escrowAddress, server } = await setup()
    const forged = { ...rules, feeTo: server.address, builder: server.address }
    expect(await factory.predict(encodeRules(forged), orderSalt(orderId))).to.not.equal(escrowAddress)
  })
})
