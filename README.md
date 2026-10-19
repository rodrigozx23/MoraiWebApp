# MORAI · Sitio web corporativo

Sitio web de MORAI para presentar **MORAI POS** (sistema para restaurantes), **DxLex** (software para abogados) y el servicio de **desarrollo de páginas web**, con un formulario único de “Solicitar demo” que envía cada lead por correo y guarda un respaldo.

- **Stack:** Node.js 20 LTS + Express 5 + EJS. Sin base de datos ni paso de compilación.
- **Hosting objetivo:** Hostinger (app Node.js).
- **Leads:** se envían por correo a `MAIL_TO` (por defecto `rodrigozx23@gmail.com`) con *reply-to* del cliente y se guardan en `data/leads.jsonl`.

---

## Contenido

1. [Correr en local](#correr-en-local)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Formulario “Solicitar demo”](#formulario-solicitar-demo)
4. [Cambiar la marca (Etapa 2)](#cambiar-la-marca-etapa-2)
5. [Variables de entorno](#variables-de-entorno)
6. [Despliegue en Hostinger](#despliegue-en-hostinger)
7. [Etapa 0: checklist previo (tareas tuyas)](#etapa-0-checklist-previo-tareas-tuyas)
8. [Pendientes (Etapa 3)](#pendientes-etapa-3)

---

## Correr en local

Requisitos: Node.js 20 o superior (`node -v`).

```bash
npm install
npm start
```

Abre <http://localhost:3000>. Sin `.env` el sitio funciona igual: los leads se guardan en `data/leads.jsonl` y en la consola aparece un aviso de que el SMTP no está configurado.

Para probar el envío real de correos:

```bash
cp .env.example .env
```

Completa `SMTP_*`, `MAIL_FROM` y `MAIL_TO` en `.env` y reinicia.

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Arranca con recarga automática al editar archivos (`node --watch`). |
| `npm test` | Ejecuta las pruebas (endpoint `/api/demo`, páginas, SEO). |
| `npm run placeholders` | Lista los datos de ejemplo que faltan reemplazar antes de publicar. |

## Estructura del proyecto

```
webMorai/
├── server.js              # Punto de entrada (lee .env y levanta el servidor)
├── config/site.js         # TODA la marca y el contenido cambiable (Etapa 2)
├── src/
│   ├── app.js             # Express: helmet, estáticos, variables CSS, rutas, 404/500
│   ├── routes/pages.js    # Páginas + robots.txt + sitemap.xml
│   ├── routes/api.js      # POST /api/demo (rate limit, honeypot, validación, guardado, correo)
│   └── lib/               # validation.js (zod), leads.js (JSONL), mailer.js (Nodemailer)
├── views/
│   ├── partials/          # head, header, footer, demo-form, demo-modal, pricing, cta-band
│   └── pages/             # inicio, pos, dxlex, paginas-web, nosotros, contacto, gracias, privacidad, 404, error
├── public/                # css/, js/, img/ (servidos tal cual)
├── data/leads.jsonl       # Respaldo de leads (se crea solo; ignorado por git)
├── scripts/placeholders.js
└── test/api-demo.test.js
```

Páginas: `/`, `/pos`, `/dxlex`, `/paginas-web`, `/nosotros`, `/contacto`, `/gracias`, `/privacidad`, cualquier otra ruta → 404. Además: `/robots.txt` y `/sitemap.xml`.

## Formulario “Solicitar demo”

- **Un solo formulario** (`views/partials/demo-form.ejs`) usado en el modal y en `/contacto`.
- **Todos los CTA** son enlaces del tipo `<a href="/contacto?producto=pos&plan=normal" data-demo="pos" data-plan="normal">`. Con JavaScript abren el modal con el producto/plan preseleccionado; sin JavaScript navegan a `/contacto?producto=<producto>` con el formulario ya completado.
- Campos: nombre*, correo*, teléfono, empresa, producto* (`pos`, `dxlex`, `web`, `otro`), plan, mensaje y aceptación de la política de privacidad*.

`POST /api/demo` acepta JSON (modal) o `application/x-www-form-urlencoded` (sin JS):

| Paso | Detalle |
| --- | --- |
| Seguridad | `helmet` (CSP, etc.), cuerpo máximo 20 KB, `x-powered-by` desactivado. |
| Rate limit | `RATE_LIMIT_MAX` envíos por IP cada `RATE_LIMIT_WINDOW_MIN` minutos → 429. |
| Anti-bot | Campo trampa oculto `website` y envío en menos de `MIN_FORM_SECONDS` segundos. Al bot se le responde “ok” pero no se guarda ni envía nada. |
| Validación | `zod`; errores por campo (400). Se eliminan saltos de línea de los campos de una línea. |
| Respaldo | Se agrega una línea JSON a `data/leads.jsonl` (o `LEADS_FILE`). |
| Correo | Nodemailer por SMTP a `MAIL_TO`, *reply-to* = cliente. Si no hay SMTP o falla el envío, se registra un aviso/error en consola y **el usuario igual recibe “gracias”**. Solo si fallan el guardado *y* el correo se responde 500. |
| Respuesta | JSON `{ ok: true, redirect: "/gracias" }` o redirección 303 a `/gracias`. |

Para revisar los leads guardados:

```bash
cat data/leads.jsonl
```

## Cambiar la marca (Etapa 2)

Cambiar de marca = **editar `config/site.js` + reemplazar los archivos de `public/img/`**. No hace falta tocar plantillas ni CSS.

En `config/site.js` están:

- **Identidad:** nombre, eslogan, URL.
- **Logo, favicon e imágenes** (rutas dentro de `public/`).
- **Colores:** se convierten en variables CSS (`primary` → `--color-primary`, `primaryDark` → `--color-primary-dark`, …) que usa `public/css/styles.css`.
- **Tipografías:** familias para títulos y texto y la URL de Google Fonts (vacía = fuentes del sistema).
- **Empresa:** razón social, RUC, dirección.
- **Contacto y redes sociales** (las redes vacías no se muestran).
- **Productos, precios** (POS: Freemium/Normal/Pro; DxLex; paquetes web) y **equipo**.
- **SEO por página:** título y descripción (meta y Open Graph).

Todo valor de ejemplo está marcado con `// PLACEHOLDER`. Ejecuta `npm run placeholders` para ver la lista. Antes de publicar, como mínimo:

- [ ] Logo, favicon e imágenes reales en `public/img/` (las actuales son SVG de ejemplo).
- [ ] Imagen para redes `og-cover.jpg` de 1200×630 (muchas redes no muestran SVG) y actualizar `images.ogDefault`.
- [ ] Razón social, RUC, dirección, correo y teléfono públicos.
- [ ] Precios reales de POS, DxLex y paquetes web.
- [ ] Equipo (nombres, cargos, fotos y biografías).
- [ ] Revisar textos de las páginas (FAQ del POS, funcionalidades de DxLex) para que coincidan con lo que hacen los productos hoy.
- [ ] Revisar la política de privacidad con un asesor legal (texto base según Ley N.° 29733).

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example).

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `PORT` | Puerto HTTP (Hostinger lo define solo). | `3000` |
| `NODE_ENV` | `production` activa HSTS, caché de estáticos y `trust proxy`. | — |
| `SITE_URL` | URL pública para canonical, Open Graph y sitemap. | valor de `config/site.js` |
| `TRUST_PROXY` | Proxies delante de la app (para la IP real en el rate limit). | `1` en producción |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Servidor SMTP. | puerto `465` |
| `MAIL_FROM` | Remitente (el mismo buzón de `SMTP_USER`). | `SMTP_USER` |
| `MAIL_TO` | Destino de los leads (admite varios separados por coma). | — |
| `LEADS_FILE` | Ruta del respaldo JSONL. | `data/leads.jsonl` |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MIN` | Límite de envíos por IP. | `5` cada `15` min |
| `MIN_FORM_SECONDS` | Tiempo mínimo para enviar el formulario (anti-bot). | `3` |

## Despliegue en Hostinger

> Los nombres exactos de los menús de hPanel pueden cambiar; la idea general es la misma.

1. **Sube el código a GitHub** (repo `morai-web`). `.env`, `node_modules/` y `data/` ya están en `.gitignore`.
2. En **hPanel → Sitios web → Agregar sitio web → App Node.js** (requiere un plan que incluya apps Node.js).
3. **Origen:** conecta el repositorio de GitHub (recomendado, permite redeploy al hacer push) o sube un `.zip` del proyecto sin `node_modules`.
4. **Configuración de compilación:**
   - Versión de Node.js: **20.x**
   - Archivo de entrada: `server.js`
   - Instalación: `npm install` · Inicio: `npm start` (no hay paso de build)
5. **Variables de entorno** (en la configuración de la app): `NODE_ENV=production`, `SITE_URL=https://tudominio`, `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`. No definas `PORT`: Hostinger lo asigna.
6. **Despliega** y vincula el dominio a la app. Activa el certificado SSL.
7. **Prueba en producción:** envía una solicitud desde el sitio y confirma que llega el correo a `MAIL_TO` y que el *Responder* va al cliente. Si no llega, revisa los registros de la app (aparecerá `[mail] Error al enviar…`) y la carpeta de spam.

**Sobre `data/leads.jsonl` en Hostinger:** un nuevo despliegue puede reemplazar la carpeta de la app. El correo es la copia principal de cada lead; descarga el JSONL periódicamente desde el administrador de archivos o apunta `LEADS_FILE` a una ruta fuera de la carpeta de despliegue (por ejemplo, en tu directorio de usuario).

## Etapa 0: checklist previo (tareas tuyas)

Estas tareas no se pueden hacer desde el código:

- [ ] **Dominio:** registrar o elegir el dominio (por ejemplo, `morai.pe`) y apuntarlo a Hostinger.
- [ ] **Plan de Hostinger** que permita apps Node.js (Business o Cloud).
- [ ] **Repositorio GitHub `morai-web`** (privado) y subir este proyecto.
- [ ] **Buzón de correo** del dominio para enviar los leads (por ejemplo, `web@morai.pe`) y anotar su contraseña para `SMTP_PASS`.
- [ ] **SPF:** registro TXT del dominio que autorice a Hostinger (Hostinger lo sugiere en la sección de correo / DNS).
- [ ] **DKIM:** activarlo en el panel de correo de Hostinger y publicar el registro DNS indicado.
- [ ] (Recomendado) **DMARC:** registro TXT `_dmarc` empezando con `p=none` para monitorear.
- [ ] Enviar un correo de prueba a Gmail y confirmar que SPF y DKIM salen como `PASS` (Gmail → “Mostrar original”).

## Pendientes (Etapa 3)

Ya incluido: meta *title/description*, Open Graph y canonical por página, `robots.txt` y `sitemap.xml` (usan `SITE_URL`).

Pendiente, a decidir:

- [ ] **Analytics** (Google Analytics 4 o Plausible). Requiere ajustar la CSP de `helmet` en `src/app.js` y mencionar las cookies en la política de privacidad.
- [ ] **Botón flotante de WhatsApp** (el número ya está en `config/site.js` → `contact.whatsapp`).
- [ ] **Blog** o sección de novedades.
- [ ] **Panel de leads** (ver y exportar los leads de `data/leads.jsonl` con acceso protegido).
- [ ] Correo de confirmación automático al cliente.
- [ ] Imagen OG en JPG/PNG y datos estructurados (JSON-LD `Organization` / `SoftwareApplication`).
