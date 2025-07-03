const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TumaDirect", function () {
  let treasury, core, bridge, mockUSDC, mockCUSD;
  let owner, user1, user2, user3;
  let treasuryAddress, coreAddress, bridgeAddress;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock contracts
    const MockTreasury = await ethers.getContractFactory("MockTreasury");
    treasury = await MockTreasury.deploy();
    await treasury.deployed();
    treasuryAddress = treasury.address;

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();

    const MockCUSD = await ethers.getContractFactory("MockCUSD");
    mockCUSD = await MockCUSD.deploy();
    await mockCUSD.deployed();

    // Deploy main contracts
    const TumaDirectCore = await ethers.getContractFactory("TumaDirectCore");
    core = await TumaDirectCore.deploy(treasuryAddress);
    await core.deployed();
    coreAddress = core.address;

    const TumaDirectBridge = await ethers.getContractFactory("TumaDirectBridge");
    bridge = await TumaDirectBridge.deploy(treasuryAddress);
    await bridge.deployed();
    bridgeAddress = bridge.address;

    // Initialize contracts
    await core.addSupportedCurrency("USDC", mockUSDC.address);
    await core.addSupportedCurrency("CUSD", mockCUSD.address);
    await bridge.addSupportedNetwork("ethereum", mockUSDC.address);
    await bridge.addSupportedNetwork("polygon", mockCUSD.address);

    // Transfer ownership to treasury
    await core.transferOwnership(treasuryAddress);
    await bridge.transferOwnership(treasuryAddress);

    // Mint tokens to users for testing
    await mockUSDC.mint(user1.address, ethers.utils.parseUnits("1000", 6));
    await mockUSDC.mint(user2.address, ethers.utils.parseUnits("1000", 6));
    await mockCUSD.mint(user1.address, ethers.utils.parseUnits("1000", 18));
    await mockCUSD.mint(user2.address, ethers.utils.parseUnits("1000", 18));
  });

  describe("TumaDirectCore", function () {
    describe("Deployment", function () {
      it("Should set the right treasury", async function () {
        expect(await core.treasury()).to.equal(treasuryAddress);
      });

      it("Should set initial transaction fee", async function () {
        expect(await core.transactionFee()).to.equal(50); // 0.5%
      });

      it("Should set initial limits", async function () {
        expect(await core.minTransactionAmount()).to.equal(100);
        expect(await core.maxTransactionAmount()).to.equal(1000000);
      });

      it("Should support initial currencies", async function () {
        expect(await core.supportedCurrencies("KES")).to.be.true;
        expect(await core.supportedCurrencies("USDC")).to.be.true;
        expect(await core.supportedCurrencies("CUSD")).to.be.true;
        expect(await core.supportedCurrencies("ETH")).to.be.true;
        expect(await core.supportedCurrencies("MATIC")).to.be.true;
      });
    });

    describe("Transaction Management", function () {
      it("Should initiate a transaction successfully", async function () {
        const amount = ethers.utils.parseUnits("100", 6); // 100 USDC
        const tx = await core.connect(user1).initiateTransaction(
          amount,
          "USDC",
          "KES",
          0 // ONRAMP
        );

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "TransactionInitiated");
        
        expect(event).to.not.be.undefined;
        expect(event.args.user).to.equal(user1.address);
        expect(event.args.amount).to.equal(amount);
        expect(event.args.currency).to.equal("USDC");
        expect(event.args.transactionType).to.equal(0); // ONRAMP
      });

      it("Should calculate fees correctly", async function () {
        const amount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
        const fee = (amount * 50) / 10000; // 0.5% fee
        const netAmount = amount - fee;

        const tx = await core.connect(user1).initiateTransaction(
          amount,
          "USDC",
          "KES",
          0 // ONRAMP
        );

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "TransactionInitiated");
        const transactionId = event.args.transactionId;

        const transaction = await core.getTransaction(transactionId);
        expect(transaction.feeAmount).to.equal(fee);
        expect(transaction.netAmount).to.equal(netAmount);
      });

      it("Should reject transactions below minimum amount", async function () {
        const amount = 50; // Below minimum of 100
        await expect(
          core.connect(user1).initiateTransaction(amount, "USDC", "KES", 0)
        ).to.be.revertedWith("TumaDirect: Amount too small");
      });

      it("Should reject transactions above maximum amount", async function () {
        const amount = 2000000; // Above maximum of 1M
        await expect(
          core.connect(user1).initiateTransaction(amount, "USDC", "KES", 0)
        ).to.be.revertedWith("TumaDirect: Amount too large");
      });

      it("Should reject unsupported currencies", async function () {
        const amount = ethers.utils.parseUnits("100", 6);
        await expect(
          core.connect(user1).initiateTransaction(amount, "INVALID", "KES", 0)
        ).to.be.revertedWith("TumaDirect: Currency not supported");
      });
    });

    describe("Transaction Processing", function () {
      let transactionId;

      beforeEach(async function () {
        const amount = ethers.utils.parseUnits("100", 6);
        const tx = await core.connect(user1).initiateTransaction(
          amount,
          "USDC",
          "KES",
          0 // ONRAMP
        );
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "TransactionInitiated");
        transactionId = event.args.transactionId;
      });

      it("Should process transaction successfully", async function () {
        const externalRef = "MPESA_REF_123";
        const tx = await treasury.connect(owner).processTransaction(transactionId, externalRef);

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "TransactionCompleted");
        
        expect(event).to.not.be.undefined;
        expect(event.args.user).to.equal(user1.address);
        expect(event.args.transactionType).to.equal(0); // ONRAMP

        const transaction = await core.getTransaction(transactionId);
        expect(transaction.status).to.equal(2); // COMPLETED
        expect(transaction.externalReference).to.equal(externalRef);
        expect(transaction.isProcessed).to.be.true;
      });

      it("Should fail transaction", async function () {
        const reason = "Insufficient funds";
        const tx = await treasury.connect(owner).failTransaction(transactionId, reason);

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "TransactionFailed");
        
        expect(event).to.not.be.undefined;
        expect(event.args.reason).to.equal(reason);

        const transaction = await core.getTransaction(transactionId);
        expect(transaction.status).to.equal(3); // FAILED
      });

      it("Should allow user to cancel transaction", async function () {
        const tx = await core.connect(user1).cancelTransaction(transactionId);

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "TransactionFailed");
        
        expect(event).to.not.be.undefined;
        expect(event.args.reason).to.equal("Cancelled by user");

        const transaction = await core.getTransaction(transactionId);
        expect(transaction.status).to.equal(4); // CANCELLED
      });
    });

    describe("Admin Functions", function () {
      it("Should update transaction fee", async function () {
        const newFee = 75; // 0.75%
        await treasury.connect(owner).updateTransactionFee(newFee);
        expect(await core.transactionFee()).to.equal(newFee);
      });

      it("Should reject fee above maximum", async function () {
        const newFee = 600; // 6% > 5% max
        await expect(
          treasury.connect(owner).updateTransactionFee(newFee)
        ).to.be.revertedWith("TumaDirect: Fee too high");
      });

      it("Should update limits", async function () {
        const newMin = 200;
        const newMax = 2000000;
        await treasury.connect(owner).updateLimits(newMin, newMax);
        
        expect(await core.minTransactionAmount()).to.equal(newMin);
        expect(await core.maxTransactionAmount()).to.equal(newMax);
      });

      it("Should add supported currency", async function () {
        const newCurrency = "EUR";
        const newContract = "0x1234567890123456789012345678901234567890";
        
        await treasury.connect(owner).addSupportedCurrency(newCurrency, newContract);
        expect(await core.supportedCurrencies(newCurrency)).to.be.true;
        expect(await core.currencyContracts(newCurrency)).to.equal(newContract);
      });
    });

    describe("View Functions", function () {
      it("Should return user transactions", async function () {
        const amount = ethers.utils.parseUnits("100", 6);
        await core.connect(user1).initiateTransaction(amount, "USDC", "KES", 0);
        await core.connect(user1).initiateTransaction(amount, "USDC", "CUSD", 2); // SWAP

        const userTxs = await core.getUserTransactions(user1.address);
        expect(userTxs.length).to.equal(2);
      });

      it("Should return transaction count", async function () {
        expect(await core.getTransactionCount()).to.equal(0);
        
        const amount = ethers.utils.parseUnits("100", 6);
        await core.connect(user1).initiateTransaction(amount, "USDC", "KES", 0);
        
        expect(await core.getTransactionCount()).to.equal(1);
      });
    });
  });

  describe("TumaDirectBridge", function () {
    describe("Deployment", function () {
      it("Should set the right treasury", async function () {
        expect(await bridge.treasury()).to.equal(treasuryAddress);
      });

      it("Should set initial bridge fee", async function () {
        expect(await bridge.bridgeFee()).to.equal(25); // 0.25%
      });

      it("Should set initial bridge limits", async function () {
        expect(await bridge.minBridgeAmount()).to.equal(1000);
        expect(await bridge.maxBridgeAmount()).to.equal(10000000);
      });

      it("Should support initial networks", async function () {
        expect(await bridge.supportedNetworks("ethereum")).to.be.true;
        expect(await bridge.supportedNetworks("polygon")).to.be.true;
        expect(await bridge.supportedNetworks("aleo")).to.be.true;
        expect(await bridge.supportedNetworks("mpesa")).to.be.true;
      });
    });

    describe("Bridge Operations", function () {
      it("Should initiate bridge successfully", async function () {
        const amount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
        
        // Approve bridge to spend tokens
        await mockUSDC.connect(user1).approve(bridgeAddress, amount);
        
        const tx = await bridge.connect(user1).initiateBridge(
          amount,
          "ethereum",
          "polygon",
          "USDC"
        );

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "BridgeInitiated");
        
        expect(event).to.not.be.undefined;
        expect(event.args.user).to.equal(user1.address);
        expect(event.args.amount).to.equal(amount);
        expect(event.args.sourceNetwork).to.equal("ethereum");
        expect(event.args.targetNetwork).to.equal("polygon");
        expect(event.args.currency).to.equal("USDC");
      });

      it("Should reject bridge with same network", async function () {
        const amount = ethers.utils.parseUnits("1000", 6);
        await mockUSDC.connect(user1).approve(bridgeAddress, amount);
        
        await expect(
          bridge.connect(user1).initiateBridge(amount, "ethereum", "ethereum", "USDC")
        ).to.be.revertedWith("TumaDirectBridge: Same network");
      });

      it("Should reject unsupported network pair", async function () {
        const amount = ethers.utils.parseUnits("1000", 6);
        await mockUSDC.connect(user1).approve(bridgeAddress, amount);
        
        await expect(
          bridge.connect(user1).initiateBridge(amount, "aleo", "mpesa", "USDC")
        ).to.be.revertedWith("TumaDirectBridge: Network pair not supported");
      });

      it("Should reject bridge below minimum amount", async function () {
        const amount = 500; // Below minimum of 1000
        await mockUSDC.connect(user1).approve(bridgeAddress, amount);
        
        await expect(
          bridge.connect(user1).initiateBridge(amount, "ethereum", "polygon", "USDC")
        ).to.be.revertedWith("TumaDirectBridge: Bridge amount too small");
      });
    });

    describe("Bridge Processing", function () {
      let bridgeId;

      beforeEach(async function () {
        const amount = ethers.utils.parseUnits("1000", 6);
        await mockUSDC.connect(user1).approve(bridgeAddress, amount);
        
        const tx = await bridge.connect(user1).initiateBridge(
          amount,
          "ethereum",
          "polygon",
          "USDC"
        );
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "BridgeInitiated");
        bridgeId = event.args.bridgeId;
      });

      it("Should complete bridge successfully", async function () {
        const externalRef = "BRIDGE_REF_123";
        const tx = await treasury.connect(owner).completeBridge(bridgeId, externalRef);

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "BridgeCompleted");
        
        expect(event).to.not.be.undefined;
        expect(event.args.user).to.equal(user1.address);

        const bridgeRequest = await bridge.getBridgeRequest(bridgeId);
        expect(bridgeRequest.status).to.equal(2); // COMPLETED
        expect(bridgeRequest.externalReference).to.equal(externalRef);
        expect(bridgeRequest.isCompleted).to.be.true;
      });

      it("Should fail bridge", async function () {
        const reason = "Network congestion";
        const tx = await treasury.connect(owner).failBridge(bridgeId, reason);

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "BridgeFailed");
        
        expect(event).to.not.be.undefined;
        expect(event.args.reason).to.equal(reason);

        const bridgeRequest = await bridge.getBridgeRequest(bridgeId);
        expect(bridgeRequest.status).to.equal(3); // FAILED
      });

      it("Should allow user to cancel bridge", async function () {
        const tx = await bridge.connect(user1).cancelBridge(bridgeId);

        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "BridgeFailed");
        
        expect(event).to.not.be.undefined;
        expect(event.args.reason).to.equal("Cancelled by user");

        const bridgeRequest = await bridge.getBridgeRequest(bridgeId);
        expect(bridgeRequest.status).to.equal(4); // CANCELLED
      });
    });

    describe("Admin Functions", function () {
      it("Should update bridge fee", async function () {
        const newFee = 50; // 0.5%
        await treasury.connect(owner).updateBridgeFee(newFee);
        expect(await bridge.bridgeFee()).to.equal(newFee);
      });

      it("Should reject bridge fee above maximum", async function () {
        const newFee = 300; // 3% > 2.5% max
        await expect(
          treasury.connect(owner).updateBridgeFee(newFee)
        ).to.be.revertedWith("TumaDirectBridge: Bridge fee too high");
      });

      it("Should add network pair", async function () {
        await treasury.connect(owner).addNetworkPair("aleo", "mpesa");
        expect(await bridge.isNetworkPairSupported("aleo", "mpesa")).to.be.true;
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete onramp flow", async function () {
      // 1. User initiates onramp
      const amount = ethers.utils.parseUnits("100", 6);
      const tx1 = await core.connect(user1).initiateTransaction(
        amount,
        "USDC",
        "KES",
        0 // ONRAMP
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1.events.find(e => e.event === "TransactionInitiated");
      const transactionId = event1.args.transactionId;

      // 2. Process transaction
      await treasury.connect(owner).processTransaction(transactionId, "MPESA_REF_123");

      // 3. Verify completion
      const transaction = await core.getTransaction(transactionId);
      expect(transaction.status).to.equal(2); // COMPLETED
      expect(transaction.isProcessed).to.be.true;
    });

    it("Should handle complete bridge flow", async function () {
      // 1. User initiates bridge
      const amount = ethers.utils.parseUnits("1000", 6);
      await mockUSDC.connect(user1).approve(bridgeAddress, amount);
      
      const tx1 = await bridge.connect(user1).initiateBridge(
        amount,
        "ethereum",
        "polygon",
        "USDC"
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1.events.find(e => e.event === "BridgeInitiated");
      const bridgeId = event1.args.bridgeId;

      // 2. Complete bridge
      await treasury.connect(owner).completeBridge(bridgeId, "BRIDGE_REF_123");

      // 3. Verify completion
      const bridgeRequest = await bridge.getBridgeRequest(bridgeId);
      expect(bridgeRequest.status).to.equal(2); // COMPLETED
      expect(bridgeRequest.isCompleted).to.be.true;
    });
  });
}); 