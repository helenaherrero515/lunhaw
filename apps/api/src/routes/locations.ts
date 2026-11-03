import { Hono } from 'hono';
import type { Env } from '../types/index.js';

export interface LguArea {
  city_name: string;
  total_barangays: number;
  barangays: string[];
}

/**
 * 17 Metro Manila (National Capital Region) LGUs with official total barangay counts
 * and representative verified barangay lists for manual area selection fallback (F-006, BR-004).
 */
export const NCR_LGUS: LguArea[] = [
  {
    city_name: 'Caloocan',
    total_barangays: 188,
    barangays: [
      'Bagong Silang (Barangay 176)',
      'Barangay 1',
      'Barangay 2',
      'Barangay 8',
      'Barangay 12',
      'Barangay 28',
      'Barangay 80',
      'Barangay 171 (Bagumbong)',
      'Barangay 178 (Camarin)',
      'Barangay 180 (Tala)'
    ]
  },
  {
    city_name: 'Las Piñas',
    total_barangays: 20,
    barangays: [
      'Almanza Uno',
      'Almanza Dos',
      'BF International Village',
      'Daniel Fajardo',
      'Elias Aldana',
      'Ilaya',
      'Pamplona Uno',
      'Pamplona Dos',
      'Pamplona Tres',
      'Pulang Lupa Uno',
      'Pulang Lupa Dos',
      'Talon Uno',
      'Talon Dos',
      'Talon Tres',
      'Talon Kuatro',
      'Talon Singko',
      'Zapote'
    ]
  },
  {
    city_name: 'Makati',
    total_barangays: 33,
    barangays: [
      'Bangkal',
      'Bel-Air',
      'Carmona',
      'Dasmariñas',
      'Forbes Park',
      'Kasilawan',
      'La Paz',
      'Magallanes',
      'Olympia',
      'Palanan',
      'Pio del Pilar',
      'Poblacion',
      'San Antonio',
      'San Isidro',
      'San Lorenzo',
      'Santa Cruz',
      'Singkamas',
      'Tejeros',
      'Urdaneta',
      'Valenzuela'
    ]
  },
  {
    city_name: 'Malabon',
    total_barangays: 21,
    barangays: [
      'Acacia',
      'Baritan',
      'Bayan-bayanan',
      'Catmon',
      'Concepcion',
      'Dampalit',
      'Flores',
      'Hulong Duhat',
      'Ibaba',
      'Longos',
      'Maysilo',
      'Muzon',
      'Niugan',
      'Panghulo',
      'Potrero',
      'San Agustin',
      'Santolan',
      'Tañong',
      'Tinajeros',
      'Tugatog'
    ]
  },
  {
    city_name: 'Mandaluyong',
    total_barangays: 27,
    barangays: [
      'Addition Hills',
      'Bagong Silang',
      'Barangka Drive',
      'Barangka Ilaya',
      'Barangka Itaas',
      'Barangka Ibaba',
      'Buayang Bato',
      'Burol',
      'Daang Bakal',
      'Hagdang Bato Itaas',
      'Hagdang Bato Libis',
      'Harapin Ang Bukas',
      'Highway Hills',
      'Hulo',
      'Mabini-J. Rizal',
      'Malamig',
      'Namayan',
      'New Zañiga',
      'Old Zañiga',
      'Plainview',
      'Pleasant Hills',
      'Poblacion',
      'San Jose',
      'Vergara',
      'Wack-Wack Greenhills'
    ]
  },
  {
    city_name: 'Manila',
    total_barangays: 897,
    barangays: [
      'Barangay 659',
      'Barangay 659-A',
      'Barangay 660',
      'Barangay 666',
      'Binondo',
      'Ermita',
      'Intramuros',
      'Malate',
      'Paco',
      'Pandacan',
      'Port Area',
      'Quiapo',
      'Sampaloc',
      'San Andres',
      'San Miguel',
      'San Nicolas',
      'Santa Ana',
      'Santa Cruz',
      'Santa Mesa',
      'Tondo'
    ]
  },
  {
    city_name: 'Marikina',
    total_barangays: 16,
    barangays: [
      'Barangka',
      'Calumpang',
      'Concepcion Uno',
      'Concepcion Dos',
      'Fortune',
      'Industrial Valley Complex',
      'Jesus de la Peña',
      'Malanday',
      'Marikina Heights',
      'Nangka',
      'Parang',
      'San Roque',
      'Santa Elena',
      'Santo Niño',
      'Tañong',
      'Tumana'
    ]
  },
  {
    city_name: 'Muntinlupa',
    total_barangays: 9,
    barangays: [
      'Alabang',
      'Ayala Alabang',
      'Bayanan',
      'Buli',
      'Cupang',
      'Poblacion',
      'Putatan',
      'Sucat',
      'Tunasan'
    ]
  },
  {
    city_name: 'Navotas',
    total_barangays: 18,
    barangays: [
      'Bagumbayan North',
      'Bagumbayan South',
      'Bangkulasi',
      'Daanghari',
      'Navotas East',
      'Navotas West',
      'North Bay Boulevard North',
      'North Bay Boulevard South',
      'San Jose',
      'San Rafael Village',
      'San Roque',
      'Sipac-Almacen',
      'Tangos North',
      'Tangos South',
      'Tanza 1',
      'Tanza 2'
    ]
  },
  {
    city_name: 'Parañaque',
    total_barangays: 16,
    barangays: [
      'Baclaran',
      'BF Homes',
      'Don Bosco',
      'Don Galo',
      'La Huerta',
      'Marcelo Green',
      'Merville',
      'Moonwalk',
      'San Antonio',
      'San Dionisio',
      'San Isidro',
      'San Martin de Porres',
      'Santo Niño',
      'Sun Valley',
      'Tambo',
      'Vitalez'
    ]
  },
  {
    city_name: 'Pasay',
    total_barangays: 201,
    barangays: [
      'Barangay 1',
      'Barangay 76',
      'Barangay 183 (Villamor)',
      'Barangay 193',
      'Malibay',
      'Maricaban',
      'San Jose',
      'San Rafael',
      'San Isidro',
      'Santa Clara'
    ]
  },
  {
    city_name: 'Pasig',
    total_barangays: 30,
    barangays: [
      'Bagong Ilog',
      'Bagong Katipunan',
      'Bambang',
      'Buting',
      'Caniogan',
      'Dela Paz',
      'Kalawaan',
      'Kapasigan',
      'Kapitolyo',
      'Malinao',
      'Manggahan',
      'Maybunga',
      'Oranbo',
      'Palatiw',
      'Pinagbuhatan',
      'Pineda',
      'Rosario',
      'Sagad',
      'San Antonio',
      'San Joaquin',
      'San Jose',
      'San Nicolas',
      'Santa Cruz',
      'Santa Lucia',
      'Santa Rosa',
      'Santo Tomas',
      'Santolan',
      'Sumilang',
      'Ugong'
    ]
  },
  {
    city_name: 'Pateros',
    total_barangays: 10,
    barangays: [
      'Aguho',
      'Magtanggol',
      'Martirez del 96',
      'Poblacion',
      'San Pedro',
      'San Roque',
      'Santa Ana',
      'Santo Rosario-Kanluran',
      'Santo Rosario-Silangan',
      'Tabacalera'
    ]
  },
  {
    city_name: 'Quezon City',
    total_barangays: 142,
    barangays: [
      'Alicia',
      'Bagong Pag-asa',
      'Bahay Toro',
      'Balingasa',
      'Batasan Hills',
      'Central',
      'Commonwealth',
      'Cubao',
      'Diliman',
      'Holy Spirit',
      'Kamuning',
      'Loyola Heights',
      'Matandang Balara',
      'Novaliches Proper',
      'Pinyahan',
      'Project 6',
      'Roxas',
      'San Bartolome',
      'South Triangle',
      'Tandang Sora',
      "Teacher's Village East",
      "Teacher's Village West",
      'UP Campus',
      'Valencia'
    ]
  },
  {
    city_name: 'San Juan',
    total_barangays: 21,
    barangays: [
      'Addition Hills',
      'Balong-Bato',
      'Batis',
      'Corazon de Jesus',
      'Ermitaño',
      'Greenhills',
      'Isabelita',
      'Kabayanan',
      'Little Baguio',
      'Maytunas',
      'Onse',
      'Pasadeña',
      'Pedro Cruz',
      'Progreso',
      'Rivera',
      'Salapan',
      'San Perfecto',
      'Santa Lucia',
      'Tibagan',
      'West Crame'
    ]
  },
  {
    city_name: 'Taguig',
    total_barangays: 38,
    barangays: [
      'Bagumbayan',
      'Bambang',
      'Calzada',
      'Central Bicutan',
      'Central Signal Village',
      'Fort Bonifacio',
      'Hagonoy',
      'Ibayo-Tipas',
      'Katuparan',
      'Ligid-Tipas',
      'Lower Bicutan',
      'Maharlika Village',
      'Napindan',
      'New Lower Bicutan',
      'North Daang Hari',
      'North Signal Village',
      'Palingon',
      'Pinagsama',
      'San Miguel',
      'Santa Ana',
      'South Daang Hari',
      'South Signal Village',
      'Tanyag',
      'Tuktukan',
      'Upper Bicutan',
      'Ususan',
      'Wawa',
      'Western Bicutan'
    ]
  },
  {
    city_name: 'Valenzuela',
    total_barangays: 33,
    barangays: [
      'Arkong Bato',
      'Bagbaguin',
      'Balangkas',
      'Bignay',
      'Canumay East',
      'Canumay West',
      'Coloong',
      'Dalandanan',
      'Gen. T. de Leon',
      'Isla',
      'Karuhatan',
      'Lawang Bato',
      'Lingunan',
      'Mabolo',
      'Malanday',
      'Malinta',
      'Mapulang Lupa',
      'Marulas',
      'Maysan',
      'Palasan',
      'Parada',
      'Pariancillo Villa',
      'Paso de Blas',
      'Pasolo',
      'Poblacion',
      'Polo',
      'Punturin',
      'Rincon',
      'Tagalag',
      'Ugong',
      'Viente Reales',
      'Wawang Pulo'
    ]
  }
];

export const locationsRoute = new Hono<{ Bindings: Env }>();

/**
 * GET /locations/areas (A-M1-01, F-006, BR-004)
 * Returns the hierarchical list of all 17 NCR Local Government Units (LGUs)
 * and their constituent barangays for manual location selection fallback.
 */
locationsRoute.get('/areas', (c) => {
  const cityFilter = c.req.query('city')?.toLowerCase().trim();
  const queryFilter = c.req.query('query')?.toLowerCase().trim();

  let lgus = NCR_LGUS;

  if (cityFilter) {
    lgus = lgus.filter((lgu) => lgu.city_name.toLowerCase() === cityFilter);
  }

  if (queryFilter) {
    lgus = lgus
      .map((lgu) => {
        const matchesCity = lgu.city_name.toLowerCase().includes(queryFilter);
        const matchingBarangays = lgu.barangays.filter((b) => b.toLowerCase().includes(queryFilter));

        if (matchesCity) {
          return lgu;
        }
        if (matchingBarangays.length > 0) {
          return {
            ...lgu,
            barangays: matchingBarangays
          };
        }
        return null;
      })
      .filter((lgu): lgu is LguArea => lgu !== null);
  }

  return c.json({
    status: 'success',
    data: {
      lgus
    }
  });
});
