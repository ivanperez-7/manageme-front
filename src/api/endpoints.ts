export const API_BASE = import.meta.env.VITE_API_URL;

type IdLike = string | number;
export const ENDPOINTS = {
  auth: {
    login: '/token/',
    refresh: '/token/refresh/',
    logout: '/logout/',
    me: '/me/',
  },
  clientes: {
    list: '/organizacion/clientes/',
    detail: (id: IdLike) => `/organizacion/clientes/${id}/`,
  },
  users: {
    list: '/organizacion/users/',
  },
  dashboard: '/productos/dashboard/',
  rendimiento: '/productos/rendimiento/',
  products: {
    list: '/productos/productos/',
    detail: (id: IdLike) => `/productos/productos/${id}/`,
    exportExistencias: '/productos/exportar/existencias/',
    exportRendimiento: '/productos/exportar/rendimiento/',
  },
  lotes: {
    list: '/productos/lotes/',
    detail: (id: IdLike) => `/productos/lotes/${id}/`,
  },
  categorias: {
    list: '/productos/categorias/',
  },
  marcas: {
    list: '/productos/marcas/',
    detail: (id: IdLike) => `/productos/marcas/${id}/`,
  },
  equipos: {
    list: '/productos/equipos/',
    detail: (id: IdLike) => `/productos/equipos/${id}/`,
    clientes: (id: IdLike) => `/productos/equipos/${id}/clientes/`,
    stats: (id: IdLike) => `/productos/equipos/${id}/stats/`,
  },
  proveedores: {
    list: '/productos/proveedores/',
    detail: (id: IdLike) => `/productos/proveedores/${id}/`,
  },
  movimientos: {
    list: '/movimientos/movimientos/',
    detail: (id: IdLike) => `/movimientos/movimientos/${id}/`,
    etiquetas: (id: IdLike) => `/movimientos/movimientos/${id}/etiquetas/`,
    exportMovimientos: '/movimientos/movimientos/exportar/',
  },
  sysvars: {
    list: '/system/configuracion/',
    detail: (id: IdLike) => `/system/configuracion/${id}/`,
  },
  system: {
    actividades: '/system/actividades/',
    alertas: '/system/alertas/',
    alertaDetail: (id: IdLike) => `/system/alertas/${id}/`,
    alertasRefrescar: '/system/alertas/refrescar/',
  },
  sucursales: {
    list: '/organizacion/sucursales/',
  },
  chat: '/chat/',
  reorden: {
    sugerencias: '/productos/reorden/',
    exportReorden: '/productos/exportar/reorden/',
  },
} as const;
