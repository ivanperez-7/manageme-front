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
export const proveedorCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  nombre_contacto: z.string().max(200).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
  correo: z.email('Correo inválido').optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

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
export const productoCreateSchema = z
  .object({
    codigo_interno: z.string().min(1, 'El código interno es obligatorio').max(50, 'Máximo 50 caracteres'),
    descripcion: z.string().min(1, 'La descripción es obligatoria'),
    categoria_id: z.number('La categoría es obligatoria'),
    equipos_id: z.array(z.number()),
    min_stock: z.number(),
    proveedor_id: z.number().nullable(),
    sku: z.string().min(1, 'El SKU es obligatorio'),
    status: z.enum(['activo', 'inactivo']),
    // Vida útil por unidades y/o por días; lo que ocurra primero. Al menos una.
    vida_util_unidades: z.number().int('Debe ser un número entero').nullable(),
    vida_util_dias: z.number().int('Debe ser un número entero').nullable(),
  })
  .refine((d) => d.vida_util_unidades != null || d.vida_util_dias != null, {
    message: 'Defina vida útil por unidades o por días (al menos una)',
    path: ['vida_util_unidades'],
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
export const movimientoItemCreateSchema = z
  .object({
    producto_id: z.number(),
    cantidad: z.number().min(1),
    equipo_cliente_id: z.number().optional(),
    cambio_anticipado: z.boolean().optional(),
    motivo_cambio: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.cambio_anticipado && !data.motivo_cambio?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Especifique el motivo del cambio anticipado',
        path: ['motivo_cambio'],
      });
    }
  });

// ── DetalleEntrada (keep zod schema) ──
export const detalleEntradaCreateSchema = z.object({
  numero_factura: z
    .string()
    .min(3, 'El número de factura es obligatorio')
    .regex(/^\d+$/, 'Solo se aceptan números'),
  recibido_por_id: z.number().gt(0, 'Seleccione un usuario válido'),
});

// ── DetalleSalida (keep zod schema) ──
export const detalleSalidaCreateSchema = z.object({
  cliente_id: z.number().gt(0, 'Seleccione un cliente válido'),
  tecnico: z.string().nullable().optional(),
  subtipo: z.enum(['venta', 'renta']),
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
      return;
    }
    if (data.tipo === 'salida' && data.detalle_salida) {
      const subtipo = data.detalle_salida.subtipo;
      if (subtipo === 'renta') {
        data.items.forEach((item, idx) => {
          if (!item.equipo_cliente_id) {
            ctx.addIssue({
              code: 'custom',
              message: 'Los productos para renta requieren un equipo del cliente',
              path: [`items[${idx}].equipo_cliente_id`],
            });
          }
        });
      }
      if (subtipo === 'venta') {
        data.items.forEach((item, idx) => {
          if (item.cambio_anticipado) {
            ctx.addIssue({
              code: 'custom',
              message: 'Cambio anticipado solo aplica a renta',
              path: [`items[${idx}].cambio_anticipado`],
            });
          }
        });
      }
    }
  });

export type MovimientoCreate = z.infer<typeof movimientoCreateSchema>;

export type MovimientoItemResponse = {
  producto_id: number;
  cantidad: number;
  equipo_cliente_id?: number | undefined;
  cambio_anticipado: boolean;
  motivo_cambio: string | null | undefined;
  id: number;
  producto: Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion'>;
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
  subtipo: 'venta' | 'renta';
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

// ── Actividad ──
type SegmentoLink = {
  texto: string;
  tipo: string;
  id: number;
};

type SegmentoText = {
  texto: string;
};

export type ActividadResponse = {
  id: number;
  usuario: number;
  usuario_nombre: string;
  accion: string;
  descripcion: string;
  segmentos: (SegmentoText | SegmentoLink)[];
  creado: string;
};

// ── Other ──
export type EquipoStatsResponse = {
  total_productos: number;
  total_instalaciones: number;
  uso_total: number;
  uso_promedio: number;
  total_movimientos: number;
};

export type EquipoClienteResponse = {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  equipo_id: number;
  equipo_nombre: string;
  marca_nombre: string;
  alias: string;
  contador_uso: number;
};

export type SucursalResponse = {
  id: number;
  nombre: string;
  direccion: string;
  activo: boolean;
};

export type ProductoRendimiento = {
  producto_id: number;
  codigo_interno: string;
  descripcion: string;
  vida_util_unidades: number | null;
  ciclos: number;
  uso_promedio: number | null;
  ratio: number | null;
  vida_util_dias: number | null;
  ciclos_dias: number;
  dias_promedio: number | null;
  ratio_dias: number | null;
};

export type DashboardData = {
  stats: {
    productos: number;
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

export type AlertaInventario = {
  id: number;
  producto: Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion'>;
  tipo_alerta: 'low_stock' | 'old_product' | 'unusual_movement' | 'high_rotation';
  mensaje: string;
  creado: string; // ISO datetime
  resuelto: boolean;
};

export type AlertasListResponse = {
  count: number;
  no_leidas: number;
  results: AlertaInventario[];
};

export type AlertasRefrescarResponse = {
  creadas: number;
  resueltas: number;
  no_leidas: number;
};

// ── Reorden ──
export type ReordenProducto = {
  producto_id: number;
  codigo_interno: string;
  descripcion: string;
  cantidad_disponible: number;
  min_stock: number;
  consumo_mensual: number | null;
  dias_cobertura: number | null;
  cantidad_sugerida: number;
};

export type ReordenProveedor = {
  proveedor_id: number;
  proveedor_nombre: string;
  productos: ReordenProducto[];
};
