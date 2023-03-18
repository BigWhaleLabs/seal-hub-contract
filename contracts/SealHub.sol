// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "@big-whale-labs/versioned-contract/contracts/Versioned.sol";
import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";
import "./interfaces/ICompleteECDSACheckerVerifier.sol";

contract SealHub is ERC2771Recipient, Versioned {
  using Counters for Counters.Counter;
  using IncrementalBinaryTree for IncrementalTreeData;

  // State
  address public verifierContract;
  Counters.Counter public numberOfCommitments;
  mapping(uint256 => bool) public commitmentMap;
  uint256[] public commitments;
  bytes32[] public merkleRoots;
  mapping(bytes32 => bool) public merkleRootMap;
  IncrementalTreeData public tree;

  // Events
  event CommitmentCreated(uint256 commitmentId, bytes32 merkleRoot);

  // Functions
  constructor(
    string memory _version,
    address _verifierContract,
    address _trustedForwarder,
    uint8 _depth
  ) Versioned(_version) {
    verifierContract = _verifierContract;
    _setTrustedForwarder(_trustedForwarder);
    tree.init(_depth, 0);
  }

  function createCommitment(
    ECDSAProof memory _ecdsaProof,
    UPrecomputesProof memory _uPrecomputesProof
  ) public {
    // Check the proof
    require(
      ICompleteECDSACheckerVerifier(verifierContract).verifyProofs(
        _ecdsaProof,
        _uPrecomputesProof
      ),
      "Invalid ZK proof"
    );
    // Add the commitment
    uint256 commitment = _ecdsaProof.input[0];
    commitmentMap[commitment] = true;
    commitments.push(commitment);
    numberOfCommitments.increment();
    // Add to Merkle Tree
    tree.insert(commitment);
    bytes32 merkleRoot = bytes32(tree.root);
    merkleRoots.push(merkleRoot);
    merkleRootMap[merkleRoot] = true;
    emit CommitmentCreated(commitment, merkleRoot);
  }

  function isCommitmentMerkleRootValid(
    bytes32 merkleRoot
  ) external view returns (bool) {
    return merkleRootMap[merkleRoot];
  }

  function _msgSender()
    internal
    view
    override(ERC2771Recipient)
    returns (address sender)
  {
    sender = ERC2771Recipient._msgSender();
  }

  function _msgData()
    internal
    view
    override(ERC2771Recipient)
    returns (bytes calldata ret)
  {
    return ERC2771Recipient._msgData();
  }
}
