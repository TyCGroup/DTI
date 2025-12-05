# DOCUMENTACIÓN UX/UI - MÓDULO INVENTARIO DE LAPTOPS

## 📋 ÍNDICE
1. [Flujo de Usuario](#flujo-de-usuario)
2. [Arquitectura de Información](#arquitectura-de-información)
3. [Wireframes y Layout](#wireframes-y-layout)
4. [Componentes UI](#componentes-ui)
5. [Interacciones y Estados](#interacciones-y-estados)
6. [Especificaciones Técnicas](#especificaciones-técnicas)

---

## 1. FLUJO DE USUARIO

### 1.1 Mapa de Navegación

```
Dashboard Principal
    ↓
Menú Lateral > Inventarios
    ↓
Inventario - Menú de Inicio (Landing Page)
    ├→ [Opción 1] Laptops → Vista de Inventario de Laptops
    ├→ [Opción 2] Desktops → Vista de Inventario de Desktops
    └→ [Opción 3] Periféricos → Vista de Inventario de Periféricos
```

### 1.2 Flujo de Acciones en Inventario de Laptops

```
INVENTARIO DE LAPTOPS
    │
    ├─→ Ver listado completo
    │   ├─→ Filtrar por estado (Activo/Inactivo/Todos)
    │   ├─→ Buscar por ST, marca, modelo, usuario
    │   └─→ Ordenar por columnas
    │
    ├─→ Agregar nueva laptop
    │   ├─→ Llenar formulario (15 campos)
    │   ├─→ Validar campos (incluyendo ST único)
    │   ├─→ Verificar que ST no esté duplicado
    │   │   └─→ Si existe: Mostrar error "Este ST ya está registrado"
    │   └─→ Guardar registro (solo si ST es único)
    │
    ├─→ Editar laptop existente
    │   ├─→ Abrir modal con datos prellenados
    │   ├─→ Modificar campos (ST no editable)
    │   ├─→ Guardar cambios (se guarda en historial)
    │   └─→ Actualizar vista
    │
    ├─→ Asignar/Cambiar usuario
    │   ├─→ Seleccionar laptop
    │   ├─→ Buscar usuario (filtrado en tiempo real)
    │   ├─→ Confirmar asignación
    │   └─→ Guardar en historial (máx. 5 registros)
    │
    ├─→ Cambiar estado de laptop
    │   ├─→ Marcar como inactiva
    │   ├─→ Seleccionar motivo:
    │   │   ├─→ Falla
    │   │   ├─→ Robo
    │   │   └─→ Otro (campo de texto manual)
    │   └─→ Guardar registro
    │
    ├─→ Ver historial de asignaciones
    │   ├─→ Ver últimas 5 asignaciones
    │   └─→ Ver detalles (usuario, fecha, ST)
    │
    ├─→ Vista de concentrado
    │   ├─→ Ver toda la información de un equipo
    │   ├─→ Editar información
    │   ├─→ Cambiar usuario
    │   └─→ Ver historial completo
    │
    └─→ Exportar a Excel
        ├─→ Exportar vista actual (filtrada)
        └─→ Exportar todo el inventario
```

---

## 2. ARQUITECTURA DE INFORMACIÓN

### 2.1 Estructura de Datos - Laptop

```javascript
{
  // Identificación
  id: "auto-generated",
  st: "L-12345",  // Service Tag único
  stCargador: "C-54321",  // Service Tag del cargador

  // Información del equipo
  marca: "Dell",  // Dell, HP, Lenovo, Asus, Apple
  modelo: "Latitude 5420",
  fechaAdquisicion: "2024-01-15",  // Date

  // Sistema
  sistema: "Windows 11",  // Windows 11, 10, Sequoia, Sonoma, Ventura, High Sierra
  procesador: "Intel Core i5",  // Intel i3, i5, i7

  // Hardware
  ram: "16 GB",  // 8 GB, 12 GB, 16 GB
  capacidadDisco: "480 GB",  // 240 GB, 480 GB, 1000 GB
  tipoDisco: "SSD",  // SSD, HDD

  // Propiedad y asignación
  propiedad: "Propiedad T&C",  // Arrendamiento, Usuario, Renta, Propiedad T&C
  usuarioAsignado: {
    id: "userId123",
    nombre: "Juan Pérez",
    area: "TI",
    email: "juan.perez@tyc.com"
  },

  // Estado
  activo: true,  // boolean
  motivoInactivo: null,  // null o string
  categoriaInactivo: null,  // "Falla", "Robo", "Otro"

  // Historial de asignaciones (máximo 5)
  historial: [
    {
      id: "hist1",
      usuarioId: "userId123",
      usuarioNombre: "Juan Pérez",
      st: "L-12345",
      fechaAsignacion: "2024-01-15",
      fechaRetiro: null  // null si aún está asignado
    }
    // ... máximo 5 registros
  ],

  // Metadatos
  creadoPor: "userId",
  fechaCreacion: "2024-01-15T10:00:00Z",
  modificadoPor: "userId",
  fechaModificacion: "2024-06-10T15:30:00Z"
}
```

### 2.2 Campos del Formulario (15 campos)

| # | Campo | Tipo | Opciones | Requerido | Validación |
|---|-------|------|----------|-----------|------------|
| 1 | **ST (Service Tag)** | Input text | - | Sí | Alfanumérico, único, no editable en modo edición |
| 2 | **Marca** | Select | Dell, HP, Lenovo, Asus, Apple, Otra | Sí | - |
| 3 | **Modelo** | Input text | - | Sí | Mínimo 2 caracteres |
| 4 | **Fecha de Adquisición** | Date picker | - | Sí | Fecha válida |
| 5 | **ST Cargador** | Input text | - | No | Alfanumérico |
| 6 | **Sistema Operativo** | Select | Windows 11, Windows 10, Sequoia, Sonoma, Ventura, High Sierra | Sí | - |
| 7 | **Procesador** | Select | Intel Core i3, Intel Core i5, Intel Core i7 | Sí | - |
| 8 | **RAM** | Select | 8 GB, 12 GB, 16 GB | Sí | - |
| 9 | **Capacidad de Disco** | Select | 240 GB, 480 GB, 1000 GB | Sí | - |
| 10 | **Tipo de Disco** | Select | SSD, HDD | Sí | - |
| 11 | **Propiedad** | Select | Arrendamiento, Usuario, Renta, Propiedad T&C | Sí | - |
| 12 | **Activo** | Toggle/Switch | Activo/Inactivo | Sí | - |
| 13 | **Categoría Inactivo** | Select | Falla, Robo, Otro | Condicional* | Solo si inactivo |
| 14 | **Motivo Inactivo** | Textarea | - | Condicional* | Solo si "Otro" |
| 15 | **Usuario Asignado** | Autocomplete | Lista de usuarios | No | - |

*Condicional: Solo aparece si el equipo está marcado como inactivo.

---

## 3. WIREFRAMES Y LAYOUT

### 3.1 Landing Page - Menú de Inventarios

```
┌────────────────────────────────────────────────────────────────┐
│ SIDEBAR │ HEADER                                   [User Menu] │
├─────────┼──────────────────────────────────────────────────────┤
│         │                                                       │
│ [Nav]   │  GESTIÓN DE INVENTARIOS                              │
│         │  Administra el inventario de equipos tecnológicos    │
│ • Home  │                                                       │
│ • Invent│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│   ▸ Menu│  │   💻        │  │   🖥️        │  │   ⌨️       ││
│   - Lap │  │   LAPTOPS    │  │   DESKTOPS   │  │ PERIFÉRICOS ││
│   - Desk│  │              │  │              │  │             ││
│   - Peri│  │   125 equipos│  │   80 equipos │  │  210 items  ││
│ • Usuar │  │   95 activos │  │   72 activos │  │  195 activos││
│ • ...   │  │              │  │              │  │             ││
│         │  │  [Ver más]   │  │  [Ver más]   │  │  [Ver más]  ││
│         │  └──────────────┘  └──────────────┘  └─────────────┘│
│         │                                                       │
│         │  RESUMEN GENERAL                                     │
│         │  ┌─────────────────────────────────────────────────┐│
│         │  │ Total de equipos: 415 │ Activos: 362 │ 87.2% ││
│         │  └─────────────────────────────────────────────────┘│
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

### 3.2 Vista Principal - Inventario de Laptops

```
┌────────────────────────────────────────────────────────────────┐
│ SIDEBAR │ HEADER                                   [User Menu] │
├─────────┼──────────────────────────────────────────────────────┤
│         │                                                       │
│ [Nav]   │  ← INVENTARIOS                                       │
│         │  INVENTARIO DE LAPTOPS                               │
│ • Home  │  Gestión completa del inventario de laptops          │
│ • Invent│                                                       │
│   ▸ Menu│  ┌──────────────────────────────────────────────────┐│
│   - Lap*│  │ INVENTARIO DE LAPTOPS         [+ Nueva] [Export] ││
│   - Desk│  │ 125 laptops                                      ││
│   - Peri│  └──────────────────────────────────────────────────┘│
│ • Usuar │                                                       │
│ • ...   │  ┌──────────────────────────────────────────────────┐│
│         │  │ [Todos] [Activos] [Inactivos]     [🔍 Buscar...] ││
│         │  └──────────────────────────────────────────────────┘│
│         │                                                       │
│         │  ┌──────────────────────────────────────────────────┐│
│         │  │ ST      │Marca│Modelo│Usuario│Sistema│ Estado ▾│  ││
│         │  ├─────────┼─────┼──────┼───────┼───────┼──────────┤  ││
│         │  │ L-12345 │Dell │Lat..│Juan P.│Win 11│●Activo  [⚙]││
│         │  │ L-12346 │HP   │Elit.│Maria G│Win 11│●Activo  [⚙]││
│         │  │ L-12347 │Leno.│Think│Carlos.│Win 10│○Inactivo[⚙]││
│         │  │ ...     │     │     │       │      │         [⚙]││
│         │  └──────────────────────────────────────────────────┘│
│         │                        [ 1 2 3 4 5 ... > ]          │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘

[⚙] Menú de acciones:
  • Ver detalles
  • Editar
  • Cambiar usuario
  • Ver historial
  • Marcar inactivo/activo
```

### 3.3 Modal - Agregar/Editar Laptop

```
┌──────────────────────────────────────────────────────────────────┐
│                                                               [X]│
│  AGREGAR NUEVA LAPTOP                                            │
│                                                                   │
│  INFORMACIÓN BÁSICA                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ ST (Service Tag) *  │  │ ST Cargador         │              │
│  │ [L-________]        │  │ [C-________]        │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Marca *             │  │ Modelo *            │              │
│  │ [Dell        ▾]     │  │ [Latitude 5420]     │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│  ┌─────────────────────┐                                        │
│  │ Fecha Adquisición * │                                        │
│  │ [📅 15/01/2024]     │                                        │
│  └─────────────────────┘                                        │
│                                                                   │
│  SISTEMA Y HARDWARE                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Sistema Operativo * │  │ Procesador *        │              │
│  │ [Windows 11   ▾]    │  │ [Intel Core i5 ▾]  │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐              │
│  │ RAM *    │  │ Capacidad *  │  │ Tipo Disco *│              │
│  │ [16 GB▾] │  │ [480 GB  ▾]  │  │ [SSD    ▾] │              │
│  └──────────┘  └──────────────┘  └─────────────┘              │
│                                                                   │
│  PROPIEDAD Y ASIGNACIÓN                                          │
│  ┌─────────────────────┐                                        │
│  │ Propiedad *         │                                        │
│  │ [Propiedad T&C  ▾]  │                                        │
│  └─────────────────────┘                                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Usuario Asignado (opcional)                         │        │
│  │ [Buscar usuario...                              🔍] │        │
│  │  ↓ Resultados:                                      │        │
│  │  • Juan Pérez - TI - juan.perez@tyc.com            │        │
│  │  • Juan García - Finanzas - juan.garcia@tyc.com    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
│  ESTADO DEL EQUIPO                                               │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Activo  [●────○] Inactivo                          │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
│  [Si está inactivo, mostrar:]                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Categoría *         │  │ Motivo (si "Otro")  │              │
│  │ [Falla      ▾]      │  │ [_______________]   │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                   │
│                                                                   │
│                           [Cancelar]  [Guardar Laptop]          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.4 Modal - Asignar/Cambiar Usuario

```
┌──────────────────────────────────────────────────────────────────┐
│                                                               [X]│
│  ASIGNAR USUARIO A LAPTOP                                        │
│                                                                   │
│  Laptop: L-12345 - Dell Latitude 5420                           │
│  Usuario actual: Juan Pérez                                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Buscar nuevo usuario                                │        │
│  │ [maria                                          🔍] │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
│  Resultados (se filtran mientras escribes):                     │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ ○ Maria García                                      │        │
│  │   TI - maria.garcia@tyc.com                        │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │ ○ María López                                       │        │
│  │   Finanzas - maria.lopez@tyc.com                   │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │ ○ María Rodríguez                                  │        │
│  │   RRHH - maria.rodriguez@tyc.com                   │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
│  ℹ️ Este cambio se guardará en el historial de asignaciones     │
│                                                                   │
│                           [Cancelar]  [Asignar Usuario]          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.5 Modal - Vista de Concentrado (Detalle Completo)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                               [X]│
│  DETALLES COMPLETOS - L-12345                     [✏️ Editar]   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ INFORMACIÓN DEL EQUIPO                                │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ ST:                L-12345                            │      │
│  │ ST Cargador:       C-54321                            │      │
│  │ Marca:             Dell                               │      │
│  │ Modelo:            Latitude 5420                      │      │
│  │ Fecha Adquisición: 15/01/2024                         │      │
│  │ Sistema Operativo: Windows 11 Pro                     │      │
│  │ Procesador:        Intel Core i5-1145G7               │      │
│  │ RAM:               16 GB                              │      │
│  │ Disco:             480 GB SSD                         │      │
│  │ Propiedad:         Propiedad T&C                      │      │
│  │ Estado:            ● Activo                           │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ USUARIO ASIGNADO                       [Cambiar Usuario]│    │
│  ├───────────────────────────────────────────────────────┤      │
│  │ Nombre:    Juan Pérez                                 │      │
│  │ Área:      Tecnología                                 │      │
│  │ Email:     juan.perez@tyc.com                        │      │
│  │ Asignado:  15/01/2024                                 │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ HISTORIAL DE ASIGNACIONES (Últimas 5)                │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ 1. Juan Pérez - TI                                    │      │
│  │    15/01/2024 - Presente                              │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ 2. María García - Finanzas                            │      │
│  │    10/10/2023 - 14/01/2024                            │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ 3. Carlos Ruiz - Marketing                            │      │
│  │    01/05/2023 - 09/10/2023                            │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ 4. Laura Sánchez - Operaciones                        │      │
│  │    15/01/2023 - 30/04/2023                            │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ 5. Sin asignar                                        │      │
│  │    01/12/2022 - 14/01/2023                            │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ METADATOS                                             │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │ Creado por:    Admin - 15/01/2024 10:30 AM          │      │
│  │ Modificado:    Admin - 10/06/2024 03:15 PM          │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│              [Descargar Excel]  [Editar Equipo]  [Cerrar]       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. COMPONENTES UI

### 4.1 Tarjetas de Categorías (Landing Page)

```css
.category-card {
  /* Dimensiones */
  width: 280px;
  height: 200px;

  /* Fondo degradado */
  background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));

  /* Borde y sombra */
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-md);

  /* Efecto hover */
  transition: var(--transition);
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--glow);
  border-color: var(--primary-color);
}
```

**Contenido:**
- Icono grande (💻 🖥️ ⌨️)
- Título (LAPTOPS, DESKTOPS, PERIFÉRICOS)
- Cantidad total (125 equipos)
- Cantidad activos (95 activos)
- Botón "Ver más"

### 4.2 Tabla de Inventario

**Columnas:**
1. ST (Service Tag) - Sortable
2. Marca - Filterable
3. Modelo - Sortable
4. Usuario Asignado - Searchable
5. Sistema - Filterable
6. RAM - Filterable
7. Disco - Filterable
8. Propiedad - Filterable
9. Estado - Badge (Activo/Inactivo)
10. Acciones - Menu dropdown

**Features:**
- Paginación (25, 50, 100 items por página)
- Búsqueda global en tiempo real
- Filtros por columna
- Ordenamiento por columna
- Selección múltiple (checkbox)
- Export seleccionados

### 4.3 Badges de Estado

```css
/* Estado Activo */
.status-badge.activo {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
}

/* Estado Inactivo */
.status-badge.inactivo {
  background: linear-gradient(135deg, #ff4757, #ff2e5c);
  color: white;
}

/* Estado En Mantenimiento */
.status-badge.mantenimiento {
  background: linear-gradient(135deg, #ffa502, #ff6348);
  color: white;
}
```

### 4.4 Autocomplete de Usuarios

**Features:**
- Búsqueda en tiempo real
- Filtrado mientras se escribe
- Muestra: Nombre, Área, Email
- Highlight del texto buscado
- Navegación con teclado (↑↓ Enter)
- Loading indicator mientras busca

```javascript
// Ejemplo de estructura
{
  usuarios: [
    {
      id: "user123",
      nombre: "Juan Pérez",
      area: "TI",
      email: "juan.perez@tyc.com",
      activo: true
    }
  ]
}
```

### 4.5 Toggle Switch (Activo/Inactivo)

```html
<div class="toggle-container">
  <label class="toggle-label">Estado del equipo</label>
  <div class="toggle-switch">
    <input type="checkbox" id="activoToggle" checked>
    <label for="activoToggle">
      <span class="toggle-slider"></span>
    </label>
    <span class="toggle-text">Activo</span>
  </div>
</div>
```

**Comportamiento:**
- Cuando se desactiva → Muestra campos condicionales (Categoría + Motivo)
- Animación suave de transición
- Color verde (activo) / rojo (inactivo)

### 4.6 Date Picker

- Librería: Usar input type="date" nativo
- Formato: DD/MM/YYYY
- Validación: No permitir fechas futuras
- Placeholder: "Selecciona fecha"

---

## 5. INTERACCIONES Y ESTADOS

### 5.1 Estados de Formulario

#### Estado: Vacío (Nuevo)
- Todos los campos en blanco
- Campos obligatorios marcados con *
- Hints de ayuda visibles
- Botón "Guardar" activo

#### Estado: Editando
- Campos prellenados con datos existentes
- Cambios se marcan visualmente
- Botón "Guardar Cambios" activo
- Opción "Cancelar" disponible

#### Estado: Validando
- Campos con error muestran borde rojo
- Mensaje de error debajo del campo
- Ícono de error ❌
- Botón deshabilitado hasta corregir
- **Validación de ST duplicado:**
  - Se verifica en tiempo real contra la base de datos
  - Si existe: Border rojo + mensaje "Este ST ya está registrado"
  - El equipo no puede guardarse hasta cambiar el ST

#### Estado: Guardando
- Loading spinner en botón "Guardar"
- Formulario deshabilitado
- Texto: "Guardando..."
- No permitir cerrar modal

#### Estado: Éxito
- Toast notification verde
- Modal se cierra automáticamente
- Tabla se actualiza en tiempo real
- Mensaje: "Laptop guardada exitosamente"

#### Estado: Error
- Toast notification roja
- Modal permanece abierta
- Mensaje de error específico
- Opción de reintentar

### 5.2 Interacciones de Tabla

#### Hover en Fila
```css
.table-row:hover {
  background: rgba(0, 212, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s ease;
}
```

#### Click en Fila
- Opción 1: Abrir modal de detalles completos
- Opción 2: Expandir fila inline con detalles

#### Menu de Acciones (...)
```
┌────────────────────────┐
│ 👁️  Ver detalles       │
│ ✏️  Editar             │
│ 👤  Cambiar usuario    │
│ 📋  Ver historial      │
│ ⚠️  Marcar inactivo    │
│ 🗑️  Eliminar           │
└────────────────────────┘
```

#### Selección Múltiple
- Checkbox en cada fila
- "Seleccionar todos" en header
- Acciones masivas:
  - Exportar seleccionados
  - Cambiar estado
  - Eliminar múltiples (con confirmación)

### 5.3 Filtros y Búsqueda

#### Búsqueda Global
- Placeholder: "Buscar por ST, marca, modelo, usuario..."
- Búsqueda en tiempo real (debounce 300ms)
- Highlight de resultados
- Clear button (X)
- Contador de resultados

#### Filtros Rápidos (Pills/Chips)
```
[Todos] [Activos] [Inactivos] [Windows] [Mac] [Dell] [HP]
```
- Click para activar/desactivar
- Múltiples filtros activos simultáneos
- Color cyan cuando activo
- Badge con contador

#### Filtros Avanzados (Dropdown)
- Por marca
- Por sistema operativo
- Por tipo de propiedad
- Por rango de fecha
- Por usuario asignado

### 5.4 Exportar a Excel

#### Opción 1: Export Simple
- Botón "Exportar"
- Exporta vista actual (con filtros aplicados)
- Formato: `Inventario_Laptops_YYYY-MM-DD.xlsx`

#### Opción 2: Export Personalizado (Modal)
```
┌──────────────────────────────────────────────┐
│ EXPORTAR INVENTARIO                      [X]│
│                                              │
│ Selecciona qué datos exportar:              │
│                                              │
│ ☑ Información del equipo                   │
│ ☑ Usuario asignado                         │
│ ☑ Historial de asignaciones                │
│ ☐ Metadatos (creado por, modificado)       │
│                                              │
│ Formato:                                     │
│ ○ Excel (.xlsx)                             │
│ ○ CSV                                       │
│                                              │
│ Filtrar por:                                 │
│ [Todos      ▾] [Todas las fechas     ▾]    │
│                                              │
│                   [Cancelar] [Exportar]     │
└──────────────────────────────────────────────┘
```

### 5.5 Historial de Asignaciones

#### Límite de 5 Registros
- Siempre mostrar los últimos 5
- Al agregar el 6to, eliminar el más antiguo
- FIFO (First In, First Out)

#### Registro de Historial
```javascript
{
  id: "hist_uuid",
  laptopId: "lap123",
  laptopST: "L-12345",
  usuarioAnterior: {
    id: "user123",
    nombre: "Juan Pérez",
    area: "TI"
  },
  usuarioNuevo: {
    id: "user456",
    nombre: "María García",
    area: "Finanzas"
  },
  fechaCambio: "2024-06-10T15:30:00Z",
  realizadoPor: "adminUser"
}
```

#### Vista de Historial
```
┌────────────────────────────────────────────────┐
│ HISTORIAL DE ASIGNACIONES - L-12345           │
├────────────────────────────────────────────────┤
│                                                 │
│ 1️⃣ Juan Pérez (TI)                            │
│    15/01/2024 - Presente                       │
│    Asignado por: Admin                         │
│    ───────────────────────────────────         │
│                                                 │
│ 2️⃣ María García (Finanzas)                    │
│    10/10/2023 - 14/01/2024 (96 días)          │
│    Asignado por: Admin                         │
│    Retirado por: Admin                         │
│    ───────────────────────────────────         │
│                                                 │
│ 3️⃣ Carlos Ruiz (Marketing)                    │
│    01/05/2023 - 09/10/2023 (161 días)         │
│    ───────────────────────────────────         │
│                                                 │
│ 4️⃣ Laura Sánchez (Operaciones)                │
│    15/01/2023 - 30/04/2023 (105 días)         │
│    ───────────────────────────────────         │
│                                                 │
│ 5️⃣ Sin asignar                                 │
│    01/12/2022 - 14/01/2023 (44 días)          │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 6. ESPECIFICACIONES TÉCNICAS

### 6.1 Validaciones de Formulario

```javascript
// Reglas de validación
{
  st: {
    required: true,
    pattern: /^[A-Z0-9-]+$/,
    unique: true,  // ⚠️ CRÍTICO: Verificar en BD que no exista
    minLength: 5,
    maxLength: 20,
    disabled: 'onEdit',  // No editable cuando se edita un equipo existente
    message: {
      required: 'El ST es obligatorio',
      pattern: 'Solo mayúsculas, números y guiones',
      unique: 'Este ST ya está registrado en el sistema. No se puede duplicar.',
      minLength: 'Mínimo 5 caracteres'
    }
  },
  marca: {
    required: true,
    message: { required: 'Selecciona una marca' }
  },
  modelo: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: { required: 'El modelo es obligatorio' }
  },
  fechaAdquisicion: {
    required: true,
    date: true,
    maxDate: 'today',  // No fechas futuras
    message: {
      required: 'La fecha es obligatoria',
      maxDate: 'No se permiten fechas futuras'
    }
  },
  sistema: { required: true },
  procesador: { required: true },
  ram: { required: true },
  capacidadDisco: { required: true },
  tipoDisco: { required: true },
  propiedad: { required: true },

  // Condicionales
  categoriaInactivo: {
    requiredIf: (form) => form.activo === false,
    message: { required: 'Selecciona una categoría' }
  },
  motivoInactivo: {
    requiredIf: (form) => {
      return form.activo === false && form.categoriaInactivo === 'Otro';
    },
    minLength: 10,
    maxLength: 500,
    message: {
      required: 'Especifica el motivo',
      minLength: 'Mínimo 10 caracteres'
    }
  }
}
```

### 6.2 Opciones de Selects

```javascript
const LAPTOP_OPTIONS = {
  MARCAS: [
    { value: 'dell', label: 'Dell' },
    { value: 'hp', label: 'HP' },
    { value: 'lenovo', label: 'Lenovo' },
    { value: 'asus', label: 'Asus' },
    { value: 'apple', label: 'Apple' },
    { value: 'otra', label: 'Otra' }
  ],

  SISTEMAS: [
    { value: 'windows11', label: 'Windows 11' },
    { value: 'windows10', label: 'Windows 10' },
    { value: 'sequoia', label: 'macOS Sequoia' },
    { value: 'sonoma', label: 'macOS Sonoma' },
    { value: 'ventura', label: 'macOS Ventura' },
    { value: 'highsierra', label: 'macOS High Sierra' }
  ],

  PROCESADORES: [
    { value: 'i3', label: 'Intel Core i3' },
    { value: 'i5', label: 'Intel Core i5' },
    { value: 'i7', label: 'Intel Core i7' }
  ],

  RAM: [
    { value: '8', label: '8 GB' },
    { value: '12', label: '12 GB' },
    { value: '16', label: '16 GB' }
  ],

  CAPACIDAD_DISCO: [
    { value: '240', label: '240 GB' },
    { value: '480', label: '480 GB' },
    { value: '1000', label: '1000 GB' }
  ],

  TIPO_DISCO: [
    { value: 'ssd', label: 'SSD' },
    { value: 'hdd', label: 'HDD' }
  ],

  PROPIEDAD: [
    { value: 'arrendamiento', label: 'Arrendamiento' },
    { value: 'usuario', label: 'Usuario' },
    { value: 'renta', label: 'Renta' },
    { value: 'propiedadtyc', label: 'Propiedad T&C' }
  ],

  CATEGORIA_INACTIVO: [
    { value: 'falla', label: 'Falla' },
    { value: 'robo', label: 'Robo' },
    { value: 'otro', label: 'Otro' }
  ]
};
```

### 6.3 Estructura Firebase/Firestore

**Colección:** `inventarios_laptops`

```javascript
// Documento
{
  // Auto-generated ID
  id: "auto-firestore-id",

  // Datos del equipo
  st: "L-12345",
  stCargador: "C-54321",
  marca: "dell",
  modelo: "Latitude 5420",
  fechaAdquisicion: Timestamp,

  // Sistema
  sistema: "windows11",
  procesador: "i5",

  // Hardware
  ram: "16",
  capacidadDisco: "480",
  tipoDisco: "ssd",

  // Propiedad
  propiedad: "propiedadtyc",

  // Usuario asignado (subdocumento)
  usuarioAsignado: {
    id: "userId123",
    nombre: "Juan Pérez",
    area: "TI",
    email: "juan.perez@tyc.com"
  },

  // Estado
  activo: true,
  categoriaInactivo: null,
  motivoInactivo: null,

  // Historial (array de objetos, máx 5)
  historial: [
    {
      id: "hist1",
      usuarioId: "userId123",
      usuarioNombre: "Juan Pérez",
      usuarioArea: "TI",
      fechaAsignacion: Timestamp,
      fechaRetiro: null
    }
  ],

  // Metadatos
  creadoPor: "adminUserId",
  fechaCreacion: Timestamp,
  modificadoPor: "adminUserId",
  fechaModificacion: Timestamp
}
```

**Índices necesarios:**
- `st` (unique) ⚠️ **CRÍTICO: Índice único para prevenir duplicados**
- `activo`
- `marca`
- `sistema`
- `usuarioAsignado.id`
- `fechaCreacion` (desc)

**Reglas de seguridad Firestore:**
```javascript
// Validar que el ST sea único
match /inventarios_laptops/{laptopId} {
  allow create: if request.auth != null
    && !exists(/databases/$(database)/documents/inventarios_laptops/$(request.resource.data.st));

  allow update: if request.auth != null
    && request.resource.data.st == resource.data.st; // No permitir cambiar ST
}

### 6.4 Performance y Optimización

#### Lazy Loading
- Tabla: Cargar 25 items inicialmente
- Paginación: Cargar por demanda
- Imágenes/iconos: Lazy load

#### Debouncing
- Búsqueda: 300ms
- Autocomplete usuarios: 200ms
- Filtros: 150ms

#### Caching
- Lista de usuarios: Cache local 5 minutos
- Opciones de selects: Cache permanente
- Últimas búsquedas: LocalStorage

#### Real-time Updates
- Listener de Firestore para cambios en tiempo real
- Solo en vista de tabla activa
- Desconectar listener al salir de la vista

### 6.5 Permisos y Roles

```javascript
PERMISSIONS = {
  // Ver inventario
  VIEW_LAPTOP_INVENTORY: 'view_laptop_inventory',

  // Crear laptop
  CREATE_LAPTOP: 'create_laptop',

  // Editar laptop
  EDIT_LAPTOP: 'edit_laptop',

  // Eliminar laptop
  DELETE_LAPTOP: 'delete_laptop',

  // Asignar/cambiar usuario
  ASSIGN_USER: 'assign_user',

  // Ver historial
  VIEW_HISTORY: 'view_history',

  // Exportar
  EXPORT_INVENTORY: 'export_inventory'
};

ROLE_PERMISSIONS = {
  SuperAdmin: ['*'],  // Todos los permisos
  Admin: [
    'view_laptop_inventory',
    'create_laptop',
    'edit_laptop',
    'delete_laptop',
    'assign_user',
    'view_history',
    'export_inventory'
  ],
  Usuario: [
    'view_laptop_inventory',
    'view_history'
  ],
  Becario: [
    'view_laptop_inventory'
  ]
};
```

### 6.6 Mensajes de Usuario

```javascript
MESSAGES = {
  SUCCESS: {
    LAPTOP_CREATED: 'Laptop agregada exitosamente',
    LAPTOP_UPDATED: 'Laptop actualizada correctamente',
    LAPTOP_DELETED: 'Laptop eliminada correctamente',
    USER_ASSIGNED: 'Usuario asignado correctamente',
    EXPORTED: 'Inventario exportado exitosamente'
  },

  ERROR: {
    ST_DUPLICATE: 'Este ST ya está registrado en el sistema. No se puede duplicar.',
    ST_DUPLICATE_DETAIL: 'El equipo con ST {st} ya existe. Por favor verifica el número de serie.',
    REQUIRED_FIELDS: 'Por favor completa todos los campos obligatorios',
    INVALID_DATE: 'Fecha inválida',
    LOAD_FAILED: 'Error al cargar inventario',
    SAVE_FAILED: 'Error al guardar. Intenta nuevamente',
    DELETE_FAILED: 'Error al eliminar',
    NO_PERMISSION: 'No tienes permisos para esta acción'
  },

  WARNING: {
    DELETE_CONFIRM: '¿Estás seguro de eliminar esta laptop?',
    UNSAVED_CHANGES: 'Hay cambios sin guardar. ¿Deseas salir?',
    INACTIVE_REASON: 'Por favor especifica el motivo'
  },

  INFO: {
    LOADING: 'Cargando inventario...',
    SAVING: 'Guardando cambios...',
    SEARCHING: 'Buscando...',
    NO_RESULTS: 'No se encontraron resultados',
    EMPTY_INVENTORY: 'No hay laptops en el inventario'
  }
};
```

---

## 7. RESPONSIVIDAD

### 7.1 Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Ocultar sidebar */
  /* Tabla en modo card */
  /* Formulario a una columna */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Sidebar colapsado */
  /* Tabla con menos columnas */
  /* Formulario a dos columnas */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Layout completo */
  /* Tabla completa */
  /* Formulario a tres columnas */
}
```

### 7.2 Mobile-first Considerations

**Navegación:**
- Hamburger menu
- Bottom navigation bar
- Gestures (swipe)

**Tabla:**
- Convertir a cards
- Acciones en menu bottom sheet
- Scroll horizontal para detalles

**Formulario:**
- Una columna
- Inputs más grandes
- Date picker nativo
- Autocomplete fullscreen

---

## 8. ACCESIBILIDAD (A11Y)

### 8.1 WCAG 2.1 Nivel AA

```html
<!-- Labels para inputs -->
<label for="stInput">ST (Service Tag) *</label>
<input id="stInput" name="st" aria-required="true" aria-describedby="stHint">
<span id="stHint" class="form-hint">Ejemplo: L-12345</span>

<!-- Estado de error -->
<input aria-invalid="true" aria-describedby="stError">
<span id="stError" role="alert">El ST es obligatorio</span>

<!-- Botones con descripción -->
<button aria-label="Agregar nueva laptop">
  <svg aria-hidden="true">...</svg>
  Nueva Laptop
</button>

<!-- Modal -->
<div role="dialog" aria-labelledby="modalTitle" aria-modal="true">
  <h2 id="modalTitle">Agregar Laptop</h2>
  ...
</div>

<!-- Tabla -->
<table role="grid" aria-label="Inventario de laptops">
  <thead>
    <tr role="row">
      <th scope="col" role="columnheader">ST</th>
    </tr>
  </thead>
</table>
```

### 8.2 Navegación por Teclado

- Tab: Navegar entre campos
- Shift+Tab: Navegar hacia atrás
- Enter: Submit formulario / Abrir modal
- Esc: Cerrar modal
- ↑↓: Navegar autocomplete
- Space: Toggle switch

### 8.3 Screen Readers

- Anuncios de cambios dinámicos
- Labels descriptivos
- Estados de carga
- Mensajes de error

---

## 9. ANIMACIONES Y TRANSICIONES

### 9.1 Micro-interacciones

```css
/* Hover en botones */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Fade in tabla */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal entrada */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 9.2 Principios de Animación

- **Duración:** 200-400ms (rápido), 400-600ms (normal)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (material design)
- **Reducir movimiento:** Respetar `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. TESTING Y QA

### 10.1 Checklist de Testing

**Funcional:**
- [ ] Agregar laptop con todos los campos
- [ ] Editar laptop existente
- [ ] Eliminar laptop (con confirmación)
- [ ] Asignar usuario a laptop
- [ ] Cambiar usuario de laptop
- [ ] Marcar laptop como inactiva
- [ ] Ver historial de asignaciones
- [ ] Exportar a Excel
- [ ] Búsqueda global funciona
- [ ] Filtros funcionan correctamente
- [ ] Paginación funciona
- [ ] Ordenamiento por columnas

**Validación:**
- [ ] ST duplicado muestra error inmediato
- [ ] ST duplicado bloquea el guardado
- [ ] No se puede editar ST en modo edición
- [ ] Verificación de ST en tiempo real funciona
- [ ] Campos requeridos validan
- [ ] Fecha no permite futuro
- [ ] Campos condicionales aparecen
- [ ] Mensajes de error claros

**UI/UX:**
- [ ] Modales se abren/cierran
- [ ] Animaciones suaves
- [ ] Loading indicators visibles
- [ ] Toast notifications aparecen
- [ ] Colores y contraste correctos

**Responsividad:**
- [ ] Mobile (320px - 768px)
- [ ] Tablet (769px - 1024px)
- [ ] Desktop (1025px+)

**Accesibilidad:**
- [ ] Navegación por teclado
- [ ] Screen reader compatible
- [ ] Contraste WCAG AA
- [ ] Focus visible

**Performance:**
- [ ] Carga inicial < 2s
- [ ] Búsqueda < 300ms
- [ ] Firestore listeners optimizados
- [ ] Sin memory leaks

---

## 11. PRÓXIMOS PASOS (DESKTOP Y PERIFÉRICOS)

### Desktop
- Campos similares a laptop
- Agregar: Monitor incluido (Sí/No), Tamaño monitor
- Historial igual (máx 5)

### Periféricos
- Categorías: Mouse, Teclado, Monitor, Webcam, Headset
- Campos: ST, Marca, Modelo, Tipo, Estado, Usuario
- Sin historial de asignaciones
- Posibilidad de asignar múltiples a un usuario

---

## 12. RECURSOS Y REFERENCIAS

**Librerías Sugeridas:**
- SheetJS (XLSX): Export a Excel
- Flatpickr: Date picker
- Fuse.js: Búsqueda fuzzy (opcional)

**Iconos:**
- Heroicons (ya usado en el proyecto)
- SVG inline

**Tipografía:**
- Sistema: -apple-system, BlinkMacSystemFont, "Segoe UI"

**Colores:**
- Cyan: #00d4ff
- Verde: #00ff88
- Rojo: #ff4757
- Azul: #0066cc

---

## CONCLUSIÓN

Esta documentación UX/UI proporciona una guía completa para implementar el módulo de inventario de laptops. Sigue los patrones del proyecto existente y garantiza una experiencia de usuario consistente y profesional.

**Puntos clave:**
✅ 15 campos del formulario claramente definidos
✅ **ST (Service Tag) único y no duplicable - VALIDACIÓN CRÍTICA**
✅ ST no editable en modo edición (solo lectura)
✅ Verificación en tiempo real contra base de datos
✅ Historial de asignaciones (máx 5) implementado
✅ Filtros y búsqueda robustos
✅ Estados activo/inactivo con motivos
✅ Autocomplete de usuarios con filtrado en tiempo real
✅ Vista de concentrado con toda la información
✅ Export a Excel
✅ Diseño responsive y accesible
✅ Siguiendo arquitectura del proyecto DTI

---

**Fecha:** Diciembre 2025
**Proyecto:** DTI - T&C Group
**Módulo:** Inventario de Laptops
**Versión:** 1.0
