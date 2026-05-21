import * as z from 'zod';

// ── Cliente ──
export const clienteCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  tipo: z.enum(['fisica', 'moral']).default('fisica'),
  rfc: z.string().max(13).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  email: z.email('Email inválido').optional().nullable(),
  direccion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

export const clienteResponseSchema = clienteCreateSchema.extend({
  id: z.number(),
});

export type ClienteCreate = z.infer<typeof clienteCreateSchema>;
export type ClienteResponse = z.infer<typeof clienteResponseSchema>;

// ── Categoria ──
export type CategoriaResponse = {
  nombre: string;
  descripcion: string | null | undefined;
  id: number;
};

// ── Marca ──
export type MarcaResponse = {
  nombre: string;
  activo: boolean;
  id: number;
};

// ── Equipo ──
export type EquipoResponse = {
  nombre: string;
  activo: boolean;
  id: number;
  marca: MarcaResponse;
};

// ── Proveedor ──
export type ProveedorResponse = {
  nombre: string;
  nombre_contacto: string | null | undefined;
  telefono: string | null | undefined;
  correo: string | null | undefined;
  direccion: string | null | undefined;
  activo: boolean;
  id: number;
};

// ── Producto (keep zod schema) ──
export const productoCreateSchema = z.object({
  codigo_interno: z.string().min(1, 'El código interno es obligatorio').max(50, 'Máximo 50 caracteres'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  categoria_id: z.number('La categoría es obligatoria'),
  equipos_id: z.array(z.number()),
  min_stock: z.number(),
  proveedor_id: z.number().nullable(),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  status: z.enum(['activo', 'inactivo']),
});
type ProductoCreate = z.infer<typeof productoCreateSchema>;

export type ProductoResponse = ProductoCreate & {
  id: number;
  cantidad_disponible: number;
  categoria: CategoriaResponse;
  equipos: EquipoResponse[];
  proveedor: ProveedorResponse | undefined;
  creado: string;
  actualizado: string;
};

// ── Lote ──
export type LoteResponse = {
  codigo_lote: string;
  cantidad_inicial: number;
  cantidad_restante: number;
  fecha_entrada: string | undefined;
  id: number;
  creado: string;
  actualizado: string;
  producto: Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion' | 'equipos'>;
};

// ── Usuario / Perfil ──
export type UserResponse = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  profile: {
    id: number;
    rol: 'admin' | 'operativo' | 'consulta';
    telefono: string | null;
    avatar: string | null;
    sucursales: number[];
  } | null;
};

// ── MovimientoItem (keep zod schema) ──
export const movimientoItemCreateSchema = z.object({
  producto_id: z.number(),
  cantidad: z.number().min(1),
  lote_id: z.number().optional(),
  equipo_cliente_id: z.number().optional(),
});

// ── DetalleEntrada (keep zod schema) ──
export const detalleEntradaCreateSchema = z.object({
  numero_factura: z.string().min(3, 'El número de factura es obligatorio'),
  recibido_por_id: z.number().gt(0, 'Seleccione un usuario válido'),
});

// ── DetalleSalida (keep zod schema) ──
export const detalleSalidaCreateSchema = z.object({
  cliente_id: z.number().gt(0, 'Seleccione un cliente válido'),
  tecnico: z.string().nullable().optional(),
});

// ── Movimiento (keep zod schema) ──
export const movimientoCreateSchema = z
  .object({
    tipo: z.enum(['entrada', 'salida']),
    items: z.array(movimientoItemCreateSchema).min(1),
    detalle_entrada: detalleEntradaCreateSchema.optional().nullable(),
    detalle_salida: detalleSalidaCreateSchema.optional().nullable(),
    comentarios: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'entrada' && !data.detalle_entrada) {
      ctx.addIssue({
        code: 'custom',
        message: 'Detalle de entrada requerido',
        path: ['detalle_entrada'],
      });
    }
    if (data.tipo === 'salida' && !data.detalle_salida) {
      ctx.addIssue({
        code: 'custom',
        message: 'Detalle de salida requerido',
        path: ['detalle_salida'],
      });
    }
  });

export type MovimientoCreate = z.infer<typeof movimientoCreateSchema>;

export type MovimientoItemResponse = {
  producto_id: number;
  cantidad: number;
  lote_id?: number | undefined;
  equipo_cliente_id?: number | undefined;
  id: number;
  producto: Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion'>;
  lote?: { id: number; codigo_lote: string; fecha_entrada: string } | undefined;
};

type DetalleEntradaResponse = {
  numero_factura: string;
  recibido_por_id: number;
  id: number;
  recibido_por: UserResponse;
};

type DetalleSalidaResponse = {
  cliente_id: number;
  tecnico: string | null | undefined;
  id: number;
  cliente: ClienteResponse;
};

export type MovimientoResponse = {
  id: number;
  tipo: 'entrada' | 'salida';
  items: MovimientoItemResponse[];
  detalle_entrada: DetalleEntradaResponse | null | undefined;
  detalle_salida: DetalleSalidaResponse | null;
  creado: string;
  creado_por: UserResponse;
  aprobado: boolean;
  aprobado_fecha: string | null;
  user_aprueba: UserResponse | null;
  comentarios: string | undefined;
};

// ── VariableSistema ──
export type VariableSistemaResponse = {
  clave: string;
  valor: string | null | undefined;
  descripcion: string | null | undefined;
  id: number;
  actualizado: string;
};

// ── Other ──
export type UsoEquipo = {
  id: number;
  contador_uso: number;
  equipo__id: number;
  equipo__nombre: string;
  alias: string;
};

export type SucursalResponse = {
  id: number;
  nombre: string;
  direccion: string;
  activo: boolean;
};

export type DashboardData = {
  stats: {
    productos: number;
    lotes: number;
    categorias: number;
    proveedores: number;
    clientes: number;
  };
  categoriasChart: { nombre: string; cantidad: number }[];
  movimientosChart: { fecha_creado: string; entradas: number; salidas: number }[];
  productosBajos: {
    id: number;
    descripcion: string;
    categoria__nombre: string;
    cantidad_disponible: number;
    min_stock: number;
  }[];
  topProductosChart: { id: number; codigo_interno: string; total_movimientos: number }[];
};
