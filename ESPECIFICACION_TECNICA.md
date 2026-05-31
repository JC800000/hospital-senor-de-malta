# Hospital Señor de Malta — Especificación Técnica Completa

---

## 1. VISIÓN GENERAL DEL SISTEMA

Sistema de gestión hospitalaria compuesto por dos subsistemas:

- **Sistema Interno**: Usado por el personal del hospital (director, administrativos, médicos, especialistas, farmacéuticos). Interfaz tipo dashboard con sidebar.
- **Portal del Paciente**: Usado por los pacientes desde su celular. Interfaz móvil simplificada.

---

## 2. STACK TECNOLÓGICO

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.11+ | Lenguaje base |
| Django | 4.2 LTS | Framework web |
| graphene-django | 3.2.x | GraphQL sobre Django |
| django-graphql-jwt | 0.4.x | Autenticación JWT con GraphQL |
| psycopg | 3.x | Driver PostgreSQL (psycopg v3, NO psycopg2) |
| django-cors-headers | 4.x | CORS para el frontend |
| python-dotenv | 1.x | Variables de entorno |

### Base de datos
| Tecnología | Versión | Uso |
|---|---|---|
| PostgreSQL | 15+ | Base de datos principal |
| Nombre BD | `hospital_bd` | |
| Usuario | `postgres` | |
| Contraseña | `root` | |
| Host | `localhost` | |
| Puerto | `5432` | |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18+ | Framework UI |
| Vite | 5+ | Bundler / dev server |
| TailwindCSS | 3.x | Estilos utilitarios |
| Apollo Client | 3.x | Cliente GraphQL |
| React Router | 6.x | Enrutamiento |
| @fortawesome/react-fontawesome | 0.2.x | Íconos |
| chart.js + react-chartjs-2 | latest | Gráficos |

### Comunicación
- **Protocolo**: GraphQL sobre HTTP POST
- **Endpoint único**: `http://localhost:8000/graphql/`
- **Autenticación**: JWT en header `Authorization: JWT <token>`
- **CORS**: habilitado para `http://localhost:5173`

---

## 3. ESTRUCTURA DE CARPETAS

