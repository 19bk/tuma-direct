const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TumaDirect contracts...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy Treasury contract first
  console.log("\n📦 Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("MockTreasury");
  const treasury = await Treasury.deploy();
  await treasury.deployed();
  console.log("✅ Treasury deployed to:", treasury.address);

  // Deploy TumaDirectCore
  console.log("\n📦 Deploying TumaDirectCore...");
  const TumaDirectCore = await ethers.getContractFactory("TumaDirectCore");
  const core = await TumaDirectCore.deploy(treasury.address);
  await core.deployed();
  console.log("✅ TumaDirectCore deployed to:", core.address);

  // Deploy TumaDirectBridge
  console.log("\n📦 Deploying TumaDirectBridge...");
  const TumaDirectBridge = await ethers.getContractFactory("TumaDirectBridge");
  const bridge = await TumaDirectBridge.deploy(treasury.address);
  await bridge.deployed();
  console.log("✅ TumaDirectBridge deployed to:", bridge.address);

  // Deploy Mock USDC for testing
  console.log("\n📦 Deploying Mock USDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  console.log("✅ Mock USDC deployed to:", mockUSDC.address);

  // Deploy Mock cUSD for testing
  console.log("\n📦 Deploying Mock cUSD...");
  const MockCUSD = await ethers.getContractFactory("MockCUSD");
  const mockCUSD = await MockCUSD.deploy();
  await mockCUSD.deployed();
  console.log("✅ Mock cUSD deployed to:", mockCUSD.address);

  // Initialize contracts
  console.log("\n🔧 Initializing contracts...");

  // Set up currency contracts in core
  await core.addSupportedCurrency("USDC", mockUSDC.address);
  await core.addSupportedCurrency("CUSD", mockCUSD.address);
  console.log("✅ Currency contracts configured in core");

  // Set up network contracts in bridge
  await bridge.addSupportedNetwork("ethereum", mockUSDC.address);
  await bridge.addSupportedNetwork("polygon", mockCUSD.address);
  console.log("✅ Network contracts configured in bridge");

  // Transfer ownership to treasury
  await core.transferOwnership(treasury.address);
  await bridge.transferOwnership(treasury.address);
  console.log("✅ Ownership transferred to treasury");

  // Verify contracts on Etherscan (if not on localhost)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1337 && network.chainId !== 31337) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: treasury.address,
        constructorArguments: [],
      });
      console.log("✅ Treasury verified");
    } catch (error) {
      console.log("⚠️ Treasury verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: core.address,
        constructorArguments: [treasury.address],
      });
      console.log("✅ TumaDirectCore verified");
    } catch (error) {
      console.log("⚠️ TumaDirectCore verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: bridge.address,
        constructorArguments: [treasury.address],
      });
      console.log("✅ TumaDirectBridge verified");
    } catch (error) {
      console.log("⚠️ TumaDirectBridge verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: mockUSDC.address,
        constructorArguments: [],
      });
      console.log("✅ Mock USDC verified");
    } catch (error) {
      console.log("⚠️ Mock USDC verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: mockCUSD.address,
        constructorArguments: [],
      });
      console.log("✅ Mock cUSD verified");
    } catch (error) {
      console.log("⚠️ Mock cUSD verification failed:", error.message);
    }
  }

  // Print deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("Treasury:", treasury.address);
  console.log("TumaDirectCore:", core.address);
  console.log("TumaDirectBridge:", bridge.address);
  console.log("Mock USDC:", mockUSDC.address);
  console.log("Mock cUSD:", mockCUSD.address);
  console.log("========================");

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    treasury: treasury.address,
    core: core.address,
    bridge: bridge.address,
    mockUSDC: mockUSDC.address,
    mockCUSD: mockCUSD.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    `deployment-${network.chainId}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`📄 Deployment info saved to deployment-${network.chainId}.json`);

  return {
    treasury,
    core,
    bridge,
    mockUSDC,
    mockCUSD,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 