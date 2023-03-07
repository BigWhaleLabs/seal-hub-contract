# SealHub smart contract

Contract to store anonymous ECDSA commitments.

# Deployments

| Contract                | Address                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Proxy                   | [0xB1E8EBd9768F6c0b8004506d6F87321DC0aed583](https://goerli.etherscan.io/address/0xB1E8EBd9768F6c0b8004506d6F87321DC0aed583) |
| Implementation(SealHub) | [0x3d0ec70f0f2e1Cc5C176Db31ef8F8764c5c2667D](https://goerli.etherscan.io/address/0x3d0ec70f0f2e1Cc5C176Db31ef8F8764c5c2667D) |
| Proxy Admin             | [0xd33d08f503EB0E65bA0a6218ee895E3335Df003C](https://goerli.etherscan.io/address/0xd33d08f503EB0E65bA0a6218ee895E3335Df003C) |

## Usage

1. Clone the repository with `git clone git@github.com:BigWhaleLabs/seal-hub-contract.git`
2. Install the dependencies with `yarn`
3. Add environment variables to your `.env` file
4. Run the scripts below

## Environment variables

| Name                         | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `ETHERSCAN_API_KEY`          | Etherscan API key                                         |
| `ETH_RPC`                    | Ethereum RPC URL                                          |
| `CONTRACT_OWNER_PRIVATE_KEY` | Private key of the contract owner to deploy the contracts |
| `COINMARKETCAP_API_KEY`      | Coinmarketcap API key                                     |

Also check out the `.env.sample` file for more information.

## Available scripts

- `yarn build` — compiles the contract ts interface to the `typechain` directory
- `yarn test` — runs the test suite
- `yarn deploy` — deploys the contract to the network
- `yarn eth-lint` — runs the linter for the solidity contract
- `yarn lint` — runs all the linters
- `yarn prettify` — prettifies the code in th project
- `yarn release` — relases the `typechain` directory to NPM
