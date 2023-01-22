// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Ayux is ERC20 {
  constructor() ERC20('AYUX', 'AYX') {
    _mint(msg.sender, 5000 * 10**18);
  }
}