/**
 * Configuración de marca y contenido del sitio MORAI.
 *
 * Cambiar de marca = editar este archivo + reemplazar los archivos de /public/img.
 *
 * Todo valor marcado con  // PLACEHOLDER  es un dato de ejemplo: reemplázalo por
 * el dato real antes de publicar. Puedes listarlos con:
 *   npm run placeholders   (o busca "PLACEHOLDER" en este archivo)
 */

const site = {
  // --- Identidad -----------------------------------------------------------
  name: 'MORAI',
  tagline: 'Software que hace crecer tu negocio',
  // URL pública (sin "/" final). Se puede sobrescribir con la variable SITE_URL.
  url: process.env.SITE_URL || 'https://moraitechnologies.com',
  locale: 'es_PE',
  lang: 'es',

  // --- Logo e imágenes (rutas dentro de /public) -----------------------------
  logo: {
    src: '/img/logo.svg', // PLACEHOLDER (logo de ejemplo)
    alt: 'MORAI',
    width: 140,
    height: 36,
  },
  favicon: '/img/favicon.svg', // PLACEHOLDER
  images: {
    // Imagen para compartir en redes (Open Graph). Recomendado: JPG/PNG 1200x630.
    ogDefault: '/img/og-cover.svg', // PLACEHOLDER (reemplazar por og-cover.jpg)
    hero: '/img/hero.svg', // PLACEHOLDER
    pos: '/img/pos/pos-nuevo-pedido.jpg', // captura real (1440x900)
    dxlex: '/img/dxlex.svg', // PLACEHOLDER (captura real de DxLex)
    web: '/img/web.svg', // PLACEHOLDER
    teamFallback: '/img/avatar.svg',
  },

  // --- Capturas de producto (galería en /pos) ---------------------------------
  // Capturas de escritorio a 1440x900 y móvil a 390x844 (x2). Para cambiarlas,
  // reemplaza los archivos de /public/img/pos/ manteniendo el nombre.
  screenshots: {
    pos: {
      featured: {
        src: '/img/pos/pos-nuevo-pedido.jpg',
        alt: 'Pantalla de nuevo pedido de MORAI POS con la carta por categorías y la cuenta de la mesa',
        title: 'Toma de pedidos en segundos',
        text: 'Busca por nombre o código, filtra por categoría y arma la cuenta de la mesa con el IGV calculado al instante.',
      },
      items: [
        {
          src: '/img/pos/pos-pedidos.jpg',
          alt: 'Lista de pedidos activos por mesa en MORAI POS',
          title: 'Pedidos activos por mesa',
          text: 'Todas las mesas abiertas con su total, a un clic de cobrar o editar.',
        },
        {
          src: '/img/pos/pos-reportes.jpg',
          alt: 'Reporte de ventas de MORAI POS con total vendido y cantidad de pedidos',
          title: 'Reportes de venta',
          text: 'Ventas totales, cantidad de pedidos y filtros por cliente, fecha y estado.',
        },
        {
          src: '/img/pos/pos-productos.jpg',
          alt: 'Mantenimiento de productos de MORAI POS con categorías, precios y stock',
          title: 'Carta, precios y stock',
          text: 'Administra productos por categoría con su precio y stock disponible.',
        },
      ],
      mobile: {
        src: '/img/pos/pos-movil.jpg',
        alt: 'MORAI POS en un celular mostrando los pedidos activos',
        title: 'También en el celular',
        text: 'Tus mozos toman pedidos desde el celular, con la misma información que la caja.',
      },
    },
  },

  // --- Colores (se exponen como variables CSS: --color-primary, etc.) --------
  colors: {
    primary: '#4F46E5', // PLACEHOLDER (color de marca)
    primaryDark: '#3730A3',
    primarySoft: '#EEF2FF',
    accent: '#10B981',
    dark: '#0F172A',
    text: '#1E293B',
    muted: '#64748B',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    danger: '#DC2626',
  },

  // --- Tipografías ----------------------------------------------------------
  fonts: {
    heading: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    // Deja en '' para no cargar Google Fonts (usa fuentes del sistema).
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap',
  },

  // --- Datos de la empresa y contacto ----------------------------------------
  company: {
    legalName: 'MORAI S.A.C.', // PLACEHOLDER (razón social)
    ruc: '20000000000', // PLACEHOLDER (RUC)
    address: 'Lima, Perú', // PLACEHOLDER (dirección fiscal)
    foundedYear: 2024, // PLACEHOLDER
  },
  contact: {
    email: 'contacto@morai.pe', // PLACEHOLDER (correo público)
    phone: '+51 900 000 000', // PLACEHOLDER
    // Botón flotante de WhatsApp. Deja '' para ocultarlo.
    whatsapp: '51900000000', // PLACEHOLDER (solo dígitos, con código de país)
    whatsappMessage: 'Hola MORAI, quiero información sobre sus productos.',
    hours: 'Lunes a viernes, 9:00 a 18:00',
  },
  social: {
    // Deja en '' las redes que no uses; no se mostrarán.
    facebook: '', // PLACEHOLDER
    instagram: '', // PLACEHOLDER
    linkedin: '', // PLACEHOLDER
    tiktok: '',
  },

  // --- Navegación -------------------------------------------------------------
  nav: [
    { href: '/', label: 'Inicio', key: 'inicio' },
    { href: '/pos', label: 'POS', key: 'pos' },
    { href: '/dxlex', label: 'DxLex', key: 'dxlex' },
    { href: '/paginas-web', label: 'Páginas web', key: 'web' },
    { href: '/nosotros', label: 'Nosotros', key: 'nosotros' },
    { href: '/contacto', label: 'Contacto', key: 'contacto' },
  ],

  // --- Productos (también alimentan el selector del formulario) -------------
  // La clave (pos, dxlex, web, otro) es la que viaja en ?producto=<clave>.
  products: {
    pos: {
      name: 'MORAI POS',
      short: 'POS para restaurantes',
      summary:
        'Toma pedidos, envía comandas a cocina, cobra y factura electrónicamente desde una sola plataforma.',
      href: '/pos',
    },
    dxlex: {
      name: 'DxLex',
      short: 'Software para abogados',
      summary:
        'Gestiona expedientes, plazos, audiencias y clientes de tu estudio jurídico en un solo lugar.',
      href: '/dxlex',
    },
    web: {
      name: 'Páginas web',
      short: 'Desarrollo de sitios web',
      summary:
        'Diseñamos y desarrollamos páginas web rápidas, modernas y pensadas para conseguir clientes.',
      href: '/paginas-web',
    },
    otro: {
      name: 'Otro',
      short: 'Otro proyecto',
      summary: 'Cuéntanos qué necesitas.',
      href: '/contacto',
    },
  },

  // --- Precios ----------------------------------------------------------------
  pricing: {
    currency: 'S/',
    // Texto que acompaña a los precios mientras no sean definitivos.
    note: 'Precios referenciales en soles, no incluyen IGV.', // PLACEHOLDER
    pos: [
      {
        key: 'freemium',
        name: 'Freemium',
        price: 0, // PLACEHOLDER
        period: '/mes',
        description: 'Para empezar a ordenar tu local sin costo.',
        features: ['1 sucursal', '1 caja', 'Toma de pedidos y cobro', 'Reportes básicos'],
        highlighted: false,
      },
      {
        key: 'normal',
        name: 'Normal',
        price: 79, // PLACEHOLDER
        period: '/mes',
        description: 'Para restaurantes en operación diaria.',
        features: [
          'Todo lo de Freemium',
          'Comandas en cocina (KDS)',
          'Facturación electrónica SUNAT',
          'Control de inventario',
          'Hasta 5 usuarios',
        ],
        highlighted: true,
      },
      {
        key: 'pro',
        name: 'Pro',
        price: 149, // PLACEHOLDER
        period: '/mes',
        description: 'Para cadenas y negocios con varias sedes.',
        features: [
          'Todo lo de Normal',
          'Multisucursal',
          'Usuarios ilimitados',
          'Reportes consolidados',
          'Soporte prioritario',
        ],
        highlighted: false,
      },
    ],
    dxlex: [
      {
        key: 'dxlex-independiente',
        name: 'Independiente',
        price: 59, // PLACEHOLDER
        period: '/mes',
        description: 'Para abogados que trabajan por su cuenta.',
        features: ['1 usuario', 'Expedientes ilimitados', 'Agenda y alertas de plazos'],
        highlighted: false,
      },
      {
        key: 'dxlex-estudio',
        name: 'Estudio',
        price: 199, // PLACEHOLDER
        period: '/mes',
        description: 'Para estudios jurídicos con equipo.',
        features: [
          'Hasta 10 usuarios',
          'Roles y permisos',
          'Portal del cliente',
          'Reportes de horas y honorarios',
        ],
        highlighted: true,
      },
    ],
    web: [
      {
        key: 'web-landing',
        name: 'Landing',
        price: 900, // PLACEHOLDER
        period: 'pago único',
        description: 'Una página enfocada en vender un producto o servicio.',
        features: ['1 página', 'Formulario de contacto', 'Diseño adaptable a móvil', 'SEO básico'],
        highlighted: false,
      },
      {
        key: 'web-corporativa',
        name: 'Corporativa',
        price: 2500, // PLACEHOLDER
        period: 'pago único',
        description: 'Sitio completo para presentar tu empresa.',
        features: [
          'Hasta 8 secciones',
          'Blog o noticias',
          'Integración con WhatsApp',
          'Analítica y SEO',
        ],
        highlighted: true,
      },
      {
        key: 'web-a-medida',
        name: 'A medida',
        price: null, // null = "Cotizar"
        period: '',
        description: 'Tiendas online, sistemas web e integraciones.',
        features: ['Análisis de requerimientos', 'Desarrollo a medida', 'Soporte y mantenimiento'],
        highlighted: false,
      },
    ],
  },

  // --- Equipo (página Nosotros) -----------------------------------------------
  team: [
    {
      name: 'Nombre Apellido', // PLACEHOLDER
      role: 'Fundador y CEO', // PLACEHOLDER
      photo: '', // PLACEHOLDER (ej. /img/equipo/nombre.jpg). Vacío = avatar genérico
      bio: 'Breve descripción de la persona y su experiencia.', // PLACEHOLDER
    },
    {
      name: 'Nombre Apellido', // PLACEHOLDER
      role: 'Líder de desarrollo', // PLACEHOLDER
      photo: '',
      bio: 'Breve descripción de la persona y su experiencia.', // PLACEHOLDER
    },
    {
      name: 'Nombre Apellido', // PLACEHOLDER
      role: 'Soporte y atención al cliente', // PLACEHOLDER
      photo: '',
      bio: 'Breve descripción de la persona y su experiencia.', // PLACEHOLDER
    },
  ],

  // --- SEO por página -----------------------------------------------------------
  seo: {
    inicio: {
      title: 'MORAI | Software para restaurantes, abogados y páginas web',
      description:
        'MORAI desarrolla software para negocios en Perú: POS para restaurantes, DxLex para abogados y páginas web a medida. Solicita una demo gratis.',
    },
    pos: {
      title: 'MORAI POS | Sistema para restaurantes con facturación electrónica',
      description:
        'POS para restaurantes: comandas en cocina, multisucursal, inventario y facturación electrónica SUNAT. Planes Freemium, Normal y Pro.',
    },
    dxlex: {
      title: 'DxLex | Software de gestión para abogados y estudios jurídicos',
      description:
        'DxLex organiza expedientes, plazos, audiencias, clientes y honorarios de tu estudio jurídico. Solicita una demo.',
    },
    web: {
      title: 'Desarrollo de páginas web | MORAI',
      description:
        'Diseñamos páginas web rápidas, adaptables a móvil y optimizadas para Google. Landing pages, sitios corporativos y desarrollos a medida.',
    },
    nosotros: {
      title: 'Nosotros | MORAI',
      description: 'Conoce al equipo de MORAI y cómo trabajamos para digitalizar negocios en Perú.',
    },
    contacto: {
      title: 'Contacto y demo | MORAI',
      description: 'Solicita una demo de MORAI POS, DxLex o cotiza tu página web. Te respondemos en menos de 24 horas hábiles.',
    },
    gracias: {
      title: '¡Gracias! | MORAI',
      description: 'Recibimos tu solicitud.',
      noindex: true,
    },
    privacidad: {
      title: 'Política de privacidad | MORAI',
      description: 'Cómo MORAI trata los datos personales que nos compartes, conforme a la Ley N.° 29733.',
    },
    notFound: {
      title: 'Página no encontrada | MORAI',
      description: 'La página que buscas no existe.',
      noindex: true,
    },
  },
};

module.exports = site;
