import { BigNumber, Wallet, utils } from 'ethers'
import { ECDSAProofStruct } from 'typechain/contracts/SealHub'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { poseidonContract } from 'circomlibjs'
import Mimc7 from './Mimc7'

export const zeroAddress = '0x0000000000000000000000000000000000000000'

const regSize = 64
const regNumber = 4

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

export async function getFakeCommitmentProof(): Promise<ECDSAProofStruct> {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: await inputsForMessage('Signature for SealHub'),
  }
}

function bigintToArray(x: bigint, n = regSize, k = regNumber) {
  let mod = 1n
  for (let idx = 0; idx < n; idx++) {
    mod = mod * 2n
  }

  const ret = [] as bigint[]
  let x_temp = x
  for (let idx = 0; idx < k; idx++) {
    ret.push(x_temp % mod)
    x_temp = x_temp / mod
  }
  return ret.map((el) => el.toString())
}

function publicKeyToArrays(publicKey: string) {
  const x = bigintToArray(BigInt('0x' + publicKey.slice(4, 4 + 64)))
  const y = bigintToArray(BigInt('0x' + publicKey.slice(68, 68 + 64)))

  return [x, y]
}

async function inputsForMessage(message: string) {
  const messageBytes = utils.toUtf8Bytes(message)
  const mimc7 = await new Mimc7().prepare()
  const messageHash = mimc7.hashWithoutBabyJub(messageBytes)
  const signature = await Wallet.createRandom().signMessage(messageHash)

  const publicKey = utils.recoverPublicKey(messageHash, signature)

  const r = bigintToArray(BigInt('0x' + signature.slice(2, 2 + 64)), 64, 4)
  const s = bigintToArray(BigInt('0x' + signature.slice(66, 66 + 64)), 64, 4)

  return [
    r,
    s,
    publicKeyToArrays(publicKey),
    [bigintToArray(BigNumber.from(messageHash).toBigInt())],
  ]
}
