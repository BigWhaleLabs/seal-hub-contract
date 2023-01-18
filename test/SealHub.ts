import { BigNumber } from 'ethers'
import { IncrementalMerkleTree } from '@zk-kit/incremental-merkle-tree'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  getFakeCommitmentProofEcdsa,
  getFakeCommitmentProofUPrecomputes,
  getFakeECDSAVerifier,
  getIncrementalTreeContract,
  zeroAddress,
} from './utils'
import { poseidon } from '@big-whale-labs/poseidon'

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
      await this.fakeVerifierContract.mock.verifyProofs.returns(true)
      // SealHub
      this.SealHubContract = await this.SealHubFactory.deploy(
        this.version,
        this.fakeVerifierContract.address,
        zeroAddress,
        30
      )
    })

    it('should add a commitment', async function () {
      const fakeEcdsaProof = await getFakeCommitmentProofEcdsa()
      const fakeUPrecomputesProof = await getFakeCommitmentProofUPrecomputes()
      const SealHub = this.SealHubContract
      await SealHub.createCommitment(fakeEcdsaProof, fakeUPrecomputesProof)
      expect((await SealHub.tree()).numberOfLeaves).to.equal(1)
      expect(await SealHub.merkleRoots(0)).to.equal((await SealHub.tree()).root)
    })

    it('should be same merkle root as in contract without leaves', async function () {
      const SealHub = this.SealHubContract
      const tree = new IncrementalMerkleTree(poseidon, 30, BigInt(0), 2)
      expect(BigNumber.from(tree.root).toHexString()).to.equal(
        (await SealHub.tree()).root.toHexString()
      )
    })

    it('should create same merkle root as in contract when leaves added', async function () {
      const SealHub = this.SealHubContract
      const tree = new IncrementalMerkleTree(poseidon, 30, BigInt(0), 2)
      for (let i = 0; i <= 50; i++) {
        const fakeEcdsaProof = await getFakeCommitmentProofEcdsa(
          String(Math.random())
        )
        const fakeUPrecomputesProof = await getFakeCommitmentProofUPrecomputes(
          String(Math.random())
        )
        await SealHub.createCommitment(fakeEcdsaProof, fakeUPrecomputesProof)
        tree.insert(fakeEcdsaProof.input[0])
      }
      const { root, numberOfLeaves } = await SealHub.tree()
      expect(numberOfLeaves).to.equal(tree.leaves.length)
      expect(BigNumber.from(root).toHexString()).to.equal(
        BigNumber.from(tree.root).toHexString()
      )
    })

    it('should fail if number of leaves are different', async function () {
      const SealHub = this.SealHubContract
      const tree = new IncrementalMerkleTree(poseidon, 30, BigInt(0), 2)
      const fakeEcdsaProof = await getFakeCommitmentProofEcdsa(
        String(Math.random())
      )
      tree.insert(fakeEcdsaProof.input[0])

      const { root, numberOfLeaves } = await SealHub.tree()
      expect(numberOfLeaves).not.to.equal(tree.leaves.length)
      expect(BigNumber.from(root).toHexString()).not.to.equal(
        BigNumber.from(tree.root).toHexString()
      )
    })

    it('should not mint if the zk proof is invalid', async function () {
      await this.fakeVerifierContract.mock.verifyProofs.returns(false)
      const contract = await this.SealHubFactory.deploy(
        this.version,
        this.fakeVerifierContract.address,
        zeroAddress,
        30
      )
      const fakeEcdsaProof = await getFakeCommitmentProofEcdsa(
        String(Math.random())
      )
      const fakeUPrecomputesProof = await getFakeCommitmentProofUPrecomputes(
        String(Math.random())
      )
      await expect(
        contract.createCommitment(fakeEcdsaProof, fakeUPrecomputesProof)
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
