import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves the monorepo workspace root by locating pnpm-workspace.yaml or .git.
 * Walks upward from the provided starting directory until the workspace anchor is found.
 *
 * @param startDir The directory to begin searching from (defaults to __dirname)
 * @returns The absolute path to the workspace root directory
 */
export function findWorkspaceRoot(startDir: string = __dirname): string {
  let curr = startDir;
  while (curr !== path.dirname(curr)) {
    if (
      fs.existsSync(path.join(curr, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(curr, '.git'))
    ) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}