```
hospital-senor-de-malta/
├── iniciar-todo.bat                ← Script que arranca todo
│
├── backend/
│   ├── .env                        ← Variables de entorno
│   ├── manage.py
│   ├── requirements.txt
│   ├── hospital_backend/           ← Proyecto Django
│   │   ├── settings.py
│   │   ├── urls.py                 ← Solo expone /graphql/ y /admin/
│   │   ├── schema.py               ← Schema raíz (une todos los módulos)
│   │   └── wsgi.py
│   │
│   ├── autenticacion/              ← Módulo 1
│   │   ├── models.py               ← Usuario (personal del hospital)
│   │   ├── schema.py               ← Query + Mutations de auth
│   │   └── admin.py
│   │
│   ├── pacientes/                  ← Módulo 2
│   │   ├── models.py               ← Paciente
│   │   ├── schema.py
│   │   └── admin.py
│   │
│   ├── tickets/                    ← Módulo 3
│   │   ├── models.py               ← Ticket, Cola
│   │   ├── schema.py
│   │   └── admin.py
│   │
│   ├── consultas/                  ← Módulo 4
│   │   ├── models.py               ← Consulta, SignosVitales, Derivacion
│   │   ├── schema.py
│   │   └── admin.py
│   │
│   ├── recetas/                    ← Módulo 5
│   │   ├── models.py               ← Receta, ItemReceta
│   │   ├── schema.py
│   │   └── admin.py
│   │
│   ├── farmacia/                   ← Módulo 6
│   │   ├── models.py               ← Medicamento, StockMedicamento
│   │   ├── schema.py
│   │   └── admin.py
│   │
│   └── reportes/                   ← Módulo 7
│       └── schema.py               ← Solo queries de agregación
│
└── frontend/
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← Router principal
        ├── index.css               ← Tailwind + fuente Inter
        │
        ├── graphql/
        │   ├── client.js           ← Apollo Client + auth link
        │   └── queries/
        │       ├── auth.js
        │       ├── pacientes.js
        │       ├── tickets.js
        │       ├── consultas.js
        │       ├── recetas.js
        │       └── farmacia.js
        │
        ├── context/
        │   └── AuthContext.jsx     ← Estado global de sesión
        │
        ├── layouts/
        │   ├── AdminLayout.jsx     ← Sidebar + header (sistema interno)
        │   └── PatientLayout.jsx   ← Bottom nav (portal paciente)
        │
        ├── components/
        │   ├── ui/
        │   │   ├── Sidebar.jsx
        │   │   ├── Modal.jsx
        │   │   ├── Badge.jsx
        │   │   ├── Spinner.jsx
        │   │   └── EmptyState.jsx
        │   └── shared/
        │       ├── TicketCard.jsx
        │       └── PacienteCard.jsx
        │
        └── pages/
            ├── staff/
            │   ├── Login.jsx               ← Pantalla 01
            │   ├── Dashboard.jsx           ← Pantalla 02
            │   ├── GestionMedicos.jsx      ← Pantalla 03
            │   ├── Reportes.jsx            ← Pantalla 04
            │   ├── Recepcion.jsx           ← Pantalla 05
            │   ├── RegistroPaciente.jsx    ← Pantalla 06
            │   ├── EmisionTicket.jsx       ← Pantalla 07
            │   ├── PanelMedico.jsx         ← Pantalla 08
            │   ├── ConsultaMedica.jsx      ← Pantalla 09
            │   ├── PanelEspecialista.jsx   ← Pantalla 10
            │   ├── Farmacia.jsx            ← Pantalla 11
            │   ├── HistorialMedico.jsx     ← Pantalla 12
            │   └── Migracion.jsx           ← Pantalla 13
            └── patient/
                ├── LoginPaciente.jsx       ← Pantalla 14
                ├── InicioPaciente.jsx      ← Pantalla 15
                ├── TicketRemoto.jsx        ← Pantalla 16
                └── MisRecetas.jsx          ← Pantalla 17
```

---

## 4. BASE DE DATOS — ESQUEMA COMPLETO

### Tabla: `usuarios` (app: autenticacion)
```
id              SERIAL PRIMARY KEY
ci              VARCHAR(20) UNIQUE NOT NULL        ← login field
nombres         VARCHAR(100) NOT NULL
apellidos       VARCHAR(100) NOT NULL
rol             VARCHAR(20) NOT NULL               ← ver ENUM abajo
especialidad    VARCHAR(100) NULL                  ← solo médico/especialista
turno           VARCHAR(10) DEFAULT 'manana'       ← manana|tarde|ambos
activo          BOOLEAN DEFAULT TRUE
password        VARCHAR(255) NOT NULL              ← hash Django
is_staff        BOOLEAN DEFAULT FALSE
fecha_creacion  TIMESTAMPTZ AUTO
ultimo_acceso   TIMESTAMPTZ NULL
```
Roles válidos: `director | administrativo | medico | especialista | farmacia`

---

### Tabla: `pacientes` (app: pacientes)
```
id              SERIAL PRIMARY KEY
ci              VARCHAR(20) UNIQUE NOT NULL
nombres         VARCHAR(100) NOT NULL
apellidos       VARCHAR(100) NOT NULL
fecha_nac       DATE NOT NULL
sexo            CHAR(1) NOT NULL                   ← M | F
estado_civil    VARCHAR(20)                        ← soltero|casado|viudo|divorciado
ocupacion       VARCHAR(100)
departamento    VARCHAR(50)
municipio       VARCHAR(100)
direccion       TEXT
telefono        VARCHAR(20)
idioma_principal VARCHAR(30) DEFAULT 'español'
tipo_sangre     VARCHAR(5)                         ← A+|A-|B+|B-|O+|O-|AB+|AB-
alergias        TEXT NULL
observaciones   TEXT NULL
activo          BOOLEAN DEFAULT TRUE
fecha_registro  TIMESTAMPTZ AUTO
registrado_por  FK → usuarios(id) NULL
```

