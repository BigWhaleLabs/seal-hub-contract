import { SealHub, SealHub__factory } from 'typechain'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  getFakeCommitmentProof,
  getFakeECDSAVerifier,
  getIncrementalTreeContract,
  zeroAddress,
} from './utils'

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
      const contract = await this.SealHubFactory.deploy(
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

  describe('Adding commitment', function () {
    this.beforeEach(async function () {
      // Verifier
      this.fakeVerifierContract = await getFakeECDSAVerifier(this.owner)
      await this.fakeVerifierContract.mock.verifyProof.returns(true)
      // SealHub
      this.SealHubContract = await this.SealHubFactory.deploy(
        this.version,
        this.fakeVerifierContract.address,
        zeroAddress,
        30
      )
    })
    it('should add a commitment', async function () {
      const fakeProof = await getFakeCommitmentProof()
      const SealHub = this.SealHubContract
      await SealHub.createCommitment(fakeProof)
      expect((await SealHub.tree()).numberOfLeaves).to.equal(1)
      expect(await SealHub.merkleRoots(0)).to.equal((await SealHub.tree()).root)
    })
  })
})
