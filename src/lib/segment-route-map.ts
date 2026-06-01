const routes: Record<string, (id: number) => { to: string; params: Record<string, string> }> = {
  producto:   (id: number) => ({ to: '/catalogo/$id',  params: { id: String(id) } }),
  movimiento: (id: number) => ({ to: '/movements/$id', params: { id: String(id) } }),
  cliente:    (id: number) => ({ to: '/clients/$id',   params: { id: String(id) } }),
  proveedor:  (id: number) => ({ to: '/suppliers/$id', params: { id: String(id) } }),
  usuario:    ()           => ({ to: '/settings',      params: {} }),
  equipo:     (id: number) => ({ to: '/equipos/$id',   params: { id: String(id) } }),
};

export function getSegmentoLink(tipo: string, id: number) {
  const fn = routes[tipo];
  return fn ? fn(id) : null;
}
