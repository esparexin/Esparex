# Query Layer Architecture (TanStack Query)

## Context
In our `frontend` App Router, we are standardizing on **TanStack Query (React Query)** for client-side data fetching, caching, and state synchronization.

Previously, components used manual `useEffect` + `useState` logic. PR-2 introduces a structured query layer inside `/src/queries` without refactoring existing components. **Future PRs** will migrate the components to use these hooks.

## Infrastructure

1. **`ReactQueryProvider`**: The root provider is already in `src/components/providers/ReactQueryProvider.tsx` with optimized defaults:
    - `staleTime: 5 minutes`
    - `retry: 1`
    - `refetchOnWindowFocus: false`
2. **`queryKeys.ts`**: The central registry of all query keys to prevent typos and fragmented caching strategies.
3. **Domain-Specific Query Hooks** e.g. `useAdsQuery.ts`, `useUserQuery.ts`, wrapping standard API calls.

## How to Create New Query Hooks

If you need to fetch new data (e.g. `getOffers()`), follow these steps:

**1. Create the Key in `queryKeys.ts`**
Always use arrays `['foo']` and strongly type any parameters like filters or IDs.

```ts
export const queryKeys = {
    // ...
    offers: {
        all: ['offers'] as const,
        list: (status: string) => [...queryKeys.offers.all, status] as const,
        detail: (id: string) => [...queryKeys.offers.all, 'detail', id] as const,
    }
}
```

**2. Create the Hook File `useOffersQuery.ts`**
Wrap the API function (which should exist in `src/api/...`). Use the keys from `queryKeys`.

```ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { getOffers } from '@/api/user/offers';

export const useOffersQuery = (status: string) => {
    return useQuery({
        queryKey: queryKeys.offers.list(status),
        queryFn: () => getOffers(status),
        staleTime: 5 * 60 * 1000 // Override if needed
    });
};
```

**3. Export from `index.ts`**
Keep the imports clean by re-exporting your hooks from `src/queries/index.ts`.

## How to Migrate Existing Components (Future Work)

Components currently using `useEffect` for fetching should be migrated to these hooks. 

**Old Code:**
```tsx
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    async function fetch() {
        const res = await getCategories();
        setData(res);
        setIsLoading(false);
    }
    fetch();
}, []);
```

**New Code:**
```tsx
import { useCategoriesQuery } from '@/queries';

function Component() {
    const { data, isLoading, isError, error } = useCategoriesQuery();

    if (isLoading) return <Loading />;
    if (isError) return <Error message={error.message} />;

    return <div>{/* render data format */}</div>;
}
```

## Rules
1. **No manual `refetch()` loops outside mutations**: Rely on cache invalidation `queryClient.invalidateQueries(queryKeys.ads.all)`.
2. **Never hardcode string keys**: Always use the `queryKeys` registry.
3. **API Logic stays in `src/api`**: The hooks should ONLY map the react-query lifecycle parameters, they should not do raw `fetch()` or normalization.
