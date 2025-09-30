import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Inicio',
    isTitle: true
  },
  {
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard'
  },
  {
    label: 'Administración',
    isTitle: true
  },
  {
    label: 'Usuarios',
    icon: 'users',
    subItems: [
      {
        label: 'Listado',
        link: '/users',
      }
    ]
  },
  {
    label: 'Contraseña',
    icon: 'users',
    subItems: [
      {
        label: 'Cambiar contraseña',
        link: '/password/change-pass',
      }
    ]
  },
  {
    label: 'Tasas',
    icon: 'briefcase',
    subItems: [
      {
        label: 'Ver',
        link: '/tasas/tasa',
      }
    ]
  },
  {
    label: 'Locales',
    icon: 'briefcase',
    subItems: [
      {
        label: 'Ver',
        link: '/locales/local',
      }
    ]
  },
  {
    label: 'MODULOS',
    isTitle: true
  },
  {
    label: 'Facturas',
    icon: 'briefcase',
    subItems: [
      {
        label: 'Procesar',
        link: '/bills/bill',
      }
    ]
  },
];
