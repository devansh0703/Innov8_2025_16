const { ethers } = require("hardhat");
const path = require("path");
require("dotenv").config();

async function main() {
  // Obtain the deployer account dynamically
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying contracts with account:", deployerAddress);

  // Retrieve deployer's balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Account balance:", balance.toString());

  // Read deployment parameters from environment variables
  const sellerAddress = process.env.SELLER_ADDRESS;
  const arbitratorAddress = process.env.ARBITRATOR_ADDRESS;
  const feePercentage = Number(process.env.FEE_PERCENTAGE);
  const disputeTimeout = Number(process.env.DISPUTE_TIMEOUT);
  const depositAmountString = process.env.DEPOSIT_AMOUNT;
  
  if (!depositAmountString) {
    throw new Error("DEPOSIT_AMOUNT is not set in environment variables");
  }
  
  // In ethers v6, use ethers.parseEther directly
  const depositAmount = ethers.parseEther(depositAmountString);

  if (!sellerAddress || !arbitratorAddress || !feePercentage || !disputeTimeout) {
    throw new Error("Missing deployment parameters in environment variables");
  }

  // Get the contract factory for ComplexEscrow
  const ComplexEscrow = await ethers.getContractFactory("ComplexEscrow");

  // Deploy the contract using environment variables (buyer is the deployer)
  const escrow = await ComplexEscrow.deploy(
    sellerAddress,
    arbitratorAddress,
    feePercentage,
    disputeTimeout,
    { value: depositAmount }
  );
  await escrow.waitForDeployment();

  console.log("ComplexEscrow contract deployed at:", escrow.target);

  // Save contract artifacts and address for frontend integration
  saveFrontendFiles(escrow);
}

function saveFrontendFiles(escrow) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ ComplexEscrow: escrow.target }, null, 2)
  );
  const ComplexEscrowArtifact = artifacts.readArtifactSync("ComplexEscrow");
  fs.writeFileSync(
    path.join(contractsDir, "ComplexEscrow.json"),
    JSON.stringify(ComplexEscrowArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