---

### Tabla: `tickets` (app: tickets)
```
id              SERIAL PRIMARY KEY
numero          VARCHAR(10) NOT NULL               ← Ej: T-022
paciente        FK → pacientes(id)
tipo            VARCHAR(15) DEFAULT 'presencial'   ← presencial|remoto
turno           VARCHAR(10)                        ← manana|tarde
estado          VARCHAR(15) DEFAULT 'esperando'    ← esperando|llamado|atendiendo|atendido|cancelado
fecha_emision   TIMESTAMPTZ AUTO
fecha_llamado   TIMESTAMPTZ NULL
fecha_atencion  TIMESTAMPTZ NULL
emitido_por     FK → usuarios(id) NULL             ← NULL si fue remoto
tiempo_espera_est INT NULL                         ← minutos estimados
posicion_cola   INT NULL
```

---

### Tabla: `consultas` (app: consultas)
```
id              SERIAL PRIMARY KEY
ticket          FK → tickets(id)
paciente        FK → pacientes(id)
medico          FK → usuarios(id)
fecha_inicio    TIMESTAMPTZ AUTO
fecha_fin       TIMESTAMPTZ NULL
motivo          TEXT
diagnostico     TEXT
observaciones   TEXT NULL
tipo            VARCHAR(15) DEFAULT 'general'      ← general|especialidad
especialidad    VARCHAR(100) NULL                  ← si tipo=especialidad
derivado_por    FK → usuarios(id) NULL             ← médico que derivó
estado          VARCHAR(15) DEFAULT 'activa'       ← activa|finalizada
```

---

### Tabla: `signos_vitales` (app: consultas)
```
id              SERIAL PRIMARY KEY
consulta        FK → consultas(id) UNIQUE
temperatura     DECIMAL(4,1) NULL                  ← °C
presion_sistolica   INT NULL                       ← mmHg
presion_diastolica  INT NULL                       ← mmHg
peso            DECIMAL(5,2) NULL                  ← kg
talla           DECIMAL(5,2) NULL                  ← cm
frecuencia_cardiaca INT NULL                       ← bpm
saturacion_oxigeno  INT NULL                       ← %
glucosa         INT NULL                           ← mg/dL
fecha_registro  TIMESTAMPTZ AUTO
```

---

### Tabla: `derivaciones` (app: consultas)
```
id              SERIAL PRIMARY KEY
consulta_origen FK → consultas(id)
paciente        FK → pacientes(id)
medico_origen   FK → usuarios(id)
especialidad_destino VARCHAR(100)
medico_destino  FK → usuarios(id) NULL
motivo          TEXT
estado          VARCHAR(15) DEFAULT 'pendiente'    ← pendiente|aceptada|finalizada
fecha_derivacion TIMESTAMPTZ AUTO
fecha_atencion  TIMESTAMPTZ NULL
notas_especialista TEXT NULL
```

---

### Tabla: `recetas` (app: recetas)
```
id              SERIAL PRIMARY KEY
consulta        FK → consultas(id)
paciente        FK → pacientes(id)
medico          FK → usuarios(id)
estado          VARCHAR(15) DEFAULT 'pendiente'    ← pendiente|despachada
fecha_emision   TIMESTAMPTZ AUTO
fecha_despacho  TIMESTAMPTZ NULL
despachado_por  FK → usuarios(id) NULL
```

---

### Tabla: `items_receta` (app: recetas)
```
id              SERIAL PRIMARY KEY
receta          FK → recetas(id)
medicamento_nombre VARCHAR(150)
dosis           VARCHAR(50)                        ← Ej: 500mg
frecuencia      VARCHAR(200)                       ← Ej: 1 cápsula cada 8 horas
duracion        VARCHAR(100)                       ← Ej: 7 días
```

---

