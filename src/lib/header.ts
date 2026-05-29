import type { AnyRouteMatch } from '@tanstack/router-core';

export type BreadcrumbItem = { label: string; to?: string };

declare module '@tanstack/router-core' {
  interface StaticDataRouteOption {
    headerBreadcrumb?: BreadcrumbItem[] | ((match: AnyRouteMatch) => BreadcrumbItem[]);
  }
}

export function resolveHeaderBreadcrumb(match: AnyRouteMatch | undefined): BreadcrumbItem[] {
  const config = match?.staticData?.headerBreadcrumb;
  if (!config) return [];
  return typeof config === 'function' ? config(match as AnyRouteMatch) : config;
}
