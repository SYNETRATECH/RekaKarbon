---
name: react-performance
description: >
  React 19 performance optimization for RekaKarbon client.
  Covers state memoization, deferred spatial rendering, map/geodetic computation efficiency,
  re-render prevention in Zustand stores, and Recharts performance tuning.
---

# React Performance Optimization (RekaKarbon Client)

Use this skill when optimizing existing UI components, rendering map overlays, performing geodetic computations, or handling real-time carbon data streams.

---

## 1 — Spatial & Geodetic Calculation Performance

- **Pre-calculate & Memoize Geodetics**: Heavy spatial boundary calculations from [`geodetics.js`](../../../client/src/utils/geodetics.js) (area, perimeter, carbon density) MUST be wrapped with `useMemo`.

```tsx
// GOOD: Memoized geodetic spatial computation
const polygonArea = useMemo(() => {
  if (!coordinates || coordinates.length < 3) return 0;
  return calculateGeodeticArea(coordinates);
}, [coordinates]);
```

- **Throttling Map Layer Redraws**: Map layer markers and polygon overlays (Leaflet / Mapbox) should update using `useDeferredValue` or debounced state to maintain fluid 60fps frame rates.

---

## 2 — Memoization Decision Guide

### 2.1 React.memo for Map & Chart Components

Wrap heavy Leaflet map overlays, interactive carbon gauge charts, and large data tables with `React.memo`.

```tsx
// GOOD: Heavy chart component memoized with stable props
export const EmissionTrendChart = React.memo(function EmissionTrendChart({
  data,
}: {
  data: CarbonData[];
}) {
  return <ResponsiveContainer>...</ResponsiveContainer>;
});
```

### 2.2 Zustand Selector Optimization

Avoid subscribing components to the entire Zustand state object (`useCarbonStore()`). Use fine-grained selectors to prevent full-tree re-renders on minor state updates.

```tsx
// BAD: Re-renders component whenever ANYTHING in Zustand changes
const store = useCarbonStore();

// GOOD: Subscribes ONLY to specific feature state
const carbonCredits = useCarbonStore((state) => state.carbonCredits);
const fetchCredits = useCarbonStore((state) => state.fetchCredits);
```

---

## 3 — Deferred Values & Non-Blocking Transitions

### 3.1 useDeferredValue for Heavy Filters

When filtering large datasets (e.g. historical carbon offset logs or spatial project lists):

```tsx
function CarbonLogTable({ logs, searchFilter }) {
  const deferredFilter = useDeferredValue(searchFilter);
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => log.title.includes(deferredFilter));
  }, [logs, deferredFilter]);

  return <Table data={filteredLogs} />;
}
```

### 3.2 Non-Blocking Route & Tab Switches

Use `useTransition` when switching heavy views (e.g. switching between Satellite Map mode and Emission Analytics):

```tsx
const [isPending, startTransition] = useTransition();

const handleTabChange = (nextTab) => {
  startTransition(() => {
    setActiveTab(nextTab);
  });
};
```

---

## 4 — Verification & Profiling Workflow

1. Run `pnpm client:build` to analyze static bundle output.
2. Use React DevTools Profiler to inspect re-render flamegraphs on key pages (Dashboard, Map Explorer, Audit Log).
3. Verify that `pnpm client:test` passes without performance regression.
