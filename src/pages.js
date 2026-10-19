// Páginas del sitio. key = clave en site.seo y site.nav; out = archivo generado en dist/.
const PAGES = [
  { path: '/', key: 'inicio', view: 'inicio', out: 'index.html', priority: '1.0' },
  { path: '/pos', key: 'pos', view: 'pos', out: 'pos.html', priority: '0.9' },
  { path: '/dxlex', key: 'dxlex', view: 'dxlex', out: 'dxlex.html', priority: '0.9' },
  { path: '/paginas-web', key: 'web', view: 'paginas-web', out: 'paginas-web.html', priority: '0.8' },
  { path: '/nosotros', key: 'nosotros', view: 'nosotros', out: 'nosotros.html', priority: '0.6' },
  // contacto es PHP para preseleccionar ?producto= y mostrar errores sin JavaScript.
  { path: '/contacto', key: 'contacto', view: 'contacto', out: 'contacto.php', priority: '0.7', php: true },
  { path: '/privacidad', key: 'privacidad', view: 'privacidad', out: 'privacidad.html', priority: '0.3' },
  { path: '/gracias', key: 'gracias', view: 'gracias', out: 'gracias.html', sitemap: false },
  { path: '/404', key: 'notFound', view: '404', out: '404.html', sitemap: false },
];

module.exports = { PAGES };
