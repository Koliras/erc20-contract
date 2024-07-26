// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GooseToken is ERC20 {
    mapping(address => bool) private admins;
    mapping(address => bool) private blacklist;

    constructor(uint256 initialSupply) ERC20("Goose", "GOS") {
        _mint(msg.sender, initialSupply);
        admins[msg.sender] = true;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }

    modifier notInBlacklist(address user) {
        require(!blacklist[user], "Users in blacklist are banned");
        _;
    }

    function addAdmin(address newAdmin) public onlyAdmin {
        admins[newAdmin] = true;
    }

    function removeAdmin(address admin) public onlyAdmin {
        admins[admin] = false;
    }

    function addToBlacklist(address user) public onlyAdmin {
        require(!admins[user], "Cannot add admin to blacklist");
        blacklist[user] = true;
    }

    function removeFromBlacklist(address user) public onlyAdmin {
        blacklist[user] = false;
    }

    function mint(uint256 additionalSupply) public onlyAdmin {
        _mint(msg.sender, additionalSupply);
    }

    function burn(uint256 supplyToBurn) public onlyAdmin {
        uint256 balance = balanceOf(msg.sender);
        if (balance < supplyToBurn)
            revert ERC20InsufficientBalance(msg.sender, balance, supplyToBurn);

        _burn(msg.sender, supplyToBurn);
    }

    function _update(
        address from,
        address to,
        uint256 amount
    )
        internal
        virtual
        override
        notInBlacklist(from)
        notInBlacklist(to)
        notInBlacklist(msg.sender)
    {
        super._update(from, to, amount);
    }
}
