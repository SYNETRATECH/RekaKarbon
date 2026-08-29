import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CARBON_TOKEN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const RekaKarbon = await ethers.getContractFactory("RekaKarbon");
  const rekaKarbon = RekaKarbon.attach(contractAddress);

  const seller = "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b";
  
  for (let i = 1; i <= 5; i++) {
     const bal = await (rekaKarbon as any).balanceOf(seller, i);
     console.log(`Balance of asset ${i} for seller: ${bal.toString()}`);
  }
}
main().catch(console.error);
