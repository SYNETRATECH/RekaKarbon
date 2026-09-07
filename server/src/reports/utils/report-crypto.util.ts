import { BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';

export function generateMerkleRoot(dataObj: Record<string, unknown>): string {
  try {
    const leaves = Object.keys(dataObj)
      .sort()
      .map((key) =>
        ethers.keccak256(
          ethers.toUtf8Bytes(`${key}:${JSON.stringify(dataObj[key])}`),
        ),
      );

    let root = leaves.length > 0 ? leaves[0] : ethers.ZeroHash;
    for (let i = 1; i < leaves.length; i++) {
      const pair = [root, leaves[i]].sort();
      root = ethers.keccak256(ethers.concat(pair));
    }
    return root;
  } catch {
    throw new BadRequestException('Invalid JSON report data');
  }
}
