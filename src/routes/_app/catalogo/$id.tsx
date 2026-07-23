import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowDownToDot,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromDot,
  CheckCircle,
  Edit,
  Info,
  Loader2,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// COMPONENTES DEL PROYECTO
import { ErrorState } from "@/components/error-state";
import { AddProductDialog } from "@/components/add-product-dialog";
import { DataTable } from "@/components/data-table";
import { DateRangePicker } from "@/components/date-range-pickers";
import { DeleteProductDialog } from "@/components/delete-product-dialog";
import { EquipoProductosDialog } from "@/components/equipo-productos-dialog";
import { ProductDetailSkeleton } from "@/components/route-skeletons";
import TipoMovimientoBadge from "@/components/tipo-movimiento-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// OTRAS UTILIDADES
import { fetchProductoById } from "@/api/catalogo";
import { fetchMovimientos } from "@/api/movimientos";
import type {
  EquipoResponse,
  MovimientoResponse,
  ProductoResponse,
  ProveedorResponse,
} from "@/lib/types";

type CatalogoLoaderData = Awaited<ReturnType<typeof fetchProductoById>>;
import { cn, humanDate, humanTime, plural } from "@/lib/utils";

const movementsColumns: ColumnDef<MovimientoResponse & { cantidad: number }>[] = [
  {
    accessorKey: "id",
    header: "Folio",
    cell: ({ row }) => (
      <Link to='/movements/$id' params={{ id: String(row.original.id) }} className='font-semibold'>
        {row.getValue("id")}
      </Link>
    ),
  },
  {
    accessorKey: "creado",
    header: "Fecha",
    cell: ({ row }) => humanDate(row.getValue("creado")),
  },
  {
    id: "hora",
    accessorKey: "creado",
    header: "Hora",
    cell: ({ row }) => humanTime(row.getValue("creado")),
  },
  {
    id: "tipo",
    header: "Tipo",
    cell: ({ row }) => <TipoMovimientoBadge tipo={row.original.tipo} />,
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.tipo === "entrada"
            ? "text-blue-600 dark:text-blue-400"
            : "text-red-600 dark:text-red-400",
          "font-semibold"
        )}
      >
        {row.original.cantidad.toLocaleString("es-MX")}
      </span>
    ),
  },
  {
    accessorKey: "aprobado",
    header: "¿Aprobado?",
    cell: ({ row }) =>
      row.getValue("aprobado") && (
        <div className='flex gap-1.5 items-center'>
          <CheckCircle className='size-4 text-green-700 dark:text-green-400' />{" "}
          <span className='text-muted-foreground'>{row.original.user_aprueba?.full_name}</span>
        </div>
      ),
  },
];

type MovimientoSearch = {
  fechaInicio?: string;
  fechaFin?: string;
  movPage?: number;
};

export const Route = createFileRoute("/_app/catalogo/$id")({
  staticData: {
    headerBreadcrumb: (match) => {
      const data = match.loaderData as CatalogoLoaderData | undefined;
      return [
        { label: "Productos", to: "/catalogo" },
        { label: data?.producto?.codigo_interno ?? "..." },
      ];
    },
  },
  validateSearch: ({ fechaInicio, fechaFin, movPage }): MovimientoSearch => ({
    fechaInicio: (fechaInicio as string) || undefined,
    fechaFin: (fechaFin as string) || undefined,
    movPage: movPage != null ? Number(movPage) : undefined,
  }),
  loader: async ({ params }) => await fetchProductoById(params.id),
  component: ProductDetailPage,
  pendingComponent: ProductDetailSkeleton,
  pendingMs: 200,
  errorComponent: ErrorState,
});

function ProductDetailPage() {
  const { producto } = Route.useLoaderData();
  const router = useRouter();

  return (
    <>
      {/* Header con título y botones de editar y eliminar */}
      <header className='grid md:flex justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            title='Volver'
            aria-label='Volver'
            onClick={() => router.history.back()}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>{producto.descripcion}</h1>
        </div>

        <div className='space-x-2'>
          <AddProductDialog
            trigger={
              <Button variant='ghost'>
                <Edit className='h-4 w-4' />
                Editar
              </Button>
            }
            producto={producto}
          />
          <DeleteProductDialog
            trigger={
              <Button variant='destructive'>
                <Trash className='h-4 w-4' />
              </Button>
            }
            productId={producto.id}
          />
        </div>
      </header>

      <ProductInfoCard producto={producto} />
      <ProductProviderCard proveedor={producto.proveedor} />
      <ProductMovementsCard />
    </>
  );
}