### Tabla: `medicamentos` (app: farmacia)
```
id              SERIAL PRIMARY KEY
nombre          VARCHAR(150) NOT NULL
presentacion    VARCHAR(100)                       ← Tableta 500mg, Jarabe 250ml, etc.
stock_actual    INT DEFAULT 0
stock_minimo    INT DEFAULT 10
unidad          VARCHAR(20) DEFAULT 'unidades'
fecha_vencimiento DATE NULL
proveedor       VARCHAR(150) NULL
activo          BOOLEAN DEFAULT TRUE
ultima_actualizacion TIMESTAMPTZ AUTO
```

---

## 5. ROLES Y PERMISOS

| Rol | Accede a |
|---|---|
| `director` | Todo el sistema. Dashboard, reportes, gestión de médicos, todos los módulos. |
| `administrativo` | Recepción, emisión de tickets, registro de pacientes. |
| `medico` | Panel médico, consulta médica, historial de pacientes, emitir recetas, derivar. |
| `especialista` | Panel especialista, consulta médica, historial, emitir recetas. |
| `farmacia` | Panel farmacia: ver recetas pendientes, despachar, gestionar stock. |

**Regla**: Todo endpoint GraphQL requiere token JWT excepto `login`.
**Regla**: El backend valida el rol en cada resolver antes de devolver datos.

---

## 6. SCHEMA GRAPHQL COMPLETO

### Types

```graphql
type UsuarioType {
  id: ID!
  ci: String!
  nombreCompleto: String!
  nombres: String!
  apellidos: String!
  rol: String!
  rolDisplay: String!
  especialidad: String
  turno: String!
  activo: Boolean!
  fechaCreacion: DateTime!
  ultimoAcceso: DateTime
  panelDestino: String!
}

type LoginResult {
  exito: Boolean!
  mensaje: String!
  token: String
  usuario: UsuarioType
}

type PacienteType {
  id: ID!
  ci: String!
  nombreCompleto: String!
  nombres: String!
  apellidos: String!
  fechaNac: Date!
  edad: Int!
  sexo: String!
  telefono: String
  direccion: String
  tipoSangre: String
  alergias: String
  activo: Boolean!
  fechaRegistro: DateTime!
}

type TicketType {
  id: ID!
  numero: String!
  paciente: PacienteType!
  tipo: String!
  turno: String!
  estado: String!
  fechaEmision: DateTime!
  tiempoEsperaEst: Int
  posicionCola: Int
}

type ConsultaType {
  id: ID!
  ticket: TicketType!
  paciente: PacienteType!
  medico: UsuarioType!
  fechaInicio: DateTime!
  fechaFin: DateTime
  motivo: String!
  diagnostico: String
  estado: String!
  signosVitales: SignosVitalesType
  receta: RecetaType
  derivacion: DerivacionType
}

type SignosVitalesType {
  temperatura: Float
  presionSistolica: Int
  presionDiastolica: Int
  peso: Float
  talla: Float
  frecuenciaCardiaca: Int
  saturacionOxigeno: Int
  glucosa: Int
}

type DerivacionType {
  id: ID!
  paciente: PacienteType!
  medicoOrigen: UsuarioType!
  especialidadDestino: String!
  medicoDestino: UsuarioType
  motivo: String!
  estado: String!
  fechaDerivacion: DateTime!
}

type RecetaType {
  id: ID!
  paciente: PacienteType!
  medico: UsuarioType!
  estado: String!
  fechaEmision: DateTime!
  items: [ItemRecetaType!]!
}

type ItemRecetaType {
  id: ID!
  medicamentoNombre: String!
  dosis: String!
  frecuencia: String!
  duracion: String!
}

type MedicamentoType {
  id: ID!
  nombre: String!
  presentacion: String!
  stockActual: Int!
  stockMinimo: Int!
  fechaVencimiento: Date
  alertaStock: String!     # ok | bajo | agotado | vencido
}

type ColaEstadoType {
  totalEspera: Int!
  tiempoPromedioMin: Int!
  ticketActual: String
  medicosActivos: Int!
}

type ResultadoType {
  exito: Boolean!
  mensaje: String!
}
```

---

### Queries

