# MORAI · Sitio web corporativo

Sitio web de MORAI para presentar **MORAI POS** (sistema para restaurantes), **DxLex** (software para abogados) y el servicio de **desarrollo de páginas web**. Tiene un formulario único "Solicitar demo" que envía cada lead por correo y guarda un respaldo, y un botón flotante de WhatsApp.

Pensado para el plan **Hostinger Premium** (hosting compartido, sin Node.js):

- **Las páginas son HTML estático**, generado con Node.js + EJS desde `config/site.js` (`npm run build` → `dist/`).
- **El formulario es PHP** (`php/api/demo.php`): validación, anti-bots, límite por IP, correo por SMTP a `rodrigozx23@gmail.com` con *Responder* al cliente, y respaldo en `leads.jsonl`.
- **Despliegue con Git:** cada push a `main` ejecuta GitHub Actions, que prueba y genera el sitio y lo publica en la rama `hostinger`. Hostinger despliega esa rama en `public_html`.

Node.js solo se usa en tu computadora (y en GitHub Actions) para generar el sitio; Hostinger nunca lo ejecuta.

---

## Contenido

1. [Correr en local](#correr-en-local)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Formulario "Solicitar demo"](#formulario-solicitar-demo)
4. [Cambiar la marca](#cambiar-la-marca)
5. [Publicar en Hostinger Premium](#publicar-en-hostinger-premium)
6. [Publicar cambios después](#publicar-cambios-después)
7. [Etapa 0: checklist previo](#etapa-0-checklist-previo)
8. [Pendientes](#pendientes)

---

## Correr en local

Requisitos: Node.js 20+ y, para probar el formulario, PHP 8.1+ (`php -v`).

```bash
npm install
```

```bash
npm run preview
```

Abre <http://127.0.0.1:8090>. Sin configuración SMTP, los leads de prueba se guardan en `morai-data/leads.jsonl` (ignorado por git) y en `morai-data/eventos.log` queda el aviso de que no se envió correo.

| Comando | Qué hace |
| --- | --- |
| `npm run build` | Genera el sitio en `dist/`. |
| `npm run preview` | Genera y sirve `dist/` con PHP en el puerto 8090 (imita el `.htaccess`). |
| `npm test` | Pruebas del build y del endpoint PHP real, con un servidor SMTP de prueba. Si no hay PHP, esas pruebas se saltan. |
| `npm run placeholders` | Lista los datos de ejemplo que faltan reemplazar. |
| `npm run zip` | Genera `morai-sitio.zip` para subirlo a mano a Hostinger (Windows 10+). |
| `npm run publish:branch` | Publica `dist/` en la rama `hostinger` (normalmente lo hace GitHub Actions). |

Para probar el envío real de correos en local, copia `php/morai-config.example.php` como `morai-config.php` en la carpeta `webMorai/` y complétalo. Ese archivo está en `.gitignore`.

## Estructura del proyecto

```
webMorai/
├── config/site.js          # TODA la marca y el contenido cambiable
├── views/                  # Plantillas EJS (pages/ y partials/)
├── public/                 # css/, js/, img/ (se copian tal cual)
├── php/
│   ├── api/                # demo.php (endpoint), lib.php, form-helpers.php, .htaccess
│   └── morai-config.example.php   # plantilla de la configuración privada (SMTP)
├── deploy/htaccess         # Reglas de Hostinger: URLs limpias, HTTPS, cabeceras de seguridad
├── src/build.js            # Generador del sitio (EJS -> dist/)
├── scripts/                # router.php (vista previa), publish-branch.js, placeholders.js
├── test/                   # Pruebas (node:test)
└── .github/workflows/deploy.yml
```

Resultado en `dist/` (lo que llega a `public_html`):

```
index.html  pos.html  dxlex.html  paginas-web.html  nosotros.html  privacidad.html
gracias.html  404.html  contacto.php  sitemap.xml  robots.txt  .htaccess
api/demo.php (+ librerías protegidas)   css/  js/  img/
```

URLs: `/`, `/pos`, `/dxlex`, `/paginas-web`, `/nosotros`, `/contacto`, `/privacidad`, `/gracias`. El `.htaccess` quita el `.html`, fuerza HTTPS y muestra `404.html` para cualquier otra ruta.

## Formulario "Solicitar demo"

- **Un solo formulario** (`views/partials/demo-form.ejs`) usado en el modal y en `/contacto`.
- **Todos los CTA** son enlaces `/contacto?producto=pos&plan=normal` con `data-demo`. Con JavaScript abren el modal con el producto y el plan preseleccionados. Sin JavaScript llevan a `/contacto`, que es PHP y preselecciona el producto.
- Campos: nombre*, correo*, teléfono, empresa, producto* (`pos`, `dxlex`, `web`, `otro`), plan, mensaje y aceptación de la política de privacidad*.

`POST /api/demo` (→ `api/demo.php`) acepta JSON (modal) o un formulario clásico:

| Paso | Detalle |
| --- | --- |
| Tamaño | Cuerpo máximo de 20 KB; solo `POST`. |
| Límite por IP | `rate_limit_max` envíos cada `rate_limit_window_min` minutos (5 cada 15 por defecto). Si se supera, responde 429. |
| Anti-bot | Campo trampa oculto `website` y envíos hechos en menos de `min_form_seconds`. Al bot se le responde "ok", pero no se guarda ni se envía nada. |
| Validación | Las mismas reglas que en el navegador. Responde 400 con un error por campo; sin JavaScript, vuelve a mostrar `/contacto` con los errores y los valores ingresados. |
| Respaldo | Agrega una línea JSON a `leads.jsonl` en la carpeta de datos, fuera de `public_html`. |
| Correo | SMTP (SSL 465 o STARTTLS 587) a `mail_to`, con *Reply-To* del cliente. Si no hay SMTP o falla, lo registra en `eventos.log` y **el usuario igual ve "gracias"**. Solo responde 500 si fallan el guardado *y* el correo. |

Las librerías PHP de `api/` no son accesibles desde la web; solo `demo.php` lo es.

## Cambiar la marca

Cambiar de marca = **editar `config/site.js` + reemplazar `public/img/`**, y después hacer push (o `npm run build`).

En `config/site.js` están: nombre, eslogan, URL, logo, favicon, imágenes, **colores** (se convierten en variables CSS `--color-*`), **tipografías**, razón social, RUC, dirección, contacto, **WhatsApp** (número y mensaje), redes sociales, productos, **precios**, **equipo** y SEO por página.

Todo valor de ejemplo está marcado con `// PLACEHOLDER`; `npm run placeholders` los lista. Antes de publicar, como mínimo:

- [ ] Logo, favicon e imágenes reales en `public/img/` (las actuales son SVG de ejemplo).
- [ ] Imagen `og-cover.jpg` de 1200×630 para redes sociales (muchas no muestran SVG) y actualizar `images.ogDefault`.
- [ ] `url` con tu dominio real (canonical, Open Graph y sitemap la usan).
- [ ] Razón social, RUC, dirección, correo, teléfono y **número de WhatsApp** reales.
- [ ] Precios reales y el equipo (nombres, cargos, fotos).
- [ ] Revisar los textos de las páginas (preguntas frecuentes del POS, funciones de DxLex).
- [ ] Revisar la política de privacidad con un asesor legal (texto base según la Ley N.° 29733).

## Publicar en Hostinger Premium

> Los nombres de los menús de hPanel pueden variar un poco.

### 1. Crear el buzón de correo
1. hPanel → **Correos electrónicos** → crea un buzón del dominio, por ejemplo `no-reply@moraitechnologies.com`. Premium incluye 2 buzones.
2. Anota su contraseña: será el `smtp_pass`.
3. En la configuración del correo, revisa que **SPF** y **DKIM** estén activos (si el dominio usa los DNS de Hostinger, suelen venir activados). Sin ellos, los leads pueden llegar a spam.

### 2. Primera publicación de la rama `hostinger`
Al hacer push a `main`, GitHub Actions crea la rama `hostinger` con el sitio generado. Revisa en GitHub → **Actions** que el workflow **Publicar sitio** termine en verde.

Si prefieres no usar Actions: `npm run build && npm run publish:branch` desde tu computadora hace lo mismo.

### 3. Conectar el repositorio en Hostinger
1. hPanel → tu sitio web → **Avanzado → Git**.
2. Si el repositorio es **privado**, copia la **clave SSH** que muestra Hostinger y agrégala en GitHub → repo → **Settings → Deploy keys** (solo lectura). Si es público, puedes usar la URL HTTPS.
3. Crea el repositorio en Hostinger:
   - **Repositorio:** `git@github.com:rodrigozx23/MoraiWebApp.git` (o `https://github.com/rodrigozx23/MoraiWebApp.git` si es público)
   - **Rama:** `hostinger`
   - **Directorio:** vacío (= `public_html`). La carpeta debe estar **vacía** la primera vez; si Hostinger dejó un `default.php` o un `index.php`, bórralo.
4. Pulsa **Desplegar**.
5. **Despliegue automático:** en la misma sección, copia la **URL del webhook** y agrégala en GitHub → repo → **Settings → Webhooks** (Content type `application/json`, evento *Just the push event*). Así cada publicación en `hostinger` se despliega sola.

#### Alternativa sin Git: subir un .zip

Si prefieres subir los archivos a mano (pantalla "Carga los archivos del sitio web" o el Administrador de archivos):

1. Genera el paquete con `npm run zip`. Crea `morai-sitio.zip` con el **contenido** de `dist/` (incluye `.htaccess` y `api/`). No incluye la configuración privada.
2. Súbelo y extráelo dentro de `public_html`. `index.html` debe quedar directamente en `public_html`, no en una subcarpeta.
3. Sigue con el paso 4.

Usa **una sola** de las dos vías (Git o zip). Con el zip, cada cambio requiere volver a generarlo y subirlo.

### 4. Crear la configuración privada (una sola vez)
1. hPanel → **Administrador de archivos**. Sube **un nivel por encima de `public_html`** (la carpeta del dominio, por ejemplo `domains/moraitechnologies.com/`).
2. Crea ahí el archivo `morai-config.php` con el contenido de [`php/morai-config.example.php`](php/morai-config.example.php) y completa `smtp_user`, `smtp_pass`, `mail_from` y `mail_to`.
3. En esa misma carpeta, el sitio creará `morai-data/` con `leads.jsonl` (respaldo de leads), `eventos.log` (avisos y errores del correo) y los contadores del límite por IP. Al estar fuera de `public_html`, no son accesibles desde la web y los nuevos despliegues no los borran.

### 5. Ajustes del hosting
- **Versión de PHP:** 8.1 o superior (hPanel → Avanzado → Configuración de PHP). Se recomienda 8.3.
- **SSL:** activa el certificado gratuito (hPanel → Seguridad → SSL). El `.htaccess` ya redirige a HTTPS.

### 6. Probar
1. Abre el sitio, envía una solicitud desde el modal y otra desde `/contacto`.
2. Confirma que llegan a `mail_to` y que *Responder* va al correo del cliente.
3. Si no llegan, revisa `morai-data/eventos.log`: verás `ERROR Error al enviar…` con el motivo (por ejemplo, contraseña incorrecta), o `WARN SMTP no configurado` si no se encontró `morai-config.php`. Revisa también la carpeta de spam.

## Publicar cambios después

```bash
git add -A
```

```bash
git commit -m "Actualiza precios"
```

```bash
git push
```

GitHub Actions prueba, genera y publica en `hostinger`, y Hostinger despliega automáticamente (si configuraste el webhook; si no, pulsa **Desplegar** en hPanel → Git).

No edites la rama `hostinger` a mano: se regenera en cada push a `main`.

## Etapa 0: checklist previo

- [ ] **Dominio** registrado y apuntando a Hostinger (Premium incluye uno gratis el primer año).
- [ ] **Plan Hostinger Premium** activo.
- [ ] **Repositorio GitHub** `MoraiWebApp` (este) con el workflow habilitado.
- [ ] **Buzón** del dominio para enviar los leads.
- [ ] **SPF y DKIM** activos; recomendado también **DMARC** (registro TXT `_dmarc` con `p=none` para empezar).
- [ ] Correo de prueba a Gmail: en "Mostrar original", SPF y DKIM deben salir `PASS`.

## Pendientes

Ya incluido: meta *title/description*, Open Graph y canonical por página, `sitemap.xml`, `robots.txt` y el botón flotante de WhatsApp.

Por decidir:

- [ ] **Analytics** (Google Analytics 4 o Plausible). Hay que permitir su dominio en la `Content-Security-Policy` de `deploy/htaccess` y mencionarlo en la política de privacidad.
- [ ] **Blog** o sección de novedades.
- [ ] **Panel de leads** (ver y exportar `leads.jsonl` con acceso protegido).
- [ ] Correo de confirmación automático al cliente.
- [ ] Imagen OG en JPG y datos estructurados (JSON-LD `Organization` / `SoftwareApplication`).
- [ ] Activar `Strict-Transport-Security` en `deploy/htaccess` cuando el dominio funcione bien con HTTPS.
