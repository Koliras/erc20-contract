// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GooseToken is ERC20 {
    mapping(address => bool) private admins;

    constructor(uint256 initialSupply) ERC20("Goose", "GOS") {
        _mint(msg.sender, initialSupply);
        admins[msg.sender] = true;
    }

    modifier isAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }

    function addAdmin(address newAdmin) public isAdmin {
        admins[newAdmin] = true;
    }

    function removeAdmin(address admin) public isAdmin {
        admins[admin] = false;
    }

    function mint(uint256 additionalSupply) public isAdmin {
        _mint(msg.sender, additionalSupply);
    }

    function burn(uint256 supplyToBurn) public isAdmin {
        uint256 balance = balanceOf(msg.sender);
        if (balance < supplyToBurn)
            revert ERC20InsufficientBalance(msg.sender, balance, supplyToBurn);

        _burn(msg.sender, supplyToBurn);
    }
}
