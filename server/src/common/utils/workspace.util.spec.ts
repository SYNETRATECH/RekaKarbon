import * as fs from 'fs';
import * as path from 'path';
import { findWorkspaceRoot } from './workspace.util';

describe('findWorkspaceRoot', () => {
  it('should locate the workspace root containing pnpm-workspace.yaml', () => {
    const root = findWorkspaceRoot(__dirname);
    expect(root).toBeDefined();
    expect(fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))).toBe(true);
  });

  it('should locate workspace root when called without arguments', () => {
    const root = findWorkspaceRoot();
    expect(root).toBeDefined();
    expect(fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))).toBe(true);
  });
});
