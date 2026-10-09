# E-fact Frontend

## Propósito del producto

Este frontend unifica tres sitios que hoy funcionan por separado. Cada empresa tendrá un `slug` propio y podrá habilitar los módulos que utilice: catálogo, consulta de saldos y consulta de reparaciones. También habrá un panel global para que el superadmin gestione empresas y módulos.

Las tres experiencias públicas son:

- **Saldos:** el cliente consulta con DNI o CUIL los saldos disponibles. El producto contempla tanto resultados de varias empresas como una consulta limitada a una empresa. La ruta definida actualmente para la consulta por empresa es `/{empresa}/saldo`; la ruta para la búsqueda agregada aún debe acordarse antes de implementarla.
- **Reparaciones:** consulta de equipos ingresados a reparar, con alcance por empresa y una experiencia agregada equivalente a la de saldos cuando se defina su ruta.
- **Catálogo:** catálogo de artículos de una empresa; el usuario selecciona productos y genera un pedido para enviar por WhatsApp. No asumir que hay pago en línea.

Cada empresa dispone de una única pantalla de administración para gestionar sus datos: saldos, equipos en reparación y artículos, según los módulos habilitados, y cargar esos datos mediante Excel. El panel global permite crear/listar empresas y configurar qué módulos utiliza cada una.

## Criterio de documentación

- Documentar solo reglas de negocio y contexto o contratos no deducibles del código que ayuden a tomar decisiones de implementación o eviten errores.
- No guardar bitácoras de tareas, cambios realizados, archivos modificados, decisiones transitorias ni pasos ya ejecutados. Comunicar el resumen del trabajo al usuario en la respuesta final, no en archivos de documentación.
- Antes de agregar o cambiar documentación, comprobar que la información siga vigente y resuelva una duda concreta; escribirla como regla o contexto actual, sin narrar cómo se llegó a ella.

## Pruebas y comentarios

- No crear pruebas unitarias, de integración, E2E ni de ningún otro tipo, salvo que el usuario lo pida explícitamente. Esta regla no restringe la ejecución de pruebas existentes.
- No agregar comentarios en ningún archivo del proyecto.

## Rutas acordadas

| Ruta                    | Uso                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `/admin/login`          | Inicio de sesión del superadmin.                                                                         |
| `/admin`                | Panel global de CRUD de empresas y módulos; requiere una sesión superadmin válida y redirige al login si no existe. |
| `/{empresa}/administracion` | Administración de una empresa: gestión de saldos, reparaciones y artículos de los módulos habilitados, incluida la carga de datos desde Excel. |
| `/{empresa}/catalogo`   | Catálogo público y armado de pedido para WhatsApp.                                                     |
| `/{empresa}/catalogo/interno` | Ingreso de usuarios Interno y consulta del catálogo de artículos de su empresa.                    |
| `/{empresa}/saldo`      | Consulta pública de saldos limitada a una empresa, mediante DNI o CUIL.                                |
| `/{empresa}/saldo/interno` | Ingreso de usuarios Interno y consulta de los saldos de su empresa.                                 |
| `/{empresa}/reparacion` | Consulta pública de reparaciones de una empresa.                                                       |

`empresa` representa el slug estable de la empresa en la URL, no su nombre de presentación. `/admin` está reservado y no puede usarse como slug. No inventar rutas para flujos aún no definidos: proponerlas y acordarlas antes de añadirlas.

`/admin` es el panel global del superadmin; `/admin/login` es su pantalla de acceso; `/{empresa}/administracion` es el panel de una empresa. Son áreas distintas.

## Organización del frontend

