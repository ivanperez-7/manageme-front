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
    detail: (id: IdLike) => `/organizacion/users/${id}/`,
  },
  dashboard: '/productos/dashboard/',
  products: {
    list: '/productos/productos/',
    detail: (id: IdLike) => `/productos/productos/${id}/`,
  },
  lotes: {
    list: '/productos/lotes/',
    detail: (id: IdLike) => `/productos/lotes/${id}/`,
  },
  categorias: {
    list: '/productos/categorias/',
    detail: (id: IdLike) => `/productos/categorias/${id}/`,
  },
  marcas: {
    list: '/productos/marcas/',
    detail: (id: IdLike) => `/productos/marcas/${id}/`,
  },
  equipos: {
    list: '/productos/equipos/',
    detail: (id: IdLike) => `/productos/equipos/${id}/`,
  },
  proveedores: {
    list: '/productos/proveedores/',
    detail: (id: IdLike) => `/productos/proveedores/${id}/`,
  },
  movimientos: {
    list: '/movimientos/movimientos/',
    detail: (id: IdLike) => `/movimientos/movimientos/${id}/`,
  },
  sysvars: {
    list: '/system/configuracion/',
    detail: (id: IdLike) => `/system/configuracion/${id}/`,
  },
  sucursales: {
    list: '/organizacion/sucursales/',
    detail: (id: IdLike) => `/organizacion/sucursales/${id}/`,
  },
  chat: '/chat/',
} as const;
