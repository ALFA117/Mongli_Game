// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MongliMemory {
    event FragmentSaved(address indexed player, bytes32 indexed hash, uint256 fragmentId);

    mapping(address => uint256) public fragmentCount;
    mapping(address => mapping(uint256 => bytes32)) public fragments;

    function saveFragment(bytes32 _hash, uint256 _fragmentId) external {
        fragments[msg.sender][_fragmentId] = _hash;
        fragmentCount[msg.sender]++;
        emit FragmentSaved(msg.sender, _hash, _fragmentId);
    }

    function getFragment(address player, uint256 fragmentId) external view returns (bytes32) {
        return fragments[player][fragmentId];
    }
}
