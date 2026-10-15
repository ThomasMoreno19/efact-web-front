'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  BadgePercent,
  Info,
  Search,
  Shapes,
  ShoppingCart,
  Tag,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import {
  CatalogoCarritoPage,
  PedidoClientePage,
} from '@/features/catalogo/components/catalogo-checkout-page';
import { CompanyLogo } from '@/features/empresa/components/company-logo';
import { CompanyPublicPageNavigation } from '@/features/empresa/components/company-public-page-navigation';
import { BarcodeScannerButton } from '@/features/articulo/components/barcode-scanner-button';
import type { EmpresaPublica } from '@/features/empresa/types/empresa';
import { getHorariosPublicos } from '@/features/horario/services/horario-public.service';
import type { Horario } from '@/features/horario/types/horario';
import { estaDentroDeHorario } from '@/features/horario/utils/horario-disponibilidad';
import {
  getArticuloStockStatus,
  type ArticuloStockStatus,
} from '@/features/articulo/utils/articulo-stock-status';
import { Input } from '@/components/ui/input';
import { CatalogoRegistroDetalleModal } from '@/features/catalogo/components/catalogo-registro-detalle-modal';
import { CatalogoShareButton } from '@/features/catalogo/components/catalogo-share-button';
import { getCatalogoPublicoPage } from '@/features/catalogo/services/catalogo-publico.service';
import type {
  CatalogoItemCarrito,
  CatalogoObservacionCarrito,
} from '@/features/catalogo/types/catalogo-carrito';
import {
  buildCatalogoCarritoUrl,
  MAX_CART_QUANTITY,
  serializeCatalogoCarritoEntries,
  type CatalogoCarritoEntrada,
} from '@/features/catalogo/utils/catalogo-carrito-url';
import { buildCatalogoArticuloUrl } from '@/features/catalogo/utils/catalogo-share-url';
import type {
  CatalogoListaPublica,
  CatalogoPublicoPage as CatalogoPublicoPageData,
  CatalogoRegistroPublico,
} from '@/features/catalogo/types/catalogo-publico';
import { getAccessibleImageUrl } from '@/services/image-url';
import {
  formatArticleName,
  formatCurrency,
  getUpdateDateStatus,
} from '@/features/catalogo/utils/catalogo-publico';
import {
  buildPedidoWhatsappMessage,
  buildWhatsappUrl,
} from '@/features/catalogo/utils/pedido-whatsapp';
import InvisibleImage from '../../../../public/transparent.svg';

const CATALOGO_LISTAS: {
  id: CatalogoListaPublica;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'articulos', label: 'Artículo', icon: Search },
  { id: 'marcas', label: 'Marca', icon: Tag },
  { id: 'rubros', label: 'Rubro', icon: Shapes },
  { id: 'ofertas', label: 'Ofertas', icon: BadgePercent },
];

type CatalogoFiltroLista = {
  search: string;
  codigoProveedor: string;
  codigoInterno: string;
  codigoBarra: string;
};

const EMPTY_FILTER: CatalogoFiltroLista = {
  search: '',
  codigoProveedor: '',
  codigoInterno: '',
  codigoBarra: '',
};

const EMPTY_CATEGORY_IDS = { marcaIds: [], rubroIds: [] };

interface CatalogoFiltroCategoria {
  id: string;
  categoria: 'marcas' | 'rubros';
  nombre: string;
}

