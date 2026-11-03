import { Hono } from 'hono';
import type { Env } from '../types/index.js';

export const locationsRoute = new Hono<{ Bindings: Env }>();

// 17 Metro Manila LGUs
const NCR_LGUS = [
  { city_name: 'Caloocan', total_barangays: 188, barangays: ['Barangay 1', 'Barangay 2', 'Bagong Silang'] },
  { city_name: 'Las Piñas', total_barangays: 20, barangays: ['Almanza Uno', 'Pamplona Uno', 'Talon Uno'] },
  { city_name: 'Makati', total_barangays: 33, barangays: ['Bel-Air', 'Poblacion', 'San Lorenzo'] },
  { city_name: 'Malabon', total_barangays: 21, barangays: ['Catmon', 'Concepcion', 'Potrero'] },
  { city_name: 'Mandaluyong', total_barangays: 27, barangays: ['Highway Hills', 'Plainview', 'Wack-Wack Greenhills'] },
  { city_name: 'Manila', total_barangays: 897, barangays: ['Barangay 659', 'Barangay 660', 'Intramuros', 'Ermita', 'Malate'] },
  { city_name: 'Marikina', total_barangays: 16, barangays: ['Concepcion Uno', 'Marikina Heights', 'Santo Niño'] },
  { city_name: 'Muntinlupa', total_barangays: 9, barangays: ['Alabang', 'Ayala Alabang', 'Putatan'] },
  { city_name: 'Navotas', total_barangays: 18, barangays: ['Bagumbayan South', 'San Jose', 'Tangos South'] },
  { city_name: 'Parañaque', total_barangays: 16, barangays: ['Baclaran', 'BF Homes', 'Don Bosco'] },
  { city_name: 'Pasay', total_barangays: 201, barangays: ['Barangay 1', 'Barangay 76', 'San Rafael'] },
  { city_name: 'Pasig', total_barangays: 30, barangays: ['San Antonio', 'Kapitolyo', 'Ugong', 'Oranbo', 'Caniogan'] },
  { city_name: 'Pateros', total_barangays: 10, barangays: ['Aguho', 'Martirez del 96', 'Santa Ana'] },
  { city_name: 'Quezon City', total_barangays: 142, barangays: ['Central', 'Diliman', 'Loyola Heights', 'Batasan Hills'] },
  { city_name: 'San Juan', total_barangays: 21, barangays: ['Greenhills', 'Addition Hills', 'Little Baguio'] },
  { city_name: 'Taguig', total_barangays: 38, barangays: ['Fort Bonifacio', 'Ususan', 'Western Bicutan'] },
  { city_name: 'Valenzuela', total_barangays: 33, barangays: ['Gen. T. de Leon', 'Karuhatan', 'Poblacion'] }
];

locationsRoute.get('/areas', (c) => {
  return c.json({
    status: 'success',
    data: {
      lgus: NCR_LGUS
    }
  });
});
