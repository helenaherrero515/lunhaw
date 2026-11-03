"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, X, Check, Building2 } from "lucide-react";
import type { Coordinates, LGUArea } from "@/types/places";

export interface LGUData extends LGUArea {
  centroid: Coordinates;
}

export const METRO_MANILA_LGUS: LGUData[] = [
  {
    city_name: "Caloocan",
    total_barangays: 188,
    barangays: [
      "Bagong Silang",
      "Barangay 1",
      "Barangay 2",
      "Barangay 3",
      "Barangay 171",
      "Grace Park East",
      "Grace Park West",
      "Morning Breeze",
    ],
    centroid: { lat: 14.65, lng: 120.983 },
  },
  {
    city_name: "Las Piñas",
    total_barangays: 20,
    barangays: [
      "Almanza Uno",
      "Almanza Dos",
      "BF International",
      "Pamplona Uno",
      "Pamplona Dos",
      "Pamplona Tres",
      "Pulang Lupa",
      "Talon Uno",
      "Talon Dos",
    ],
    centroid: { lat: 14.4445, lng: 120.9939 },
  },
  {
    city_name: "Makati",
    total_barangays: 33,
    barangays: [
      "Bel-Air",
      "Poblacion",
      "San Lorenzo",
      "Urdaneta",
      "San Antonio",
      "Pio del Pilar",
      "Bangkal",
      "Palanan",
      "Guadalupe Nuevo",
      "Guadalupe Viejo",
    ],
    centroid: { lat: 14.5547, lng: 121.0244 },
  },
  {
    city_name: "Malabon",
    total_barangays: 21,
    barangays: [
      "Catmon",
      "Concepcion",
      "Potrero",
      "Tonsuya",
      "Longos",
      "Dampalit",
      "Flores",
      "Hulong Duhat",
      "Ibaba",
      "Maysilo",
      "Niugan",
      "Panghulo",
      "San Agustin",
      "Tañong",
      "Tinajeros",
      "Tugatog",
    ],
    centroid: { lat: 14.6625, lng: 120.9569 },
  },
  {
    city_name: "Mandaluyong",
    total_barangays: 27,
    barangays: [
      "Highway Hills",
      "Plainview",
      "Wack-Wack Greenhills",
      "Addition Hills",
      "Barangka Ilaya",
      "Barangka Itaas",
      "Hulo",
      "Malamig",
      "Namayan",
      "Pleasant Hills",
    ],
    centroid: { lat: 14.5794, lng: 121.0359 },
  },
  {
    city_name: "Manila",
    total_barangays: 897,
    barangays: [
      "Barangay 659",
      "Barangay 660",
      "Intramuros",
      "Ermita",
      "Malate",
      "Binondo",
      "Quiapo",
      "Sampaloc",
      "San Miguel",
      "San Nicolas",
      "Santa Ana",
      "Santa Cruz",
      "Santa Mesa",
      "Tondo",
    ],
    centroid: { lat: 14.5995, lng: 120.9842 },
  },
  {
    city_name: "Marikina",
    total_barangays: 16,
    barangays: [
      "Concepcion Uno",
      "Concepcion Dos",
      "Marikina Heights",
      "Santo Niño",
      "Barangka",
      "Calumpang",
      "Fortune",
      "Industrial Valley",
      "Jesus Dela Peña",
      "Malanday",
      "Nangka",
      "Parang",
      "San Roque",
      "Santa Elena",
      "Tañong",
      "Tumana",
    ],
    centroid: { lat: 14.6507, lng: 121.1029 },
  },
  {
    city_name: "Muntinlupa",
    total_barangays: 9,
    barangays: [
      "Alabang",
      "Ayala Alabang",
      "Putatan",
      "Bayanan",
      "Buli",
      "Cupang",
      "Poblacion",
      "Sucat",
      "Tunasan",
    ],
    centroid: { lat: 14.4081, lng: 121.0415 },
  },
  {
    city_name: "Navotas",
    total_barangays: 18,
    barangays: [
      "Bagumbayan South",
      "San Jose",
      "Tangos South",
      "Bagumbayan North",
      "Bangkulasi",
      "Daanghari",
      "Navotas East",
      "Navotas West",
      "North Bay Boulevard North",
      "North Bay Boulevard South",
      "San Rafael Village",
      "San Roque",
      "Sipac-Almacen",
      "Tangos North",
      "Tanza 1",
      "Tanza 2",
    ],
    centroid: { lat: 14.6667, lng: 120.9417 },
  },
  {
    city_name: "Parañaque",
    total_barangays: 16,
    barangays: [
      "Baclaran",
      "BF Homes",
      "Don Bosco",
      "Don Galo",
      "La Huerta",
      "Marcelo Green",
      "Merville",
      "Moonwalk",
      "San Antonio",
      "San Dionisio",
      "San Isidro",
      "San Martin de Porres",
      "Santo Niño",
      "Sun Valley",
      "Tambo",
      "Vitalez",
    ],
    centroid: { lat: 14.4793, lng: 121.0198 },
  },
  {
    city_name: "Pasay",
    total_barangays: 201,
    barangays: [
      "Barangay 1",
      "Barangay 76",
      "San Rafael",
      "Barangay 183",
      "Malibay",
      "Maricaban",
      "San Jose",
      "San Isidro",
      "Santa Clara",
    ],
    centroid: { lat: 14.5378, lng: 121.0014 },
  },
  {
    city_name: "Pasig",
    total_barangays: 30,
    barangays: [
      "San Antonio",
      "Kapitolyo",
      "Ugong",
      "Oranbo",
      "Caniogan",
      "Bagong Ilog",
      "Bambang",
      "Dela Paz",
      "Kapasigan",
      "Manggahan",
      "Maybunga",
      "Pinagbuhatan",
      "Rosario",
      "San Joaquin",
      "San Nicolas",
      "Santa Cruz",
      "Santa Lucia",
      "Santa Rosa",
      "Santolan",
      "Sumilang",
    ],
    centroid: { lat: 14.5764, lng: 121.0851 },
  },
  {
    city_name: "Pateros",
    total_barangays: 10,
    barangays: [
      "Aguho",
      "Martirez del 96",
      "Santa Ana",
      "Magtanggol",
      "Poblacion",
      "San Pedro",
      "San Roque",
      "Santo Rosario-Kanluran",
      "Santo Rosario-Silangan",
      "Tabacalera",
    ],
    centroid: { lat: 14.5454, lng: 121.0686 },
  },
  {
    city_name: "Quezon City",
    total_barangays: 142,
    barangays: [
      "Central",
      "Diliman",
      "Loyola Heights",
      "Batasan Hills",
      "Commonwealth",
      "Cubao",
      "Holy Spirit",
      "Kamuning",
      "New Manila",
      "Novaliches Proper",
      "Pasong Tamo",
      "Roxas",
      "San Bartolome",
      "South Triangle",
      "Tandang Sora",
      "UP Campus",
    ],
    centroid: { lat: 14.676, lng: 121.0437 },
  },
  {
    city_name: "San Juan",
    total_barangays: 21,
    barangays: [
      "Greenhills",
      "Addition Hills",
      "Little Baguio",
      "Batis",
      "Corazon de Jesus",
      "Kabayanan",
      "Maytunas",
      "Onse",
      "Pedro Cruz",
      "Progreso",
      "Rivera",
      "Salapan",
      "San Perfecto",
      "Santa Lucia",
      "Tibagan",
      "West Crame",
    ],
    centroid: { lat: 14.6019, lng: 121.0355 },
  },
  {
    city_name: "Taguig",
    total_barangays: 38,
    barangays: [
      "Fort Bonifacio",
      "Ususan",
      "Western Bicutan",
      "Bagumbayan",
      "Bambang",
      "Calzada",
      "Hagonoy",
      "Ibayo-Tipas",
      "Ligid-Tipas",
      "Lower Bicutan",
      "Maharlika Village",
      "Napindan",
      "Palingon",
      "San Miguel",
      "Santa Ana",
      "Tuktukan",
      "Upper Bicutan",
    ],
    centroid: { lat: 14.5176, lng: 121.0509 },
  },
  {
    city_name: "Valenzuela",
    total_barangays: 33,
    barangays: [
      "Gen. T. de Leon",
      "Karuhatan",
      "Poblacion",
      "Arkong Bato",
      "Bagbaguin",
      "Canumay East",
      "Canumay West",
      "Dalandanan",
      "Fortune",
      "Lawang Bato",
      "Malinta",
      "Mapulang Lupa",
      "Marulas",
      "Maysan",
      "Pariancillo Villa",
      "Paso de Blas",
      "Pasolo",
      "Polo",
      "Rincon",
      "Tagalag",
      "Ugong",
      "Viente Reales",
      "Wawang Pulo",
    ],
    centroid: { lat: 14.7011, lng: 120.983 },
  },
];

