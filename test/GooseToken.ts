import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("GooseToken", function () {
  async function deployToken() {
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const initialSupply = 10000000;
    const [owner, secondAdmin, user1, user2] = await hre.ethers.getSigners();

    const GooseToken = await hre.ethers.getContractFactory("GooseToken");
    const gooseToken = await GooseToken.deploy(initialSupply, [secondAdmin]);
    await gooseToken.waitForDeployment();

    return {
      gooseToken,
      user1,
      user2,
      secondAdmin,
      owner,
      initialSupply,
      ZERO_ADDRESS,
    };
  }

  describe("Deployment", function () {
    it("Should set the balance of owner to initial supply", async function () {
      const { gooseToken, owner, initialSupply } = await loadFixture(
        deployToken
      );

      expect(await gooseToken.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should make the owner an admin", async function () {
      const { gooseToken, owner } = await loadFixture(deployToken);

      await expect(gooseToken.addAdmin(owner.address)).to.be.revertedWith(
        "Cannot add admin to admin list"
      );
    });

    it("Should set the second admin", async function () {
      const { gooseToken, secondAdmin } = await loadFixture(deployToken);

      await expect(gooseToken.addAdmin(secondAdmin)).to.be.revertedWith(
        "Cannot add admin to admin list"
      );
    });
  });

  describe("Admin list", function () {
    describe("Adding admin", function () {
      it("Should add admin", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await expect(gooseToken.addAdmin(user1.address))
          .to.emit(gooseToken, "AdminAdded")
          .withArgs(user1.address);
      });

      it("Should not allow adding admin to admin list", async function () {
        const { gooseToken, secondAdmin } = await loadFixture(deployToken);

        await expect(
          gooseToken.addAdmin(secondAdmin.address)
        ).to.be.revertedWith("Cannot add admin to admin list");
      });

      it("Should not allow user to add admins", async function () {
        const { gooseToken, user1, user2 } = await loadFixture(deployToken);

        await expect(
          gooseToken.connect(user1).addAdmin(user2.address)
        ).to.be.revertedWith("Only admins have rights for this action");
      });

      it("Should not allow making admin from user from blacklist", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await gooseToken.addToBlacklist(user1.address);
        await expect(gooseToken.addAdmin(user1.address)).to.be.revertedWith(
          "Users in blacklist are banned"
        );
      });
    });

    describe("Removing admin", function () {
      it("Should not allow user remove admin", async function () {
        const { gooseToken, user1, secondAdmin } = await loadFixture(
          deployToken
        );

        await expect(
          gooseToken.connect(user1).removeAdmin(secondAdmin.address)
        ).to.be.revertedWith("Only admins have rights for this action");
      });

      it("Should not allow removing not admins from admin list", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await expect(gooseToken.removeAdmin(user1.address)).to.be.revertedWith(
          "Cannot remove user from admins if the user is not the admin"
        );
      });

      it("Should emit event on succesful admin removing", async function () {
        const { gooseToken, secondAdmin } = await loadFixture(deployToken);

        await expect(gooseToken.removeAdmin(secondAdmin.address))
          .to.emit(gooseToken, "AdminRemoved")
          .withArgs(secondAdmin.address);
      });
    });
  });

  describe("Blacklist", function () {
    describe("Adding to blacklist", function () {
      it("Should not allow not admin add users to blacklist", async function () {
        const { gooseToken, user1, user2 } = await loadFixture(deployToken);

        await expect(
          gooseToken.connect(user1).addToBlacklist(user2.address)
        ).to.be.revertedWith("Only admins have rights for this action");
      });

      it("Should not allow to add admin to blacklist", async function () {
        const { gooseToken, secondAdmin } = await loadFixture(deployToken);

        await expect(
          gooseToken.addToBlacklist(secondAdmin.address)
        ).to.be.revertedWith("Cannot add admin to blacklist");
      });

      it("Should not allow add user from blacklist to blacklist once more", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await gooseToken.addToBlacklist(user1.address);
        await expect(
          gooseToken.addToBlacklist(user1.address)
        ).to.be.revertedWith(
          "Cannot add user to blacklist if the user is already there"
        );
      });

      it("Should emit event on succesful adding user to blacklist", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await expect(gooseToken.addToBlacklist(user1.address))
          .to.emit(gooseToken, "AddedToBlacklist")
          .withArgs(user1.address);
      });
    });

    describe("Removing from blacklist", function () {
      it("Should not allow not admin remove anyone from blacklist", async function () {
        const { gooseToken, user1, user2 } = await loadFixture(deployToken);

        await gooseToken.addToBlacklist(user1.address);
        await expect(
          gooseToken.connect(user2).removeFromBlacklist(user1.address)
        ).to.be.revertedWith("Only admins have rights for this action");
      });

      it("Should not allow removing from blacklist user not in blacklist", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await expect(
          gooseToken.removeFromBlacklist(user1.address)
        ).to.be.revertedWith(
          "Cannot remove user from blacklist that is not in there"
        );
      });

      it("Should emit event on succesfull removal of user from blacklist", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await gooseToken.addToBlacklist(user1.address);
        await expect(gooseToken.removeFromBlacklist(user1.address))
          .to.emit(gooseToken, "RemovedFromBlacklist")
          .withArgs(user1.address);
      });
    });
  });

  describe("Minting token", function () {
    it("Should not allow minting if message sender is not an admin", async function () {
      const { gooseToken, user1 } = await loadFixture(deployToken);

      await expect(
        gooseToken.connect(user1).mint(user1.address, 1000)
      ).to.be.revertedWith("Only admins have rights for this action");
    });

    it("Should not allow minting to address from blacklist", async function () {
      const { gooseToken, user1 } = await loadFixture(deployToken);

      await gooseToken.addToBlacklist(user1.address);
      await expect(gooseToken.mint(user1.address, 1000)).to.be.revertedWith(
        "Users in blacklist are banned"
      );
    });

    it("Should emit transfer event on succesfull mint", async function () {
      const { gooseToken, user1, ZERO_ADDRESS } = await loadFixture(
        deployToken
      );

      await expect(gooseToken.mint(user1.address, 1000))
        .to.emit(gooseToken, "Transfer")
        .withArgs(ZERO_ADDRESS, user1.address, 1000);
      expect(await gooseToken.balanceOf(user1.address)).to.eq(1000);
    });
  });

  describe("Burning token", function () {
    describe("Function 'burn'", function () {
      it("Should not allow burning token for not admins", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await expect(gooseToken.connect(user1).burn(1000)).to.be.revertedWith(
          "Only admins have rights for this action"
        );
      });

      it("Should emit transfer event on succesfull token burning", async function () {
        const { gooseToken, initialSupply, owner, ZERO_ADDRESS } =
          await loadFixture(deployToken);

        await expect(gooseToken.burn(1000))
          .to.emit(gooseToken, "Transfer")
          .withArgs(owner.address, ZERO_ADDRESS, 1000);
        expect(await gooseToken.balanceOf(owner.address)).to.eq(
          initialSupply - 1000
        );
      });
    });

    describe("Function 'burnFrom'", function () {
      it("Should not allow burning token for not admins", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await expect(
          gooseToken.connect(user1).burnFrom(user1.address, 1000)
        ).to.be.revertedWith("Only admins have rights for this action");
      });

      it("Should not allow burning from user in blacklist", async function () {
        const { gooseToken, user1 } = await loadFixture(deployToken);

        await gooseToken.addToBlacklist(user1.address);
        await expect(
          gooseToken.burnFrom(user1.address, 1000)
        ).to.be.revertedWith("Users in blacklist are banned");
      });

      it("Should not allow burn token from user without sufficient allowance", async function () {
        const { gooseToken, owner, user1 } = await loadFixture(deployToken);

        const userAllowance = await gooseToken.allowance(
          owner.address,
          user1.address
        );
        await expect(gooseToken.burnFrom(user1.address, 1000))
          .to.be.revertedWithCustomError(
            gooseToken,
            "ERC20InsufficientAllowance"
          )
          .withArgs(owner.address, userAllowance, 1000);
      });

      it("Should emit transfer event on succesfull token burning", async function () {
        const { gooseToken, owner, ZERO_ADDRESS, user1 } = await loadFixture(
          deployToken
        );

        await gooseToken.connect(user1).approve(owner.address, 1000);
        await gooseToken.transfer(user1.address, 1000);
        await expect(gooseToken.burnFrom(user1.address, 1000))
          .to.emit(gooseToken, "Transfer")
          .withArgs(user1.address, ZERO_ADDRESS, 1000);
        expect(await gooseToken.balanceOf(user1.address)).to.eq(0);
      });
    });
  });
});
