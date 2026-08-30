import { ethers } from 'hardhat';
async function main() {
  const contractAddress =
    process.env.CARBON_TOKEN_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const RekaKarbon = await ethers.getContractFactory('RekaKarbon');
  const rekaKarbon = RekaKarbon.attach(contractAddress);
  const mockUsers = [
    '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b', // buyer
    '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', // seller
  ];
  for (const user of mockUsers) {
    console.log(`Minting 10,000,000,000 RKB to ${user}...`);
    const tx = await (rekaKarbon as any).mintWalletCredit(user, 10000000000);
    await tx.wait();
  }
}
main().catch(console.error);
