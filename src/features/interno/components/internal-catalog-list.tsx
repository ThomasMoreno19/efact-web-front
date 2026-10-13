'use client';

import Image from 'next/image';
import {
  ArrowUp,
  BadgePercent,
  MapPin,
  Search,
  Shapes,
  ShoppingCart,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { CatalogoRegistroDetalleModal } from '@/features/catalogo/components/catalogo-registro-detalle-modal';
import { CatalogoShareButton } from '@/features/catalogo/components/catalogo-share-button';
import type { CatalogoRegistroPublico } from '@/features/catalogo/types/catalogo-publico';
import {
  formatArticleName,
  formatCurrency,
  getUpdateDateStatus,
} from '@/features/catalogo/utils/catalogo-publico';
import { buildCatalogoArticuloUrl } from '@/features/catalogo/utils/catalogo-share-url';
import { getArticuloStockStatus } from '@/features/articulo/utils/articulo-stock-status';
import { getAccessibleImageUrl } from '@/services/image-url';
import { getCatalogoInternoPage } from '@/features/interno/services/interno-client.service';
import type {
  CatalogoInternoArticulo,
  CatalogoInternoCategoria,
  CatalogoInternoFiltros,
  CatalogoInternoLista,
  CatalogoInternoRegistro,
} from '@/features/interno/types/interno';
import {
  buildInternalWhatsappUrl,
  buildMovimientoExistenciaWhatsappMessage,
  type MovimientoExistenciaItem,
} from '@/features/interno/utils/movimiento-existencia-whatsapp';
import {
  InternalCatalogMovementCart,
  InternalCatalogMovementCheckout,
} from '@/features/interno/components/internal-catalog-movement';
import InvisibleImage from '../../../../public/transparent.svg';

const INTERNAL_CATALOG_LISTS: {
  id: CatalogoInternoLista;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'articulos', label: 'Artículo', icon: Search },
  { id: 'marcas', label: 'Marca', icon: Tag },
  { id: 'rubros', label: 'Rubro', icon: Shapes },
  { id: 'ofertas', label: 'Ofertas', icon: BadgePercent },
  { id: 'proveedores', label: 'Proveedor', icon: Truck },
  { id: 'ubicaciones', label: 'Ubicación', icon: MapPin },
];

type InternalCategoryList = 'marcas' | 'rubros' | 'proveedores' | 'ubicaciones';

interface InternalCategoryFilter {
  id: number;
  lista: InternalCategoryList;
  nombre: string;
}

interface InternalCatalogFilter {
  search: string;
  codigoProveedor: string;
  codigoInterno: string;
  codigoBarra: string;
}

const EMPTY_FILTER: InternalCatalogFilter = {
  search: '',
  codigoProveedor: '',
  codigoInterno: '',
  codigoBarra: '',
};

const EMPTY_CATEGORY_IDS = {
  marcaIds: [] as number[],
  rubroIds: [] as number[],
  proveedorIds: [] as number[],
  ubicacionIds: [] as number[],
};

const STATUS_LABELS = {
  red: 'Existencia cero o negativa',
  yellow: 'Existencia menor o igual al mínimo',
  green: 'Existencia mayor al mínimo o coincidencia entre mínimo y máximo',
} as const;

const STATUS_COLORS = {
  red: 'bg-stock-low',
  yellow: 'bg-stock-warning',
  green: 'bg-stock-high',
} as const;

