// ============================================================================
// SANTA-OS - Embedded Advent Calendar Route Schedule (Auto-Generated)
// Source: page/public/journey.json via scripts/export-firmware-schedule.mjs
// ============================================================================
// Educational Note on Memory Architecture:
// This 24-day itinerary contains 288 stops total (12 stops/day).
// Instead of allocating a 130KB JSON string in SRAM (which would exceed the
// 25% SRAM budget < 56KB), this entire table is compiled into PROGMEM (Flash ROM).
//
// Flash ROM consumption: 288 * 28 bytes = ~8.0 KB (~0.27% of 3MB partition)
// Dynamic Heap RAM:      0 bytes
// ============================================================================

#pragma once
#include "types.h"

#ifndef PROGMEM
  #define PROGMEM
#endif

#define ADVENT_TOTAL_DAYS      24
#define ADVENT_STOPS_PER_DAY   12
#define ADVENT_TOTAL_STOPS     (ADVENT_TOTAL_DAYS * ADVENT_STOPS_PER_DAY)

// Compact waypoint record stored in Flash ROM
struct AdventWaypoint {
  char name[20]; // Truncated uppercase ASCII label for 5x7 GLCD bitmap font
  float lon;     // GPS Longitude (-180.0 .. +180.0)
  float lat;     // GPS Latitude  (-90.0 .. +90.0)
};

