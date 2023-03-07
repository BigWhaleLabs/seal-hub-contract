import { ethers, upgrades } from 'hardhat'
import prompt from 'prompt'

const regexes = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

async function main() {
  const SealHub = await ethers.getContractFactory('SealHub')
  const { proxyAddress } = await prompt.get({
    properties: {
      proxyAddress: {
        required: true,
        message: 'Proxy address',
        pattern: regexes.ethereumAddress,
      },
    },
  })
  console.log('Upgrading SealHub...')
  await upgrades.upgradeProxy(proxyAddress as string, SealHub, {
    unsafeAllow: ['external-library-linking'],
  })
  console.log('SealHub upgraded')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