export interface LGUSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (selection: {
    city: string;
    barangay?: string;
    coordinates?: Coordinates;
  }) => void;
  selectedCity?: string | null;
  selectedBarangay?: string | null;
  title?: string;
  description?: string;
}

export function LGUSelectorModal({
  isOpen,
  onClose,
  onSelectLocation,
  selectedCity: initialCity = null,
  selectedBarangay: initialBarangay = null,
  title = "Select Area in Metro Manila",
  description = "Choose your city and barangay to explore nearby public green spaces and study havens.",
}: LGUSelectorModalProps) {
  const [city, setCity] = useState<string>(initialCity || "");
  const [barangay, setBarangay] = useState<string>(initialBarangay || "");
  const [citySearch, setCitySearch] = useState<string>("");
  const [barangaySearch, setBarangaySearch] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCity) setCity(initialCity);
    if (initialBarangay) setBarangay(initialBarangay);
  }, [initialCity, initialBarangay, isOpen]);

  // Handle escape key listener for accessible dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return METRO_MANILA_LGUS;
    const q = citySearch.toLowerCase();
    return METRO_MANILA_LGUS.filter((lgu) =>
      lgu.city_name.toLowerCase().includes(q)
    );
  }, [citySearch]);

  // Selected city object
  const activeCityData = useMemo(() => {
    return METRO_MANILA_LGUS.find(
      (l) => l.city_name.toLowerCase() === city.toLowerCase()
    );
  }, [city]);

  // Filtered barangays for selected city
  const filteredBarangays = useMemo(() => {
    if (!activeCityData) return [];
    if (!barangaySearch.trim()) return activeCityData.barangays;
    const q = barangaySearch.toLowerCase();
    return activeCityData.barangays.filter((b) => b.toLowerCase().includes(q));
  }, [activeCityData, barangaySearch]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;

    const selectedCoords = activeCityData?.centroid;
    onSelectLocation({
      city,
      barangay: barangay || undefined,
      coordinates: selectedCoords,
    });
    onClose();
  };

  const handleSelectCity = (cityName: string) => {
    setCity(cityName);
    setBarangay("");
    setBarangaySearch("");
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgu-modal-title"
        aria-describedby="lgu-modal-desc"
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-emerald-900/10 bg-[#FDFBF7] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200/80 p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="lgu-modal-title"
                className="text-lg font-bold text-stone-900"
              >
                {title}
              </h2>
              <p
                id="lgu-modal-desc"
                className="mt-0.5 text-xs leading-relaxed text-stone-600"
              >
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden p-5">
          <div className="grid flex-1 gap-5 overflow-y-auto pr-1">
            {/* Step 1: City Selection */}
            <div>
              <label
                htmlFor="city-select"
                className="block text-xs font-semibold uppercase tracking-wider text-emerald-900"
              >
                1. Select City or Municipality (17 LGUs)
              </label>

              {/* City Quick Dropdown */}
              <div className="mt-1.5">
                <select
                  id="city-select"
                  value={city}
                  onChange={(e) => handleSelectCity(e.target.value)}
                  aria-label="Select City or Municipality"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-800 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  <option value="">-- Choose a Metro Manila City --</option>
                  {METRO_MANILA_LGUS.map((lgu) => (
                    <option key={lgu.city_name} value={lgu.city_name}>
                      {lgu.city_name} ({lgu.total_barangays} barangays)
                    </option>
                  ))}
                </select>
              </div>

              {/* Searchable City Filter Input */}
              <div className="relative mt-2">
                <Search
                  className="absolute left-3 top-2.5 h-4 w-4 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city..."
                  aria-label="Search city or municipality"
                />
              </div>

              {/* City Pill Grid */}
              <div
                role="listbox"
                aria-label="Metro Manila Cities"
                className="mt-2.5 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-stone-100 bg-stone-50/50 p-2"
              >
                {filteredCities.map((lgu) => {
                  const isSelected =
                    city.toLowerCase() === lgu.city_name.toLowerCase();
                  return (
                    <button
                      key={lgu.city_name}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCity(lgu.city_name)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-800"
                          : "bg-white text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200/80"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{lgu.city_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Barangay Selection (active when city is selected) */}
            <div className={city ? "opacity-100" : "opacity-40 pointer-events-none"}>
              <label
                htmlFor="barangay-select"
                className="block text-xs font-semibold uppercase tracking-wider text-emerald-900"
              >
                2. Barangays in {city || "City"}
              </label>

              {/* Barangay Dropdown */}
              <div className="mt-1.5">
                <select
                  id="barangay-select"
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  disabled={!city}
                  aria-label="Select Barangay"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-800 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  <option value="">-- All Barangays in {city || "City"} --</option>
                  {activeCityData?.barangays.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Barangay Filter Input */}
              {activeCityData && activeCityData.barangays.length > 0 && (
                <div className="relative mt-2">
                  <Search
                    className="absolute left-3 top-2.5 h-4 w-4 text-stone-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={barangaySearch}
                    onChange={(e) => setBarangaySearch(e.target.value)}
                    placeholder={`Search barangays in ${city}...`}
                    aria-label="Search barangay"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/80 py-2 pl-9 pr-3 text-xs text-stone-700 placeholder:text-stone-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              )}

              {/* Barangay Quick Pills */}
              {activeCityData && (
                <div
                  role="listbox"
                  aria-label={`Barangays in ${city}`}
                  className="mt-2.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-stone-100 bg-stone-50/50 p-2"
                >
                  {filteredBarangays.map((b) => {
                    const isSelected =
                      barangay.toLowerCase() === b.toLowerCase();
                    return (
                      <button
                        key={b}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => setBarangay(b)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs transition-all ${
                          isSelected
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-white text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                        <span>{b}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-5 flex items-center justify-between border-t border-stone-200/80 pt-4">
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="h-3.5 w-3.5 text-emerald-700" />
              <span>
                {city
                  ? `${barangay ? `${barangay}, ` : ""}${city}`
                  : "No area selected"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!city}
                aria-label="Confirm location"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                <span>Confirm Area</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
