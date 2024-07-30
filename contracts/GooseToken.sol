// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GooseToken is ERC20 {
    mapping(address => bool) private admins;
    mapping(address => bool) private blacklist;

    constructor(
        uint256 initialSupply,
        address[] memory additionalAdmins
    ) ERC20("Goose", "GOS") {
        _mint(msg.sender, initialSupply);
        admins[msg.sender] = true;
        for (uint256 i = 0; i < additionalAdmins.length; i++) {
            admins[additionalAdmins[i]] = true;
        }
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admins have rights for this action");
        _;
    }

    modifier notInBlacklist(address user) {
        require(!blacklist[user], "Users in blacklist are banned");
        _;
    }

    function addAdmin(
        address newAdmin
    ) public onlyAdmin notInBlacklist(newAdmin) {
        require(!admins[newAdmin], "Cannot add admin to admin list");
        admins[newAdmin] = true;
    }

    function removeAdmin(address admin) public onlyAdmin {
        require(
            admins[admin],
            "Cannot remove user from admins if the user is not the admin"
        );
        admins[admin] = false;
    }

    function addToBlacklist(address user) public onlyAdmin {
        require(!admins[user], "Cannot add admin to blacklist");
        require(
            !blacklist[user],
            "Cannot add user to blacklist if the user is already there"
        );
        blacklist[user] = true;
    }

    function removeFromBlacklist(address user) public onlyAdmin {
        require(
            !blacklist[user],
            "Cannot remove user from blacklist that is not in there"
        );
        blacklist[user] = false;
    }

    function mint(
        address to,
        uint256 additionalSupply
    ) public onlyAdmin notInBlacklist(to) {
        _mint(to, additionalSupply);
    }

    function burn(uint256 supplyToBurn) public onlyAdmin {
        _burn(msg.sender, supplyToBurn);
    }

    function burnFrom(
        address from,
        uint256 supplyToBurn
    ) public onlyAdmin notInBlacklist(from) {
        _spendAllowance(from, msg.sender, supplyToBurn);
        _burn(from, supplyToBurn);
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
