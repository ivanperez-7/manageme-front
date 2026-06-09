import { useQueries, useQueryClient } from '@tanstack/react-query';

import { catalogFetchers, CATALOG_KEYS, type CatalogKey, type CatalogsData } from '@/api/catalogo';

export function useCatalogs() {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: CATALOG_KEYS.map((key) => ({
      queryKey: ['catalogs', key],
      queryFn: catalogFetchers[key],
    })),
  });

  const data = Object.fromEntries(
    CATALOG_KEYS.map((key, i) => [key, results[i].data ?? []])
  ) as CatalogsData;

  /** Refetch the given catalogs (defaults to all). */
  const reloadCatalogs = (keys: CatalogKey[] = CATALOG_KEYS) =>
    Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: ['catalogs', key] }))
    ).then(() => undefined);

  /** True if any of the given catalogs is loading (no args = any catalog). */
  const isLoading = (...keys: CatalogKey[]) => {
    const target = keys.length ? keys : CATALOG_KEYS;
    return target.some((key) => results[CATALOG_KEYS.indexOf(key)].isLoading);
  };

  return { ...data, reloadCatalogs, isLoading };
}
