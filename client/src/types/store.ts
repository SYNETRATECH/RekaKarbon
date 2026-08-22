/**
 * Re-exports store state types from the focused store slices.
 * The monolithic CarbonStoreState has been decomposed — import from the specific
 * store module that owns the state you need:
 *
 *   - Auth/session state   → useAuthStore (store/useAuthStore.ts)
 *   - Map/spatial state    → useMapStore  (store/useMapStore.ts)
 *   - UI/drawer/modal state → useUIStore  (store/useUIStore.ts)
 */
export type { AuthStoreState, ClientUserRole, UserProfile } from '../store/useAuthStore';
export type { UIStoreState } from '../store/useUIStore';
export type { MapStoreState } from '../store/useMapStore';

// Verichain explorer search result shape (kept for the public landing page)
export interface SearchedTxData {
  item: any;
  type: 'vendor' | 'tokenBuyer';
  project: any;
}