const ProductInfoCard = ({ producto }: { producto: ProductoResponse }) => {
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoResponse | null>(null);
  const [equipoDialogOpen, setEquipoDialogOpen] = useState(false);

  const openEquipo = (eq: EquipoResponse) => {
    setSelectedEquipo(eq);
    setEquipoDialogOpen(true);
  };

  return (
    <Card className='my-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Información General</CardTitle>
        <Separator />
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Código</p>
              <p className='font-semibold'>{producto.codigo_interno}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Categoría</p>
              <p>{producto.categoria?.nombre}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>SKU</p>
              <p>{producto.sku}</p>
            </div>
          </div>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Existencia</p>
              <p>{plural("unidad", producto.cantidad_disponible)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>
                Vida útil
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='inline-flex ml-1 cursor-help align-middle'>
                      <Info className='h-3 w-3 text-muted-foreground/70' />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side='right' className='max-w-56 text-xs'>
                    Vida útil esperada entre reemplazos, por unidades de uso y/o por días; lo que
                    ocurra primero.
                  </TooltipContent>
                </Tooltip>
              </p>
              <p>
                {producto.vida_util_unidades != null && plural("unidad", producto.vida_util_unidades)}
                {producto.vida_util_unidades != null && producto.vida_util_dias != null && " · "}
                {producto.vida_util_dias != null && plural("día", producto.vida_util_dias)}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground '>Equipos compatibles</p>
              {producto.equipos?.length > 0 ? (
                <div className='flex flex-wrap gap-2 mt-2'>
                  {producto.equipos.map((eq) => (
                    <Badge
                      key={eq.id}
                      variant='secondary'
                      className='px-3 py-1 gap-2 cursor-pointer transition-colors hover:bg-secondary/70 max-w-[280px] truncate'
                      role='button'
                      tabIndex={0}
                      title={`Ver productos de ${eq.nombre}`}
                      onClick={() => openEquipo(eq)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openEquipo(eq);
                        }
                      }}
                    >
                      {eq.nombre}{" "}
                      <span className='text-xs text-muted-foreground'>{eq.marca.nombre}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>N/A</p>
              )}

              {selectedEquipo && (
                <EquipoProductosDialog
                  equipo={selectedEquipo}
                  open={equipoDialogOpen}
                  onOpenChange={setEquipoDialogOpen}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductProviderCard = ({ proveedor }: { proveedor?: ProveedorResponse }) =>
  proveedor && (
    <Card className='my-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Proveedor de este producto</CardTitle>
        <Separator />
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Razón social</p>
              <p className='font-semibold'>{proveedor.nombre}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Nombre de contacto</p>
              <p className='font-semibold'>{proveedor.nombre_contacto}</p>
            </div>
          </div>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Teléfono</p>
              <p className='font-semibold'>{proveedor.telefono || "N/A"}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Correo</p>
              <a className='font-semibold' href={"mailto:" + proveedor.correo}>
                {proveedor.correo || "N/A"}
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

const ProductMovementsCard = () => {
  const { producto } = Route.useLoaderData();
  const { fechaInicio, fechaFin, movPage } = Route.useSearch();
  const navigate = Route.useNavigate();

  const inicio = fechaInicio || format(new Date(), "yyyy-MM-dd");
  const fin = fechaFin || format(new Date(), "yyyy-MM-dd");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["movimientos", { productoId: producto.id, inicio, fin }],
    queryFn: () => fetchMovimientos({ productoId: producto.id, fechaInicio: inicio, fechaFin: fin }),
  });

  const movimientos = data?.movimientos ?? [];
  const oldestDate = data?.oldestDate ?? "";

  return (
    <Card className='mb-6'>
      <CardHeader className='grid items-center md:flex md:justify-between'>
        <CardTitle className='text-lg'>Movimientos</CardTitle>
        <div className='flex items-center gap-2'>
          <Button size='sm' asChild>
            <Link
              to='/movements/new'
              search={{
                initialData: {
                  tipo: "salida",
                  items: [{ producto_id: producto.id, cantidad: 0 }],
                },
              }}
            >
              <ArrowUpFromDot />
              Registrar salida
            </Link>
          </Button>
          <Button size='sm' asChild>
            <Link
              to='/movements/new'
              search={{
                initialData: {
                  tipo: "entrada",
                  items: [{ producto_id: producto.id, cantidad: 0 }],
                },
              }}
            >
              <ArrowDownToDot />
              Registrar entrada
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DateRangePicker
          minDate={oldestDate ? new Date(oldestDate) : undefined}
          defaultStartDate={fechaInicio ? new Date(fechaInicio) : undefined}
          defaultEndDate={fechaFin ? new Date(fechaFin) : undefined}
          onStartDateChange={(date) =>
            navigate({
              search: (prev) => ({ ...prev, fechaInicio: format(date, "yyyy-MM-dd") }),
              replace: true,
              resetScroll: false,
            })
          }
          onEndDateChange={(date) =>
            navigate({
              search: (prev) => ({ ...prev, fechaFin: format(date, "yyyy-MM-dd") }),
              replace: true,
              resetScroll: false,
            })
          }
          className='mb-3'
        />

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='size-6 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <DataTable
            data={movimientos.flatMap((mov) =>
              mov.items
                .filter((item) => item.producto.id == producto.id)
                .map((item) => ({ cantidad: item.cantidad, ...mov }))
            )}
            columns={movementsColumns}
            transparent
            hiddenColumnIds={["hora"]}
            initialPage={movPage ?? 0}
            onChangePage={(pageIndex) =>
              navigate({
                search: (prev) => ({ ...prev, movPage: pageIndex }),
                replace: true,
                resetScroll: false,
              })
            }
            emptyComponent={
              <Empty className='my-0 py-0'>
                <EmptyHeader>
                  <EmptyMedia variant='decorative'>
                    <ArrowLeftRight />
                  </EmptyMedia>
                  <EmptyTitle>No se ha hecho ningún movimiento</EmptyTitle>
                  <EmptyDescription>
                    Comienza registrando una entrada o salida de este producto
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
        )}
      </CardContent>
    </Card>
  );
};