export function InternalCatalogList({
  empresaId,
  empresaSlug,
  telefono,
  nombreUsuario,
  toleranciaMinDias,
  toleranciaMaxDias,
  barcodeScan,
}: {
  empresaId: number;
  empresaSlug: string;
  telefono: string | null;
  nombreUsuario: string;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  barcodeScan: { value: string; sequence: number } | null;
}) {
  const [activeList, setActiveList] = useState<CatalogoInternoLista>('articulos');
  const [view, setView] = useState<'catalogo' | 'carrito' | 'checkout'>('catalogo');
  const [keepInitialFocus, setKeepInitialFocus] = useState(true);
  const [categoryFilters, setCategoryFilters] = useState<InternalCategoryFilter[]>([]);
  const [movementItems, setMovementItems] = useState<MovimientoExistenciaItem[]>([]);
  const [nombre, setNombre] = useState(nombreUsuario);
  const [observacionMovimiento, setObservacionMovimiento] = useState('');
  const [filters, setFilters] = useState<Record<CatalogoInternoLista, InternalCatalogFilter>>({
    articulos: { ...EMPTY_FILTER },
    marcas: { ...EMPTY_FILTER },
    rubros: { ...EMPTY_FILTER },
    ofertas: { ...EMPTY_FILTER },
    proveedores: { ...EMPTY_FILTER },
    ubicaciones: { ...EMPTY_FILTER },
  });
  const currentFilter = filters[activeList];
  const [debouncedFilters, setDebouncedFilters] = useState<
    Record<CatalogoInternoLista, InternalCatalogFilter>
  >({
    articulos: { ...EMPTY_FILTER },
    marcas: { ...EMPTY_FILTER },
    rubros: { ...EMPTY_FILTER },
    ofertas: { ...EMPTY_FILTER },
    proveedores: { ...EMPTY_FILTER },
    ubicaciones: { ...EMPTY_FILTER },
  });
  const currentDebouncedFilter = debouncedFilters[activeList];
  const [records, setRecords] = useState<CatalogoInternoRegistro[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<CatalogoInternoArticulo | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const currentCategoryIds = useMemo(
    () => getCategoryIds(categoryFilters),
    [categoryFilters],
  );
  const appliedCategoryIds =
    activeList === 'articulos' || activeList === 'ofertas'
      ? currentCategoryIds
      : EMPTY_CATEGORY_IDS;
  const shouldLoad =
    activeList !== 'articulos' ||
    Object.values(currentDebouncedFilter).some(Boolean) ||
    categoryFilters.length > 0;
  const whatsappNumber = telefono?.replace(/\D/g, '').replace(/^00/, '');
  const cartCount = movementItems.length;
  const showMovementCartButton = view === 'catalogo' && movementItems.length > 0;

  useEffect(() => {
    if (view !== 'catalogo') return;
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    if (!barcodeScan) return;
    setView('catalogo');
    setActiveList('articulos');
    setKeepInitialFocus(false);
    setCategoryFilters([]);
    setSelectedArticle(null);
    setRecords([]);
    setTotal(0);
    setHasMore(false);
    setOffset(0);
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    setFilters((current) => ({
      ...current,
      articulos: { ...EMPTY_FILTER, codigoBarra: barcodeScan.value.trim() },
    }));
  }, [barcodeScan]);

  useEffect(() => {
    const normalizedFilters = normalizeFilters(currentFilter);
    if (areFiltersEqual(normalizedFilters, currentDebouncedFilter)) return;
    const timeout = window.setTimeout(() => {
      setDebouncedFilters((current) => ({
        ...current,
        [activeList]: normalizedFilters,
      }));
      setRecords([]);
      setTotal(0);
      setHasMore(false);
      setOffset(0);
      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);
      setReloadKey((current) => current + 1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [activeList, currentDebouncedFilter, currentFilter]);

  useEffect(() => {
    if (!shouldLoad) {
      setRecords([]);
      setTotal(0);
      setHasMore(false);
      setOffset(0);
      setIsLoading(false);
      setIsLoadingMore(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    if (offset === 0) setIsLoading(true);
    const requestFilters: CatalogoInternoFiltros = {
      ...currentDebouncedFilter,
      marcaIds: appliedCategoryIds.marcaIds,
      rubroIds: appliedCategoryIds.rubroIds,
      proveedorIds: appliedCategoryIds.proveedorIds,
      ubicacionIds: appliedCategoryIds.ubicacionIds,
    };
    getCatalogoInternoPage(
      empresaId,
      activeList,
      offset,
      requestFilters,
      controller.signal,
    )
      .then((page) => {
        setRecords((current) =>
          offset === 0 ? page.records : [...current, ...page.records],
        );
        setTotal(page.total);
        setHasMore(page.hasMore);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo cargar el catálogo interno.',
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        setIsLoadingMore(false);
      });

    return () => controller.abort();
  }, [
    activeList,
    appliedCategoryIds,
    currentDebouncedFilter,
    empresaId,
    offset,
    reloadKey,
    shouldLoad,
  ]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || error) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsLoadingMore(true);
          setOffset(records.length);
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, isLoadingMore, records.length]);

  function updateFilter(field: keyof InternalCatalogFilter, value: string) {
    setFilters((current) => ({
      ...current,
      [activeList]: { ...current[activeList], [field]: value },
    }));
  }

  function selectList(lista: CatalogoInternoLista) {
    setActiveList(lista);
    setKeepInitialFocus(false);
    setRecords([]);
    setTotal(0);
    setHasMore(false);
    setOffset(0);
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
  }

  function toggleCategoryFilter(lista: InternalCategoryList, record: CatalogoInternoCategoria) {
    setCategoryFilters((current) => {
      const exists = current.some((filter) => filter.lista === lista && filter.id === record.id);
      if (exists) {
        return current.filter((filter) => filter.lista !== lista || filter.id !== record.id);
      }
      return [...current, { lista, id: record.id, nombre: record.nombre }];
    });
    selectList('articulos');
  }

  function removeCategoryFilter(filter: InternalCategoryFilter) {
    setCategoryFilters((current) =>
      current.filter((item) => item.lista !== filter.lista || item.id !== filter.id),
    );
  }

  function toggleMovementItem(articulo: CatalogoInternoArticulo) {
    if (!articulo.tieneExistencia) return;
    setMovementItems((current) => {
      const alreadySelected = current.some(
        (item) => item.articulo.id === articulo.id,
      );
      if (alreadySelected) {
        return current.filter((item) => item.articulo.id !== articulo.id);
      }
      return [...current, { articulo, cantidad: '1', observacion: '' }];
    });
  }

  function changeMovementQuantity(id: string, cantidad: string) {
    setMovementItems((current) =>
      current.map((item) =>
        item.articulo.id === id ? { ...item, cantidad } : item,
      ),
    );
  }

  function changeMovementObservation(id: string, observacion: string) {
    setMovementItems((current) =>
      current.map((item) =>
        item.articulo.id === id ? { ...item, observacion } : item,
      ),
    );
  }

  function removeMovementItem(id: string) {
    setMovementItems((current) => current.filter((item) => item.articulo.id !== id));
  }

  function sendMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !whatsappNumber ||
      nombre.trim().length === 0 ||
      movementItems.length === 0 ||
      movementItems.some((item) => !isValidMovementQuantity(item.cantidad))
    ) {
      return;
    }
    const message = buildMovimientoExistenciaWhatsappMessage(
      nombre,
      observacionMovimiento,
      movementItems,
    );
    window.open(
      buildInternalWhatsappUrl(whatsappNumber, message),
      '_blank',
      'noopener,noreferrer',
    );
  }

  function retryLoading() {
    if (records.length === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }

  const searchIsActive =
    Object.values(currentDebouncedFilter).some(Boolean) || categoryFilters.length > 0;
  const articles = records.filter(isCatalogoInternoArticulo);
  const categories = records.filter(isCatalogoInternoCategoria);
  const heading: Record<CatalogoInternoLista, string> = {
    articulos: 'Artículos',
    marcas: 'Marcas',
    rubros: 'Rubros',
    ofertas: 'Ofertas',
    proveedores: 'Proveedores',
    ubicaciones: 'Ubicaciones',
  };

  return (
    <div className="relative">
      {view === 'catalogo' ? (
        <>
          <nav
            aria-label="Listas del catálogo interno"
            role="tablist"
            className="-mx-5 flex w-[calc(100%+2.5rem)] flex-nowrap items-end gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-5 pb-[5px] touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:w-auto sm:gap-2 sm:overflow-visible sm:px-8 sm:pb-0"
          >
            {INTERNAL_CATALOG_LISTS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeList === item.id}
                aria-label={item.label}
                onClick={() => {
                  selectList(item.id);
                }}
                className={`relative z-10 flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-button border px-1.5 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:-mb-px sm:h-11 sm:gap-2 sm:rounded-t-button sm:rounded-b-none sm:border-b-0 sm:px-4 sm:text-sm ${
                  activeList === item.id
                    ? 'border-border bg-surface text-brand'
                    : 'border-border bg-transparent text-muted hover:bg-surface-raised hover:text-foreground'
                }`}
              >
                {item.id === 'ubicaciones' ? (
                  <LocationShelfIcon className="size-5 shrink-0" />
                ) : (
                  <item.icon aria-hidden="true" className="size-5 shrink-0" />
                )}
                {item.id === 'articulos' ? null : <span>{item.label}</span>}
              </button>
            ))}
          </nav>
          <section className="mt-3 overflow-hidden rounded-card border border-border bg-surface sm:mt-0">
            <div className="px-4 pb-4 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-lg font-semibold">
                  {heading[activeList]}
                </h1>
                {!isLoading && !error ? (
                  <p className="text-sm text-muted">
                    {total.toLocaleString('es-AR')} {total === 1 ? 'registro' : 'registros'}
                  </p>
                ) : null}
              </div>
              <div className="mt-5 space-y-4">
                <div className="mx-auto w-full max-w-2xl">
                  <InternalSearchField
                    id={`internal-catalog-${activeList}-search`}
                    label="Buscar por nombre"
                    placeholder="Ingresá una o más palabras"
                    value={currentFilter.search}
                    maxLength={100}
                    autoFocus={activeList === 'articulos' && keepInitialFocus}
                    onChange={(value) => updateFilter('search', value)}
                    onClear={() => updateFilter('search', '')}
                  />
                </div>
                {activeList === 'articulos' ? (
                  <div className="mx-auto grid w-full grid-cols-[minmax(0,1.75fr)_minmax(7rem,1fr)] gap-3 sm:w-4/5 sm:grid-cols-[minmax(0,3fr)_minmax(5rem,1fr)] sm:gap-4">
                    <InternalSearchField
                      id="internal-catalog-provider-code"
                      label="Código de proveedor"
                      placeholder="Código de proveedor"
                      value={currentFilter.codigoProveedor}
                      maxLength={15}
                      onChange={(value) => updateFilter('codigoProveedor', value)}
                      onClear={() => updateFilter('codigoProveedor', '')}
                    />
                    <InternalSearchField
                      id="internal-catalog-internal-code"
                      label="Código interno"
                      inputMode="numeric"
                      placeholder="Código"
                      value={currentFilter.codigoInterno}
                      maxLength={8}
                      onChange={(value) => updateFilter('codigoInterno', value)}
                      onClear={() => updateFilter('codigoInterno', '')}
                    />
                  </div>
                ) : null}
                {activeList === 'articulos' && currentFilter.codigoBarra ? (
                  <div className="mx-auto w-full max-w-md">
                    <InternalSearchField
                      id="internal-catalog-barcode"
                      label="Código de barras"
                      placeholder="Código de barras"
                      value={currentFilter.codigoBarra}
                      maxLength={20}
                      onChange={(value) => updateFilter('codigoBarra', value)}
                      onClear={() => updateFilter('codigoBarra', '')}
                    />
                  </div>
                ) : null}
              </div>

              {(activeList === 'articulos' || activeList === 'ofertas') && categoryFilters.length > 0 ? (
                <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Filtros seleccionados">
                  {categoryFilters.map((filter) => (
                    <button
                      key={`${filter.lista}:${filter.id}`}
                      type="button"
                      aria-label={`Quitar filtro ${getCategoryLabel(filter.lista)}: ${filter.nombre}`}
                      onClick={() => removeCategoryFilter(filter)}
                      className="inline-flex min-h-9 items-center gap-2 rounded-pill border border-border bg-surface-raised px-3 text-xs font-medium text-foreground transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span>{filter.nombre}</span>
                      <X aria-hidden="true" className="size-3.5 text-muted" />
                    </button>
                  ))}
                </div>
              ) : null}

              {isLoading ? (
                <p role="status" className="mt-5 text-sm text-muted">
                  Cargando catálogo…
                </p>
              ) : null}
              {error ? (
                <p
                  role="alert"
                  className="mt-5 rounded-input border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
                >
                  {error}
                  <button
                    type="button"
                    onClick={retryLoading}
                    className="ml-3 font-semibold underline underline-offset-2"
                  >
                    Reintentar
                  </button>
                </p>
              ) : null}
              {!isLoading && !error && records.length === 0 ? (
                <p className="mt-5 text-center text-sm text-muted">
                  {activeList === 'articulos' && !searchIsActive
                    ? 'Ingresá criterios de búsqueda para obtener resultados.'
                    : 'No se encontraron registros con esos filtros.'}
                </p>
              ) : null}

              {!isLoading && records.length > 0 && isArticleList(activeList) ? (
                <InternalCatalogArticles
                  empresaSlug={empresaSlug}
                  articulos={articles}
                  selectedItems={movementItems}
                  toleranciaMinDias={toleranciaMinDias}
                  toleranciaMaxDias={toleranciaMaxDias}
                  onToggleItem={toggleMovementItem}
                  onToggleCategoryFilter={toggleCategoryFilter}
                  onSelectArticle={setSelectedArticle}
                />
              ) : null}
              {!isLoading && records.length > 0 && isCategoryList(activeList) ? (
                <InternalCatalogCategories
                  lista={activeList}
                  categorias={categories}
                  selectedFilters={categoryFilters}
                  onSelect={toggleCategoryFilter}
                />
              ) : null}

              {hasMore && !isLoading ? (
                <div ref={loadMoreRef} className="mt-5 min-h-8">
                  {isLoadingMore ? (
                    <p role="status" className="text-center text-sm text-muted">
                      Cargando más registros…
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
          {showMovementCartButton ? (
            <button
              type="button"
              aria-label={`Abrir movimiento con ${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}`}
              title="Ver movimiento de existencia"
              onClick={() => setView('carrito')}
              className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-pill bg-brand text-brand-foreground shadow-xl transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ShoppingCart aria-hidden="true" className="size-5" />
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-pill bg-danger px-1 text-[11px] font-bold text-background">
                {cartCount}
              </span>
            </button>
          ) : null}
          {selectedArticle ? (
            <CatalogoRegistroDetalleModal
              articulo={toPublicArticle(selectedArticle)}
              shareUrl={buildCatalogoArticuloUrl(
                `/${empresaSlug}/catalogo`,
                selectedArticle.codigoInterno,
                true,
              )}
              toleranciaMinDias={toleranciaMinDias}
              toleranciaMaxDias={toleranciaMaxDias}
              onClose={() => setSelectedArticle(null)}
            />
          ) : null}
          <InternalScrollToTop
            bottomClassName={showMovementCartButton ? 'bottom-20' : 'bottom-5'}
          />
        </>
      ) : view === 'carrito' ? (
        <InternalCatalogMovementCart
          items={movementItems}
          onBack={() => setView('catalogo')}
          onContinue={() => setView('checkout')}
          onQuantityChange={changeMovementQuantity}
          onObservationChange={changeMovementObservation}
          onRemove={removeMovementItem}
        />
      ) : (
        <InternalCatalogMovementCheckout
          nombre={nombre}
          observacion={observacionMovimiento}
          whatsappDisponible={Boolean(whatsappNumber)}
          onNombreChange={setNombre}
          onObservacionChange={setObservacionMovimiento}
          onBack={() => setView('carrito')}
          onSubmit={sendMovement}
        />
      )}
    </div>
  );
}

function InternalCatalogArticles({
  empresaSlug,
  articulos,
  selectedItems,
  toleranciaMinDias,
  toleranciaMaxDias,
  onToggleItem,
  onToggleCategoryFilter,
  onSelectArticle,
}: {
  empresaSlug: string;
  articulos: CatalogoInternoArticulo[];
  selectedItems: MovimientoExistenciaItem[];
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  onToggleItem: (articulo: CatalogoInternoArticulo) => void;
  onToggleCategoryFilter: (
    lista: InternalCategoryList,
    categoria: CatalogoInternoCategoria,
  ) => void;
  onSelectArticle: (articulo: CatalogoInternoArticulo) => void;
}) {
  return (
    <div className="mt-4 divide-y divide-border">
      {articulos.map((articulo, index) => {
        const stockStatus = articulo.tieneExistencia
          ? getArticuloStockStatus(
              articulo.existencia,
              articulo.minimaExistencia,
              articulo.maximaExistencia,
            )
          : null;
        const updateStatus = getUpdateDateStatus(
          articulo.actualizadoEn,
          toleranciaMinDias,
          toleranciaMaxDias,
        );
        const articleName = formatArticleName(articulo.nombre);
        const isSelected = selectedItems.some(
          (item) => item.articulo.id === articulo.id,
        );
        const displayPrice = updateStatus.isBeyondMaximum
          ? 'Consultar'
          : articulo.precio1 === null
            ? null
            : formatCurrency(articulo.precio1);
        const articleContent = (
          <>
            <span className="min-w-0 flex-1 pr-9">
              <span
                role="heading"
                aria-level={3}
                className="block break-words text-left text-sm font-medium sm:text-base"
              >
                {articleName}
              </span>
              {articulo.ubicacion || articulo.marca || articulo.rubro ? (
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {articulo.ubicacion ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="break-words">{articulo.ubicacion.nombre}</span>
                    </span>
                  ) : null}
                  {articulo.marca ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Tag aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="break-words">{articulo.marca.nombre}</span>
                    </span>
                  ) : null}
                  {articulo.rubro ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Shapes aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="break-words">{articulo.rubro.nombre}</span>
                    </span>
                  ) : null}
                </span>
              ) : null}
              {articulo.proveedor ? (
                <span className="mt-1 block break-words text-xs text-muted">
                  Proveedor: {articulo.proveedor.nombre}
                </span>
              ) : null}
              {stockStatus ? (
                <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <StockIndicator status={stockStatus} />
                  <span>Existencia: {articulo.existencia.toLocaleString('es-AR')}</span>
                </span>
              ) : null}
            </span>
            <span className="ml-2 flex shrink-0 flex-col items-end justify-center gap-1 py-2">
              {displayPrice ? (
                <span
                  className={`whitespace-nowrap text-xs font-semibold sm:text-sm ${
                    updateStatus.isBeyondMaximum ? 'text-brand' : 'text-foreground'
                  }`}
                >
                  {displayPrice}
                </span>
              ) : null}
              {updateStatus.label ? (
                <span
                  className={`whitespace-nowrap text-[10px] sm:text-xs ${
                    updateStatus.isBeyondMinimum ? 'text-brand' : 'text-muted'
                  }`}
                >
                  {updateStatus.label}
                </span>
              ) : null}
              <span className="whitespace-nowrap text-[10px] text-muted sm:text-xs">
                Cód. {articulo.codigoInterno}
              </span>
            </span>
          </>
        );
        const shareUrl = buildCatalogoArticuloUrl(
          `/${empresaSlug}/catalogo`,
          articulo.codigoInterno,
        );

        return (
          <article
            key={articulo.id}
            className={`relative flex min-h-28 items-stretch overflow-hidden rounded-record sm:min-h-32 ${
              isSelected
                ? 'bg-stock-warning/15 odd:bg-stock-warning/30'
                : index % 2 === 0
                  ? 'bg-foreground/5'
                  : ''
            }`}
          >
            <button
              type="button"
              aria-label={`Ver imagen y detalles de ${articleName}`}
              onClick={() => onSelectArticle(articulo)}
              className={`relative min-h-28 w-20 shrink-0 self-stretch overflow-hidden rounded-l-record cursor-zoom-in focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:min-h-32 sm:w-28 ${
                isSelected ? 'bg-stock-warning/15' : 'bg-surface'
              }`}
            >
              <InternalRecordImage
                source={getAccessibleImageUrl(articulo.logoUrl?.trim() ?? null)}
              />
            </button>
            {articulo.tieneExistencia ? (
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? `Quitar ${articleName} del movimiento`
                    : `Agregar ${articleName} al movimiento`
                }
                onClick={() => onToggleItem(articulo)}
                className={`flex min-w-0 flex-1 items-center px-3 py-2 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4 ${
                  isSelected ? '' : 'hover:bg-surface-raised/70'
                }`}
              >
                {articleContent}
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 items-center px-3 py-2 sm:px-4">
                {articleContent}
              </div>
            )}
            <div className="absolute right-1 top-1 z-10">
              <CatalogoShareButton href={shareUrl} title={articleName} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function InternalCatalogCategories({
  lista,
  categorias,
  selectedFilters,
  onSelect,
}: {
  lista: InternalCategoryList;
  categorias: CatalogoInternoCategoria[];
  selectedFilters: InternalCategoryFilter[];
  onSelect: (
    lista: InternalCategoryList,
    categoria: CatalogoInternoCategoria,
  ) => void;
}) {
  return (
    <div
      className={`mt-4 grid gap-3 ${
        lista === 'ubicaciones'
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          : 'sm:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {categorias.map((categoria) => {
        const selected = selectedFilters.some(
          (filter) => filter.lista === lista && filter.id === categoria.id,
        );
        const ItemIcon = getCategoryIcon(lista);
        return (
          <button
            key={categoria.id}
            type="button"
            aria-pressed={selected}
            aria-label={`${selected ? 'Quitar' : 'Agregar'} filtro de ${getCategoryLabel(lista)} ${categoria.nombre}`}
            onClick={() => onSelect(lista, categoria)}
            className={`relative flex items-center justify-center overflow-hidden rounded-record border bg-surface-raised text-center transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              lista === 'ubicaciones' ? 'min-h-24 p-3' : 'min-h-48 p-6'
            } ${
              selected
                ? 'border-brand ring-2 ring-brand/60'
                : 'border-border hover:border-brand/70'
            }`}
          >
            {categoria.logoUrl ? (
              <span className="absolute inset-0 overflow-hidden rounded-record">
                <InternalRecordImage
                  source={getAccessibleImageUrl(categoria.logoUrl.trim())}
                />
                <span className="absolute inset-0 bg-background/45" />
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-muted/20">
                {lista === 'ubicaciones' ? (
                  <LocationShelfIcon className="size-16" />
                ) : (
                  <ItemIcon aria-hidden="true" className="size-28" />
                )}
              </span>
            )}
            <span className="relative z-10 max-w-full break-words text-lg font-semibold">
              {categoria.nombre}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InternalSearchField({
  id,
  label,
  value,
  placeholder,
  onChange,
  onClear,
  maxLength,
  inputMode,
  autoFocus = false,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
  maxLength?: number;
  inputMode?: 'numeric' | 'text';
  autoFocus?: boolean;
}) {
  return (
    <Input
      id={id}
      label={label}
      endAdornmentPadding="compact"
      type="text"
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.currentTarget.value)}
      endAdornment={
        value ? (
          <button
            type="button"
            aria-label={`Borrar ${label.toLowerCase()}`}
            onClick={onClear}
            className="flex size-8 items-center justify-center rounded-button text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : undefined
      }
    />
  );
}

function InternalRecordImage({ source }: { source: string | null }) {
  const [hasError, setHasError] = useState(false);
  if (!source || hasError) {
    return (
      <Image
        src={InvisibleImage}
        alt=""
        aria-hidden="true"
        fill
        className="object-cover"
      />
    );
  }
  return (
    <Image
      src={source}
      alt=""
      aria-hidden="true"
      fill
      unoptimized
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function LocationShelfIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 3.5v17M20 3.5v17M4 8h16M4 14h16M4 20.5h16" />
      <path d="M6.5 4.8h4V8m3-3.2h4V8M6.5 10h4v4h-4zm7 0h4v4h-4zm-7 6h4v4h-4zm7 0h4v4h-4z" />
    </svg>
  );
}

function StockIndicator({
  status,
}: {
  status: NonNullable<ReturnType<typeof getArticuloStockStatus>>;
}) {
  return (
    <span
      role="img"
      aria-label={STATUS_LABELS[status]}
      title={STATUS_LABELS[status]}
      className={`size-3 shrink-0 rounded-pill ${STATUS_COLORS[status]}`}
    />
  );
}

function InternalScrollToTop({ bottomClassName }: { bottomClassName: string }) {
  const [showButton, setShowButton] = useState(false);
  useEffect(() => {
    function update() {
      setShowButton(window.scrollY > 320);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  if (!showButton) return null;
  return (
    <button
      type="button"
      aria-label="Volver arriba"
      title="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-5 z-50 flex size-12 items-center justify-center rounded-pill bg-brand text-brand-foreground shadow-xl transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${bottomClassName}`}
    >
      <ArrowUp aria-hidden="true" className="size-4" />
    </button>
  );
}

function toPublicArticle(articulo: CatalogoInternoArticulo): CatalogoRegistroPublico {
  return {
    id: articulo.id,
    nombre: articulo.nombre,
    codigo_interno: articulo.codigoInterno,
    codigo_proveedor: articulo.codigoProveedor,
    codigo_barra: articulo.codigoBarra,
    logo_url: articulo.logoUrl,
    precio1: articulo.precio1,
    oferta: articulo.oferta,
    marca: articulo.marca ? { nombre: articulo.marca.nombre } : null,
    rubro: articulo.rubro ? { nombre: articulo.rubro.nombre } : null,
    existencia: articulo.existencia,
    minima_existencia: articulo.minimaExistencia,
    maxima_existencia: articulo.maximaExistencia,
    tiene_existencia: articulo.tieneExistencia,
    actualizado_en: articulo.actualizadoEn,
  };
}

function getCategoryIds(filters: InternalCategoryFilter[]) {
  return {
    marcaIds: filters.filter((filter) => filter.lista === 'marcas').map((filter) => filter.id),
    rubroIds: filters.filter((filter) => filter.lista === 'rubros').map((filter) => filter.id),
    proveedorIds: filters
      .filter((filter) => filter.lista === 'proveedores')
      .map((filter) => filter.id),
    ubicacionIds: filters
      .filter((filter) => filter.lista === 'ubicaciones')
      .map((filter) => filter.id),
  };
}

function getCategoryLabel(lista: InternalCategoryList) {
  const labels: Record<InternalCategoryList, string> = {
    marcas: 'marca',
    rubros: 'rubro',
    proveedores: 'proveedor',
    ubicaciones: 'ubicación',
  };
  return labels[lista];
}

function getCategoryIcon(lista: InternalCategoryList) {
  const icons: Record<InternalCategoryList, LucideIcon> = {
    marcas: Tag,
    rubros: Shapes,
    proveedores: Truck,
    ubicaciones: MapPin,
  };
  return icons[lista];
}

function isCatalogoInternoArticulo(
  record: CatalogoInternoRegistro,
): record is CatalogoInternoArticulo {
  return typeof record.id === 'string';
}

function isCatalogoInternoCategoria(
  record: CatalogoInternoRegistro,
): record is CatalogoInternoCategoria {
  return typeof record.id === 'number';
}

function isArticleList(lista: CatalogoInternoLista) {
  return lista === 'articulos' || lista === 'ofertas';
}

function isCategoryList(lista: CatalogoInternoLista): lista is InternalCategoryList {
  return (
    lista === 'marcas' ||
    lista === 'rubros' ||
    lista === 'proveedores' ||
    lista === 'ubicaciones'
  );
}

function normalizeFilters(filters: InternalCatalogFilter): InternalCatalogFilter {
  return {
    search: filters.search.trim().replace(/\s+/g, ' '),
    codigoProveedor: filters.codigoProveedor.trim(),
    codigoInterno: filters.codigoInterno.trim(),
    codigoBarra: filters.codigoBarra.trim(),
  };
}

function areFiltersEqual(first: InternalCatalogFilter, second: InternalCatalogFilter) {
  return (
    first.search === second.search &&
    first.codigoProveedor === second.codigoProveedor &&
    first.codigoInterno === second.codigoInterno &&
    first.codigoBarra === second.codigoBarra
  );
}

function isValidMovementQuantity(value: string) {
  return value.trim() !== '' && Number.isSafeInteger(Number(value));
}
