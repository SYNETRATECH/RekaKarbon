/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */
/**
 * Jest test environment setup for @rekakarbon/server.
 *
 * Prevents onnxruntime-node native C++ addon from re-registering environment cleanup hooks
 * across multiple Jest test suites running within the same worker thread in Node.js 22+.
 */
interface OrtNativeBinding {
  initOrtOnce?: (...args: unknown[]) => unknown;
}

interface OrtBindingModule {
  binding?: OrtNativeBinding;
}

try {
  const bindingMod: OrtBindingModule = require('onnxruntime-node/dist/binding');
  const processKey = Symbol.for('__REKAKARBON_ORT_INITIALIZED__');
  const proc = process as unknown as Record<symbol, boolean | undefined>;

  if (proc[processKey]) {
    // Native binding already initialized in this worker thread.
    // Suppress redundant C++ initOrtOnce call to prevent napi_add_env_cleanup_hook assertion abort.
    if (
      bindingMod.binding &&
      typeof bindingMod.binding.initOrtOnce === 'function'
    ) {
      bindingMod.binding.initOrtOnce = () => undefined;
    }
  } else {
    // Intercept the first call so we mark process[processKey] when it executes
    const originalInitOrtOnce = bindingMod.binding?.initOrtOnce;
    if (typeof originalInitOrtOnce === 'function' && bindingMod.binding) {
      bindingMod.binding.initOrtOnce = function (
        this: unknown,
        ...args: unknown[]
      ): unknown {
        proc[processKey] = true;
        return originalInitOrtOnce.apply(this, args);
      };
    }
  }
} catch {
  // Ignore if onnxruntime-node native binding is not available in environment
}