```graphql
type Query {
  # Auth
  yo: UsuarioType

  # Usuarios / Médicos
  usuarios(rol: String, activo: Boolean): [UsuarioType!]!
  usuarioPorCi(ci: String!): UsuarioType

  # Pacientes
  pacientes(busqueda: String, limite: Int): [PacienteType!]!
  pacientePorCi(ci: String!): PacienteType
  pacientePorId(id: ID!): PacienteType

  # Tickets
  tickets(estado: String, turno: String): [TicketType!]!
  colaEstado: ColaEstadoType!
  misTicketsActivos: [TicketType!]!    # Para el paciente autenticado

  # Consultas
  consultas(medicoId: ID, pacienteId: ID, estado: String): [ConsultaType!]!
  consultaPorId(id: ID!): ConsultaType
  historialPaciente(pacienteId: ID!): [ConsultaType!]!
  consultaActiva(medicoId: ID!): ConsultaType

  # Derivaciones
  derivaciones(medicoDestinoId: ID, estado: String): [DerivacionType!]!

  # Recetas
  recetasPorPaciente(pacienteId: ID!): [RecetaType!]!
  recetasPendientes: [RecetaType!]!     # Para farmacia

  # Farmacia
  medicamentos(busqueda: String, soloAlertas: Boolean): [MedicamentoType!]!

  # Reportes (solo director/admin)
  reporteResumen(fechaInicio: Date!, fechaFin: Date!): ReporteResumenType!
}
```

---

### Mutations

```graphql
type Mutation {
  # ── Autenticación ──
  login(ci: String!, password: String!): LoginResult!
  cambiarPassword(passwordActual: String!, passwordNuevo: String!): ResultadoType!
  refreshToken(token: String!): TokenPayload!
  verifyToken(token: String!): TokenPayload!

  # ── Usuarios ──
  crearUsuario(input: UsuarioInput!): UsuarioType!
  actualizarUsuario(id: ID!, input: UsuarioInput!): UsuarioType!
  toggleUsuarioActivo(id: ID!): UsuarioType!

  # ── Pacientes ──
  registrarPaciente(input: PacienteInput!): PacienteType!
  actualizarPaciente(id: ID!, input: PacienteInput!): PacienteType!

  # ── Tickets ──
  emitirTicket(pacienteId: ID!, tipo: String!, turno: String!): TicketType!
  llamarSiguienteTicket(medicoId: ID!): TicketType
  marcarTicketAtendido(ticketId: ID!): TicketType!
  cancelarTicket(ticketId: ID!): ResultadoType!

  # ── Consultas ──
  iniciarConsulta(ticketId: ID!, motivo: String!): ConsultaType!
  finalizarConsulta(
    consultaId: ID!
    diagnostico: String!
    observaciones: String
    signosVitales: SignosVitalesInput
  ): ConsultaType!

  # ── Recetas ──
  emitirReceta(consultaId: ID!, items: [ItemRecetaInput!]!): RecetaType!
  despacharReceta(recetaId: ID!): RecetaType!

  # ── Derivaciones ──
  derivarPaciente(
    consultaId: ID!
    especialidadDestino: String!
    medicoDestinoId: ID
    motivo: String!
  ): DerivacionType!
  aceptarDerivacion(derivacionId: ID!): DerivacionType!

  # ── Farmacia ──
  registrarMedicamento(input: MedicamentoInput!): MedicamentoType!
  actualizarStock(medicamentoId: ID!, cantidad: Int!, operacion: String!): MedicamentoType!
}
```

---

### Inputs

```graphql
input UsuarioInput {
  ci: String!
  nombres: String!
  apellidos: String!
  rol: String!
  especialidad: String
  turno: String
  password: String
}

input PacienteInput {
  ci: String!
  nombres: String!
  apellidos: String!
  fechaNac: Date!
  sexo: String!
  estadoCivil: String
  ocupacion: String
  departamento: String
  municipio: String
  direccion: String
  telefono: String
  idiomaPersonal: String
  tipoSangre: String
  alergias: String
  observaciones: String
}

input SignosVitalesInput {
  temperatura: Float
  presionSistolica: Int
  presionDiastolica: Int
  peso: Float
  talla: Float
  frecuenciaCardiaca: Int
  saturacionOxigeno: Int
  glucosa: Int
}

input ItemRecetaInput {
  medicamentoNombre: String!
  dosis: String!
  frecuencia: String!
  duracion: String!
}

input MedicamentoInput {
  nombre: String!
  presentacion: String!
  stockActual: Int!
  stockMinimo: Int!
  unidad: String
  fechaVencimiento: Date
  proveedor: String
}
```

