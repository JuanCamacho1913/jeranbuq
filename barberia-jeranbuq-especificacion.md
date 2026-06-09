# BARBERIA JERANBUQ

## Sistema de Agendamiento de Citas

### Documento de Especificación Técnica y Funcional

**Versión 1.0**

| Campo | Valor |
|-------|-------|
| Proyecto | BARBERIA JERANBUQ - Plataforma de Citas |
| Tipo | Aplicación Web (PWA) - Monorepo Full-Stack |
| Estado | Borrador inicial / Discovery |
| Audiencia | Equipo de desarrollo |

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Objetivos del Proyecto](#2-objetivos-del-proyecto)
3. [Alcance del Proyecto](#3-alcance-del-proyecto)
4. [Roles de Usuario](#4-roles-de-usuario)
5. [Requisitos Funcionales](#5-requisitos-funcionales)
6. [Requisitos No Funcionales](#6-requisitos-no-funcionales)
7. [Arquitectura Técnica](#7-arquitectura-técnica)
8. [Modelo de Datos](#8-modelo-de-datos)
9. [API - Endpoints y Server Actions](#9-api---endpoints-y-server-actions)
10. [Flujos de Usuario](#10-flujos-de-usuario)
11. [Lógica Crítica: Cálculo de Slots Disponibles](#11-lógica-crítica-cálculo-de-slots-disponibles)
12. [Roadmap y Fases](#12-roadmap-y-fases)
13. [Criterios de Aceptación del MVP](#13-criterios-de-aceptación-del-mvp)
14. [Riesgos y Mitigaciones](#14-riesgos-y-mitigaciones)
15. [Convenciones del Equipo](#15-convenciones-del-equipo)
16. [Próximos Pasos](#16-próximos-pasos)

---

## 1. Resumen Ejecutivo

BARBERIA JERANBUQ es una aplicación web que digitaliza la gestión de citas de una barbería. El objetivo es eliminar la coordinación manual por WhatsApp/llamada y darle al barbero control total sobre su agenda.

La plataforma tiene dos roles claramente diferenciados:

- **Cliente**: se registra de forma rápida con su cuenta de Google, completa un breve onboarding con su número de WhatsApp (para que el barbero pueda contactarlo si lo necesita), consulta servicios disponibles, ve los horarios libres de un día específico y agenda su cita en menos de un minuto. Recibe la confirmación de cita por correo electrónico.

- **Administrador (barbero)**: configura sus servicios, define su disponibilidad semanal, ve la agenda completa, y acepta, rechaza o modifica las citas entrantes.

El proyecto se implementará como un monorepo con una única aplicación Next.js que cumple el rol de frontend y backend (full-stack). Esto simplifica el desarrollo, despliegue y comunicación entre capas, sin sacrificar la posibilidad de exponer endpoints REST cuando se requiera.

---

## 2. Objetivos del Proyecto

### 2.1 Objetivo General

Construir una plataforma web responsive que permita a los clientes agendar citas en una barbería de forma autónoma, y al barbero gestionar su agenda y servicios desde un panel de administración.

### 2.2 Objetivos Específicos

1. Reducir el tiempo de coordinación de citas por WhatsApp/llamada en al menos un 80%.
2. Permitir al barbero tener visibilidad en tiempo real de su agenda.
3. Evitar el doble agendamiento (race conditions) sobre un mismo horario.
4. Ofrecer una experiencia mobile-first, ya que la mayoría de clientes accederán desde el celular.
5. Mantener una arquitectura escalable que permita agregar más barberos en el futuro.

### 2.3 Métricas de Éxito

6. Más del 70% de las citas se agendan vía la plataforma (vs. WhatsApp) en los primeros 3 meses.
7. Tiempo promedio para agendar una cita: menor a 60 segundos.
8. Cero conflictos de doble agendamiento.
9. Tasa de no-show reducida gracias a recordatorios automatizados.

---

## 3. Alcance del Proyecto

### 3.1 Dentro del Alcance (MVP)

| Funcionalidad | Descripción |
|--------------|-------------|
| Autenticación | Login y registro exclusivamente con Google OAuth |
| Onboarding | Tras el primer login, se solicita el número de WhatsApp del cliente (sin verificación) y se guarda en su perfil |
| Catálogo de servicios | Listado de servicios con duración y precio (Corte, Barba, Limpieza Facial, etc.) |
| Agendamiento | Cliente selecciona servicio, fecha y horario disponible |
| Gestión de citas (cliente) | Ver mis citas, cancelar cita propia |
| Panel admin | Ver agenda diaria/semanal, aceptar/rechazar/modificar citas |
| Gestión de disponibilidad | Admin define horarios laborales y bloquea días/horas |
| CRUD de servicios | Admin crea, edita y elimina servicios |
| Contacto cliente | Botón en panel admin que abre WhatsApp con el número del cliente vía deep link wa.me/ |
| Notificaciones | Confirmación de cita al cliente por email (Resend). Nuevas citas al admin por email. |
| Responsive UI | Diseño mobile-first, funcional en celular y desktop |

### 3.2 Fuera del Alcance (MVP)

Las siguientes funcionalidades NO forman parte del MVP, pero pueden considerarse para versiones futuras:

- Login con número de teléfono / OTP / SMS. Solo se permite Google OAuth.
- Verificación del número de WhatsApp del cliente (se guarda tal cual lo escribe).
- Recordatorios automáticos previos a la cita (ej: 24h antes).
- Notificaciones por WhatsApp Business API ni por SMS.
- Campañas de marketing, promociones o cupones.
- Pagos en línea (la cita se paga presencialmente).
- Soporte multi-barbería o multi-barbero (por ahora un solo profesional).
- Sistema de reseñas y calificaciones.
- Programa de fidelización.
- App nativa (iOS/Android). Por ahora solo PWA web.
- Reporting avanzado / dashboard de métricas.

---

## 4. Roles de Usuario

### 4.1 Cliente

Persona que desea agendar una cita en la barbería. Generalmente accede desde el celular.

- **Acciones**: Registrarse, iniciar sesión, ver servicios, ver horarios disponibles, agendar cita, ver historial de citas, cancelar cita.
- **No puede**: Modificar servicios, ver citas de otros clientes, alterar la disponibilidad del barbero.

### 4.2 Administrador (Barbero)

Dueño de la barbería. Solo existe uno en el MVP. Tiene control total sobre la agenda y los servicios.

- **Acciones**: Iniciar sesión, gestionar servicios (CRUD), definir horarios laborales, bloquear días/horas específicas, ver agenda diaria/semanal, aceptar/rechazar/modificar/cancelar citas.
- **No puede**: Crear más administradores (el rol se asigna manualmente en BD en el MVP).

### 4.3 Matriz de Permisos

| Acción | Cliente | Admin |
|--------|---------|-------|
| Ver servicios | ✓ | ✓ |
| Crear/editar/eliminar servicios | ✗ | ✓ |
| Ver horarios disponibles | ✓ | ✓ |
| Definir/bloquear horarios | ✗ | ✓ |
| Agendar cita propia | ✓ | ✓ |
| Ver propias citas | ✓ | ✓ |
| Ver TODAS las citas | ✗ | ✓ |
| Cancelar cita propia | ✓ | ✓ |
| Aceptar/rechazar/modificar citas ajenas | ✗ | ✓ |

---

## 5. Requisitos Funcionales

Cada requisito tiene un identificador único (RF-XXX) que se usará para trazabilidad en los tickets de desarrollo y QA.

### 5.1 Autenticación y Registro

| ID | Descripción |
|----|-------------|
| RF-001 | El sistema debe permitir registro y login únicamente mediante Google OAuth. |
| RF-002 | Tras el primer login exitoso, el sistema debe redirigir al usuario a una pantalla de onboarding donde se solicita su número de WhatsApp. |
| RF-003 | El sistema debe validar el formato del número (longitud, dígitos numéricos, prefijo de país opcional con default +57 Colombia), pero NO debe verificar el número con SMS/OTP. |
| RF-004 | El usuario no podrá agendar citas hasta completar el onboarding (ingresar su WhatsApp). |
| RF-005 | El usuario debe poder actualizar su número de WhatsApp posteriormente desde su perfil. |
| RF-006 | El sistema debe mantener sesión persistente mediante cookies HTTP-only manejadas por Auth.js. |
| RF-007 | El usuario debe poder cerrar sesión desde cualquier pantalla del flujo logueado. |
| RF-008 | El sistema debe asignar rol 'CLIENT' por defecto. El rol 'ADMIN' se configura manualmente en BD. |

### 5.2 Catálogo de Servicios

| ID | Descripción |
|----|-------------|
| RF-010 | El sistema debe mostrar el listado de servicios activos con nombre, duración estimada y precio. |
| RF-011 | El admin debe poder crear un servicio nuevo (nombre, duración, precio, ícono, descripción opcional). |
| RF-012 | El admin debe poder editar un servicio existente. |
| RF-013 | El admin debe poder desactivar un servicio (soft delete) — sigue siendo visible en citas históricas pero no aparece para agendar. |
| RF-014 | La duración del servicio determina cuántos slots ocupa al agendar. |

### 5.3 Disponibilidad y Horarios

| ID | Descripción |
|----|-------------|
| RF-020 | El admin debe poder definir su horario semanal estándar (ej: lunes a sábado de 7:00 AM a 7:00 PM). |
| RF-021 | El admin debe poder definir el intervalo de slots (default: 30 minutos). |
| RF-022 | El admin debe poder bloquear días específicos completos (ej: vacaciones). |
| RF-023 | El admin debe poder bloquear slots individuales (ej: 'almuerzo de 12:00 a 1:00'). |
| RF-024 | El sistema debe calcular los slots disponibles para una fecha dada en función de: horario semanal, bloqueos, y citas ya agendadas. |
| RF-025 | El sistema debe mostrar al cliente los slots con estado 'DISPONIBLE' (verde) o 'NO DISPONIBLE' (rojo, no clickeable). |

### 5.4 Agendamiento de Citas (Cliente)

| ID | Descripción |
|----|-------------|
| RF-030 | El cliente debe poder seleccionar un servicio del catálogo. |
| RF-031 | El cliente debe poder ver un calendario con los próximos 30 días navegable. |
| RF-032 | Al seleccionar un día, el cliente debe ver el listado de slots con su estado. |
| RF-033 | Al confirmar el slot, el sistema debe crear la cita con estado 'PENDIENTE'. |
| RF-034 | El sistema debe prevenir el doble agendamiento usando un lock optimista o transacción en BD. |
| RF-035 | El cliente debe recibir confirmación de la cita por correo electrónico. |
| RF-036 | El cliente debe poder ver el listado de sus citas (próximas y pasadas). |
| RF-037 | El cliente debe poder cancelar una cita propia con al menos N horas de anticipación (configurable, default 2h). |

### 5.5 Gestión de Citas (Admin)

| ID | Descripción |
|----|-------------|
| RF-040 | El admin debe ver la agenda del día con todas las citas (hora, cliente, servicio, estado). |
| RF-041 | El admin debe poder cambiar la vista a semanal o mensual. |
| RF-042 | El admin debe poder aceptar una cita pendiente (pasa a estado 'CONFIRMADA'). |
| RF-043 | El admin debe poder rechazar una cita con motivo opcional (pasa a estado 'RECHAZADA'). |
| RF-044 | El admin debe poder modificar la hora/fecha/servicio de una cita. |
| RF-045 | El admin debe poder marcar una cita como 'COMPLETADA' o 'NO_SHOW' al finalizar el día. |
| RF-046 | Toda acción del admin sobre una cita (aceptar, rechazar, modificar) debe disparar un correo de notificación al cliente. |
| RF-047 | En el detalle de cada cita el admin debe ver el número de WhatsApp del cliente y un botón 'Contactar por WhatsApp' que abre wa.me/<numero> con un mensaje pre-llenado. |

### 5.6 Notificaciones

| ID | Descripción |
|----|-------------|
| RF-050 | El sistema debe enviar un correo electrónico al cliente cuando: se crea su cita (estado PENDING), se confirma, se rechaza o se modifica. |
| RF-051 | El sistema debe enviar un correo electrónico al admin cada vez que se crea una nueva cita. |
| RF-052 | Canal único de notificación: correo electrónico vía Resend. |
| RF-053 | El sistema NO envía recordatorios automáticos antes de la cita. Esta funcionalidad queda fuera del MVP. |
| RF-054 | El sistema NO envía notificaciones por WhatsApp ni SMS. Si el barbero necesita comunicarse con el cliente, lo hace manualmente desde el deep link wa.me/ (ver RF-047). |

---

## 6. Requisitos No Funcionales

| ID | Categoría | Descripción |
|----|-----------|-------------|
| RNF-001 | Performance | El listado de horarios disponibles debe cargar en menos de 1 segundo en conexión 4G. |
| RNF-002 | Disponibilidad | El sistema debe tener un uptime objetivo de 99.5%. |
| RNF-003 | Responsive | La UI debe ser totalmente funcional en pantallas desde 320px hasta 1920px. |
| RNF-004 | Accesibilidad | Cumplir con WCAG 2.1 nivel AA en componentes principales (contraste, foco, ARIA labels). |
| RNF-005 | Seguridad | Todas las contraseñas/tokens encriptados. Comunicación obligatoriamente HTTPS. |
| RNF-006 | Seguridad | Rate limiting en endpoints de autenticación (máx 5 intentos OTP en 10 min). |
| RNF-007 | Privacidad | Cumplimiento con habeas data colombiano (Ley 1581 de 2012). Los datos del cliente solo se usan para la operación del servicio. |
| RNF-008 | Escalabilidad | Arquitectura preparada para soportar al menos 5,000 citas/mes sin cambios estructurales. |
| RNF-009 | Mantenibilidad | Cobertura de tests unitarios mínima del 60% en la lógica de servidor (Server Actions, helpers de slots, etc.). |
| RNF-010 | Internacionalización | UI en español por defecto. Estructura preparada para agregar otros idiomas. |
| RNF-011 | Compatibilidad | Soporte para los dos últimos versiones mayores de Chrome, Safari, Firefox y Edge. |
| RNF-012 | PWA | La app debe ser instalable como PWA en celular y desktop. |

---

## 7. Arquitectura Técnica

### 7.1 Visión General

El proyecto se estructura como un monorepo basado en una única aplicación Next.js full-stack. Next.js (con App Router) provee tanto el frontend (React Server Components + Client Components) como el backend (Route Handlers y Server Actions), eliminando la necesidad de mantener dos proyectos separados y de orquestar CORS, dos despliegues, dos pipelines, etc.

Aunque la app es una sola, el monorepo se mantiene para alojar paquetes compartidos (acceso a base de datos, UI kit, tipos, configuración) que pueden reutilizarse fácilmente si en el futuro se agrega una segunda app (por ejemplo, una app móvil o un panel separado).

La comunicación entre el navegador y el servidor se hace por tres vías complementarias:

- **Server Components**: renderizan en el servidor con acceso directo a la BD vía Prisma. Ideal para listados (servicios, agenda).
- **Server Actions**: para mutaciones desde formularios y botones (agendar cita, aceptar/rechazar). Type-safe, sin necesidad de definir endpoints.
- **Route Handlers (/api/\*)**: para endpoints REST públicos o que necesitan ser consumidos externamente (webhooks de Twilio, OAuth callback, etc.).

```
┌─────────────────────────────────────────────────────────────┐
│                         MONOREPO                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        apps/web (Next.js 15 - App Router)           │   │
│  │                                                     │   │
│  │  ┌─────────────┐    ┌────────────────────┐         │   │
│  │  │   Cliente   │    │ Server Components  │         │   │
│  │  │  (browser)  │ ◄──► Server Actions     │         │   │
│  │  │             │    │ Route Handlers     │         │   │
│  │  └─────────────┘    └─────────┬──────────┘         │   │
│  └────────────────────────────────┬┴───────────────────┘   │
│                 ▲                  │                         │
│                 │ usa              │ usa                     │
│                 ▼                  ▼                         │
│  ┌──────────────┐    ┌────────────────────┐                │
│  │ packages/ui  │    │ packages/database  │                │
│  │  shadcn/ui   │    │  (Prisma Client)   │                │
│  └──────────────┘    └─────────┬──────────┘                │
│                                │                            │
│                                ▼                            │
│                    ┌─────────────────┐                      │
│                    │   PostgreSQL    │                      │
│                    │ (Neon/Supabase) │                      │
│                    └─────────────────┘                      │
│                                                             │
│  Servicios externos: Google OAuth, Resend (email)          │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Stack Tecnológico Propuesto

Propuesta inicial. Cualquier cambio debe discutirse con el equipo antes de implementarse.

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 15 (App Router) + TypeScript | Full-stack en un solo proyecto: front (RSC) + back (Route Handlers, Server Actions). Cero CORS. |
| Lenguaje | TypeScript (estricto) | Type-safety end-to-end, mismo lenguaje en cliente y servidor. |
| UI / Estilos | TailwindCSS + shadcn/ui | Mobile-first nativo, componentes accesibles, fácil de personalizar. |
| Estado servidor | React Server Components + React Query | RSC para data fetching inicial. React Query para refetch/cache en cliente. |
| Estado cliente | Zustand | Mínimo boilerplate, ideal para estado UI (modales, formularios complejos). |
| Forms + Validación | react-hook-form + Zod | Zod se reutiliza en cliente y servidor para validar inputs en Server Actions y Route Handlers. |
| ORM | Prisma | Type-safe, migraciones automáticas. Cliente vive en un paquete compartido del monorepo. |
| BD | PostgreSQL (Neon o Supabase) | Serverless Postgres con tier gratuito generoso, encaja bien con Vercel. |
| Auth | Auth.js v5 (NextAuth) | Integración nativa con Next.js. Únicamente provider de Google OAuth. |
| Email | Resend | API moderna y simple para envío transaccional. 3,000 emails/mes gratis, suficiente para el MVP. |
| Plantillas email | React Email | Diseño de emails con componentes React. Se renderizan server-side. |
| Contacto cliente | Deep links wa.me/ | El admin contacta al cliente abriendo WhatsApp Web/app vía wa.me/<numero>. Cero costo, cero integración. |
| Monorepo | pnpm workspaces + Turborepo | Build cache, instalación rápida, pipeline incremental. |
| Hosting | Vercel | Despliegue nativo de Next.js, edge functions, preview deploys por PR, SSL gratis. |
| BD Hosting | Neon / Supabase | Postgres serverless, branching de BD para entornos de preview. |
| Tests unitarios | Vitest | Compatible con TypeScript y RSC, más rápido que Jest. |
| Tests E2E | Playwright | Cubre flujos completos cliente/admin en navegador real. |
| CI/CD | GitHub Actions + Vercel | GitHub Actions para lint/test/typecheck. Vercel para deploys automáticos. |

### 7.3 Estructura del Monorepo

Esquema propuesto. El código se organiza en dos carpetas dentro de `src/`: `frontend/` para todo lo visual y `backend/` para toda la lógica de servidor. La carpeta `app/` solo contiene las páginas y rutas (Next.js lo exige), actuando como pegamento entre ambas partes:

```
barberia-jeranbuq/
├── apps/
│   └── web/                          # Única app Next.js (front + back)
│       ├── src/
│       │   ├── app/                  # ROUTING (Next.js lo exige aquí)
│       │   │   ├── layout.tsx        # Root layout: fuentes, providers globales
│       │   │   ├── globals.css       # Tailwind + variables CSS
│       │   │   ├── page.tsx          # Landing pública - redirige a login o home
│       │   │   ├── not-found.tsx
│       │   │   ├── error.tsx         # Error boundary global
│       │   │   │
│       │   │   ├── (auth)/           # Grupo: rutas de autenticación
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx  # Pantalla WELCOME con botón Google
│       │   │   │   └── onboarding/
│       │   │   │       └── page.tsx  # Captura de WhatsApp (primer login)
│       │   │   │
│       │   │   ├── (client)/         # Grupo: flujo cliente autenticado
│       │   │   │   ├── layout.tsx    # Layout cliente (header, logout)
│       │   │   │   ├── page.tsx      # BIENVENIDO + listado de servicios
│       │   │   │   ├── agendar/
│       │   │   │   │   └── [serviceId]/
│       │   │   │   │       └── page.tsx  # AGENDAR TURNO: calendario + slots
│       │   │   │   ├── mis-citas/
│       │   │   │   │   └── page.tsx  # MIS CITAS
│       │   │   │   └── perfil/
│       │   │   │       └── page.tsx  # Editar WhatsApp
│       │   │   │
│       │   │   ├── (admin)/          # Grupo: panel admin (guard de rol)
│       │   │   │   ├── layout.tsx    # Verifica role === ADMIN
│       │   │   │   ├── agenda/
│       │   │   │   │   └── page.tsx  # Agenda diaria/semanal/mensual
│       │   │   │   ├── servicios/
│       │   │   │   │   └── page.tsx  # CRUD de servicios
│       │   │   │   └── disponibilidad/
│       │   │   │       ├── page.tsx  # Horario semanal
│       │   │   │       └── bloqueos/
│       │   │   │           └── page.tsx  # Bloqueos puntuales
│       │   │   │
│       │   │   └── api/              # ROUTE HANDLERS (REST)
│       │   │       ├── auth/
│       │   │       │   └── [...nextauth]/route.ts  # Manejado por Auth.js
│       │   │       └── v1/
│       │   │           ├── services/route.ts       # GET público (cache)
│       │   │           ├── availability/route.ts   # GET disponibilidad por fecha
│       │   │           └── appointments/route.ts   # GET para integraciones
│       │   │
│       │   ├── frontend/             # ═══════════════════════════
│       │   │   │                     # FRONTEND
│       │   │   │                     # ═══════════════════════════
│       │   │   ├── components/
│       │   │   │   ├── ui/           # Primitivos shadcn
│       │   │   │   │   ├── button.tsx
│       │   │   │   │   ├── input.tsx
│       │   │   │   │   ├── dialog.tsx
│       │   │   │   │   ├── toast.tsx
│       │   │   │   │   └── ...
│       │   │   │   ├── shared/       # Reutilizables en toda la app
│       │   │   │   │   ├── Header.tsx
│       │   │   │   │   ├── Logo.tsx
│       │   │   │   │   └── LoadingSpinner.tsx
│       │   │   │   ├── auth/
│       │   │   │   │   ├── GoogleSignInButton.tsx
│       │   │   │   │   └── OnboardingForm.tsx
│       │   │   │   ├── client/       # Específicos del flujo cliente
│       │   │   │   │   ├── ServiceList.tsx
│       │   │   │   │   ├── ServiceCard.tsx
│       │   │   │   │   ├── DateCalendar.tsx
│       │   │   │   │   ├── SlotList.tsx
│       │   │   │   │   ├── SlotItem.tsx
│       │   │   │   │   ├── AppointmentSummaryModal.tsx
│       │   │   │   │   ├── MyAppointmentsList.tsx
│       │   │   │   │   └── AppointmentCard.tsx
│       │   │   │   └── admin/        # Específicos del panel admin
│       │   │   │       ├── AgendaView.tsx
│       │   │   │       ├── AppointmentRow.tsx
│       │   │   │       ├── AppointmentActions.tsx  # Aceptar/Rechazar/Modificar
│       │   │   │       ├── WhatsAppContactButton.tsx  # Deep link wa.me/
│       │   │   │       ├── ServiceForm.tsx
│       │   │   │       ├── WeeklyScheduleForm.tsx
│       │   │   │       └── TimeBlockForm.tsx
│       │   │   │
│       │   │   ├── hooks/            # React hooks (client-only)
│       │   │   │   ├── useAppointmentForm.ts
│       │   │   │   ├── useAvailableSlots.ts
│       │   │   │   └── useToast.ts
│       │   │   │
│       │   │   ├── stores/           # Zustand
│       │   │   │   └── booking.store.ts  # Estado del flujo de agendamiento
│       │   │   │
│       │   │   ├── lib/              # Utilidades de cliente
│       │   │   │   ├── format.ts     # formatPhone, formatPrice, formatDate
│       │   │   │   ├── whatsapp.ts   # buildWaMeLink(phone, message)
│       │   │   │   └── cn.ts        # clsx + tailwind-merge
│       │   │   │
│       │   │   └── styles/
│       │   │       └── tokens.css    # Variables de diseño
│       │   │
│       │   ├── backend/              # ═══════════════════════════
│       │   │   │                     # BACKEND
│       │   │   │                     # ═══════════════════════════
│       │   │   ├── actions/          # Server Actions ('use server')
│       │   │   │   ├── auth.actions.ts          # completeOnboarding, updatePhone
│       │   │   │   ├── appointments.actions.ts  # create, cancelMy, updateStatus
│       │   │   │   ├── services.actions.ts      # create, update, deactivate
│       │   │   │   └── availability.actions.ts  # updateSchedule, createBlock
│       │   │   │
│       │   │   ├── services/         # Lógica de negocio pura
│       │   │   │   ├── slots.service.ts         # Algoritmo de cálculo de slots
│       │   │   │   ├── appointments.service.ts  # Transacción + EXCLUDE constraint
│       │   │   │   ├── availability.service.ts
│       │   │   │   ├── services.service.ts
│       │   │   │   └── users.service.ts
│       │   │   │
│       │   │   ├── lib/              # Utilidades de servidor
│       │   │   │   ├── auth.ts       # Config Auth.js + helper auth()
│       │   │   │   ├── guards.ts     # requireAuth(), requireAdmin()
│       │   │   │   ├── email.ts      # Cliente Resend
│       │   │   │   ├── errors.ts     # Clases de error de dominio
│       │   │   │   └── env.ts        # Validación de env vars con Zod
│       │   │   │
│       │   │   └── emails/           # Plantillas React Email
│       │   │       ├── AppointmentConfirmation.tsx  # Al cliente al crear cita
│       │   │       ├── AppointmentAccepted.tsx      # Al cliente al ser aceptada
│       │   │       ├── AppointmentRejected.tsx
│       │   │       ├── AppointmentModified.tsx
│       │   │       └── NewAppointmentAdmin.tsx      # Al admin con cada nueva cita
│       │   │
│       │   └── middleware.ts         # Auth guard + redirect a onboarding
│       │
│       ├── public/
│       │   ├── favicon.ico
│       │   ├── manifest.json         # PWA
│       │   └── icons/
│       │
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── postcss.config.js
│       ├── .env.local.example
│       └── package.json
│
├── packages/
│   ├── database/                     # Prisma centralizado
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── index.ts             # exporta prisma client singleton
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── shared/                       # Tipos y schemas Zod (front - back)
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │   ├── appointment.schema.ts
│   │   │   │   ├── service.schema.ts
│   │   │   │   ├── availability.schema.ts
│   │   │   │   └── user.schema.ts
│   │   │   ├── types/
│   │   │   │   └── api.ts
│   │   │   ├── constants/
│   │   │   │   ├── appointment-status.ts
│   │   │   │   └── business.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── eslint-config/
│   │   ├── base.js
│   │   ├── next.js
│   │   └── package.json
│   │
│   └── typescript-config/
│       ├── base.json
│       ├── nextjs.json
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint + typecheck + test
│       └── preview.yml               # Deploy preview por PR
│
├── package.json                      # Root: scripts globales con turbo
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .nvmrc
├── .editorconfig
└── README.md
```

### 7.4 Decisión: API REST vs Server Actions

Next.js permite resolver mutaciones de dos formas. Definimos cuándo usar cada una:

- **Usar Server Actions cuando**: la mutación se dispara desde un formulario o botón dentro de la propia app (agendar una cita, aceptar una cita, crear un servicio). Más simple, type-safe end-to-end, y permite revalidación automática del cache de Next.js.
- **Usar Route Handlers (REST) cuando**: el endpoint debe ser consumido por un cliente externo (webhooks de Twilio, callback de Google OAuth, futura app móvil). También para endpoints públicos de solo lectura cacheables.

**Regla práctica**: por defecto, Server Actions. Solo creamos endpoints REST cuando hay una razón clara.

---

## 8. Modelo de Datos

Entidades principales del sistema. La implementación final puede variar según las decisiones del equipo, pero esta estructura cubre todos los requisitos funcionales.

### 8.1 Diagrama de Entidades

```
User (1) ──────────────< (N) Appointment >────────── (N) Service
                              │
                              │
                         (N)  ▼
              AppointmentStatus (enum)

AdminAvailability ── Define horarios semanales
TimeBlock         ── Bloqueos puntuales (vacaciones, almuerzo)
```

### 8.2 Entidades

#### User

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | String | Nombre completo, obtenido de Google |
| email | String | Único. Obtenido de Google |
| googleId | String | Único. Obtenido del provider OAuth |
| phone | String? | WhatsApp con código país. Null hasta completar onboarding |
| onboardingCompletedAt | DateTime? | Marca cuando el usuario completó la captura de WhatsApp |
| role | Enum | 'CLIENT' \| 'ADMIN' |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### Service

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | String | Ej: 'Corte de Cabello' |
| description | String? | Opcional |
| durationMin | Int | Duración en minutos |
| price | Decimal | Precio en pesos (COP) |
| icon | String? | Nombre del ícono a renderizar |
| active | Boolean | Soft delete |
| createdAt | DateTime | |

#### Appointment

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| serviceId | UUID | FK → Service |
| startAt | DateTime | Inicio de la cita |
| endAt | DateTime | Fin calculado por duración |
| status | Enum | PENDING \| CONFIRMED \| REJECTED \| CANCELLED \| COMPLETED \| NO_SHOW |
| notes | String? | Notas del cliente o admin |
| rejectionReason | String? | Si fue rechazada |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Índice único compuesto**: (startAt) para prevenir overlap. Validación adicional en capa de aplicación.

#### AdminAvailability

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| dayOfWeek | Int | 0=Domingo ... 6=Sábado |
| startTime | String | Formato 'HH:mm', ej: '07:00' |
| endTime | String | Formato 'HH:mm', ej: '19:00' |
| slotMinutes | Int | Ej: 30 |
| active | Boolean | Para desactivar un día |

#### TimeBlock

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| startAt | DateTime | Inicio del bloqueo |
| endAt | DateTime | Fin del bloqueo |
| reason | String? | Ej: 'Almuerzo', 'Vacaciones' |
| createdAt | DateTime | |

---

## 9. API - Endpoints y Server Actions

La sección detalla la superficie de comunicación cliente-servidor de la app Next.js. Aplican los criterios definidos en la sección 7.4: las operaciones disparadas desde formularios de la app usan Server Actions; los endpoints públicos o consumidos por terceros son Route Handlers REST (prefijo /api/v1).

Todas las respuestas REST son JSON. Errores siguen el formato `{ error: { code, message } }`. Las Server Actions devuelven `{ ok: true, data } | { ok: false, error }` para que el cliente pueda manejarlas con react-hook-form o React Query.

### 9.1 Autenticación (Auth.js)

Auth.js maneja toda la sesión vía cookies HTTP-only. No hay endpoints REST de login que el frontend deba consumir manualmente: se usan los componentes y helpers de Auth.js (signIn, signOut, useSession).

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET/POST | /api/auth/[...nextauth] | Público | Manejado por Auth.js: signin con Google, signout, callback, sesión. |
| Action | completeOnboarding(phone) | Auth | Server Action: guarda el número de WhatsApp en el perfil del usuario. |
| Action | updatePhone(phone) | Auth | Server Action: permite al usuario actualizar su número desde el perfil. |

### 9.2 Servicios

Lectura vía Server Component (sin endpoint). Mutaciones vía Server Actions desde el panel admin.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/v1/services | Público | Endpoint REST de respaldo (cache pública). Útil para futura app móvil. |
| Action | createService(data) | Admin | Server Action: crea servicio nuevo. |
| Action | updateService(id, data) | Admin | Server Action: edita un servicio. |
| Action | deactivateService(id) | Admin | Server Action: desactiva (soft delete). |

### 9.3 Disponibilidad

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/v1/availability?date=YYYY-MM-DD | Auth | Slots disponibles para la fecha (también consumible por widget externo). |
| Action | getSchedule() | Admin | Server Action: obtiene configuración semanal. |
| Action | updateSchedule(data) | Admin | Server Action: actualiza configuración semanal. |
| Action | createTimeBlock(data) | Admin | Server Action: crea bloqueo de tiempo. |
| Action | deleteTimeBlock(id) | Admin | Server Action: elimina bloqueo. |

### 9.4 Citas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| Action | createAppointment(data) | Auth | Server Action: cliente crea cita. |
| Action | cancelMyAppointment(id) | Auth | Server Action: cliente cancela cita propia. |
| Action | updateAppointmentStatus(id, status) | Admin | Server Action: confirm/reject/complete/no_show. |
| Action | rescheduleAppointment(id, data) | Admin | Server Action: cambia fecha/hora/servicio. |
| GET | /api/v1/appointments | Admin | Endpoint REST para integraciones (export, futuras apps). |

---

## 10. Flujos de Usuario

### 10.1 Flujo Cliente - Agendar Cita

1. Cliente abre la web (PWA).
2. Si no está logueado → pulsa 'Continuar con Google' → flujo OAuth → autenticado.
3. Si es su primer login → pantalla de onboarding 'Solo nos falta un dato' → ingresa su número de WhatsApp → guardar.
4. Llega a la pantalla 'BIENVENIDO {NOMBRE}' con el listado de servicios.
5. Selecciona un servicio (ej: 'Corte de Cabello').
6. Llega a 'AGENDAR TURNO' con calendario del mes.
7. Selecciona un día disponible.
8. Aparecen los slots con estado DISPONIBLE / NO DISPONIBLE.
9. Pulsa 'AGENDAR' en un slot disponible.
10. Modal de confirmación con resumen (servicio, fecha, hora, precio).
11. Confirma → cita queda en estado PENDIENTE.
12. Cliente recibe correo electrónico con la confirmación de solicitud.
13. Admin recibe correo electrónico de nueva cita.
14. Cuando el admin la acepta, el cliente recibe otro correo de 'CITA CONFIRMADA'.

### 10.2 Flujo Admin - Aceptar / Rechazar / Modificar

1. Admin inicia sesión con Google (mismo flujo, pero su user tiene role=ADMIN).
2. Llega al panel admin con la agenda del día.
3. Ve las citas pendientes destacadas.
4. En cada cita pendiente tiene 3 acciones: Aceptar / Rechazar / Modificar.
5. Aceptar: cambia a CONFIRMED, dispara email al cliente.
6. Rechazar: pide motivo opcional, dispara email al cliente.
7. Modificar: abre un editor de fecha/hora/servicio, valida disponibilidad, dispara email al cliente.
8. Si el admin necesita comunicarse con el cliente: pulsa el botón 'Contactar por WhatsApp' que abre wa.me/<numero> en una pestaña nueva.
9. Al terminar el día, marca las citas como COMPLETADA o NO_SHOW.

### 10.3 Flujo Admin - Configurar Disponibilidad

1. Admin entra a 'Configuración → Horarios'.
2. Define para cada día de la semana: hora de inicio, hora de fin, duración del slot (default 30 min).
3. Puede desactivar días completos (ej: domingo no labora).
4. En 'Bloqueos' puede agregar excepciones: vacaciones del 20-25 dic, almuerzo todos los días 12:00-13:00 (recurrente), etc.
5. El cálculo de slots disponibles se reconstruye en el siguiente request del cliente.

---

## 11. Lógica Crítica: Cálculo de Slots Disponibles

Este es el algoritmo más sensible del sistema. Debe ser determinístico y rápido. Se ejecuta cada vez que el cliente abre el calendario o cambia de día.

### 11.1 Pseudocódigo

```
FUNCIÓN obtenerSlotsDisponibles(fecha, servicioId):
    serviceDuration = Service.findById(servicioId).durationMin
    dayOfWeek = fecha.getDay()
    config = AdminAvailability.findOne({ dayOfWeek, active: true })

    SI no existe config → retornar [] (día cerrado)

    slots = []
    cursor = combinar(fecha, config.startTime)
    end = combinar(fecha, config.endTime)

    MIENTRAS cursor + serviceDuration <= end:
        slotInicio = cursor
        slotFin = cursor + serviceDuration

        // ¿Está bloqueado?
        bloqueado = TimeBlock.existsOverlap(slotInicio, slotFin)

        // ¿Ya hay cita en ese rango?
        ocupado = Appointment.existsOverlap(
            slotInicio, slotFin,
            status IN (PENDING, CONFIRMED)
        )

        slots.push({
            startAt: slotInicio,
            available: !bloqueado && !ocupado
        })

        cursor += config.slotMinutes

    retornar slots
```

### 11.2 Prevención de Doble Agendamiento

Al crear una cita el backend debe ejecutar dentro de una transacción:

1. Re-validar disponibilidad del slot (porque pudo cambiar entre la consulta y el POST).
2. Insertar el Appointment.
3. Si falla la validación → rollback y devolver 409 SLOT_UNAVAILABLE.

Adicionalmente, considerar un índice único parcial en PostgreSQL para prevenir overlap a nivel de BD usando EXCLUDE constraint con tsrange:

```sql
ALTER TABLE appointments ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    tsrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED'));
```

---

## 12. Roadmap y Fases

Propuesta de iteración. Cada fase termina con una demo funcional.

| Fase | Objetivo | Estimado | Entregables |
|------|----------|----------|-------------|
| Fase 0 | Setup | 1 semana | Inicializar monorepo (Turborepo + pnpm), crear app Next.js, configurar Prisma + Postgres, Auth.js, despliegue inicial a Vercel, CI básico. |
| Fase 1 | Autenticación | 0.5 semanas | RF-001 a RF-008. Google OAuth con Auth.js, pantalla welcome, pantalla onboarding, middleware de auth y guard de rol. |
| Fase 2 | Catálogo Servicios | 1 semana | RF-010 a RF-014. Listado de servicios para cliente, CRUD para admin. |
| Fase 3 | Disponibilidad | 1.5 semanas | RF-020 a RF-025. Configuración del horario semanal, bloqueos, algoritmo de slots. |
| Fase 4 | Agendamiento | 2 semanas | RF-030 a RF-037. UI de calendario, agendamiento end-to-end, listado de citas del cliente. |
| Fase 5 | Panel Admin | 1.5 semanas | RF-040 a RF-047. Agenda diaria/semanal/mensual, acciones sobre citas, deep link wa.me/. |
| Fase 6 | Emails | 0.5 semanas | RF-050 a RF-054. Integración Resend, plantillas React Email (confirmación al cliente, nueva cita al admin). |
| Fase 7 | Hardening | 1 semana | Tests, accesibilidad, performance, PWA, ajustes de UI. |
| Fase 8 | QA + Beta | 1 semana | Pruebas con usuarios reales, fixes. |

**Estimado total**: ~9 semanas calendario con un equipo de 2 personas. Ajustable según disponibilidad.

---

## 13. Criterios de Aceptación del MVP

El MVP se considera entregado cuando se cumplan todas las siguientes condiciones:

- Todos los requisitos funcionales RF-001 a RF-053 implementados y validados con QA.
- Cobertura de tests del código de servidor ≥ 60%.
- La PWA es instalable en Android y iOS.
- Lighthouse score (mobile) ≥ 85 en Performance y ≥ 95 en Accesibilidad.
- Pruebas con al menos 5 usuarios reales sin bugs bloqueantes.
- Documentación técnica (README + variables de entorno + cómo levantar local) completa.
- Pipeline de CI/CD funcionando: PR → build → tests → deploy a staging.
- Backups automáticos de la BD configurados.

---

## 14. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Race condition en agendamiento | Alto | Transacción + EXCLUDE constraint en Postgres (ver sección 11.2). |
| Admin no entiende el panel | Alto | Sesión de onboarding 1-a-1 con el barbero. UI lo más simple posible. |
| Cliente fantasma (no-show) | Alto | Sin recordatorios automatizados en el MVP, el riesgo aumenta. Mitigación: el barbero puede contactar manualmente vía wa.me/ el día previo. En v2: evaluar recordatorios automáticos por email o WhatsApp Business API. |
| Cliente sin cuenta Google | Medio | Asumimos que el público objetivo (mayoría con smartphone Android) tiene Gmail. Los pocos casos sin Google agendan por canal tradicional (WhatsApp directo al barbero). |
| Cliente escribe mal su WhatsApp en onboarding | Medio | Validación de formato en frontend (longitud, dígitos). En v2: verificación por OTP si se vuelve un problema. |
| Email de confirmación llega a spam | Medio | Configurar DNS (SPF, DKIM, DMARC) para el dominio. Resend lo facilita con instrucciones claras. |
| Cliente intenta agendar 5 min antes de la hora | Bajo | Bloquear slots dentro de los próximos X minutos (configurable). |
| Zona horaria | Medio | Manejar todo en UTC en backend. Convertir a America/Bogota en frontend. |

---

## 15. Convenciones del Equipo

### 15.1 Git

- Branch principal: `main` (protegida, solo merges via PR).
- Branch de desarrollo: `dev`.
- Feature branches: `feature/RF-030-agendar-cita`.
- Fix branches: `fix/descripcion-corta`.
- Commits siguiendo Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- PRs requieren al menos 1 review y CI verde para mergear.

### 15.2 Código

- TypeScript estricto en todo el monorepo (`strict: true`, `noUncheckedIndexedAccess: true`).
- ESLint + Prettier configurados a nivel de monorepo (compartidos en `packages/eslint-config`).
- Nombres en inglés en código; mensajes UI y comentarios en español.
- Server Components por defecto. Usar `'use client'` solo cuando se necesite interactividad o hooks de cliente.
- Validación con Zod en cualquier input que cruce la frontera cliente-servidor (Server Actions, Route Handlers).
- Imports absolutos con alias: `'@/...'` dentro de apps/web, `'@em-barber/database'`, `'@em-barber/ui'`, `'@em-barber/shared'` para los paquetes.
- Acceso a BD solo desde server code (Server Components, Server Actions, Route Handlers). Nunca importar prisma en Client Components.

### 15.3 Variables de Entorno

Una sola app (apps/web) con un único archivo `.env.local` (no se commitea). El `.env.example` sí se commitea.

```bash
# apps/web/.env.local

# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/em_barber
DIRECT_URL=postgresql://...  # Para migraciones Prisma (Neon/Supabase)

# Auth.js
AUTH_SECRET=...              # generar con: openssl rand -base64 32
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Google OAuth (único provider)
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=citas@embarber.com
ADMIN_NOTIFICATION_EMAIL=barbero@embarber.com

# Públicas (expuestas al cliente)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configuración de negocio
APPOINTMENT_CANCEL_HOURS=2
DEFAULT_PHONE_COUNTRY_CODE=+57
```

---

## 16. Próximos Pasos

Una vez aprobado este documento, el equipo debe:

1. Revisar y validar el stack tecnológico propuesto en sección 7.2.
2. Definir responsables por área (UI/UX, lógica de servidor, infra).
3. Crear el repositorio y configurar el monorepo con la estructura propuesta en sección 7.3.
4. Crear los tickets correspondientes a la Fase 0 en la herramienta de gestión (Jira / Linear / GitHub Projects).
5. Agendar daily de 15 minutos y review semanal.
6. Confirmar acceso a credenciales de terceros: Google Cloud Console (OAuth), Resend (email), Vercel, Neon/Supabase, dominio.
7. Definir entorno de staging para QA continuo.

---

*— Fin del documento —*