// Static table stored in PROGMEM
const AdventWaypoint ADVENT_SCHEDULE[ADVENT_TOTAL_DAYS][ADVENT_STOPS_PER_DAY] PROGMEM = {
  // --- Day 1: 2026-12-01 | Etap Dnia 1 ---
  {
    { "AUCKLAND", 174.7633f, -36.8485f }, // Stop 1: Auckland
    { "SYDNEY", 151.2093f, -33.8688f }, // Stop 2: Sydney
    { "TOKIO", 139.6503f, 35.6762f }, // Stop 3: Tokio
    { "SEOUL", 126.9780f, 37.5665f }, // Stop 4: Seoul
    { "ROVANIEMI", 25.7294f, 66.5039f }, // Stop 5: Rovaniemi
    { "STOCKHOLM", 18.0686f, 59.3293f }, // Stop 6: Stockholm
    { "KAIR", 31.2357f, 30.0444f }, // Stop 7: Kair
    { "NAIROBI", 36.8219f, -1.2921f }, // Stop 8: Nairobi
    { "ANCHORAGE", -149.9003f, 61.2181f }, // Stop 9: Anchorage (AK)
    { "VANCOUVER", -123.1207f, 49.2827f }, // Stop 10: Vancouver
    { "BOGOTÁ", -74.0721f, 4.7110f }, // Stop 11: Bogotá
    { "QUITO", -78.4678f, -0.1807f }, // Stop 12: Quito
  },
  // --- Day 2: 2026-12-02 | Etap Dnia 2 ---
  {
    { "WELLINGTON", 174.7762f, -41.2865f }, // Stop 1: Wellington
    { "MELBOURNE", 144.9631f, -37.8136f }, // Stop 2: Melbourne
    { "TAIPEI", 121.5654f, 25.0330f }, // Stop 3: Taipei
    { "SINGAPUR", 103.8198f, 1.3521f }, // Stop 4: Singapur
    { "OSLO", 10.7522f, 59.9139f }, // Stop 5: Oslo
    { "COPENHAGEN", 12.5683f, 55.6761f }, // Stop 6: Copenhagen
    { "ZANZIBAR", 39.2026f, -6.1659f }, // Stop 7: Zanzibar
    { "ADDIS ABABA", 38.7400f, 9.0300f }, // Stop 8: Addis Ababa
    { "SEATTLE", -122.3321f, 47.6062f }, // Stop 9: Seattle (WA)
    { "CALGARY", -114.0719f, 51.0447f }, // Stop 10: Calgary
    { "LIMA", -77.0428f, -12.0464f }, // Stop 11: Lima
    { "CUSCO", -71.9675f, -13.5319f }, // Stop 12: Cusco
  },
  // --- Day 3: 2026-12-03 | Etap Dnia 3 ---
  {
    { "SUVA", 178.4419f, -18.1416f }, // Stop 1: Suva
    { "BRISBANE", 153.0251f, -27.4698f }, // Stop 2: Brisbane
    { "HONG KONG", 114.1694f, 22.3193f }, // Stop 3: Hong Kong
    { "PEKIN", 116.4074f, 39.9042f }, // Stop 4: Pekin
    { "BERLIN", 13.4050f, 52.5200f }, // Stop 5: Berlin
    { "BELFAST", -5.9301f, 54.5973f }, // Stop 6: Belfast
    { "KIGALI", 30.1044f, -1.9706f }, // Stop 7: Kigali
    { "VICTORIA FALLS", 25.8572f, -17.9243f }, // Stop 8: Victoria Falls
    { "SAN FRANCISCO", -122.4194f, 37.7749f }, // Stop 9: San Francisco (CA)
    { "SALT LAKE CITY", -111.8910f, 40.7608f }, // Stop 10: Salt Lake City (UT)
    { "LA PAZ", -68.1193f, -16.4897f }, // Stop 11: La Paz
    { "SANTIAGO", -70.6693f, -33.4489f }, // Stop 12: Santiago
  },
  // --- Day 4: 2026-12-04 | Etap Dnia 4 ---
  {
    { "CHRISTCHURCH", 172.6362f, -43.5321f }, // Stop 1: Christchurch
    { "HOBART", 147.3272f, -42.8821f }, // Stop 2: Hobart
    { "KYOTO", 135.7681f, 35.0116f }, // Stop 3: Kyoto
    { "BANGKOK", 100.5018f, 13.7563f }, // Stop 4: Bangkok
    { "WARSZAWA", 21.0122f, 52.2297f }, // Stop 5: Warszawa
    { "PRAGA", 14.4378f, 50.0755f }, // Stop 6: Praga
    { "KAPSZTAD", 18.4241f, -33.9249f }, // Stop 7: Kapsztad
    { "JOHANNESBURG", 28.0473f, -26.2041f }, // Stop 8: Johannesburg
    { "DENVER", -104.9903f, 39.7392f }, // Stop 9: Denver (CO)
    { "GUADALAJARA", -103.3496f, 20.6597f }, // Stop 10: Guadalajara
    { "BARILOCHE", -71.3103f, -41.1335f }, // Stop 11: Bariloche
    { "USHUAIA", -68.3030f, -54.8019f }, // Stop 12: Ushuaia
  },
  // --- Day 5: 2026-12-05 | Etap Dnia 5 ---
  {
    { "PERTH", 115.8605f, -31.9505f }, // Stop 1: Perth
    { "HANOI", 105.8542f, 21.0285f }, // Stop 2: Hanoi
    { "KUALA LUMPUR", 101.6869f, 3.1390f }, // Stop 3: Kuala Lumpur
    { "WIEDEN", 16.3738f, 48.2082f }, // Stop 4: Wiedeń
    { "ZURICH", 8.5417f, 47.3769f }, // Stop 5: Zurich
    { "WINDHOEK", 17.0658f, -22.5609f }, // Stop 6: Windhoek
    { "ANTANANARIVO", 47.5079f, -18.8792f }, // Stop 7: Antananarivo
    { "MEXICO CITY", -99.1332f, 19.4326f }, // Stop 8: Mexico City
    { "AUSTIN", -97.7431f, 30.2672f }, // Stop 9: Austin (TX)
    { "BUENOS AIRES", -58.3816f, -34.6037f }, // Stop 10: Buenos Aires
    { "MONTEVIDEO", -56.1645f, -34.9011f }, // Stop 11: Montevideo
    { "APIA", -171.7667f, -13.8333f }, // Stop 12: Apia
  },
  // --- Day 6: 2026-12-06 | Mikołajki ---
  {
    { "ADELAIDE", 138.6007f, -34.9285f }, // Stop 1: Adelaide
    { "MANILA", 120.9842f, 14.5995f }, // Stop 2: Manila
    { "JAKARTA", 106.8456f, -6.2088f }, // Stop 3: Jakarta
    { "GENEWA", 6.1432f, 46.2044f }, // Stop 4: Genewa
    { "RZYM", 12.4964f, 41.9028f }, // Stop 5: Rzym
    { "PORT LOUIS", 57.5012f, -20.1609f }, // Stop 6: Port Louis
    { "LUANDA", 13.2894f, -8.8390f }, // Stop 7: Luanda
    { "NEW ORLEANS", -90.0715f, 29.9511f }, // Stop 8: New Orleans (LA)
    { "CHICAGO", -87.6298f, 41.8781f }, // Stop 9: Chicago (IL)
    { "ASUNCION", -57.5759f, -25.2637f }, // Stop 10: Asunción
    { "FLORIANOPOLIS", -48.5480f, -27.5954f }, // Stop 11: Florianópolis
    { "NUKUʻALOFA", -175.2018f, -21.1393f }, // Stop 12: Nukuʻalofa
  },
  // --- Day 7: 2026-12-07 | Etap Dnia 7 ---
  {
    { "PORT VILA", 168.3273f, -17.7333f }, // Stop 1: Port Vila
    { "CAIRNS", 145.7781f, -16.9186f }, // Stop 2: Cairns
    { "NEW DELHI", 77.2090f, 28.6139f }, // Stop 3: New Delhi
    { "MUMBAI", 72.8777f, 19.0760f }, // Stop 4: Mumbai
    { "FLORENCE", 11.2558f, 43.7696f }, // Stop 5: Florence
    { "BARCELONA", 2.1734f, 41.3851f }, // Stop 6: Barcelona
    { "LAGOS", 3.3792f, 6.5244f }, // Stop 7: Lagos
    { "ACCRA", -0.1870f, 5.6037f }, // Stop 8: Accra
    { "TORONTO", -79.3832f, 43.6532f }, // Stop 9: Toronto
    { "MONTREAL", -73.5673f, 45.5017f }, // Stop 10: Montreal
    { "SÃO PAULO", -46.6333f, -23.5505f }, // Stop 11: São Paulo
    { "RIO DE JANEIRO", -43.1729f, -22.9068f }, // Stop 12: Rio de Janeiro
  },
  // --- Day 8: 2026-12-08 | Etap Dnia 8 ---
  {
    { "PORT MORESBY", 147.1803f, -9.4438f }, // Stop 1: Port Moresby
    { "DARWIN", 130.8456f, -12.4634f }, // Stop 2: Darwin
    { "KATHMANDU", 85.3240f, 27.7172f }, // Stop 3: Kathmandu
    { "THIMPHU", 89.6393f, 27.4728f }, // Stop 4: Thimphu
    { "MADRID", -3.7038f, 40.4168f }, // Stop 5: Madrid
    { "LIZBONA", -9.1393f, 38.7223f }, // Stop 6: Lizbona
    { "DAKAR", -17.4677f, 14.7167f }, // Stop 7: Dakar
    { "MARRAKECH", -7.9811f, 31.6295f }, // Stop 8: Marrakech
    { "BOSTON", -71.0589f, 42.3601f }, // Stop 9: Boston (MA)
    { "NEW YORK CITY", -74.0060f, 40.7128f }, // Stop 10: New York City (NY)
    { "SALVADOR DA BAHIA", -38.5016f, -12.9777f }, // Stop 11: Salvador da Bahia
    { "FORTALEZA", -38.5267f, -3.7319f }, // Stop 12: Fortaleza
  },
  // --- Day 9: 2026-12-09 | Etap Dnia 9 ---
  {
    { "ALICE SPRINGS", 133.8807f, -23.6980f }, // Stop 1: Alice Springs
    { "TASHKENT", 69.2401f, 41.2995f }, // Stop 2: Tashkent
    { "ALMATY", 76.8512f, 43.2220f }, // Stop 3: Almaty
    { "PORTO", -8.6291f, 41.1579f }, // Stop 4: Porto
    { "PARIS", 2.3522f, 48.8566f }, // Stop 5: Paris
    { "CASABLANCA", -7.5898f, 33.5731f }, // Stop 6: Casablanca
    { "ALGIER", 3.0588f, 36.7538f }, // Stop 7: Algier
    { "PHILADELPHIA", -75.1652f, 39.9526f }, // Stop 8: Philadelphia (PA)
    { "WASHINGTON, D.C.", -77.0369f, 38.9072f }, // Stop 9: Washington, D.C.
    { "MANAUS", -60.0217f, -3.1190f }, // Stop 10: Manaus
    { "GEORGETOWN", -58.1551f, 6.8013f }, // Stop 11: Georgetown
    { "RAROTONGA", -159.7777f, -21.2367f }, // Stop 12: Rarotonga
  },
  // --- Day 10: 2026-12-10 | Etap Dnia 10 ---
  {
    { "BROOME", 122.2359f, -17.9614f }, // Stop 1: Broome
    { "TBILISI", 44.8271f, 41.7151f }, // Stop 2: Tbilisi
    { "BAKU", 49.8671f, 40.4093f }, // Stop 3: Baku
    { "LYON", 4.8357f, 45.7640f }, // Stop 4: Lyon
    { "BRUKSELA", 4.3517f, 50.8503f }, // Stop 5: Bruksela
    { "TUNIS", 10.1815f, 36.8065f }, // Stop 6: Tunis
    { "ALEXANDRIA", 29.9187f, 31.2001f }, // Stop 7: Alexandria
    { "ATLANTA", -84.3880f, 33.7490f }, // Stop 8: Atlanta (GA)
    { "MIAMI", -80.1918f, 25.7617f }, // Stop 9: Miami (FL)
    { "PARAMARIBO", -55.2038f, 5.8520f }, // Stop 10: Paramaribo
    { "CARACAS", -66.9036f, 10.4806f }, // Stop 11: Caracas
    { "PAPEETE", -149.5585f, -17.5516f }, // Stop 12: Papeete
  },
  // --- Day 11: 2026-12-11 | Etap Dnia 11 ---
  {
    { "NOUMÉA", 166.4580f, -22.2758f }, // Stop 1: Nouméa
    { "GOLD COAST", 153.4000f, -28.0167f }, // Stop 2: Gold Coast
    { "DUBAI", 55.2708f, 25.2048f }, // Stop 3: Dubai
    { "MUSCAT", 58.3829f, 23.5880f }, // Stop 4: Muscat
    { "AMSTERDAM", 4.9041f, 52.3676f }, // Stop 5: Amsterdam
    { "LONDYN", -0.1278f, 51.5074f }, // Stop 6: Londyn
    { "LUXOR", 32.6396f, 25.6872f }, // Stop 7: Luxor
    { "KAMPALA", 32.5825f, 0.3476f }, // Stop 8: Kampala
    { "HAVANA", -82.3666f, 23.1136f }, // Stop 9: Havana
    { "SAN JUAN", -66.1057f, 18.4655f }, // Stop 10: San Juan
    { "CARTAGENA", -75.4794f, 10.3910f }, // Stop 11: Cartagena
    { "GALAPAGOS", -90.3138f, -0.7432f }, // Stop 12: Galapagos (Puerto Ayora)
  },
  // --- Day 12: 2026-12-12 | Etap Dnia 12 ---
  {
    { "HONIARA", 159.9729f, -9.4456f }, // Stop 1: Honiara
    { "CANBERRA", 149.1300f, -35.2809f }, // Stop 2: Canberra
    { "DOHA", 51.5310f, 25.2854f }, // Stop 3: Doha
    { "RIYADH", 46.6753f, 24.7136f }, // Stop 4: Riyadh
    { "EDINBURGH", -3.1883f, 55.9533f }, // Stop 5: Edinburgh
    { "DUBLIN", -6.2603f, 53.3498f }, // Stop 6: Dublin
    { "GABORONE", 25.9231f, -24.6282f }, // Stop 7: Gaborone
    { "MAPUTO", 32.5732f, -25.9692f }, // Stop 8: Maputo
    { "QUEBEC CITY", -71.2080f, 46.8139f }, // Stop 9: Quebec City
    { "SANTA CLAUS", -86.9142f, 38.1217f }, // Stop 10: Santa Claus (IN)
    { "MEDELLÍN", -75.5812f, 6.2442f }, // Stop 11: Medellín
    { "PUNTA ARENAS", -70.9171f, -53.1638f }, // Stop 12: Pole Lodowe Patagonii (Punta Arenas)
  },
  // --- Day 13: 2026-12-13 | Etap Dnia 13 ---
  {
    { "QUEENSTOWN", 168.6626f, -45.0312f }, // Stop 1: Queenstown
    { "NEWCASTLE", 151.7817f, -32.9283f }, // Stop 2: Newcastle
    { "AMMAN", 35.9284f, 31.9454f }, // Stop 3: Amman
    { "PETRA", 35.4444f, 30.3285f }, // Stop 4: Petra
    { "REYKJAVIK", -21.9426f, 64.1466f }, // Stop 5: Reykjavik
    { "TROMSØ", 18.9553f, 69.6492f }, // Stop 6: Tromsø
    { "LUSAKA", 28.3228f, -15.3875f }, // Stop 7: Lusaka
    { "VICTORIA", 55.4513f, -4.6191f }, // Stop 8: Victoria
    { "HALIFAX", -63.5752f, 44.6488f }, // Stop 9: Halifax (NS)
    { "ST. JOHN'S", -52.7126f, 47.5615f }, // Stop 10: St. John's (NL)
    { "CORDOBA", -64.1888f, -31.4201f }, // Stop 11: Córdoba
    { "MENDOZA", -68.8458f, -32.8895f }, // Stop 12: Mendoza
  },
  // --- Day 14: 2026-12-14 | Etap Dnia 14 ---
  {
    { "PALIKIR", 158.1611f, 6.9248f }, // Stop 1: Palikir
    { "SUNSHINE COAST", 153.0667f, -26.6500f }, // Stop 2: Sunshine Coast
    { "JERUSALEM", 35.2137f, 31.7683f }, // Stop 3: Jerusalem
    { "BEIRUT", 35.5018f, 33.8938f }, // Stop 4: Beirut
    { "TALLINN", 24.7536f, 59.4370f }, // Stop 5: Tallinn
    { "RIGA", 24.1052f, 56.9496f }, // Stop 6: Riga
    { "PRAIA", -23.5133f, 14.9330f }, // Stop 7: Praia
    { "ABIDJAN", -4.0083f, 5.3600f }, // Stop 8: Abidjan
    { "MINNEAPOLIS", -93.2650f, 44.9778f }, // Stop 9: Minneapolis (MN)
    { "DETROIT", -83.0458f, 42.3314f }, // Stop 10: Detroit (MI)
    { "SALTA", -65.4232f, -24.7821f }, // Stop 11: Salta
    { "VALPARAÍSO", -71.6127f, -33.0472f }, // Stop 12: Valparaíso
  },
  // --- Day 15: 2026-12-15 | Etap Dnia 15 ---
  {
    { "MAJURO", 171.1833f, 7.1167f }, // Stop 1: Majuro
    { "GEELONG", 144.3617f, -38.1499f }, // Stop 2: Geelong
    { "ISTANBUL", 28.9784f, 41.0082f }, // Stop 3: Istanbul
    { "YEREVAN", 44.4991f, 40.1792f }, // Stop 4: Yerevan
    { "VILNIUS", 25.2797f, 54.6872f }, // Stop 5: Vilnius
    { "BUDAPEST", 19.0402f, 47.4979f }, // Stop 6: Budapest
    { "YAOUNDÉ", 11.5021f, 3.8480f }, // Stop 7: Yaoundé
    { "DAR ES SALAAM", 39.2083f, -6.7924f }, // Stop 8: Dar es Salaam
    { "NASHVILLE", -86.7816f, 36.1627f }, // Stop 9: Nashville (TN)
    { "PHOENIX", -112.0740f, 33.4484f }, // Stop 10: Phoenix (AZ)
    { "SAN PEDRO DE ATACAM", -68.1997f, -22.9087f }, // Stop 11: San Pedro de Atacama
    { "UYUNI", -66.8261f, -20.4607f }, // Stop 12: Uyuni
  },
  // --- Day 16: 2026-12-16 | Etap Dnia 16 ---
  {
    { "NGERULMUD", 134.6242f, 7.5004f }, // Stop 1: Ngerulmud
    { "TOWNSVILLE", 146.8169f, -19.2590f }, // Stop 2: Townsville
    { "COLOMBO", 79.8612f, 6.9271f }, // Stop 3: Colombo
    { "MALÉ", 73.5093f, 4.1755f }, // Stop 4: Malé
    { "BRATISLAVA", 17.1077f, 48.1486f }, // Stop 5: Bratislava
    { "LJUBLJANA", 14.5058f, 46.0569f }, // Stop 6: Ljubljana
    { "DURBAN", 31.0218f, -29.8587f }, // Stop 7: Durban
    { "SWAKOPMUND", 14.5333f, -22.6833f }, // Stop 8: Swakopmund
    { "LAS VEGAS", -115.1398f, 36.1699f }, // Stop 9: Las Vegas (NV)
    { "LOS ANGELES", -118.2437f, 34.0522f }, // Stop 10: Los Angeles (CA)
    { "SUCRE", -65.2619f, -19.0196f }, // Stop 11: Sucre
    { "AREQUIPA", -71.5375f, -16.4090f }, // Stop 12: Arequipa
  },
  // --- Day 17: 2026-12-17 | Etap Dnia 17 ---
  {
    { "SOUTH TARAWA", 172.9790f, 1.3291f }, // Stop 1: South Tarawa
    { "TOOWOOMBA", 151.9507f, -27.5598f }, // Stop 2: Toowoomba
    { "ULAANBAATAR", 106.9057f, 47.9077f }, // Stop 3: Ulaanbaatar
    { "BUSAN", 129.0756f, 35.1796f }, // Stop 4: Busan
    { "ZAGREB", 15.9819f, 45.8150f }, // Stop 5: Zagreb
    { "DUBROVNIK", 18.0944f, 42.6507f }, // Stop 6: Dubrovnik
    { "COTONOU", 2.4183f, 6.3703f }, // Stop 7: Cotonou
    { "LOMÉ", 1.2125f, 6.1375f }, // Stop 8: Lomé
    { "SAN DIEGO", -117.1611f, 32.7157f }, // Stop 9: San Diego (CA)
    { "OTTAWA", -75.6972f, 45.4215f }, // Stop 10: Ottawa
    { "TRUJILLO", -79.0215f, -8.1091f }, // Stop 11: Trujillo
    { "BRASÍLIA", -47.8919f, -15.7975f }, // Stop 12: Brasília
  },
  // --- Day 18: 2026-12-18 | Etap Dnia 18 ---
  {
    { "FUNAFUTI", 179.1983f, -8.5211f }, // Stop 1: Funafuti
    { "BALLARAT", 143.8503f, -37.5622f }, // Stop 2: Ballarat
    { "OSAKA", 135.5023f, 34.6937f }, // Stop 3: Osaka
    { "SAPPORO", 141.3545f, 43.0618f }, // Stop 4: Sapporo
    { "ATENY", 23.7275f, 37.9838f }, // Stop 5: Ateny
    { "BRASOV", 25.6012f, 45.6579f }, // Stop 6: Brasov
    { "LIBREVILLE", 9.4673f, 0.4162f }, // Stop 7: Libreville
    { "BRAZZAVILLE", 15.2429f, -4.2634f }, // Stop 8: Brazzaville
    { "WINNIPEG", -97.1384f, 49.8951f }, // Stop 9: Winnipeg
    { "EDMONTON", -113.4938f, 53.5461f }, // Stop 10: Edmonton
    { "CURITIBA", -49.2733f, -25.4284f }, // Stop 11: Curitiba
    { "BELO HORIZONTE", -43.9345f, -19.9167f }, // Stop 12: Belo Horizonte
  },
  // --- Day 19: 2026-12-19 | Etap Dnia 19 ---
  {
    { "YAREN", 166.9209f, -0.5477f }, // Stop 1: Yaren
    { "BENDIGO", 144.2794f, -36.7570f }, // Stop 2: Bendigo
    { "SHANGHAI", 121.4737f, 31.2304f }, // Stop 3: Shanghai
    { "XI'AN", 108.9398f, 34.3416f }, // Stop 4: Xi'an
    { "SOFIA", 23.3219f, 42.6977f }, // Stop 5: Sofia
    { "BELGRADE", 20.4489f, 44.7866f }, // Stop 6: Belgrade
    { "KINSHASA", 15.2663f, -4.4419f }, // Stop 7: Kinshasa
    { "LILONGWE", 33.7741f, -13.9626f }, // Stop 8: Lilongwe
    { "VICTORIA", -123.3656f, 48.4284f }, // Stop 9: Victoria (BC)
    { "MONTERREY", -100.3161f, 25.6866f }, // Stop 10: Monterrey
    { "RECIFE", -34.8770f, -8.0476f }, // Stop 11: Recife
    { "BELÉM", -48.4902f, -1.4558f }, // Stop 12: Belém
  },
  // --- Day 20: 2026-12-20 | Etap Dnia 20 ---
  {
    { "DUNEDIN", 170.5028f, -45.8788f }, // Stop 1: Dunedin
    { "LAUNCESTON", 147.1441f, -41.4332f }, // Stop 2: Launceston
    { "DA NANG", 108.2022f, 16.0544f }, // Stop 3: Da Nang
    { "BALI", 115.2126f, -8.6705f }, // Stop 4: Bali (Denpasar)
    { "MONACHIUM", 11.5820f, 48.1351f }, // Stop 5: Monachium
    { "KOLONIA", 6.9603f, 50.9375f }, // Stop 6: Kolonia
    { "BAMAKO", -8.0029f, 12.6392f }, // Stop 7: Bamako
    { "OUAGADOUGOU", -1.5197f, 12.3714f }, // Stop 8: Ouagadougou
    { "CANCÚN", -86.8515f, 21.1619f }, // Stop 9: Cancún
    { "OAXACA", -96.7266f, 17.0732f }, // Stop 10: Oaxaca
    { "CALI", -76.5320f, 3.4516f }, // Stop 11: Cali
    { "BARRANQUILLA", -74.7813f, 10.9685f }, // Stop 12: Barranquilla
  },
  // --- Day 21: 2026-12-21 | Etap Dnia 21 ---
  {
    { "NAPIER", 176.9120f, -39.4928f }, // Stop 1: Napier
    { "WOLLONGONG", 150.8931f, -34.4278f }, // Stop 2: Wollongong
    { "SIEM REAP", 103.8448f, 13.3671f }, // Stop 3: Siem Reap
    { "LUANG PRABANG", 102.1366f, 19.8893f }, // Stop 4: Luang Prabang
    { "STRASBOURG", 7.7521f, 48.5734f }, // Stop 5: Strasbourg
    { "LUCERNE", 8.3093f, 47.0502f }, // Stop 6: Lucerne
    { "FES", -5.0078f, 34.0181f }, // Stop 7: Fes
    { "ARUSHA", 36.6830f, -3.3869f }, // Stop 8: Arusha
    { "SAN JOSÉ", -84.0907f, 9.9281f }, // Stop 9: San José
    { "PANAMA CITY", -79.5199f, 8.9824f }, // Stop 10: Panama City
    { "CUENCA", -79.0059f, -2.9001f }, // Stop 11: Cuenca
    { "PUERTO VARAS", -72.9854f, -41.3195f }, // Stop 12: Puerto Varas
  },
  // --- Day 22: 2026-12-22 | Etap Dnia 22 ---
  {
    { "ROTORUA", 176.2497f, -38.1368f }, // Stop 1: Rotorua
    { "MACKAY", 149.1861f, -21.1411f }, // Stop 2: Mackay
    { "BENGALURU", 77.5946f, 12.9716f }, // Stop 3: Bengaluru
    { "JAIPUR", 75.7873f, 26.9124f }, // Stop 4: Jaipur
    { "BERGEN", 5.3221f, 60.3913f }, // Stop 5: Bergen
    { "HELSINKI", 24.9384f, 60.1699f }, // Stop 6: Helsinki
    { "MOUNT KILIMANJARO", 37.3556f, -3.0674f }, // Stop 7: Mount Kilimanjaro
    { "ASWAN", 32.8998f, 24.0889f }, // Stop 8: Aswan
    { "GUATEMALA CITY", -90.5069f, 14.6349f }, // Stop 9: Guatemala City
    { "KINGSTON", -76.7936f, 17.9714f }, // Stop 10: Kingston
    { "EL CALAFATE", -72.2648f, -50.3380f }, // Stop 11: El Calafate
    { "PUNTA DEL ESTE", -54.9500f, -34.9667f }, // Stop 12: Punta del Este
  },
  // --- Day 23: 2026-12-23 | Etap Dnia 23 ---
  {
    { "TAURANGA", 176.1651f, -37.6878f }, // Stop 1: Tauranga
    { "ROCKHAMPTON", 150.5100f, -23.3791f }, // Stop 2: Rockhampton
    { "KUWAIT CITY", 47.9774f, 29.3759f }, // Stop 3: Kuwait City
    { "MANAMA", 50.5860f, 26.2285f }, // Stop 4: Manama
    { "GOTHENBURG", 11.9746f, 57.7089f }, // Stop 5: Gothenburg
    { "WENECJA", 12.3155f, 45.4408f }, // Stop 6: Wenecja
    { "FREETOWN", -13.2299f, 8.4840f }, // Stop 7: Freetown
    { "BANJUL", -16.5790f, 13.4549f }, // Stop 8: Banjul
    { "SANTO DOMINGO", -69.9312f, 18.4861f }, // Stop 9: Santo Domingo
    { "NASSAU", -77.3504f, 25.0443f }, // Stop 10: Nassau
    { "CIUDAD DEL ESTE", -54.6111f, -25.5097f }, // Stop 11: Ciudad del Este
    { "KAIETEUR FALLS", -59.4800f, 5.1760f }, // Stop 12: Kaieteur Falls
  },
  // --- Day 24: 2026-12-24 | Wielki Finał Wigilijny ---
  {
    { "GISBORNE", 178.0176f, -38.6623f }, // Stop 1: Gisborne
    { "BETHLEHEM", 35.2024f, 31.7054f }, // Stop 2: Bethlehem
    { "NICOSIA", 33.3823f, 35.1856f }, // Stop 3: Nicosia
    { "KHARTOUM", 32.5599f, 15.5007f }, // Stop 4: Khartoum
    { "NOUAKCHOTT", -15.9582f, 18.0735f }, // Stop 5: Nouakchott
    { "CAYENNE", -52.3135f, 4.9224f }, // Stop 6: Cayenne
    { "WYSPA WIELKANOCNA", -109.4324f, -27.1492f }, // Stop 7: Wyspa Wielkanocna (Hanga Roa)
    { "KIRITIMATI", -157.4278f, 1.8721f }, // Stop 8: Wyspa Bożego Narodzenia (Kiritimati)
    { "HONOLULU", -157.8583f, 21.3069f }, // Stop 9: Honolulu (HI)
    { "NUUK", -51.6941f, 64.1814f }, // Stop 10: Nuuk
    { "BIEGUN POLNOCNY", 0.0000f, 90.0000f }, // Stop 11: Baza na Biegunie Północnym
    { "KRAKOW", 19.9450f, 50.0647f }, // Stop 12: Kraków
  },
};