- Usar el **App Router**: `app/` declara rutas, layouts y páginas; mantener allí la composición necesaria para conectar la URL con su funcionalidad.
- Organizar `src/` por responsabilidades y dominios. `src/features/<dominio>/` contiene la lógica propia de cada módulo (por ejemplo `auth`, `empresa`, `articulo`, `rubro`), con sus componentes, hooks, servicios, tipos y utilidades locales.
- `src/components/` contiene componentes realmente compartidos entre features, incluidos los controles genéricos de `src/components/ui/`. No ubicar aquí componentes de una sola feature.
- `src/hooks/` y `src/services/` son para hooks y servicios compartidos entre features. Los hooks y servicios específicos de un dominio permanecen dentro de su carpeta `src/features/<dominio>/`.
- Mantener `app/` como capa de rutas y composición: los `page.tsx` y `route.ts` delegan lógica de negocio en su feature y evitan acumular formularios, llamadas al backend o reglas del dominio.
- Procurar que cada archivo, componente y servicio tenga una responsabilidad clara. Extraer componentes de presentación, formularios, menús, diálogos, acceso a datos y utilidades cuando cumplan funciones distintas; evitar componentes monolíticos.
- Crear una carpeta de feature cuando se empiece a trabajar en ella, sin generar directorios vacíos por anticipado.
- `app/globals.css` es la fuente única de los tokens visuales globales, incluidos colores y radios. Usar sus variables/utilidades Tailwind en las pantallas; no introducir valores de color ni `border-radius` directamente en componentes. Los controles reutilizables de interfaz van en `src/components/ui/`.
- Mantener una sola aplicación y una experiencia consistente, preservando las diferencias funcionales de cada módulo. No duplicar una aplicación completa por empresa.
- La configuración de módulos de la empresa es la fuente para mostrar sus páginas y opciones de gestión. No presentar como disponible un módulo deshabilitado. La interfaz no reemplaza la autorización ni las validaciones que correspondan al backend.

## Trabajo en paralelo

Puede haber varios agentes trabajando en paralelo, cada uno en un módulo distinto. Por ejemplo, un agente puede implementar la consulta de saldos mientras otro trabaja en la consulta de reparaciones; ambos pueden avanzar de forma independiente en sus rutas y archivos de dominio. La coordinación es necesaria cuando una tarea cruza esos límites o modifica piezas compartidas. Para evitar conflictos:

1. Antes de editar, revisar el estado y los cambios existentes; tratarlos como trabajo de otra persona hasta confirmar lo contrario.
2. Trabajar dentro del módulo y los archivos asignados; no hace falta esperar a otros agentes que trabajen en módulos independientes. Si no hay asignación explícita, escoger un área acotada y comunicar qué rutas/archivos se tocarán cuando pueda haber solapamiento.
3. No reescribir ni revertir cambios ajenos. Coordinar antes de modificar en paralelo layouts, estilos globales, navegación, componentes compartidos, contratos API o configuración; las páginas y lógica aisladas por módulo pueden desarrollarse en simultáneo.
4. Si una tarea requiere un cambio compartido, acordar la interfaz (props, tipos o contrato) con los dominios consumidores y mantenerla compatible. No inventar endpoints, formatos de Excel ni reglas de negocio que no estén especificados; dejar constancia de la duda y pedir definición.
5. Si un contrato compartido o una decisión de producto afecta a otros módulos, comunicarlo a los agentes que los estén implementando.

## Criterios de implementación

- La interfaz visible debe estar en español y funcionar en pantallas móviles y de escritorio; mantener accesibilidad básica (etiquetas, foco, teclado y mensajes de error comprensibles).
- DNI y CUIL son datos personales: pedir solo lo necesario y no incluirlos en logs, URLs ni almacenamiento persistente salvo que un requisito explícito lo justifique.
- Respetar TypeScript y los patrones existentes. No agregar dependencias sin necesidad y revisar la documentación local de Next.js indicada arriba antes de implementar APIs o patrones del framework.
- El gestor de paquetes del proyecto es **pnpm**. Desde `front/`, los comandos disponibles incluyen `pnpm dev`, `pnpm lint` y `pnpm build`; ejecutar los checks adecuados al cambio y comunicar cualquier fallo.
