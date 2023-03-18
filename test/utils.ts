import { BigNumber, utils } from 'ethers'
import {
  ECDSAProofStruct,
  UPrecomputesProofStruct,
} from 'typechain/contracts/SealHub'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { poseidonContract } from 'circomlibjs'

export const zeroAddress = '0x0000000000000000000000000000000000000000'

export async function getIncrementalTreeContract() {
  const poseidonT3ABI = poseidonContract.generateABI(2)
  const poseidonT3Bytecode = poseidonContract.createCode(2)
  const [signer] = await ethers.getSigners()
  const PoseidonLibT3Factory = new ethers.ContractFactory(
    poseidonT3ABI,
    poseidonT3Bytecode,
    signer
  )
  const poseidonT3Lib = await PoseidonLibT3Factory.deploy()
  await poseidonT3Lib.deployed()

  const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
    'IncrementalBinaryTree',
    {
      libraries: {
        PoseidonT3: poseidonT3Lib.address,
      },
    }
  )
  const incrementalBinaryTreeLib =
    await IncrementalBinaryTreeLibFactory.deploy()
  await incrementalBinaryTreeLib.deployed()

  return incrementalBinaryTreeLib.address
}

export async function getFakeECDSAVerifier(signer: SignerWithAddress) {
  return await waffle.deployMockContract(signer, [
    {
      inputs: [
        {
          components: [
            {
              internalType: 'uint256[2]',
              name: 'a',
              type: 'uint256[2]',
            },
            {
              internalType: 'uint256[2][2]',
              name: 'b',
              type: 'uint256[2][2]',
            },
            {
              internalType: 'uint256[2]',
              name: 'c',
              type: 'uint256[2]',
            },
            {
              internalType: 'uint256[6]',
              name: 'input',
              type: 'uint256[6]',
            },
          ],
          internalType: 'struct ECDSAProof',
          name: '_ecdsaProof',
          type: 'tuple',
        },
        {
          components: [
            {
              internalType: 'uint256[2]',
              name: 'a',
              type: 'uint256[2]',
            },
            {
              internalType: 'uint256[2][2]',
              name: 'b',
              type: 'uint256[2][2]',
            },
            {
              internalType: 'uint256[2]',
              name: 'c',
              type: 'uint256[2]',
            },
            {
              internalType: 'uint256[1]',
              name: 'input',
              type: 'uint256[1]',
            },
          ],
          internalType: 'struct UPrecomputesProof',
          name: '_uPrecomputesProof',
          type: 'tuple',
        },
      ],
      name: 'verifyProofs',
      outputs: [
        {
          internalType: 'bool',
          name: 'r',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ])
}

export function getFakeCommitmentProofEcdsa(
  message = 'seal'
): ECDSAProofStruct {
  const messageBytes = utils.toUtf8Bytes(message)
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: [
      BigNumber.from(messageBytes).toBigInt(),
      BigNumber.from(messageBytes).toBigInt(),
      BigNumber.from(messageBytes).toBigInt(),
      BigNumber.from(messageBytes).toBigInt(),
      BigNumber.from(messageBytes).toBigInt(),
      BigNumber.from(messageBytes).toBigInt(),
    ],
  }
}
export function getFakeCommitmentProofUPrecomputes(
  message = 'seal'
): UPrecomputesProofStruct {
  const messageBytes = utils.toUtf8Bytes(message)
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: [BigNumber.from(messageBytes).toBigInt()],
  }
}