---

## 7. RUTAS DEL FRONTEND

### Sistema Interno (requiere JWT)
| Ruta | Componente | Descripción |
|---|---|---|
| `/login` | `Login.jsx` | Login del personal. Redirige según rol. |
| `/dashboard` | `Dashboard.jsx` | KPIs, gráficos, tabla médicos activos. |
| `/recepcion` | `Recepcion.jsx` | Cola de espera, buscador CI, emitir ticket. |
| `/registro-paciente` | `RegistroPaciente.jsx` | Formulario 4 pasos nuevo paciente. |
| `/emision-ticket/:pacienteId` | `EmisionTicket.jsx` | Muestra el ticket generado. |
| `/medico` | `PanelMedico.jsx` | Paciente actual, cola, cronómetro. |
| `/consulta/:consultaId` | `ConsultaMedica.jsx` | 3 tabs: historial, consulta, derivar. |
| `/especialista` | `PanelEspecialista.jsx` | Lista derivaciones, consulta especializada. |
| `/farmacia` | `Farmacia.jsx` | 2 tabs: recetas pendientes, stock. |
| `/historiales` | `HistorialMedico.jsx` | Timeline expandible de consultas. |
| `/medicos` | `GestionMedicos.jsx` | CRUD médicos, toggle activo. |
| `/reportes` | `Reportes.jsx` | Gráficos, filtros, exportar. |
| `/migracion` | `Migracion.jsx` | Manual o bulk import CSV/Excel. |

### Portal Paciente (autenticación por CI)
| Ruta | Componente | Descripción |
|---|---|---|
| `/portal` | `LoginPaciente.jsx` | Login solo con CI. |
| `/mi-portal` | `InicioPaciente.jsx` | Inicio: ticket activo + acciones. |
| `/mi-ticket` | `TicketRemoto.jsx` | Sacar ticket + ver estado. |
| `/mis-recetas` | `MisRecetas.jsx` | Lista recetas con filtros. |

---

## 8. DISEÑO UI — SISTEMA DE DISEÑO

### Paleta de colores
```css
--hospital-dark:    #0F2D5E   /* headers, sidebar */
--hospital-primary: #1A4F8A   /* botones primarios, nav activo */
--hospital-accent:  #3B82F6   /* acentos, íconos, links */
--success:          #22C55E
--warning:          #F59E0B
--danger:           #EF4444
--violet:           #8B5CF6   /* derivaciones */
```

### Tipografía
- Fuente: **Inter** (Google Fonts) — pesos 300, 400, 500, 600, 700, 800
- Importar: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap`

### Íconos
- FontAwesome 6 Free (`@fortawesome/react-fontawesome`)

### Componentes reutilizables a construir
| Componente | Props principales |
|---|---|
| `Badge` | `estado: 'pendiente'|'despachada'|'activa'|...` → color automático |
| `Modal` | `open, onClose, title, children` |
| `Spinner` | `size, color` |
| `EmptyState` | `icon, title, description` |
| `TicketCard` | `ticket` object — muestra número, paciente, estado |
| `PacienteCard` | `paciente` object — muestra datos básicos |
| `KpiCard` | `value, label, icon, color` |

### Layout Sistema Interno
- Sidebar fijo de 256px (w-64) en desktop, drawer en móvil
- Sidebar fondo `#0F2D5E`, texto `white/60`, activo `bg-blue-500/25 border-r-2 border-blue-400`
- Header blanco con botón hamburguesa en móvil
- Contenido con `overflow-auto` y padding `p-4 lg:p-6`

