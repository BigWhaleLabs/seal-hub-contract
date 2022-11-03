import { BigNumber, BigNumberish, utils } from 'ethers'
import { ECDSAProofStruct } from 'typechain/contracts/SealHub'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { poseidonContract } from 'circomlibjs'

export const zeroAddress = '0x0000000000000000000000000000000000000000'

export async function getIncrementalTreeContract() {
  console.log(poseidonContract)
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

  console.log(
    `PoseidonT3 library has been deployed to: ${poseidonT3Lib.address}`
  )

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

  console.log(
    `IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`
  )
  return incrementalBinaryTreeLib.address
}

export async function getFakeECDSAVerifier(signer: SignerWithAddress) {
  return await waffle.deployMockContract(signer, [
    {
      inputs: [
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
      name: 'verifyProof',
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

export function getFakeCommitmentProof(): ECDSAProofStruct {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: inputsForMessage('seal'),
  }
}

function inputsForMessage(message: string) {
  const messageBytes = utils.toUtf8Bytes(message)
  return [BigNumber.from(messageBytes).toBigInt()] as [BigNumberish]
}