// Helper to load an active Advent Day's 12 stops into the active JourneyData buffer
inline bool loadAdventDay(int dayNumber, JourneyData& outData) {
  if (dayNumber < 1 || dayNumber > ADVENT_TOTAL_DAYS) return false;
  int dayIdx = dayNumber - 1;
  outData.version = 2;
  outData.activeDay = dayNumber;
  outData.secPerCity = 12.0f; // 6s flight + 6s landed
  outData.speedMultiplier = 1.0f;
  outData.cityCount = ADVENT_STOPS_PER_DAY;

  for (int i = 0; i < ADVENT_STOPS_PER_DAY; i++) {
#if defined(ARDUINO)
    strncpy_P(outData.cities[i].name, ADVENT_SCHEDULE[dayIdx][i].name, sizeof(outData.cities[i].name) - 1);
    outData.cities[i].name[sizeof(outData.cities[i].name) - 1] = '\0';
    outData.cities[i].lon = pgm_read_float(&ADVENT_SCHEDULE[dayIdx][i].lon);
    outData.cities[i].lat = pgm_read_float(&ADVENT_SCHEDULE[dayIdx][i].lat);
#else
    strncpy(outData.cities[i].name, ADVENT_SCHEDULE[dayIdx][i].name, sizeof(outData.cities[i].name) - 1);
    outData.cities[i].name[sizeof(outData.cities[i].name) - 1] = '\0';
    outData.cities[i].lon = ADVENT_SCHEDULE[dayIdx][i].lon;
    outData.cities[i].lat = ADVENT_SCHEDULE[dayIdx][i].lat;
#endif
  }
  return true;
}