export function CatalogoPublicoPage({
  empresa,
  initialView,
  initialCartEntries,
  initialArticleCode = null,
  initialOpenArticleDetails = false,
}: {
  empresa: EmpresaPublica;
  initialView: 'catalogo' | 'carrito';
  initialCartEntries: CatalogoCarritoEntrada[];
  initialArticleCode?: string | null;
  initialOpenArticleDetails?: boolean;
}) {
  const router = useRouter();
  const initialCartEntriesKey = JSON.stringify(initialCartEntries);
  const [activeList, setActiveList] = useState<CatalogoListaPublica>('articulos');
  const [keepInitialFocus, setKeepInitialFocus] = useState(true);
  const [isCompactHeader, setIsCompactHeader] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'catalogo' | 'carrito' | 'cliente'>(initialView);
  const [horarios, setHorarios] = useState<Horario[] | null>(null);
  const [horarioError, setHorarioError] = useState<string | null>(null);
  const [horarioRetryKey, setHorarioRetryKey] = useState(0);
  const [horaActual, setHoraActual] = useState<Date | null>(null);
  const [cartItems, setCartItems] = useState<CatalogoItemCarrito[]>([]);
  const [hydratedCartKey, setHydratedCartKey] = useState<string | null>(
    initialCartEntries.length === 0 ? initialCartEntriesKey : null,
  );
  const [cartLoadError, setCartLoadError] = useState<string | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [observacionPedido, setObservacionPedido] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<CatalogoFiltroCategoria[]>([]);
  const [sharedDetailToOpen, setSharedDetailToOpen] = useState<string | null>(
    initialOpenArticleDetails ? initialArticleCode ?? null : null,
  );
  const [filters, setFilters] = useState<Record<CatalogoListaPublica, CatalogoFiltroLista>>({
    articulos: { ...EMPTY_FILTER, codigoInterno: initialArticleCode ?? '' },
    marcas: { ...EMPTY_FILTER },
    rubros: { ...EMPTY_FILTER },
    ofertas: { ...EMPTY_FILTER },
  });
  const currentFilter = filters[activeList];
  const whatsappNumber = empresa.telefono?.replace(/\D/g, '').replace(/^00/, '');
  const cartCount = cartItems.reduce((total, item) => total + item.cantidad, 0);
  const isCartRoute = initialView === 'carrito';
  const compactHeader = isCartRoute || isCompactHeader;
  const isCartLoading = hydratedCartKey !== initialCartEntriesKey;
  const verificarHorario =
    checkoutStep === 'carrito' && !empresa.pedidosFueraHorario;
  const estadoHorario = !verificarHorario
    ? 'habilitado'
    : horarioError !== null
      ? 'error'
      : horarios === null || horaActual === null
        ? 'consultando'
        : estaDentroDeHorario(horarios, horaActual)
          ? 'habilitado'
          : 'fuera-horario';
  const showCartButton =
    empresa.tieneCarrito && cartItems.length > 0 && checkoutStep === 'catalogo';

  useEffect(() => {
    if (initialView !== 'catalogo') return;
    setActiveList('articulos');
    setCategoryFilters([]);
    setFilters((current) => ({
      ...current,
      articulos: { ...EMPTY_FILTER, codigoInterno: initialArticleCode ?? '' },
    }));
    setSharedDetailToOpen(
      initialOpenArticleDetails ? initialArticleCode ?? null : null,
    );
  }, [initialArticleCode, initialOpenArticleDetails, initialView]);

  useEffect(() => {
    const entries = JSON.parse(
      initialCartEntriesKey,
    ) as CatalogoCarritoEntrada[];
    if (entries.length === 0) {
      setCartItems([]);
      setCartLoadError(null);
      setHydratedCartKey(initialCartEntriesKey);
      return;
    }

    const controller = new AbortController();
    setCartLoadError(null);
    getCatalogoPublicoPage(
      empresa.id,
      'articulos',
      0,
      { articuloIds: entries.map((entry) => entry.id) },
      controller.signal,
    )
      .then((page) => {
        const articlesById = new Map(
          page.records.map((article) => [String(article.id), article]),
        );
        const restoredItems = entries.flatMap((entry) => {
          const articulo = articlesById.get(entry.id);
          if (!articulo || isArticleUnavailable(articulo)) return [];
          const updateDateStatus = getUpdateDateStatus(
            articulo.actualizado_en,
            empresa.toleranciaMinDias,
            empresa.toleranciaMaxDias,
          );
          return [
            {
              articulo,
              cantidad:
                articulo.tiene_existencia === true
                  ? Math.min(MAX_CART_QUANTITY, entry.cantidad)
                  : 1,
              precioConsultar: updateDateStatus.isBeyondMaximum,
              observacion1: entry.observacion1,
              observacion2: entry.observacion2,
              observacion3: entry.observacion3,
            },
          ];
        });
        setCartItems(restoredItems);
        setCartLoadError(
          restoredItems.length === entries.length
            ? null
            : 'Algunos artículos del enlace ya no están disponibles.',
        );
        setHydratedCartKey(initialCartEntriesKey);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCartItems([]);
        setCartLoadError(
          cause instanceof Error
            ? cause.message
            : 'No se pudieron cargar los artículos del carrito.',
        );
        setHydratedCartKey(initialCartEntriesKey);
      });

    return () => controller.abort();
  }, [
    empresa.id,
    empresa.toleranciaMaxDias,
    empresa.toleranciaMinDias,
    initialCartEntriesKey,
  ]);

  useEffect(() => {
    setCheckoutStep(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!verificarHorario) return;
    let cancelled = false;
    setHorarios(null);
    setHorarioError(null);

    getHorariosPublicos(empresa.id)
      .then((result) => {
        if (!cancelled) setHorarios(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setHorarioError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo consultar el horario de atención.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [empresa.id, horarioRetryKey, verificarHorario]);

  useEffect(() => {
    if (!verificarHorario) return;
    const updateCurrentTime = () => setHoraActual(new Date());
    updateCurrentTime();
    const interval = window.setInterval(updateCurrentTime, 30_000);
    return () => window.clearInterval(interval);
  }, [verificarHorario]);

  useEffect(() => {
    if (isCartLoading || (cartLoadError !== null && cartItems.length === 0)) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('articulo');
    serializeCatalogoCarritoEntries(getCartEntries(cartItems)).forEach((value) =>
      url.searchParams.append('articulo', value),
    );
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [cartItems, cartLoadError, initialCartEntriesKey, isCartLoading]);

  useEffect(() => {
    function updateScrollState() {
      const scrollY = window.scrollY;
      setIsCompactHeader((current) =>
        current ? scrollY > 20 : scrollY > 100,
      );
      setShowScrollToTop(scrollY > 320);
    }

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [checkoutStep]);

  function toggleCartItem(articulo: CatalogoRegistroPublico) {
    if (isArticleUnavailable(articulo)) return;
    const updateDateStatus = getUpdateDateStatus(
      articulo.actualizado_en,
      empresa.toleranciaMinDias,
      empresa.toleranciaMaxDias,
    );
    setCartItems((current) => {
      const isSelected = current.some(
        (item) => String(item.articulo.id) === String(articulo.id),
      );
      if (isSelected) {
        return current.filter(
          (item) => String(item.articulo.id) !== String(articulo.id),
        );
      }
      return [
        ...current,
        {
          articulo,
          cantidad: 1,
          precioConsultar: updateDateStatus.isBeyondMaximum,
          observacion1: '',
          observacion2: '',
          observacion3: '',
        },
      ];
    });
  }

  function changeCartQuantity(id: string | number, quantity: number) {
    setCartItems((current) =>
      current.map((item) =>
        String(item.articulo.id) === String(id)
          ? {
              ...item,
              cantidad:
                item.articulo.tiene_existencia === true
                  ? Math.min(MAX_CART_QUANTITY, Math.max(1, Math.floor(quantity)))
                  : 1,
            }
          : item,
      ),
    );
  }

  function changeCartObservation(
    id: string | number,
    field: CatalogoObservacionCarrito,
    value: string,
  ) {
    setCartItems((current) =>
      current.map((item) => {
        if (String(item.articulo.id) !== String(id)) return item;
        const updated = { ...item, [field]: value };
        if (field === 'observacion1' && value.length < 40) {
          updated.observacion2 = '';
          updated.observacion3 = '';
        }
        if (field === 'observacion2' && value.length < 40) {
          updated.observacion3 = '';
        }
        return updated;
      }),
    );
  }

  function removeCartItem(id: string | number) {
    setCartLoadError(null);
    setCartItems((current) =>
      current.filter((item) => String(item.articulo.id) !== String(id)),
    );
  }

  function removeAllCartItems() {
    setCartLoadError(null);
    setCartItems([]);
  }

  function openCart() {
    router.push(
      buildCatalogoCarritoUrl(
        `/${empresa.slug}/catalogo/carrito`,
        getCartEntries(cartItems),
      ),
    );
  }

  function backToCatalog() {
    router.push(
      buildCatalogoCarritoUrl(
        `/${empresa.slug}/catalogo`,
        getCartEntries(cartItems),
      ),
    );
  }

  function sendOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!whatsappNumber || !nombreCliente.trim() || cartItems.length === 0) return;
    const message = buildPedidoWhatsappMessage(
      nombreCliente,
      observacionPedido,
      cartItems,
    );
    window.open(buildWhatsappUrl(whatsappNumber, message), '_blank', 'noopener,noreferrer');
  }

  function updateFilter(field: keyof CatalogoFiltroLista, value: string) {
    setFilters((current) => ({
      ...current,
      [activeList]: { ...current[activeList], [field]: value },
    }));
  }

  function handleBarcodeDetected(codigoBarra: string) {
    setCheckoutStep('catalogo');
    setActiveList('articulos');
    setKeepInitialFocus(false);
    setCategoryFilters([]);
    setFilters((current) => ({
      ...current,
      articulos: { ...EMPTY_FILTER, codigoBarra: codigoBarra.trim() },
    }));
  }

  function toggleCategoryFilter(
    categoria: 'marcas' | 'rubros',
    record: CatalogoRegistroPublico,
  ) {
    const id = String(record.id);
    setCategoryFilters((current) => {
      const isSelected = current.some(
        (filter) => filter.categoria === categoria && filter.id === id,
      );
      if (isSelected) {
        return current.filter(
          (filter) => filter.categoria !== categoria || filter.id !== id,
        );
      }
      return [...current, { id, categoria, nombre: record.nombre }];
    });
    setActiveList('articulos');
    setKeepInitialFocus(false);
  }

  function removeCategoryFilter(filter: CatalogoFiltroCategoria) {
    setCategoryFilters((current) =>
      current.filter(
        (item) =>
          item.categoria !== filter.categoria || item.id !== filter.id,
      ),
    );
  }

  const categoryFilterKey = categoryFilters
    .map((filter) => `${filter.categoria}:${filter.id}`)
    .join(',');

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <header
        className={`fixed inset-x-0 z-40 bg-background/95 px-4 backdrop-blur transition-[top,box-shadow] duration-300 sm:px-6 ${
          compactHeader
            ? 'top-0 border-b border-border shadow-lg'
            : 'top-8 border-b border-transparent sm:top-12'
        }`}
      >
        <div
          className={`relative mx-auto flex max-w-5xl flex-col items-center px-12 text-center transition-all duration-300 ${
            compactHeader ? 'gap-0 py-2' : 'py-0'
          }`}
        >
          <CompanyPublicPageNavigation
            empresa={empresa}
            currentPage="catalogo"
            containerClassName="absolute left-0 top-1 z-30"
          />
          {empresa.incluirCodigoBarra && initialView === 'catalogo' && checkoutStep === 'catalogo' ? (
            <BarcodeScannerButton
              onDetected={handleBarcodeDetected}
              className="absolute right-0 top-1"
            />
          ) : null}
          <div
            className={`relative overflow-hidden rounded-record bg-surface transition-all duration-300 ${
              compactHeader ? 'size-12' : 'size-28 sm:size-36'
            }`}
          >
            <CompanyLogo empresa={empresa} />
          </div>
          <h1
            className={`font-semibold tracking-tight transition-all duration-300 ${
              compactHeader
                ? 'mt-1 text-lg'
                : 'mt-4 text-2xl sm:text-3xl'
            }`}
          >
            {empresa.nombre}
          </h1>
          <div
            className={`flex flex-col items-center gap-1 overflow-hidden transition-all duration-300 ${
              compactHeader
                ? 'pointer-events-none mt-0 max-h-0 -translate-y-1 opacity-0'
                : 'mt-2 max-h-20 translate-y-0 opacity-100'
            }`}
          >
            {empresa.ubicacion ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Image
                  src="/location.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="size-4 shrink-0"
                />
                <span>{empresa.ubicacion}</span>
              </p>
            ) : null}
            {empresa.telefono && whatsappNumber ? (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contactar a ${empresa.nombre} por WhatsApp`}
                className="flex items-center gap-2 text-sm text-muted transition hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src="/whatsapp.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="size-4 shrink-0"
                />
                <span>{empresa.telefono}</span>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={`mx-auto w-full max-w-5xl ${
          isCartRoute ? 'mt-28' : 'mt-[244px] sm:mt-[292px]'
        }`}
      >
        {checkoutStep === 'catalogo' ? (
          <>
        <nav
          aria-label="Listas del catálogo"
          role="tablist"
          className="flex flex-nowrap items-end gap-1 pl-3 pr-0 sm:gap-2 sm:px-8"
        >
          {CATALOGO_LISTAS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeList === item.id}
              aria-label={item.label}
              onClick={() => {
                setActiveList(item.id);
                setKeepInitialFocus(false);
              }}
              className={`relative z-10 -mb-px flex h-10 shrink-0 items-center gap-1 rounded-t-button border border-b-0 px-1.5 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-11 sm:gap-2 sm:px-4 sm:text-sm ${
                activeList === item.id
                  ? 'border-border bg-surface text-brand'
                  : 'border-border bg-transparent text-muted hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              <item.icon aria-hidden="true" className="size-5 shrink-0" />
              {item.id === 'articulos' ? null : <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <section className="overflow-hidden rounded-card border border-border bg-surface">
          <div
            role="tabpanel"
            className="px-4 pb-4 pt-5 sm:px-8 sm:pb-8 sm:pt-6"
          >
            <div className="space-y-4">
              <div className="mx-auto w-full max-w-2xl">
                <SearchField
                  id={`catalog-public-${activeList}-search`}
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
                  <SearchField
                    id="catalog-public-provider-code"
                    label="Código de proveedor"
                    placeholder="Código de proveedor"
                    value={currentFilter.codigoProveedor}
                    maxLength={15}
                    onChange={(value) => updateFilter('codigoProveedor', value)}
                    onClear={() => updateFilter('codigoProveedor', '')}
                  />
                  <SearchField
                    id="catalog-public-internal-code"
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
                  <SearchField
                    id="catalog-public-barcode"
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

            {categoryFilters.length > 0 ? (
              <CatalogoFiltroChips
                filters={categoryFilters}
                onRemove={removeCategoryFilter}
              />
            ) : null}

            <CatalogoPublicoList
              key={`${activeList}:${activeList === 'articulos' || activeList === 'ofertas' ? categoryFilterKey : ''}:${initialArticleCode ?? ''}`}
              empresaId={empresa.id}
              empresaSlug={empresa.slug}
              lista={activeList}
              filters={currentFilter}
              categoryFilters={categoryFilters}
              toleranciaMinDias={empresa.toleranciaMinDias}
              toleranciaMaxDias={empresa.toleranciaMaxDias}
              imagenesEnArticulos={empresa.imagenesEnArticulos}
              initialOpenArticleCode={sharedDetailToOpen}
              onSharedDetailOpened={() => setSharedDetailToOpen(null)}
              carritoHabilitado={empresa.tieneCarrito}
              cartItems={cartItems}
              onToggleCart={toggleCartItem}
              onToggleCategoryFilter={toggleCategoryFilter}
            />
          </div>
        </section>
          </>
        ) : checkoutStep === 'carrito' ? (
          <CatalogoCarritoPage
            items={cartItems}
            shareUrl={buildCatalogoCarritoUrl(
              `/${empresa.slug}/catalogo/carrito`,
              getCartEntries(cartItems),
            )}
            isLoading={isCartLoading}
            error={cartLoadError}
            estadoHorario={estadoHorario}
            horarios={horarios ?? []}
            onBack={backToCatalog}
            onContinue={() => {
              if (estadoHorario !== 'habilitado') return;
              setCheckoutStep('cliente');
            }}
            onRetryHorario={() => setHorarioRetryKey((key) => key + 1)}
            onRemoveAll={removeAllCartItems}
            onQuantityChange={changeCartQuantity}
            onObservationChange={changeCartObservation}
            onRemove={removeCartItem}
          />
        ) : (
          <PedidoClientePage
            nombre={nombreCliente}
            observacion={observacionPedido}
            onNombreChange={setNombreCliente}
            onObservacionChange={setObservacionPedido}
            onBack={() => setCheckoutStep('carrito')}
            onSubmit={sendOrder}
            whatsappDisponible={Boolean(whatsappNumber)}
          />
        )}
      </div>
      {showScrollToTop ? (
        <button
          type="button"
          aria-label="Volver arriba"
          title="Volver arriba"
          onClick={scrollToTopQuickly}
          className={`fixed right-5 z-50 flex size-12 items-center justify-center rounded-pill bg-brand text-brand-foreground shadow-xl transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            checkoutStep === 'carrito'
              ? estadoHorario === 'habilitado'
                ? 'bottom-24'
                : 'bottom-36'
              : showCartButton
                ? 'bottom-20'
                : 'bottom-5'
          }`}
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      {showCartButton ? (
        <button
          type="button"
          aria-label={`Abrir carrito con ${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}`}
          title="Ver carrito"
          onClick={openCart}
          className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-pill bg-brand text-brand-foreground shadow-xl transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ShoppingCart aria-hidden="true" className="size-5" />
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-pill bg-danger px-1 text-[11px] font-bold text-background">
            {cartCount}
          </span>
        </button>
      ) : null}
    </main>
  );
}

function getCartEntries(items: CatalogoItemCarrito[]): CatalogoCarritoEntrada[] {
  return items.map((item) => ({
    id: String(item.articulo.id),
    cantidad: item.cantidad,
    observacion1: item.observacion1,
    observacion2: item.observacion2,
    observacion3: item.observacion3,
  }));
}

function isArticleUnavailable(articulo: CatalogoRegistroPublico) {
  return articulo.no_procesado === true || articulo.no_procesado === 1;
}

function scrollToTopQuickly() {
  const start = window.scrollY;
  if (start === 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, 0);
    return;
  }

  const startTime = performance.now();
  const duration = 420;
  function animate(time: number) {
    const progress = Math.min((time - startTime) / duration, 1);
    const easedProgress = 1 - (1 - progress) ** 3;
    window.scrollTo(0, Math.round(start * (1 - easedProgress)));
    if (progress < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function SearchField({
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

function CatalogoFiltroChips({
  filters,
  onRemove,
}: {
  filters: CatalogoFiltroCategoria[];
  onRemove: (filter: CatalogoFiltroCategoria) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Filtros seleccionados">
      {filters.map((filter) => {
        const CategoryIcon = filter.categoria === 'marcas' ? Tag : Shapes;
        return (
          <button
            key={`${filter.categoria}:${filter.id}`}
            type="button"
            aria-label={`Quitar filtro ${filter.categoria === 'marcas' ? 'Marca' : 'Rubro'}: ${filter.nombre}`}
            onClick={() => onRemove(filter)}
            className="inline-flex min-h-9 items-center gap-2 rounded-pill border border-border bg-surface-raised px-3 text-xs font-medium text-foreground transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <CategoryIcon aria-hidden="true" className="size-4 text-muted" />
            <span>{filter.nombre}</span>
            <X aria-hidden="true" className="size-3.5 text-muted" />
          </button>
        );
      })}
    </div>
  );
}

function CatalogoPublicoList({
  empresaId,
  empresaSlug,
  imagenesEnArticulos,
  lista,
  filters,
  categoryFilters,
  toleranciaMinDias,
  toleranciaMaxDias,
  initialOpenArticleCode,
  onSharedDetailOpened,
  carritoHabilitado,
  cartItems,
  onToggleCart,
  onToggleCategoryFilter,
}: {
  empresaId: number;
  empresaSlug: string;
  imagenesEnArticulos: boolean;
  lista: CatalogoListaPublica;
  filters: CatalogoFiltroLista;
  categoryFilters: CatalogoFiltroCategoria[];
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  initialOpenArticleCode: string | null;
  onSharedDetailOpened: () => void;
  carritoHabilitado: boolean;
  cartItems: CatalogoItemCarrito[];
  onToggleCart: (articulo: CatalogoRegistroPublico) => void;
  onToggleCategoryFilter: (
    categoria: 'marcas' | 'rubros',
    record: CatalogoRegistroPublico,
  ) => void;
}) {
  const hasInitialCriteria =
    Object.values(filters).some(Boolean) || categoryFilters.length > 0;
  const [records, setRecords] = useState<CatalogoRegistroPublico[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(
    lista !== 'articulos' || hasInitialCriteria,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [debouncedFilters, setDebouncedFilters] = useState(() =>
    normalizeFilters(filters),
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const categoryIds = useMemo(
    () => ({
      marcaIds: categoryFilters
        .filter((filter) => filter.categoria === 'marcas')
        .map((filter) => filter.id),
      rubroIds: categoryFilters
        .filter((filter) => filter.categoria === 'rubros')
        .map((filter) => filter.id),
    }),
    [categoryFilters],
  );
  const appliedCategoryIds =
    lista === 'articulos' || lista === 'ofertas'
      ? categoryIds
      : EMPTY_CATEGORY_IDS;
  const shouldLoad =
    lista !== 'articulos' ||
    Object.values(debouncedFilters).some(Boolean) ||
    categoryFilters.length > 0;

  useEffect(() => {
    const normalizedFilters = normalizeFilters(filters);
    if (areFiltersEqual(normalizedFilters, debouncedFilters)) return;
    const timeout = window.setTimeout(() => {
      setDebouncedFilters(normalizedFilters);
      setRecords([]);
      setHasMore(false);
      setOffset(0);
      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);
      setReloadKey((current) => current + 1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [debouncedFilters, filters]);

  useEffect(() => {
    if (!shouldLoad) {
      setRecords([]);
      setHasMore(false);
      setOffset(0);
      setIsLoading(false);
      setIsLoadingMore(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    if (offset === 0) setIsLoading(true);
    getCatalogoPublicoPage(
      empresaId,
      lista,
      offset,
      {
        ...debouncedFilters,
        marcaIds: appliedCategoryIds.marcaIds,
        rubroIds: appliedCategoryIds.rubroIds,
      },
      controller.signal,
    )
      .then((page: CatalogoPublicoPageData) => {
        setRecords((current) =>
          offset === 0 ? page.records : [...current, ...page.records],
        );
        setHasMore(page.hasMore);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo cargar el catálogo.',
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        if (offset === 0) setIsLoading(false);
        else setIsLoadingMore(false);
      });

    return () => controller.abort();
  }, [
    appliedCategoryIds,
    debouncedFilters,
    empresaId,
    lista,
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

  function retryLoading() {
    if (records.length === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }

  const searchIsActive =
    Object.values(debouncedFilters).some(Boolean) ||
    categoryFilters.length > 0;

  return (
    <div className="mt-6">
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
          {lista === 'articulos' && !searchIsActive
            ? 'Ingrese criterios de búsqueda para obtener resultados'
            : searchIsActive
            ? 'No se encontraron registros con esos filtros.'
            : 'No hay registros cargados para esta empresa.'}
        </p>
      ) : null}

      {!isLoading && records.length > 0 ? (
        lista === 'marcas' || lista === 'rubros' ? (
          <CatalogoTarjetas
            categoria={lista}
            records={records}
            selectedFilters={categoryFilters}
            onToggleFilter={onToggleCategoryFilter}
          />
        ) : (
          <CatalogoArticulos
            records={records}
            empresaSlug={empresaSlug}
            imagenesEnArticulos={imagenesEnArticulos}
            toleranciaMinDias={toleranciaMinDias}
            toleranciaMaxDias={toleranciaMaxDias}
            initialOpenArticleCode={initialOpenArticleCode}
            onSharedDetailOpened={onSharedDetailOpened}
            carritoHabilitado={carritoHabilitado}
            cartItems={cartItems}
            onToggleCart={onToggleCart}
          />
        )
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
  );
}

function CatalogoArticulos({
  records,
  empresaSlug,
  imagenesEnArticulos,
  toleranciaMinDias,
  toleranciaMaxDias,
  initialOpenArticleCode,
  onSharedDetailOpened,
  carritoHabilitado,
  cartItems,
  onToggleCart,
}: {
  records: CatalogoRegistroPublico[];
  empresaSlug: string;
  imagenesEnArticulos: boolean;
  toleranciaMinDias: number | null;
  toleranciaMaxDias: number | null;
  initialOpenArticleCode: string | null;
  onSharedDetailOpened: () => void;
  carritoHabilitado: boolean;
  cartItems: CatalogoItemCarrito[];
  onToggleCart: (articulo: CatalogoRegistroPublico) => void;
}) {
  const [selectedArticle, setSelectedArticle] = useState<CatalogoRegistroPublico | null>(null);
  const sharedDetailOpenedRef = useRef(false);

  useEffect(() => {
    if (!initialOpenArticleCode || sharedDetailOpenedRef.current) {
      return;
    }
    const article = records.find(
      (record) => String(record.codigo_interno) === initialOpenArticleCode,
    );
    if (!article) return;
    setSelectedArticle(article);
    sharedDetailOpenedRef.current = true;
    onSharedDetailOpened();
  }, [initialOpenArticleCode, onSharedDetailOpened, records]);

  function closeArticleDetails() {
    setSelectedArticle(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('detalle')) {
      url.searchParams.delete('detalle');
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }

  return (
    <>
      <div className="mt-4 divide-y divide-border">
        {records.map((articulo) => {
          const stockStatus =
            articulo.tiene_existencia === true
              ? getArticuloStockStatus(
                  articulo.existencia,
                  articulo.minima_existencia,
                  articulo.maxima_existencia,
                )
              : null;
          const imageUrl = getAccessibleImageUrl(articulo.logo_url?.trim() ?? null);
          const updateStatus = getUpdateDateStatus(
            articulo.actualizado_en,
            toleranciaMinDias,
            toleranciaMaxDias,
          );
          const existence =
            articulo.tiene_existencia === true &&
            Number.isFinite(articulo.existencia)
              ? articulo.existencia?.toLocaleString('es-AR')
              : undefined;
          const displayPrice = updateStatus.isBeyondMaximum
            ? 'Consultar'
            : articulo.precio1 !== undefined && articulo.precio1 !== null
              ? formatCurrency(articulo.precio1)
              : null;
          const cartItem = cartItems.find(
            (item) => String(item.articulo.id) === String(articulo.id),
          );
          const cartItemAtLimit =
            articulo.tiene_existencia === true &&
            cartItem !== undefined &&
            cartItem.cantidad >= MAX_CART_QUANTITY;
          const unavailable = isArticleUnavailable(articulo);
          const isSelected = cartItem !== undefined;
          const articleName = formatArticleName(articulo.nombre);
          const codigoInterno = articulo.codigo_interno;
          const articleShareUrl =
            typeof codigoInterno === 'number' &&
            Number.isSafeInteger(codigoInterno) &&
            codigoInterno >= 0 &&
            codigoInterno <= 2_147_483_647
              ? buildCatalogoArticuloUrl(
                  `/${empresaSlug}/catalogo`,
                  codigoInterno,
                )
              : null;
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
                {articulo.marca?.nombre || articulo.rubro?.nombre ? (
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {articulo.marca?.nombre ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Tag aria-hidden="true" className="size-3.5 shrink-0" />
                        <span className="break-words">{articulo.marca.nombre}</span>
                      </span>
                    ) : null}
                    {articulo.rubro?.nombre ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Shapes aria-hidden="true" className="size-3.5 shrink-0" />
                        <span className="break-words">{articulo.rubro.nombre}</span>
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {stockStatus || existence !== undefined ? (
                  <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    {stockStatus ? <StockIndicator status={stockStatus} /> : null}
                    {existence !== undefined ? (
                      <span>Exist: {existence}</span>
                    ) : null}
                  </span>
                ) : null}
                {cartItemAtLimit ? (
                  <span className="mt-2 block text-xs font-medium text-brand">
                    Máximo: {MAX_CART_QUANTITY} unidades
                  </span>
                ) : null}
              </span>
              <span className="ml-2 flex shrink-0 flex-col items-end gap-1 py-2">
                {displayPrice ? (
                  <span
                    className={`whitespace-nowrap text-xs font-semibold sm:text-sm ${
                      updateStatus.isBeyondMaximum
                        ? 'text-brand'
                        : 'text-foreground'
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
              </span>
            </>
          );

          return (
            <article
              key={articulo.id}
              className={`relative flex min-h-28 items-stretch overflow-hidden rounded-record sm:min-h-32 ${
                unavailable
                  ? 'opacity-20 line-through'
                  : isSelected
                    ? 'bg-stock-warning/15 odd:bg-stock-warning/30'
                    : 'odd:bg-foreground/5'
              }`}
            >
              {imagenesEnArticulos ? (
                <button
                  type="button"
                  aria-label={`Ver imagen y detalles de ${articleName}${articulo.oferta === true ? ', en oferta' : ''}${unavailable ? ', no disponible para pedidos' : ''}`}
                  onClick={() => setSelectedArticle(articulo)}
                  className={`relative min-h-28 w-20 shrink-0 self-stretch overflow-hidden rounded-l-record cursor-zoom-in focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:min-h-32 sm:w-28 ${
                    isSelected ? 'bg-stock-warning/15 odd:bg-stock-warning/30' : 'bg-surface'
                  }`}
                >
                  <RecordImage source={imageUrl} />
                  {articulo.oferta === true ? (
                    <span
                      aria-hidden="true"
                      title="En oferta"
                      className="absolute right-1 top-1 z-10 flex size-7 items-center justify-center rounded-button bg-brand text-brand-foreground shadow-md"
                    >
                      <BadgePercent className="size-4" />
                    </span>
                  ) : null}
                </button>
              ) : null}
              {carritoHabilitado ? (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={unavailable}
                  aria-label={
                    unavailable
                      ? `${articleName} no disponible para pedidos`
                      : isSelected
                        ? `Quitar ${articleName} del carrito`
                        : `Agregar ${articleName} al carrito`
                  }
                  title={
                    unavailable
                      ? 'No disponible para pedidos'
                      : isSelected
                        ? 'Quitar del carrito'
                        : 'Seleccionar para agregar al carrito'
                  }
                  onClick={() => onToggleCart(articulo)}
                  className={`flex min-w-0 flex-1 items-center px-3 py-2 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed sm:px-4 ${
                    isSelected || unavailable ? '' : 'hover:bg-surface-raised/70'
                  }`}
                >
                  {articleContent}
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-center px-3 py-2 sm:px-4">
                  {articleContent}
                </div>
              )}
              {!imagenesEnArticulos ? (
                <button
                  type="button"
                  aria-label={`Ver detalles de ${articleName}`}
                  onClick={() => setSelectedArticle(articulo)}
                  className="absolute left-1 top-1 z-10 flex size-8 items-center justify-center rounded-button text-foreground/80 transition hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Info aria-hidden="true" className="size-4 drop-shadow-sm" />
                </button>
              ) : null}
              {articleShareUrl ? (
                <div className="absolute right-1 top-1 z-10">
                  <CatalogoShareButton href={articleShareUrl} title={articleName} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {selectedArticle ? (
        <CatalogoRegistroDetalleModal
          articulo={selectedArticle}
          mostrarImagen={imagenesEnArticulos}
          shareUrl={
            typeof selectedArticle.codigo_interno === 'number' &&
            Number.isSafeInteger(selectedArticle.codigo_interno) &&
            selectedArticle.codigo_interno >= 0 &&
            selectedArticle.codigo_interno <= 2_147_483_647
              ? buildCatalogoArticuloUrl(
                  `/${empresaSlug}/catalogo`,
                  selectedArticle.codigo_interno,
                  true,
                )
              : null
          }
          toleranciaMinDias={toleranciaMinDias}
          toleranciaMaxDias={toleranciaMaxDias}
          onClose={closeArticleDetails}
        />
      ) : null}
    </>
  );
}

function CatalogoTarjetas({
  categoria,
  records,
  selectedFilters,
  onToggleFilter,
}: {
  categoria: 'marcas' | 'rubros';
  records: CatalogoRegistroPublico[];
  selectedFilters: CatalogoFiltroCategoria[];
  onToggleFilter: (
    categoria: 'marcas' | 'rubros',
    record: CatalogoRegistroPublico,
  ) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((record) => {
        const isSelected = selectedFilters.some(
          (filter) =>
            filter.categoria === categoria && filter.id === String(record.id),
        );
        const categoryLabel = categoria === 'marcas' ? 'marca' : 'rubro';

        return (
          <button
            key={record.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${isSelected ? 'Quitar' : 'Agregar'} filtro de ${categoryLabel} ${record.nombre}`}
            onClick={() => onToggleFilter(categoria, record)}
            className={`relative flex min-h-56 items-center justify-center overflow-hidden rounded-record border bg-surface-raised p-6 text-center transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              isSelected
                ? 'border-brand ring-2 ring-brand/60'
                : 'border-border hover:border-brand/70'
            }`}
          >
            <span className="absolute inset-0 overflow-hidden rounded-record">
              <RecordImage
                source={getAccessibleImageUrl(record.logo_url?.trim() ?? null)}
              />
              <span className="absolute inset-0 bg-background/45" />
            </span>
            <span className="relative z-10 max-w-full break-words text-lg font-semibold">
              {record.nombre}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RecordImage({
  source,
  imageClassName = 'object-cover',
}: {
  source: string | null;
  imageClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);
  if (!source || hasError) {
    return (
      <Image
        src={InvisibleImage}
        alt=""
        aria-hidden="true"
        fill
        className={imageClassName}
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
      className={imageClassName}
      onError={() => setHasError(true)}
    />
  );
}

function StockIndicator({ status }: { status: ArticuloStockStatus }) {
  const statusLabels: Record<ArticuloStockStatus, string> = {
    red: 'Existencia cero o negativa',
    yellow: 'Existencia menor o igual al mínimo',
    green: 'Existencia mayor al mínimo o coincidencia entre mínimo y máximo',
  };
  const statusColors: Record<ArticuloStockStatus, string> = {
    red: 'bg-stock-low',
    yellow: 'bg-stock-warning',
    green: 'bg-stock-high',
  };

  return (
    <span
      role="img"
      aria-label={statusLabels[status]}
      title={statusLabels[status]}
      className={`size-3 shrink-0 rounded-pill ${statusColors[status]}`}
    />
  );
}

function normalizeWords(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeFilters(filters: CatalogoFiltroLista): CatalogoFiltroLista {
  return {
    search: normalizeWords(filters.search),
    codigoProveedor: filters.codigoProveedor.trim(),
    codigoInterno: filters.codigoInterno.trim(),
    codigoBarra: filters.codigoBarra.trim(),
  };
}

function areFiltersEqual(
  first: CatalogoFiltroLista,
  second: CatalogoFiltroLista,
) {
  return (
    first.search === second.search &&
    first.codigoProveedor === second.codigoProveedor &&
    first.codigoInterno === second.codigoInterno &&
    first.codigoBarra === second.codigoBarra
  );
}