### Layout Portal Paciente
- Sin sidebar
- Header degradado `linear-gradient(145deg, #0F2D5E, #1A4F8A)`
- Bottom navigation fijo con 2 botones: Sacar ticket / Mis recetas
- Max-width `max-w-md mx-auto` (diseño móvil centrado)

---

## 9. CONFIGURACIÓN DEL BACKEND (settings.py)

```python
INSTALLED_APPS = [
    # Django defaults...
    'graphene_django',
    'corsheaders',
    'autenticacion',
    'pacientes',
    'tickets',
    'consultas',
    'recetas',
    'farmacia',
    'reportes',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # PRIMERO
    # resto de middleware...
]

AUTH_USER_MODEL = 'autenticacion.Usuario'

GRAPHENE = {
    'SCHEMA': 'hospital_backend.schema.schema',
    'MIDDLEWARE': ['graphql_jwt.middleware.JSONWebTokenMiddleware'],
}

AUTHENTICATION_BACKENDS = [
    'graphql_jwt.backends.JSONWebTokenBackend',
    'django.contrib.auth.backends.ModelBackend',
]

GRAPHQL_JWT = {
    'JWT_VERIFY_EXPIRATION': True,
    'JWT_EXPIRATION_DELTA': timedelta(hours=8),
}

CORS_ALLOW_ALL_ORIGINS = True   # Solo desarrollo
LANGUAGE_CODE = 'es-bo'
TIME_ZONE = 'America/La_Paz'
```

---

## 10. CONFIGURACIÓN DEL FRONTEND

### vite.config.js
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

### Apollo Client (src/graphql/client.js)
```js
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client'

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('token')
  if (token) {
    operation.setContext({ headers: { Authorization: `JWT ${token}` } })
  }
  return forward(operation)
})

const httpLink = createHttpLink({ uri: '/graphql/' })

export default new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
```

### AuthContext (src/context/AuthContext.jsx)
Guarda en `localStorage`:
- `token` → string JWT
- `usuario` → objeto JSON con `{ id, ci, nombreCompleto, rol, rolDisplay, especialidad, panelDestino }`

---

## 11. FLUJO DE NAVEGACIÓN POR MÓDULO

### Flujo 1: Login staff
```
/login → formulario CI + password
→ mutation login(ci, password) → { token, usuario { rol, panelDestino } }
→ guardar en localStorage
→ redirigir a panelDestino según rol:
    director       → /dashboard
    administrativo → /recepcion
    medico         → /medico
    especialista   → /especialista
    farmacia       → /farmacia
```

### Flujo 2: Atención presencial completa
```
Recepcionista en /recepcion:
  → buscar paciente por CI (query pacientePorCi)
  → si existe: mutation emitirTicket → redirige a /emision-ticket/:id
  → si no existe: redirige a /registro-paciente → al finalizar → emitirTicket

Médico en /medico:
  → ve cola (query tickets estado=esperando)
  → llama siguiente (mutation llamarSiguienteTicket)
  → click "Atender" → mutation iniciarConsulta → redirige a /consulta/:id

En /consulta/:id:
  Tab "Consulta actual":
    → llenar diagnóstico, signos vitales
    → agregar medicamentos a la receta
    → mutation finalizarConsulta + emitirReceta

  Tab "Derivar":
    → seleccionar especialidad + especialista
    → mutation derivarPaciente

Farmacéutico en /farmacia:
  → ve recetasPendientes
  → mutation despacharReceta → receta pasa a estado "despachada"
```

### Flujo 3: Portal paciente
```
/portal → ingresa CI → (mock o query pacientePorCi)
→ /mi-portal → muestra ticket activo o botón "Sacar ticket"
→ /mi-ticket → mutation emitirTicket tipo=remoto
→ /mis-recetas → query recetasPorPaciente
```

---

## 12. DATOS SEMILLA (seed)

Al ejecutar `python manage.py seed_todos`:

### Usuarios de prueba
| CI | Nombre | Rol | Password |
|---|---|---|---|
| 10000001 | Carlos Mendoza Vidal | director | director123 |
| 10000002 | Ana Rojas Pedraza | administrativo | admin123 |
| 10000003 | Roberto Vasquez Torres | medico | medico123 |
| 10000004 | Carmen Flores Mamani | especialista (Cardiología) | espec123 |
| 10000005 | Jorge Lima Choque | farmacia | farma123 |

### Pacientes de prueba
| CI | Nombre | Notas |
|---|---|---|
| 45678901 | María García López | 34 años, F |
| 67890123 | Carlos Pérez Mamani | 45 años, M, HTA |
| 23456789 | Luis Mamani Cruz | 62 años, M, DM2 |
| 34567890 | Rosa Quispe Flores | 35 años, F |

---

## 13. COMANDOS DE INICIO

### Backend (primera vez)
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_todos     # crea datos de prueba
python manage.py runserver 8000
```

### Frontend (primera vez)
```bash
cd frontend
npm install
npm run dev
```

### Archivo .bat para iniciar todo junto
Doble clic en `iniciar-todo.bat` desde la raíz del proyecto.
Abre dos terminales y el navegador en `http://localhost:5173` automáticamente.

---

## 14. NOTAS TÉCNICAS IMPORTANTES

1. **psycopg v3**: Usar `psycopg[binary]` (versión 3), NO `psycopg2`. En Python 3.13 + Windows, psycopg2 tiene un bug de UnicodeDecodeError con mensajes de error en español de PostgreSQL.

2. **Apollo Client v3**: Usar `@apollo/client@3.x`. La versión 4 tiene problemas con el bundler rolldown de Vite 8.

3. **Tailwind**: Si se usa Vite, usar el plugin `@tailwindcss/vite` en lugar de PostCSS.

4. **JWT Header**: El header debe ser `Authorization: JWT <token>` (no `Bearer`), porque así lo espera `django-graphql-jwt`.

5. **CORS**: El middleware `CorsMiddleware` debe ser el PRIMERO en `MIDDLEWARE` de Django.

6. **AUTH_USER_MODEL**: Debe definirse ANTES de correr la primera migración. No se puede cambiar después sin resetear la base de datos.

7. **GraphQL en producción**: Cambiar `graphiql=True` a `graphiql=False` en urls.py.

8. **Base de datos**: Si `hospital_bd` no existe, crearla con:
   ```python
   import psycopg
   conn = psycopg.connect(host='localhost', dbname='postgres', user='postgres', password='root', autocommit=True)
   conn.cursor().execute('CREATE DATABASE hospital_bd ENCODING UTF8')
   ```

---

## 15. MÓDULOS — ORDEN DE IMPLEMENTACIÓN

| # | Módulo | Backend | Frontend | Estado |
|---|---|---|---|---|
| 1 | Autenticación | `autenticacion/` | `Login.jsx` | Implementar primero |
| 2 | Pacientes | `pacientes/` | `Recepcion.jsx`, `RegistroPaciente.jsx` | Segundo |
| 3 | Tickets / Cola | `tickets/` | `Recepcion.jsx`, `EmisionTicket.jsx`, `PanelMedico.jsx` | Tercero |
| 4 | Consulta Médica | `consultas/` | `ConsultaMedica.jsx`, `HistorialMedico.jsx` | Cuarto |
| 5 | Recetas | `recetas/` | `ConsultaMedica.jsx` (tab receta), `MisRecetas.jsx` | Quinto |
| 6 | Derivaciones | parte de `consultas/` | `ConsultaMedica.jsx` (tab derivar), `PanelEspecialista.jsx` | Sexto |
| 7 | Farmacia | `farmacia/` | `Farmacia.jsx` | Séptimo |
| 8 | Dashboard | `reportes/` | `Dashboard.jsx`, `Reportes.jsx` | Octavo |
| 9 | Portal Paciente | reutiliza módulos 2,3,5 | `LoginPaciente.jsx`, `TicketRemoto.jsx`, `MisRecetas.jsx` | Noveno |
| 10 | Gestión / Admin | `autenticacion/` | `GestionMedicos.jsx`, `Migracion.jsx` | Décimo |
