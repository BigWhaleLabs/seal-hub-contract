import {
  GSN_FORWARDER_CONTRACT_ADDRESS,
  SEAL_HUB_VERIFIER_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
import { ethers, run, upgrades } from 'hardhat'
import { getIncrementalTreeContract } from '../test/utils'
import { utils } from 'ethers'
import { version } from '../package.json'
import prompt from 'prompt'

const regexes = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )

  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
  } as { [chainId: number]: string }
  const chainName = chains[chainId]

  console.log(`Deploying IncrementalBinaryTreeLib...`)
  const incrementalBinaryTreeLibAddress = await getIncrementalTreeContract()

  console.log(
    `IncrementalBinaryTreeLib deployed to ${incrementalBinaryTreeLibAddress}`
  )

  const contractName = 'SealHub'
  console.log(`Deploying ${contractName}...`)
  const factory = await ethers.getContractFactory(contractName, {
    libraries: {
      IncrementalBinaryTree: incrementalBinaryTreeLibAddress,
    },
  })
  const { verifierAddress, forwarder, depth } = await prompt.get({
    properties: {
      verifierAddress: {
        required: true,
        pattern: regexes.ethereumAddress,
        default: SEAL_HUB_VERIFIER_CONTRACT_ADDRESS,
      },
      forwarder: {
        required: true,
        pattern: regexes.ethereumAddress,
        default: GSN_FORWARDER_CONTRACT_ADDRESS,
      },
      depth: {
        required: true,
        default: 30,
      },
    },
  })
  const constructorArguments = [version, verifierAddress, forwarder, depth] as [
    string,
    string,
    string,
    string
  ]
  const contract = await upgrades.deployProxy(factory, constructorArguments, {
    initializer: 'initialize',
    unsafeAllow: ['external-library-linking'],
  })

  console.log(
    'Deploy tx gas price:',
    utils.formatEther(contract.deployTransaction.gasPrice || 0)
  )
  console.log(
    'Deploy tx gas limit:',
    utils.formatEther(contract.deployTransaction.gasLimit)
  )
  await contract.deployed()

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    contract.address
  )
  const adminAddress = await upgrades.erc1967.getAdminAddress(contract.address)

  console.log('SealHub Proxy address:', contract.address)
  console.log('Implementation address:', implementationAddress)
  console.log('Admin address:', adminAddress)

  console.log('Contract deployed to:', contract.address)
  console.log('Wait for 1 minute to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

  // Try to verify the contract on Etherscan
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address: implementationAddress,
      constructorArguments,
    })
    await run('verify:verify', {
      address: incrementalBinaryTreeLibAddress,
    })
  } catch (err) {
    console.log(
      'Error verifiying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }

  // Print out the information
  console.log(`${contractName} deployed and verified on Etherscan!`)
  console.log('Contract address:', implementationAddress)
  console.log(
    'Etherscan URL:',
    `https://${
      chainName !== 'mainnet' ? `${chainName}.` : ''
    }etherscan.io/address/${implementationAddress}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
