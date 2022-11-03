// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "@big-whale-labs/versioned-contract/contracts/Versioned.sol";
import "./models/ECDSAProof.sol";
import "./interfaces/IECDSACheckerVerifier.sol";

contract SealHub is ERC2771Recipient, Versioned {
  using Counters for Counters.Counter;

  // State
  address public verifierContract;
  Counters.Counter public numberOfCommitments;
  mapping(uint256 => bool) public commitmentMap;
  uint256[] public commitments;
  bytes32[] public merkleRoots;

  // Events
  event CommitmentCreated(uint256 commitmentId, bytes32 merkleRoot);

  // Functions
  constructor(
    string memory _version,
    address _verifierContract,
    address _trustedForwarder
  ) Versioned(_version) {
    verifierContract = _verifierContract;
    _setTrustedForwarder(_trustedForwarder);
  }

  function createCommitment(ECDSAProof memory proof) public {
    // Check the proof
    require(
      IECDSACheckerVerifier(verifierContract).verifyProof(
        proof.a,
        proof.b,
        proof.c,
        proof.input
      ),
      "Invalid ZK proof"
    );
    // Add the commitment
    uint256 commitment = proof.input[0];
    commitmentMap[commitment] = true;
    commitments.push(commitment);
    numberOfCommitments.increment();
    // TODO: add to incremental Merkle tree (let's do depth 30, which gives ~1B commitments)
    // TODO: after we add to incremental Merkle tree we also need to push the new Merkle root to the merkleRoots array
    emit CommitmentCreated(commitment, merkleRoot);
  }

  function _msgSender()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (address sender)
  {
    sender = ERC2771Recipient._msgSender();
  }

  function _msgData()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (bytes calldata ret)
  {
    return ERC2771Recipient._msgData();
  }
}
