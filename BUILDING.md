# Guía de compilación y desarrollo

Cómo clonar, compilar, probar y publicar nuevas versiones de **AI Usage Bars**.

## Requisitos

- **Node.js 20+** (recomendado 22 LTS)
- **npm 10+** (viene con Node)
- **Chrome** (o cualquier Chromium: Edge, Brave, etc.)
- **Git** con clave SSH configurada (para `push` al remote, solo mantenedores)

## Primer setup

```bash
git clone https://github.com/brassoy/ai-usage-bars.git
cd ai-usage-bars
npm install
```

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Compila en modo watch — rebuild en cada cambio. Iteración rápida. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run typecheck` | Comprobación de tipos con TypeScript (no emite código). |
| `npm run icons` | Reescala `assets/icon-source.png` a 16/32/48/128 px y los escribe en `public/icons/`. |
| `npm run package` | Pipeline completo: icons → typecheck → build → zip → `releases/usage-extension-v{version}.zip`. |

## Estructura del proyecto

```
ai-usage-bars/
├── assets/                     # Archivos fuente, NO se publican en el paquete
│   └── icon-source.png         # Imagen original del icono (1254×1254)
├── docs/screenshots/           # Capturas para README y Chrome Web Store
├── popup.html                  # Entry point del popup
├── options.html                # Entry point de la página de ajustes
├── public/                     # Se copia tal cual a dist/ (lo que se publica)
│   ├── _locales/               # Traducciones por idioma (11)
│   └── icons/                  # PNGs estáticos generados
├── scripts/
│   ├── generate-icons.ts       # Downscaler PNG (box-average)
│   └── package.ts              # Empaqueta dist/ → zip
├── src/
│   ├── background/             # Service worker (alarms, fetch, icon dinámico)
│   ├── popup/                  # Lógica del popup
│   ├── options/                # Lógica de la página de ajustes
│   ├── providers/              # Adapter pattern para claude.ai
│   ├── storage/                # Wrappers de chrome.storage
│   ├── icon/                   # Renderizado dinámico (OffscreenCanvas)
│   └── i18n.ts                 # Helpers de chrome.i18n
├── vite.config.ts              # Build + emite manifest.json al final
├── tsconfig.json               # Raíz, referencia los dos siguientes:
├── tsconfig.app.json           # Tipos de extensión + browser (src/)
└── tsconfig.node.json          # Tipos de Node (vite.config.ts + scripts/)
```

## Cargar la extensión en Chrome (modo desarrollador)

1. Ejecuta `npm run build` (o `npm run dev` para iterar).
2. Abre `chrome://extensions`.
3. Activa **"Modo desarrollador"** (esquina superior derecha).
4. Pulsa **"Cargar descomprimida"** y selecciona la carpeta `dist/`.

Para recargar tras cambios: en `chrome://extensions`, pulsa el icono ↻ de la tarjeta de la extensión.

## Cómo añadir un idioma

1. Copia `public/_locales/en/messages.json` a `public/_locales/<código>/messages.json` (por ejemplo `tr` para turco).
2. Traduce todos los valores de `"message"` manteniendo las claves y los bloques `placeholders` intactos.
3. `npm run build` y prueba en Chrome cambiando el idioma del navegador (Configuración → Idiomas → mueve el tuyo arriba).

Códigos de idioma admitidos: los de Chrome — `en`, `es`, `pt_BR`, `zh_CN`, `zh_TW`, etc. **Guion bajo, no guion.**

## Cómo actualizar el icono

1. Sustituye `assets/icon-source.png` por una imagen PNG cuadrada (recomendado: 1024×1024 o más, RGB o RGBA).
2. Ejecuta `npm run icons`.
3. Verifica visualmente los 4 tamaños generados en `public/icons/icon-{16,32,48,128}.png` — sobre todo el de 16×16 (es el más expuesto a perder detalles).
4. `npm run build` y comprueba en Chrome.

## Cómo lanzar una nueva versión

1. Actualiza la versión en **`package.json`** y en **`vite.config.ts`** (campo `version` del manifest). Deben coincidir.
2. Actualiza el badge del README si corresponde (aunque los badges dinámicos del Chrome Web Store lo hacen solos tras la publicación).
3. `npm run package` → `releases/usage-extension-v{version}.zip`.
4. Commit siguiendo Conventional Commits:
   - `feat:` nuevas funcionalidades
   - `fix:` bug fixes
   - `chore:` mantenimiento (deps, build, etc.)
   - `docs:` cambios solo en docs
5. Tag y push:
   ```bash
   git tag -a v0.X.Y -m "Release v0.X.Y — <breve descripción>"
   git push origin main
   git push origin v0.X.Y
   ```
6. **Release en GitHub**: https://github.com/brassoy/ai-usage-bars/releases/new → selecciona el tag, redacta notas, adjunta el zip de `releases/`.
7. **Chrome Web Store**: https://chrome.google.com/webstore/devconsole/ → sube el mismo zip a la extensión existente. Google detecta la nueva versión y la pone en revisión (rápida si los permisos no cambian).

## Convenciones de commit

Usamos **Conventional Commits**:

```
<type>(<scope opcional>): <descripción imperativa>

<body opcional>
```

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `build`, `ci`.

**No añadimos** atribuciones de IA ni `Co-Authored-By` en commits.

## Stack técnico

- **TypeScript** estricto (`noUnusedLocals`, `noUnusedParameters`, sin `any` implícito)
- **Vite 8** con `defineConfig` y multi-entry de Rollup
- **Manifest V3** — service worker, no background page
- **OffscreenCanvas** en el service worker para renderizar el icono dinámico
- **`chrome.i18n`** nativo para internacionalización
- **Cero dependencias en runtime** (solo en devDeps: pngjs, tsx, vite, typescript, @types/*)

## Troubleshooting

**El icono no se actualiza tras `npm run build`**
Chrome cachea iconos agresivamente. Quita la extensión y vuelve a cargarla descomprimida.

**El service worker dice "Inactivo" en `chrome://extensions`**
Es normal en MV3 — el SW se duerme tras unos segundos sin actividad. Lo despiertan los `chrome.alarms` o cualquier mensaje del popup. Pulsa el enlace **"service worker"** para abrir sus DevTools y verlo despertarse.

**Cambié un `_locales/<lang>/messages.json` y no veo el cambio**
Recarga la extensión en `chrome://extensions`. Si tu navegador no está en ese idioma, cámbialo en Configuración → Idiomas → mueve tu idioma al primer puesto.

**Quiero ver las peticiones que hace el SW**
`chrome://extensions` → busca "AI Usage Bars" → pulsa **"service worker"** → en las DevTools, pestaña Network. Las llamadas a `claude.ai/api/*` se ven ahí.

**"Not signed in" aunque estoy logueado en claude.ai**
Comprueba en las DevTools del SW que la cookie viaja: corre `fetch('https://claude.ai/api/organizations', { credentials: 'include' }).then(r => r.status)`. Si devuelve 401 es un problema de sesión; si devuelve 200, el adapter tiene algún bug.

## Contribuir

Issues y PRs son bienvenidas en https://github.com/brassoy/ai-usage-bars

Antes de enviar un PR:
- `npm run typecheck` pasa sin errores
- `npm run build` completa sin errores
- Sigues el estilo del código existente (TypeScript estricto, sin comentarios obvios, conventional commits)

Para traducciones nuevas no hace falta abrir issue previo — manda el PR directamente.
