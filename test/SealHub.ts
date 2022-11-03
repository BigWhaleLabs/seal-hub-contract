import { SealHub__factory } from 'typechain'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { getIncrementalTreeContract, zeroAddress } from './utils'

describe('SealHub contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.SealHubFactory = await ethers.getContractFactory('SealHub', {
      libraries: {
        IncrementalBinaryTree: await getIncrementalTreeContract(),
      },
    })
    this.version = '0.0.1'
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await (this.SealHubFactory as SealHub__factory).deploy(
        this.version,
        zeroAddress,
        zeroAddress,
        30
      )
      expect(await contract.version()).to.equal(this.version)
      expect(await contract.verifierContract()).to.equal(zeroAddress)
      expect(await contract.getTrustedForwarder()).to.equal(zeroAddress)
      expect((await contract.tree()).depth).to.equal(30)
      expect((await contract.tree()).numberOfLeaves).to.equal(0)
    })
  })
})
