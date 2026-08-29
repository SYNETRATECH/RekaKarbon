import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CARBON_TOKEN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const RekaKarbon = await ethers.getContractFactory("RekaKarbon");
  const rekaKarbon = RekaKarbon.attach(contractAddress);

  const mockUsers = [
    "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b", // buyer
    "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", // seller
  ];

  for (const user of mockUsers) {
    console.log(`Minting 100,000,000 RKB to ${user}...`);
    const tx1 = await (rekaKarbon as any).mintWalletCredit(user, 100000000);
    await tx1.wait();
  }

  console.log(`Minting Carbon Token to Seller...`);
  const tx2 = await (rekaKarbon as any).mintOffsetCredit(mockUsers[1], 50000, "113.9213,-0.7893");
  await tx2.wait();
  
  for (let i = 0; i < 20; i++) {
     const tx3 = await (rekaKarbon as any).mintOffsetCredit(mockUsers[1], 50000, "0,0");
     await tx3.wait();
  }
  
  console.log("Done syncing mock data to blockchain.");
}

main().catch(console.error);
