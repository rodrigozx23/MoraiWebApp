<?php require_once __DIR__ . '/api/form-helpers.php'; morai_form_init(); ?>
<!doctype html>
<html lang="es" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contacto y demo | MORAI</title>
  <meta name="description" content="Solicita una demo de MORAI POS, DxLex o cotiza tu página web. Te respondemos en menos de 24 horas hábiles.">
  <link rel="canonical" href="https://moraitechnologies.com/contacto">
  <meta name="theme-color" content="#4F46E5">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MORAI">
  <meta property="og:locale" content="es_PE">
  <meta property="og:title" content="Contacto y demo | MORAI">
  <meta property="og:description" content="Solicita una demo de MORAI POS, DxLex o cotiza tu página web. Te respondemos en menos de 24 horas hábiles.">
  <meta property="og:url" content="https://moraitechnologies.com/contacto">
  <meta property="og:image" content="https://moraitechnologies.com/img/og-cover.svg">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Plus+Jakarta+Sans:wght@600;700;800&amp;display=swap">
  
  <style>:root{--color-primary:#4F46E5;--color-primary-dark:#3730A3;--color-primary-soft:#EEF2FF;--color-accent:#10B981;--color-dark:#0F172A;--color-text:#1E293B;--color-muted:#64748B;--color-bg:#FFFFFF;--color-surface:#F8FAFC;--color-border:#E2E8F0;--color-danger:#DC2626;--font-heading:'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;--font-body:'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif}</style>
  <link rel="stylesheet" href="/css/styles.css">
  <script src="/js/main.js" defer></script>
</head>
<body class="page-contacto">
<a class="skip-link" href="#contenido">Saltar al contenido</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="MORAI, inicio">
      <img src="/img/logo.svg" alt="MORAI" width="140" height="36">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principal">
      <span class="nav-toggle-bar"></span><span class="sr-only">Abrir menú</span>
    </button>
    <nav id="menu-principal" class="site-nav" aria-label="Principal">
      <ul>
        
        <li><a href="/">Inicio</a></li>
        
        <li><a href="/pos">POS</a></li>
        
        <li><a href="/dxlex">DxLex</a></li>
        
        <li><a href="/paginas-web">Páginas web</a></li>
        
        <li><a href="/nosotros">Nosotros</a></li>
        
        <li><a href="/contacto" aria-current="page">Contacto</a></li>
        
      </ul>
      <a class="btn btn-primary btn-sm" href="/contacto" data-demo="">Solicitar demo</a>
    </nav>
  </div>
</header>

<main id="contenido">


<section class="section">
  <div class="container contact-grid">
    <div>
      <p class="eyebrow">Contacto</p>
      <h1>Solicita una demo o cotización</h1>
      <p class="lead">Completa el formulario y un especialista te contactará en menos de 24 horas hábiles.</p>
      <ul class="contact-list">
        <li><span class="contact-label">Correo</span><a href="mailto:contacto@morai.pe">contacto@morai.pe</a></li>
        <li><span class="contact-label">Teléfono</span><a href="tel:+51900000000">+51 900 000 000</a></li>
        <li><span class="contact-label">Horario</span>Lunes a viernes, 9:00 a 18:00</li>
        <li><span class="contact-label">Dirección</span>Lima, Perú</li>
      </ul>
    </div>
    <div class="card form-card" id="formulario">
      
<form class="demo-form" action="/api/demo" method="post" data-demo-form>
  <div class="form-alert" role="alert" data-form-alert<?= morai_e("_") === "" ? " hidden" : "" ?>><?= morai_e("_") ?></div>

  <div class="form-grid">
    <div class="field">
      <label for="contacto-nombre">Nombre y apellido *</label>
      <input id="contacto-nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="80" value="<?= morai_v("nombre") ?>"<?= morai_invalid("nombre") ?>>
      <p class="field-error" data-error-for="nombre"><?= morai_e("nombre") ?></p>
    </div>
    <div class="field">
      <label for="contacto-email">Correo electrónico *</label>
      <input id="contacto-email" name="email" type="email" autocomplete="email" required maxlength="120" value="<?= morai_v("email") ?>"<?= morai_invalid("email") ?>>
      <p class="field-error" data-error-for="email"><?= morai_e("email") ?></p>
    </div>
    <div class="field">
      <label for="contacto-telefono">Teléfono / WhatsApp</label>
      <input id="contacto-telefono" name="telefono" type="tel" autocomplete="tel" maxlength="25" value="<?= morai_v("telefono") ?>"<?= morai_invalid("telefono") ?>>
      <p class="field-error" data-error-for="telefono"><?= morai_e("telefono") ?></p>
    </div>
    <div class="field">
      <label for="contacto-empresa">Empresa o negocio</label>
      <input id="contacto-empresa" name="empresa" type="text" autocomplete="organization" maxlength="120" value="<?= morai_v("empresa") ?>"<?= morai_invalid("empresa") ?>>
      <p class="field-error" data-error-for="empresa"><?= morai_e("empresa") ?></p>
    </div>
    <div class="field">
      <label for="contacto-producto">¿Qué te interesa? *</label>
      <select id="contacto-producto" name="producto" required data-producto<?= morai_invalid("producto") ?>>
        <option value="">Elige una opción</option>
        
        <option value="pos"<?= morai_sel("producto", "pos") ?>>MORAI POS</option>
        
        <option value="dxlex"<?= morai_sel("producto", "dxlex") ?>>DxLex</option>
        
        <option value="web"<?= morai_sel("producto", "web") ?>>Páginas web</option>
        
        <option value="otro"<?= morai_sel("producto", "otro") ?>>Otro</option>
        
      </select>
      <p class="field-error" data-error-for="producto"><?= morai_e("producto") ?></p>
    </div>
    <div class="field">
      <label for="contacto-plan">Plan (opcional)</label>
      <select id="contacto-plan" name="plan" data-plan<?= morai_invalid("plan") ?>>
        <option value="">Aún no lo sé</option>
        
        <optgroup label="MORAI POS" data-group="pos">
          
          <option value="freemium"<?= morai_sel("plan", "freemium") ?>>Freemium</option>
          
          <option value="normal"<?= morai_sel("plan", "normal") ?>>Normal</option>
          
          <option value="pro"<?= morai_sel("plan", "pro") ?>>Pro</option>
          
        </optgroup>
        
        <optgroup label="DxLex" data-group="dxlex">
          
          <option value="dxlex-independiente"<?= morai_sel("plan", "dxlex-independiente") ?>>Independiente</option>
          
          <option value="dxlex-estudio"<?= morai_sel("plan", "dxlex-estudio") ?>>Estudio</option>
          
        </optgroup>
        
        <optgroup label="Páginas web" data-group="web">
          
          <option value="web-landing"<?= morai_sel("plan", "web-landing") ?>>Landing</option>
          
          <option value="web-corporativa"<?= morai_sel("plan", "web-corporativa") ?>>Corporativa</option>
          
          <option value="web-a-medida"<?= morai_sel("plan", "web-a-medida") ?>>A medida</option>
          
        </optgroup>
        
      </select>
      <p class="field-error" data-error-for="plan"><?= morai_e("plan") ?></p>
    </div>
    <div class="field field-full">
      <label for="contacto-mensaje">Cuéntanos sobre tu negocio</label>
      <textarea id="contacto-mensaje" name="mensaje" rows="3" maxlength="2000" placeholder="Ej.: tengo 2 locales y quiero integrar la cocina con la caja."><?= morai_v("mensaje") ?></textarea>
      <p class="field-error" data-error-for="mensaje"><?= morai_e("mensaje") ?></p>
    </div>
  </div>

  
  <div class="hp" aria-hidden="true">
    <label for="contacto-website">No llenar este campo</label>
    <input id="contacto-website" name="website" type="text" tabindex="-1" autocomplete="off">
  </div>
  
  <input type="hidden" name="ts" value="<?= (int) (microtime(true) * 1000) ?>" data-ts>
  <input type="hidden" name="origen" value="/contacto">

  <div class="field field-check">
    <input id="contacto-consentimiento" name="consentimiento" type="checkbox" required<?= morai_checked("consentimiento") ?>>
    <label for="contacto-consentimiento">Acepto la <a href="/privacidad" target="_blank">política de privacidad</a> y que MORAI me contacte. *</label>
  </div>
  <p class="field-error" data-error-for="consentimiento"><?= morai_e("consentimiento") ?></p>

  <button class="btn btn-primary btn-block" type="submit" data-submit>Solicitar demo gratis</button>
  <p class="form-note muted">Te respondemos en menos de 24 horas hábiles.</p>
</form>

    </div>
  </div>
</section>

</main>
<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      <img src="/img/logo.svg" alt="MORAI" width="140" height="36" class="footer-logo">
      <p class="muted">Software que hace crecer tu negocio</p>
    </div>
    <div>
      <h2 class="footer-title">Productos</h2>
      <ul class="footer-links">
        
        <li><a href="/pos">MORAI POS</a></li>
        
        <li><a href="/dxlex">DxLex</a></li>
        
        <li><a href="/paginas-web">Páginas web</a></li>
        
      </ul>
    </div>
    <div>
      <h2 class="footer-title">Empresa</h2>
      <ul class="footer-links">
        <li><a href="/nosotros">Nosotros</a></li>
        <li><a href="/contacto">Contacto</a></li>
        <li><a href="/privacidad">Política de privacidad</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-title">Contacto</h2>
      <ul class="footer-links">
        <li><a href="mailto:contacto@morai.pe">contacto@morai.pe</a></li>
        <li><a href="tel:+51900000000">+51 900 000 000</a></li>
        <li class="muted">Lunes a viernes, 9:00 a 18:00</li>
        
      </ul>
    </div>
  </div>
  <div class="container footer-legal">
    <p>© 2026 MORAI S.A.C. · RUC 20000000000 · Lima, Perú</p>
  </div>
</footer>

<a class="wa-float" href="https://wa.me/51900000000?text=Hola%20MORAI%2C%20quiero%20informaci%C3%B3n%20sobre%20sus%20productos." target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg>
  <span class="wa-label">WhatsApp</span>
</a>

<dialog class="modal" id="demo-modal" aria-labelledby="demo-modal-title">
  <div class="modal-box">
    <button class="modal-close" type="button" data-modal-close aria-label="Cerrar">×</button>
    <h2 id="demo-modal-title" class="modal-title">Solicita tu demo</h2>
    <p class="muted modal-sub" data-modal-sub>Déjanos tus datos y te mostramos cómo funciona.</p>
    
<form class="demo-form" action="/api/demo" method="post" data-demo-form>
  <div class="form-alert" role="alert" data-form-alert hidden></div>

  <div class="form-grid">
    <div class="field">
      <label for="modal-nombre">Nombre y apellido *</label>
      <input id="modal-nombre" name="nombre" type="text" autocomplete="name" required minlength="2" maxlength="80" value="">
      <p class="field-error" data-error-for="nombre"></p>
    </div>
    <div class="field">
      <label for="modal-email">Correo electrónico *</label>
      <input id="modal-email" name="email" type="email" autocomplete="email" required maxlength="120" value="">
      <p class="field-error" data-error-for="email"></p>
    </div>
    <div class="field">
      <label for="modal-telefono">Teléfono / WhatsApp</label>
      <input id="modal-telefono" name="telefono" type="tel" autocomplete="tel" maxlength="25" value="">
      <p class="field-error" data-error-for="telefono"></p>
    </div>
    <div class="field">
      <label for="modal-empresa">Empresa o negocio</label>
      <input id="modal-empresa" name="empresa" type="text" autocomplete="organization" maxlength="120" value="">
      <p class="field-error" data-error-for="empresa"></p>
    </div>
    <div class="field">
      <label for="modal-producto">¿Qué te interesa? *</label>
      <select id="modal-producto" name="producto" required data-producto>
        <option value="">Elige una opción</option>
        
        <option value="pos">MORAI POS</option>
        
        <option value="dxlex">DxLex</option>
        
        <option value="web">Páginas web</option>
        
        <option value="otro">Otro</option>
        
      </select>
      <p class="field-error" data-error-for="producto"></p>
    </div>
    <div class="field">
      <label for="modal-plan">Plan (opcional)</label>
      <select id="modal-plan" name="plan" data-plan>
        <option value="">Aún no lo sé</option>
        
        <optgroup label="MORAI POS" data-group="pos">
          
          <option value="freemium">Freemium</option>
          
          <option value="normal">Normal</option>
          
          <option value="pro">Pro</option>
          
        </optgroup>
        
        <optgroup label="DxLex" data-group="dxlex">
          
          <option value="dxlex-independiente">Independiente</option>
          
          <option value="dxlex-estudio">Estudio</option>
          
        </optgroup>
        
        <optgroup label="Páginas web" data-group="web">
          
          <option value="web-landing">Landing</option>
          
          <option value="web-corporativa">Corporativa</option>
          
          <option value="web-a-medida">A medida</option>
          
        </optgroup>
        
      </select>
      <p class="field-error" data-error-for="plan"></p>
    </div>
    <div class="field field-full">
      <label for="modal-mensaje">Cuéntanos sobre tu negocio</label>
      <textarea id="modal-mensaje" name="mensaje" rows="3" maxlength="2000" placeholder="Ej.: tengo 2 locales y quiero integrar la cocina con la caja."></textarea>
      <p class="field-error" data-error-for="mensaje"></p>
    </div>
  </div>

  
  <div class="hp" aria-hidden="true">
    <label for="modal-website">No llenar este campo</label>
    <input id="modal-website" name="website" type="text" tabindex="-1" autocomplete="off">
  </div>
  
  <input type="hidden" name="ts" value="" data-ts>
  <input type="hidden" name="origen" value="/contacto">

  <div class="field field-check">
    <input id="modal-consentimiento" name="consentimiento" type="checkbox" required>
    <label for="modal-consentimiento">Acepto la <a href="/privacidad" target="_blank">política de privacidad</a> y que MORAI me contacte. *</label>
  </div>
  <p class="field-error" data-error-for="consentimiento"></p>

  <button class="btn btn-primary btn-block" type="submit" data-submit>Solicitar demo gratis</button>
  <p class="form-note muted">Te respondemos en menos de 24 horas hábiles.</p>
</form>

  </div>
</dialog>

</body>
</html>

