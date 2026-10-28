// SANTA-OS Advent Calendar Journey Master Schedule (Dec 01 - Dec 24)
// Total 288 cities across all continents (12 cities per day x 24 days)
// Coordinates in standard decimal degrees [lon, lat]

export interface AdventWaypoint {
  name: string;
  country: string;
  region: string;
  lon: number;
  lat: number;
  weather: string;
  tempC: number;
  tzOffset: number; // UTC offset in hours
}

export interface AdventDay {
  day: number;
  title: string;
  description: string;
  route: AdventWaypoint[];
}

export const ADVENT_SCHEDULES: Record<number, AdventDay> = {
  1: {
    day: 1,
    title: "Arctic & Nordic Scout",
    description: "Calibration flight over the Arctic Circle and Northern Scandinavian outposts.",
    route: [
      { name: "LONGYEARBYEN", country: "Svalbard", region: "Arctic", lon: 15.6, lat: 78.2, weather: "Blizzard", tempC: -16, tzOffset: 1 },
      { name: "TROMSØ", country: "Norway", region: "Europe", lon: 18.9, lat: 69.7, weather: "Snow Flurries", tempC: -4, tzOffset: 1 },
      { name: "KIRUNA", country: "Sweden", region: "Europe", lon: 20.2, lat: 67.8, weather: "Freezing Fog", tempC: -9, tzOffset: 1 },
      { name: "ROVANIEMI", country: "Finland", region: "Europe", lon: 25.7, lat: 66.5, weather: "Heavy Snow", tempC: -8, tzOffset: 2 },
      { name: "OULU", country: "Finland", region: "Europe", lon: 25.5, lat: 65.0, weather: "Snow Flurries", tempC: -5, tzOffset: 2 },
      { name: "TRONDHEIM", country: "Norway", region: "Europe", lon: 10.4, lat: 63.4, weather: "Light Snow", tempC: -2, tzOffset: 1 },
      { name: "REYKJAVIK", country: "Iceland", region: "Atlantic", lon: -21.9, lat: 64.1, weather: "Gale Winds", tempC: 1, tzOffset: 0 },
      { name: "NUUK", country: "Greenland", region: "Arctic", lon: -51.7, lat: 64.2, weather: "Polar Ice", tempC: -12, tzOffset: -2 },
      { name: "BERGEN", country: "Norway", region: "Europe", lon: 5.3, lat: 60.4, weather: "Rain/Snow", tempC: 3, tzOffset: 1 },
      { name: "OSLO", country: "Norway", region: "Europe", lon: 10.7, lat: 59.9, weather: "Overcast", tempC: -1, tzOffset: 1 },
      { name: "STOCKHOLM", country: "Sweden", region: "Europe", lon: 18.1, lat: 59.3, weather: "Flurries", tempC: 0, tzOffset: 1 },
      { name: "HELSINKI", country: "Finland", region: "Europe", lon: 24.9, lat: 60.2, weather: "Light Snow", tempC: -2, tzOffset: 2 },
    ]
  },
  2: {
    day: 2,
    title: "North Sea & British Isles",
    description: "Cruising over ancient coastal fortresses, highlands, and channel ports.",
    route: [
      { name: "EDINBURGH", country: "UK", region: "Europe", lon: -3.2, lat: 55.9, weather: "Misty Rain", tempC: 4, tzOffset: 0 },
      { name: "GLASGOW", country: "UK", region: "Europe", lon: -4.3, lat: 55.9, weather: "Overcast", tempC: 5, tzOffset: 0 },
      { name: "BELFAST", country: "UK", region: "Europe", lon: -5.9, lat: 54.6, weather: "Chilly Rain", tempC: 6, tzOffset: 0 },
      { name: "DUBLIN", country: "Ireland", region: "Europe", lon: -6.3, lat: 53.3, weather: "Drizzle", tempC: 7, tzOffset: 0 },
      { name: "MANCHESTER", country: "UK", region: "Europe", lon: -2.2, lat: 53.5, weather: "Fog", tempC: 5, tzOffset: 0 },
      { name: "LONDON", country: "UK", region: "Europe", lon: -0.1, lat: 51.5, weather: "Brisk/Cloudy", tempC: 6, tzOffset: 0 },
      { name: "AMSTERDAM", country: "Netherlands", region: "Europe", lon: 4.9, lat: 52.4, weather: "Canal Mist", tempC: 4, tzOffset: 1 },
      { name: "BRUSSELS", country: "Belgium", region: "Europe", lon: 4.4, lat: 50.8, weather: "Overcast", tempC: 5, tzOffset: 1 },
      { name: "HAMBURG", country: "Germany", region: "Europe", lon: 10.0, lat: 53.5, weather: "Cold Wind", tempC: 2, tzOffset: 1 },
      { name: "COPENHAGEN", country: "Denmark", region: "Europe", lon: 12.6, lat: 55.7, weather: "Crisp/Clear", tempC: 1, tzOffset: 1 },
      { name: "GOTHENBURG", country: "Sweden", region: "Europe", lon: 12.0, lat: 57.7, weather: "Flurries", tempC: -1, tzOffset: 1 },
      { name: "AALBORG", country: "Denmark", region: "Europe", lon: 9.9, lat: 57.0, weather: "Frosty", tempC: 0, tzOffset: 1 },
    ]
  },
  3: {
    day: 3,
    title: "Central Europe & Alpine Passes",
    description: "High-altitude route sweeping through the Alps and historic Central European capitals.",
    route: [
      { name: "BERLIN", country: "Germany", region: "Europe", lon: 13.4, lat: 52.5, weather: "Frosty", tempC: 1, tzOffset: 1 },
      { name: "POZNAN", country: "Poland", region: "Europe", lon: 16.9, lat: 52.4, weather: "Cold Wind", tempC: 0, tzOffset: 1 },
      { name: "WARSAW", country: "Poland", region: "Europe", lon: 21.0, lat: 52.2, weather: "Light Snow", tempC: -2, tzOffset: 1 },
      { name: "KRAKOW", country: "Poland", region: "Europe", lon: 19.9, lat: 50.1, weather: "Powder Snow", tempC: -3, tzOffset: 1 },
      { name: "PRAGUE", country: "Czechia", region: "Europe", lon: 14.4, lat: 50.1, weather: "Misty Frost", tempC: 0, tzOffset: 1 },
      { name: "VIENNA", country: "Austria", region: "Europe", lon: 16.4, lat: 48.2, weather: "Flurries", tempC: 1, tzOffset: 1 },
      { name: "BRATISLAVA", country: "Slovakia", region: "Europe", lon: 17.1, lat: 48.1, weather: "Cold Mist", tempC: 1, tzOffset: 1 },
      { name: "BUDAPEST", country: "Hungary", region: "Europe", lon: 19.0, lat: 47.5, weather: "Crisp/Clear", tempC: 2, tzOffset: 1 },
      { name: "MUNICH", country: "Germany", region: "Europe", lon: 11.6, lat: 48.1, weather: "Snow Squalls", tempC: -1, tzOffset: 1 },
      { name: "INNSBRUCK", country: "Austria", region: "Europe", lon: 11.4, lat: 47.3, weather: "Alpine Snow", tempC: -4, tzOffset: 1 },
      { name: "ZURICH", country: "Switzerland", region: "Europe", lon: 8.5, lat: 47.4, weather: "Crisp Air", tempC: 0, tzOffset: 1 },
      { name: "GENEVA", country: "Switzerland", region: "Europe", lon: 6.1, lat: 46.2, weather: "Light Fog", tempC: 2, tzOffset: 1 },
    ]
  },
  4: {
    day: 4,
    title: "Mediterranean & Iberian Coast",
    description: "Warmer southern winds navigating from the Riviera across the Iberian Peninsula.",
    route: [
      { name: "MILAN", country: "Italy", region: "Europe", lon: 9.2, lat: 45.5, weather: "Winter Fog", tempC: 3, tzOffset: 1 },
      { name: "MARSEILLE", country: "France", region: "Europe", lon: 5.4, lat: 43.3, weather: "Mistral Breeze", tempC: 9, tzOffset: 1 },
      { name: "BARCELONA", country: "Spain", region: "Europe", lon: 2.2, lat: 41.4, weather: "Clear Night", tempC: 11, tzOffset: 1 },
      { name: "VALENCIA", country: "Spain", region: "Europe", lon: -0.4, lat: 39.5, weather: "Gentle Breeze", tempC: 12, tzOffset: 1 },
      { name: "MADRID", country: "Spain", region: "Europe", lon: -3.7, lat: 40.4, weather: "Brisk/Dry", tempC: 6, tzOffset: 1 },
      { name: "PORTO", country: "Portugal", region: "Europe", lon: -8.6, lat: 41.2, weather: "Coastal Rain", tempC: 10, tzOffset: 0 },
      { name: "LISBON", country: "Portugal", region: "Europe", lon: -9.1, lat: 38.7, weather: "Mild Night", tempC: 13, tzOffset: 0 },
      { name: "SEVILLE", country: "Spain", region: "Europe", lon: -6.0, lat: 37.4, weather: "Clear", tempC: 10, tzOffset: 1 },
      { name: "GIBRALTAR", country: "UK", region: "Europe", lon: -5.3, lat: 36.1, weather: "Breezy", tempC: 14, tzOffset: 1 },
      { name: "ROME", country: "Italy", region: "Europe", lon: 12.5, lat: 41.9, weather: "Starlit", tempC: 8, tzOffset: 1 },
      { name: "NAPLES", country: "Italy", region: "Europe", lon: 14.3, lat: 40.9, weather: "Light Rain", tempC: 9, tzOffset: 1 },
      { name: "VALLETTA", country: "Malta", region: "Europe", lon: 14.5, lat: 35.9, weather: "Sea Breeze", tempC: 15, tzOffset: 1 },
    ]
  },
  5: {
    day: 5,
    title: "Baltic & Eastern Frontiers",
    description: "Sweeping eastward over pine forests, frozen lakes, and historic amber shores.",
    route: [
      { name: "TALLINN", country: "Estonia", region: "Europe", lon: 24.7, lat: 59.4, weather: "Heavy Snow", tempC: -5, tzOffset: 2 },
      { name: "RIGA", country: "Latvia", region: "Europe", lon: 24.1, lat: 56.9, weather: "Blizzard", tempC: -4, tzOffset: 2 },
      { name: "VILNIUS", country: "Lithuania", region: "Europe", lon: 25.3, lat: 54.7, weather: "Snow Flurries", tempC: -3, tzOffset: 2 },
      { name: "GDANSK", country: "Poland", region: "Europe", lon: 18.6, lat: 54.4, weather: "Baltic Gusts", tempC: -1, tzOffset: 1 },
      { name: "LUBLIN", country: "Poland", region: "Europe", lon: 22.6, lat: 51.2, weather: "Powder Snow", tempC: -3, tzOffset: 1 },
      { name: "LVIV", country: "Ukraine", region: "Europe", lon: 24.0, lat: 49.8, weather: "Snowfall", tempC: -4, tzOffset: 2 },
      { name: "CLUJ-NAPOCA", country: "Romania", region: "Europe", lon: 23.6, lat: 46.8, weather: "Carpathian Frost", tempC: -2, tzOffset: 2 },
      { name: "BUCHAREST", country: "Romania", region: "Europe", lon: 26.1, lat: 44.4, weather: "Cold Rain", tempC: 2, tzOffset: 2 },
      { name: "SOFIA", country: "Bulgaria", region: "Europe", lon: 23.3, lat: 42.7, weather: "Balkan Flurries", tempC: 0, tzOffset: 2 },
      { name: "BELGRADE", country: "Serbia", region: "Europe", lon: 20.5, lat: 44.8, weather: "Crisp/Clear", tempC: 1, tzOffset: 1 },
      { name: "ZAGREB", country: "Croatia", region: "Europe", lon: 15.9, lat: 45.8, weather: "Frosty Fog", tempC: 1, tzOffset: 1 },
      { name: "LJUBLJANA", country: "Slovenia", region: "Europe", lon: 14.5, lat: 46.1, weather: "Alpine Frost", tempC: -1, tzOffset: 1 },
    ]
  },
  6: {
    day: 6,
    title: "Aegean, Levant & Arabian Desert",
    description: "Connecting ancient crossroads from Athens to the golden dunes of the Gulf.",
    route: [
      { name: "ATHENS", country: "Greece", region: "Europe", lon: 23.7, lat: 38.0, weather: "Crisp Night", tempC: 12, tzOffset: 2 },
      { name: "ISTANBUL", country: "Turkey", region: "Europe", lon: 28.9, lat: 41.0, weather: "Bosphorus Mist", tempC: 8, tzOffset: 3 },
      { name: "ANKARA", country: "Turkey", region: "Asia", lon: 32.8, lat: 39.9, weather: "Plateau Frost", tempC: 2, tzOffset: 3 },
      { name: "NICOSIA", country: "Cyprus", region: "Europe", lon: 33.4, lat: 35.2, weather: "Mild Breezes", tempC: 14, tzOffset: 2 },
      { name: "BEIRUT", country: "Lebanon", region: "Middle East", lon: 35.5, lat: 33.9, weather: "Starlit Night", tempC: 16, tzOffset: 2 },
      { name: "AMMAN", country: "Jordan", region: "Middle East", lon: 35.9, lat: 31.9, weather: "Cold Desert", tempC: 9, tzOffset: 3 },
      { name: "JERUSALEM", country: "Israel", region: "Middle East", lon: 35.2, lat: 31.8, weather: "Clear", tempC: 11, tzOffset: 2 },
      { name: "RIYADH", country: "Saudi Arabia", region: "Middle East", lon: 46.7, lat: 24.7, weather: "Clear Desert", tempC: 17, tzOffset: 3 },
      { name: "DOHA", country: "Qatar", region: "Middle East", lon: 51.5, lat: 25.3, weather: "Breezy", tempC: 20, tzOffset: 3 },
      { name: "ABU DHABI", country: "UAE", region: "Middle East", lon: 54.4, lat: 24.5, weather: "Warm Night", tempC: 22, tzOffset: 4 },
      { name: "DUBAI", country: "UAE", region: "Middle East", lon: 55.3, lat: 25.2, weather: "Clear Horizon", tempC: 22, tzOffset: 4 },
      { name: "MUSCAT", country: "Oman", region: "Middle East", lon: 58.4, lat: 23.6, weather: "Sea Breeze", tempC: 23, tzOffset: 4 },
    ]
  },
  7: {
    day: 7,
    title: "Caucasus & Silk Road Oasis",
    description: "High mountain passes of the Caucasus dipping into historic Central Asian caravan hubs.",
    route: [
      { name: "TBILISI", country: "Georgia", region: "Asia", lon: 44.8, lat: 41.7, weather: "Mountain Chill", tempC: 3, tzOffset: 4 },
      { name: "YEREVAN", country: "Armenia", region: "Asia", lon: 44.5, lat: 40.2, weather: "Ararat Frost", tempC: -1, tzOffset: 4 },
      { name: "BAKU", country: "Azerbaijan", region: "Asia", lon: 49.9, lat: 40.4, weather: "Caspian Gale", tempC: 6, tzOffset: 4 },
      { name: "TEHRAN", country: "Iran", region: "Middle East", lon: 51.4, lat: 35.7, weather: "Dry Cold", tempC: 5, tzOffset: 3.5 },
      { name: "ASHGABAT", country: "Turkmenistan", region: "Central Asia", lon: 58.4, lat: 37.9, weather: "Clear Sky", tempC: 4, tzOffset: 5 },
      { name: "BUKHARA", country: "Uzbekistan", region: "Central Asia", lon: 64.4, lat: 39.8, weather: "Silk Frost", tempC: 0, tzOffset: 5 },
      { name: "SAMARKAND", country: "Uzbekistan", region: "Central Asia", lon: 66.9, lat: 39.6, weather: "Cold Night", tempC: -1, tzOffset: 5 },
      { name: "TASHKENT", country: "Uzbekistan", region: "Central Asia", lon: 69.3, lat: 41.3, weather: "Crisp/Clear", tempC: 1, tzOffset: 5 },
      { name: "DUSHANBE", country: "Tajikistan", region: "Central Asia", lon: 68.8, lat: 38.6, weather: "Pamir Chill", tempC: 2, tzOffset: 5 },
      { name: "BISHKEK", country: "Kyrgyzstan", region: "Central Asia", lon: 74.6, lat: 42.9, weather: "Tian Shan Snow", tempC: -4, tzOffset: 6 },
      { name: "ALMATY", country: "Kazakhstan", region: "Central Asia", lon: 76.9, lat: 43.2, weather: "Heavy Snow", tempC: -6, tzOffset: 5 },
      { name: "ASTANA", country: "Kazakhstan", region: "Central Asia", lon: 71.4, lat: 51.1, weather: "Steppe Blizzard", tempC: -18, tzOffset: 5 },
    ]
  },
  8: {
    day: 8,
    title: "Indian Subcontinent & Indian Ocean",
    description: "Sweeping south from the Himalayan foothills across the subcontinent to the spice coasts.",
    route: [
      { name: "ISLAMABAD", country: "Pakistan", region: "South Asia", lon: 73.1, lat: 33.7, weather: "Crisp/Misty", tempC: 11, tzOffset: 5 },
      { name: "LAHORE", country: "Pakistan", region: "South Asia", lon: 74.3, lat: 31.5, weather: "Dense Haze", tempC: 13, tzOffset: 5 },
      { name: "DELHI", country: "India", region: "South Asia", lon: 77.2, lat: 28.6, weather: "Winter Smog/Fog", tempC: 12, tzOffset: 5.5 },
      { name: "JAIPUR", country: "India", region: "South Asia", lon: 75.8, lat: 26.9, weather: "Clear Night", tempC: 14, tzOffset: 5.5 },
      { name: "AHMEDABAD", country: "India", region: "South Asia", lon: 72.6, lat: 23.0, weather: "Pleasant", tempC: 18, tzOffset: 5.5 },
      { name: "MUMBAI", country: "India", region: "South Asia", lon: 72.8, lat: 19.1, weather: "Warm Breeze", tempC: 24, tzOffset: 5.5 },
      { name: "BENGALURU", country: "India", region: "South Asia", lon: 77.6, lat: 12.9, weather: "Mild & Clear", tempC: 19, tzOffset: 5.5 },
      { name: "CHENNAI", country: "India", region: "South Asia", lon: 80.3, lat: 13.1, weather: "Humid/Warm", tempC: 25, tzOffset: 5.5 },
      { name: "HYDERABAD", country: "India", region: "South Asia", lon: 78.5, lat: 17.4, weather: "Starlit", tempC: 20, tzOffset: 5.5 },
      { name: "KOLKATA", country: "India", region: "South Asia", lon: 88.4, lat: 22.6, weather: "Pleasant Chill", tempC: 18, tzOffset: 5.5 },
      { name: "DHAKA", country: "Bangladesh", region: "South Asia", lon: 90.4, lat: 23.8, weather: "Morning Mist", tempC: 19, tzOffset: 6 },
      { name: "COLOMBO", country: "Sri Lanka", region: "South Asia", lon: 79.9, lat: 6.9, weather: "Tropical Rain", tempC: 27, tzOffset: 5.5 },
    ]
  },
  9: {
    day: 9,
    title: "Himalayas, Gobi & Yellow River",
    description: "High supersonic crossing over Kathmandu, Tibetan plateau, and Chinese megacities.",
    route: [
      { name: "KATHMANDU", country: "Nepal", region: "Asia", lon: 85.3, lat: 27.7, weather: "Alpine Crisp", tempC: 8, tzOffset: 5.75 },
      { name: "LHASA", country: "Tibet", region: "Asia", lon: 91.1, lat: 29.6, weather: "Highland Freeze", tempC: -5, tzOffset: 8 },
      { name: "CHENGDU", country: "China", region: "East Asia", lon: 104.1, lat: 30.7, weather: "Sichuan Mist", tempC: 9, tzOffset: 8 },
      { name: "CHONGQING", country: "China", region: "East Asia", lon: 106.6, lat: 29.6, weather: "Foggy Basin", tempC: 10, tzOffset: 8 },
      { name: "XI'AN", country: "China", region: "East Asia", lon: 108.9, lat: 34.3, weather: "Dry Frost", tempC: 2, tzOffset: 8 },
      { name: "WUHAN", country: "China", region: "East Asia", lon: 114.3, lat: 30.6, weather: "Crisp/Clear", tempC: 6, tzOffset: 8 },
      { name: "BEIJING", country: "China", region: "East Asia", lon: 116.4, lat: 39.9, weather: "Freezing Cold", tempC: -4, tzOffset: 8 },
      { name: "TIANJIN", country: "China", region: "East Asia", lon: 117.2, lat: 39.1, weather: "Coastal Chill", tempC: -3, tzOffset: 8 },
      { name: "HARBIN", country: "China", region: "East Asia", lon: 126.6, lat: 45.8, weather: "Ice City Freeze", tempC: -22, tzOffset: 8 },
      { name: "SHENYANG", country: "China", region: "East Asia", lon: 123.4, lat: 41.8, weather: "Subzero Clear", tempC: -12, tzOffset: 8 },
      { name: "ULAANBAATAR", country: "Mongolia", region: "Asia", lon: 106.9, lat: 47.9, weather: "Siberian Chill", tempC: -25, tzOffset: 8 },
      { name: "SHANGHAI", country: "China", region: "East Asia", lon: 121.5, lat: 31.2, weather: "Chilly Night", tempC: 5, tzOffset: 8 },
    ]
  },
  10: {
    day: 10,
    title: "Pacific Rim & Land of the Rising Sun",
    description: "Cruising the Korean Peninsula, Japanese Archipelago, and the East China Sea.",
    route: [
      { name: "SEOUL", country: "South Korea", region: "East Asia", lon: 127.0, lat: 37.6, weather: "Subzero Freeze", tempC: -5, tzOffset: 9 },
      { name: "BUSAN", country: "South Korea", region: "East Asia", lon: 129.1, lat: 35.2, weather: "Coastal Wind", tempC: 1, tzOffset: 9 },
      { name: "FUKUOKA", country: "Japan", region: "East Asia", lon: 130.4, lat: 33.6, weather: "Brisk Rain", tempC: 6, tzOffset: 9 },
      { name: "HIROSHIMA", country: "Japan", region: "East Asia", lon: 132.5, lat: 34.4, weather: "Chilly", tempC: 5, tzOffset: 9 },
      { name: "OSAKA", country: "Japan", region: "East Asia", lon: 135.5, lat: 34.7, weather: "Clear Night", tempC: 4, tzOffset: 9 },
      { name: "KYOTO", country: "Japan", region: "East Asia", lon: 135.8, lat: 35.0, weather: "Crisp Air", tempC: 3, tzOffset: 9 },
      { name: "NAGOYA", country: "Japan", region: "East Asia", lon: 136.9, lat: 35.2, weather: "Clear", tempC: 4, tzOffset: 9 },
      { name: "TOKYO", country: "Japan", region: "East Asia", lon: 139.7, lat: 35.7, weather: "Crisp/Clear", tempC: 3, tzOffset: 9 },
      { name: "SENDAI", country: "Japan", region: "East Asia", lon: 140.9, lat: 38.3, weather: "Flurries", tempC: 0, tzOffset: 9 },
      { name: "SAPPORO", country: "Japan", region: "East Asia", lon: 141.3, lat: 43.1, weather: "Heavy Snow", tempC: -6, tzOffset: 9 },
      { name: "NAHA", country: "Japan", region: "East Asia", lon: 127.7, lat: 26.2, weather: "Mild/Breezy", tempC: 19, tzOffset: 9 },
      { name: "TAIPEI", country: "Taiwan", region: "East Asia", lon: 121.5, lat: 25.0, weather: "Passing Rain", tempC: 17, tzOffset: 8 },
    ]
  },
  11: {
    day: 11,
    title: "Southeast Asia Tropical Archipelagos",
    description: "From the Mekong river delta down through equatorial rainforests and island chains.",
    route: [
      { name: "HONG KONG", country: "China", region: "East Asia", lon: 114.2, lat: 22.3, weather: "Cool Breeze", tempC: 18, tzOffset: 8 },
      { name: "HANOI", country: "Vietnam", region: "Southeast Asia", lon: 105.8, lat: 21.0, weather: "Winter Fog", tempC: 17, tzOffset: 7 },
      { name: "DA NANG", country: "Vietnam", region: "Southeast Asia", lon: 108.2, lat: 16.1, weather: "Sea Breeze", tempC: 22, tzOffset: 7 },
      { name: "HO CHI MINH", country: "Vietnam", region: "Southeast Asia", lon: 106.7, lat: 10.8, weather: "Warm Night", tempC: 26, tzOffset: 7 },
      { name: "BANGKOK", country: "Thailand", region: "Southeast Asia", lon: 100.5, lat: 13.8, weather: "Dry & Warm", tempC: 27, tzOffset: 7 },
      { name: "PHNOM PENH", country: "Cambodia", region: "Southeast Asia", lon: 104.9, lat: 11.6, weather: "Pleasant", tempC: 26, tzOffset: 7 },
      { name: "KUALA LUMPUR", country: "Malaysia", region: "Southeast Asia", lon: 101.7, lat: 3.1, weather: "Tropical Showers", tempC: 26, tzOffset: 8 },
      { name: "SINGAPORE", country: "Singapore", region: "Southeast Asia", lon: 103.8, lat: 1.3, weather: "Humid/Warm", tempC: 27, tzOffset: 8 },
      { name: "JAKARTA", country: "Indonesia", region: "Southeast Asia", lon: 106.8, lat: -6.2, weather: "Monsoon Mist", tempC: 28, tzOffset: 7 },
      { name: "SURABAYA", country: "Indonesia", region: "Southeast Asia", lon: 112.7, lat: -7.3, weather: "Warm Clouds", tempC: 29, tzOffset: 7 },
      { name: "MANILA", country: "Philippines", region: "Southeast Asia", lon: 121.0, lat: 14.6, weather: "Tropical Breeze", tempC: 27, tzOffset: 8 },
      { name: "CEBU", country: "Philippines", region: "Southeast Asia", lon: 123.9, lat: 10.3, weather: "Clear Night", tempC: 28, tzOffset: 8 },
    ]
  },
  12: {
    day: 12,
    title: "Australasia & Great Barrier Reef",
    description: "Crossing the equator toward the Southern Cross into midsummer Australian cities.",
    route: [
      { name: "DARWIN", country: "Australia", region: "Oceania", lon: 130.8, lat: -12.5, weather: "Wet Season Storm", tempC: 30, tzOffset: 9.5 },
      { name: "CAIRNS", country: "Australia", region: "Oceania", lon: 145.8, lat: -16.9, weather: "Warm Ocean Air", tempC: 28, tzOffset: 10 },
      { name: "BRISBANE", country: "Australia", region: "Oceania", lon: 153.0, lat: -27.5, weather: "Summer Breeze", tempC: 25, tzOffset: 10 },
      { name: "GOLD COAST", country: "Australia", region: "Oceania", lon: 153.4, lat: -28.0, weather: "Surf Mist", tempC: 24, tzOffset: 10 },
      { name: "SYDNEY", country: "Australia", region: "Oceania", lon: 151.2, lat: -33.9, weather: "Clear Summer", tempC: 23, tzOffset: 11 },
      { name: "CANBERRA", country: "Australia", region: "Oceania", lon: 149.1, lat: -35.3, weather: "Crisp Night", tempC: 17, tzOffset: 11 },
      { name: "MELBOURNE", country: "Australia", region: "Oceania", lon: 144.9, lat: -37.8, weather: "Breezy/Mild", tempC: 20, tzOffset: 11 },
      { name: "HOBART", country: "Australia", region: "Oceania", lon: 147.3, lat: -42.9, weather: "Cool Breeze", tempC: 15, tzOffset: 11 },
      { name: "ADELAIDE", country: "Australia", region: "Oceania", lon: 138.6, lat: -34.9, weather: "Dry Heat", tempC: 26, tzOffset: 10.5 },
      { name: "PERTH", country: "Australia", region: "Oceania", lon: 115.9, lat: -31.9, weather: "Indian Ocean Breeze", tempC: 24, tzOffset: 8 },
      { name: "AUCKLAND", country: "New Zealand", region: "Oceania", lon: 174.8, lat: -36.8, weather: "Fresh Pacific Wind", tempC: 19, tzOffset: 13 },
      { name: "WELLINGTON", country: "New Zealand", region: "Oceania", lon: 174.8, lat: -41.3, weather: "Strong Gusts", tempC: 16, tzOffset: 13 },
    ]
  },
  13: {
    day: 13,
    title: "Pacific Atolls & Polynesia",
    description: "Deep oceanic sweep across the International Date Line and tropical lagoons.",
    route: [
      { name: "CHRISTCHURCH", country: "New Zealand", region: "Oceania", lon: 172.6, lat: -43.5, weather: "Southern Wind", tempC: 15, tzOffset: 13 },
      { name: "SUVA", country: "Fiji", region: "Oceania", lon: 178.4, lat: -18.1, weather: "Tropical Showers", tempC: 27, tzOffset: 12 },
      { name: "PORT VILA", country: "Vanuatu", region: "Oceania", lon: 168.3, lat: -17.7, weather: "Warm Rain", tempC: 28, tzOffset: 11 },
      { name: "HONIARA", country: "Solomon Islands", region: "Oceania", lon: 159.9, lat: -9.4, weather: "Tropical Mist", tempC: 29, tzOffset: 11 },
      { name: "PORT MORESBY", country: "Papua New Guinea", region: "Oceania", lon: 147.2, lat: -9.4, weather: "Warm Night", tempC: 28, tzOffset: 10 },
      { name: "GUAM", country: "USA", region: "Pacific", lon: 144.8, lat: 13.4, weather: "Trade Winds", tempC: 27, tzOffset: 10 },
      { name: "MAJURO", country: "Marshall Islands", region: "Pacific", lon: 171.4, lat: 7.1, weather: "Coral Breeze", tempC: 28, tzOffset: 12 },
      { name: "APIA", country: "Samoa", region: "Pacific", lon: -171.8, lat: -13.8, weather: "Warm Ocean", tempC: 28, tzOffset: 13 },
      { name: "NUKU'ALOFA", country: "Tonga", region: "Pacific", lon: -175.2, lat: -21.1, weather: "Starlit Lagoon", tempC: 26, tzOffset: 13 },
      { name: "PAPEETE", country: "Tahiti", region: "Pacific", lon: -149.6, lat: -17.5, weather: "Warm Breeze", tempC: 27, tzOffset: -10 },
      { name: "HONOLULU", country: "USA", region: "Pacific", lon: -157.8, lat: 21.3, weather: "Aloha Breeze", tempC: 24, tzOffset: -10 },
      { name: "HILO", country: "USA", region: "Pacific", lon: -155.1, lat: 19.7, weather: "Volcanic Mist", tempC: 22, tzOffset: -10 },
    ]
  },
  14: {
    day: 14,
    title: "Pacific Northwest & Great White North",
    description: "Flying from the Gulf of Alaska through the coastal mountains and frozen Yukon.",
    route: [
      { name: "FAIRBANKS", country: "USA", region: "North America", lon: -147.7, lat: 64.8, weather: "Aurora Deep Freeze", tempC: -24, tzOffset: -9 },
      { name: "ANCHORAGE", country: "USA", region: "North America", lon: -149.9, lat: 61.2, weather: "Heavy Snow", tempC: -11, tzOffset: -9 },
      { name: "JUNEAU", country: "USA", region: "North America", lon: -134.4, lat: 58.3, weather: "Coastal Rain/Snow", tempC: 0, tzOffset: -9 },
      { name: "WHITEHORSE", country: "Canada", region: "North America", lon: -135.1, lat: 60.7, weather: "Yukon Frost", tempC: -19, tzOffset: -7 },
      { name: "EDMONTON", country: "Canada", region: "North America", lon: -113.5, lat: 53.5, weather: "Prairie Freeze", tempC: -14, tzOffset: -7 },
      { name: "CALGARY", country: "Canada", region: "North America", lon: -114.1, lat: 51.0, weather: "Chinook Flurries", tempC: -7, tzOffset: -7 },
      { name: "VANCOUVER", country: "Canada", region: "North America", lon: -123.1, lat: 49.3, weather: "Pacific Mist", tempC: 5, tzOffset: -8 },
      { name: "VICTORIA", country: "Canada", region: "North America", lon: -123.4, lat: 48.4, weather: "Gentle Rain", tempC: 6, tzOffset: -8 },
      { name: "SEATTLE", country: "USA", region: "North America", lon: -122.3, lat: 47.6, weather: "Drizzle", tempC: 7, tzOffset: -8 },
      { name: "PORTLAND", country: "USA", region: "North America", lon: -122.7, lat: 45.5, weather: "Overcast", tempC: 8, tzOffset: -8 },
      { name: "BOISE", country: "USA", region: "North America", lon: -116.2, lat: 43.6, weather: "Crisp/Clear", tempC: 1, tzOffset: -7 },
      { name: "SPOKANE", country: "USA", region: "North America", lon: -117.4, lat: 47.7, weather: "Flurries", tempC: -1, tzOffset: -8 },
    ]
  },
  15: {
    day: 15,
    title: "American West & Rocky Mountains",
    description: "Supercruise over the Sierra Nevada, Mojave, and Continental Divide.",
    route: [
      { name: "SAN FRANCISCO", country: "USA", region: "North America", lon: -122.4, lat: 37.8, weather: "Bay Fog", tempC: 11, tzOffset: -8 },
      { name: "SAN JOSE", country: "USA", region: "North America", lon: -121.9, lat: 37.3, weather: "Clear Night", tempC: 10, tzOffset: -8 },
      { name: "FRESNO", country: "USA", region: "North America", lon: -119.8, lat: 36.7, weather: "Valley Chill", tempC: 9, tzOffset: -8 },
      { name: "LOS ANGELES", country: "USA", region: "North America", lon: -118.2, lat: 34.0, weather: "Pleasant", tempC: 14, tzOffset: -8 },
      { name: "SAN DIEGO", country: "USA", region: "North America", lon: -117.2, lat: 32.7, weather: "Coastal Breeze", tempC: 15, tzOffset: -8 },
      { name: "LAS VEGAS", country: "USA", region: "North America", lon: -115.1, lat: 36.2, weather: "Starlit Desert", tempC: 8, tzOffset: -8 },
      { name: "PHOENIX", country: "USA", region: "North America", lon: -112.1, lat: 33.4, weather: "Clear Night", tempC: 13, tzOffset: -7 },
      { name: "TUCSON", country: "USA", region: "North America", lon: -110.9, lat: 32.2, weather: "Desert Chill", tempC: 10, tzOffset: -7 },
      { name: "SALT LAKE CITY", country: "USA", region: "North America", lon: -111.9, lat: 40.8, weather: "Mountain Snow", tempC: -2, tzOffset: -7 },
      { name: "DENVER", country: "USA", region: "North America", lon: -105.0, lat: 39.7, weather: "Mile High Frost", tempC: -3, tzOffset: -7 },
      { name: "ALBUQUERQUE", country: "USA", region: "North America", lon: -106.7, lat: 35.1, weather: "Crisp Cold", tempC: 2, tzOffset: -7 },
      { name: "EL PASO", country: "USA", region: "North America", lon: -106.5, lat: 31.8, weather: "Starlit", tempC: 7, tzOffset: -7 },
    ]
  },
  16: {
    day: 16,
    title: "American Heartland & Great Plains",
    description: "Crossing the vast cornfields, Great Lakes, and prairie cities.",
    route: [
      { name: "MINNEAPOLIS", country: "USA", region: "North America", lon: -93.3, lat: 45.0, weather: "Deep Freeze", tempC: -9, tzOffset: -6 },
      { name: "MILWAUKEE", country: "USA", region: "North America", lon: -87.9, lat: 43.0, weather: "Lake Effect Snow", tempC: -4, tzOffset: -6 },
      { name: "CHICAGO", country: "USA", region: "North America", lon: -87.6, lat: 41.9, weather: "Windy City Snow", tempC: -3, tzOffset: -6 },
      { name: "INDIANAPOLIS", country: "USA", region: "North America", lon: -86.2, lat: 39.8, weather: "Cold Rain", tempC: 1, tzOffset: -5 },
      { name: "DETROIT", country: "USA", region: "North America", lon: -83.0, lat: 42.3, weather: "Flurries", tempC: -1, tzOffset: -5 },
      { name: "COLUMBUS", country: "USA", region: "North America", lon: -83.0, lat: 40.0, weather: "Chilly Overcast", tempC: 2, tzOffset: -5 },
      { name: "ST. LOUIS", country: "USA", region: "North America", lon: -90.2, lat: 38.6, weather: "Brisk Wind", tempC: 3, tzOffset: -6 },
      { name: "KANSAS CITY", country: "USA", region: "North America", lon: -94.6, lat: 39.1, weather: "Prairie Frost", tempC: 1, tzOffset: -6 },
      { name: "OMAHA", country: "USA", region: "North America", lon: -95.9, lat: 41.3, weather: "Subzero Gusts", tempC: -4, tzOffset: -6 },
      { name: "DALLAS", country: "USA", region: "North America", lon: -96.8, lat: 32.8, weather: "Clear Night", tempC: 9, tzOffset: -6 },
      { name: "AUSTIN", country: "USA", region: "North America", lon: -97.7, lat: 30.3, weather: "Mild/Starlit", tempC: 12, tzOffset: -6 },
      { name: "HOUSTON", country: "USA", region: "North America", lon: -95.4, lat: 29.8, weather: "Humid Breeze", tempC: 15, tzOffset: -6 },
    ]
  },
  17: {
    day: 17,
    title: "Eastern Seaboard & Saint Lawrence",
    description: "From Montreal and Boston down the bustling northeast corridor into Florida.",
    route: [
      { name: "QUEBEC CITY", country: "Canada", region: "North America", lon: -71.2, lat: 46.8, weather: "Heavy Snow", tempC: -8, tzOffset: -5 },
      { name: "MONTREAL", country: "Canada", region: "North America", lon: -73.6, lat: 45.5, weather: "Winter Storm", tempC: -6, tzOffset: -5 },
      { name: "OTTAWA", country: "Canada", region: "North America", lon: -75.7, lat: 45.4, weather: "Blizzard", tempC: -7, tzOffset: -5 },
      { name: "TORONTO", country: "Canada", region: "North America", lon: -79.4, lat: 43.7, weather: "Flurries", tempC: -2, tzOffset: -5 },
      { name: "BOSTON", country: "USA", region: "North America", lon: -71.1, lat: 42.4, weather: "Nor'easter Gusts", tempC: 1, tzOffset: -5 },
      { name: "NEW YORK", country: "USA", region: "North America", lon: -74.0, lat: 40.7, weather: "Cold Rain/Snow", tempC: 3, tzOffset: -5 },
      { name: "PHILADELPHIA", country: "USA", region: "North America", lon: -75.2, lat: 39.9, weather: "Brisk Chill", tempC: 4, tzOffset: -5 },
      { name: "WASHINGTON DC", country: "USA", region: "North America", lon: -77.0, lat: 38.9, weather: "Chilly Overcast", tempC: 5, tzOffset: -5 },
      { name: "CHARLOTTE", country: "USA", region: "North America", lon: -80.8, lat: 35.2, weather: "Crisp", tempC: 8, tzOffset: -5 },
      { name: "ATLANTA", country: "USA", region: "North America", lon: -84.4, lat: 33.7, weather: "Clear Night", tempC: 9, tzOffset: -5 },
      { name: "ORLANDO", country: "USA", region: "North America", lon: -81.4, lat: 28.5, weather: "Pleasant", tempC: 17, tzOffset: -5 },
      { name: "MIAMI", country: "USA", region: "North America", lon: -80.2, lat: 25.8, weather: "Tropical Warmth", tempC: 22, tzOffset: -5 },
    ]
  },
  18: {
    day: 18,
    title: "Caribbean Sea & Central America",
    description: "Island hopping turquoise cays, Mayan ruins, and tropical cloud forests.",
    route: [
      { name: "NASSAU", country: "Bahamas", region: "Caribbean", lon: -77.3, lat: 25.0, weather: "Warm Breeze", tempC: 23, tzOffset: -5 },
      { name: "HAVANA", country: "Cuba", region: "Caribbean", lon: -82.4, lat: 23.1, weather: "Starlit Night", tempC: 22, tzOffset: -5 },
      { name: "KINGSTON", country: "Jamaica", region: "Caribbean", lon: -76.8, lat: 18.0, weather: "Tropical Wind", tempC: 26, tzOffset: -5 },
      { name: "SANTO DOMINGO", country: "Dom. Rep.", region: "Caribbean", lon: -69.9, lat: 18.5, weather: "Warm Showers", tempC: 25, tzOffset: -4 },
      { name: "SAN JUAN", country: "Puerto Rico", region: "Caribbean", lon: -66.1, lat: 18.5, weather: "Trade Winds", tempC: 26, tzOffset: -4 },
      { name: "CANCUN", country: "Mexico", region: "Central America", lon: -86.8, lat: 21.2, weather: "Warm Ocean", tempC: 24, tzOffset: -5 },
      { name: "MERIDA", country: "Mexico", region: "Central America", lon: -89.6, lat: 21.0, weather: "Mild/Clear", tempC: 23, tzOffset: -6 },
      { name: "GUATEMALA CITY", country: "Guatemala", region: "Central America", lon: -90.5, lat: 14.6, weather: "Cool Mountain", tempC: 16, tzOffset: -6 },
      { name: "SAN SALVADOR", country: "El Salvador", region: "Central America", lon: -89.2, lat: 13.7, weather: "Pleasant", tempC: 21, tzOffset: -6 },
      { name: "MANAGUA", country: "Nicaragua", region: "Central America", lon: -86.3, lat: 12.1, weather: "Warm Clouds", tempC: 25, tzOffset: -6 },
      { name: "SAN JOSE", country: "Costa Rica", region: "Central America", lon: -84.1, lat: 9.9, weather: "Valley Mist", tempC: 19, tzOffset: -6 },
      { name: "PANAMA CITY", country: "Panama", region: "Central America", lon: -79.5, lat: 9.0, weather: "Canal Humidity", tempC: 27, tzOffset: -5 },
    ]
  },
  19: {
    day: 19,
    title: "Andean Cordillera & Northern Highlands",
    description: "Soaring along the spine of South America above ancient cloud-capped peaks.",
    route: [
      { name: "BARRANQUILLA", country: "Colombia", region: "South America", lon: -74.8, lat: 11.0, weather: "Caribbean Wind", tempC: 28, tzOffset: -5 },
      { name: "CARACAS", country: "Venezuela", region: "South America", lon: -66.9, lat: 10.5, weather: "Valley Breeze", tempC: 21, tzOffset: -4 },
      { name: "MEDELLIN", country: "Colombia", region: "South America", lon: -75.6, lat: 6.2, weather: "Spring Air", tempC: 20, tzOffset: -5 },
      { name: "BOGOTA", country: "Colombia", region: "South America", lon: -74.1, lat: 4.7, weather: "Highland Chill", tempC: 12, tzOffset: -5 },
      { name: "CALI", country: "Colombia", region: "South America", lon: -76.5, lat: 3.4, weather: "Warm/Pleasant", tempC: 23, tzOffset: -5 },
      { name: "QUITO", country: "Ecuador", region: "South America", lon: -78.5, lat: -0.2, weather: "Mountain Frost", tempC: 11, tzOffset: -5 },
      { name: "GUAYAQUIL", country: "Ecuador", region: "South America", lon: -79.9, lat: -2.2, weather: "Tropical Warm", tempC: 28, tzOffset: -5 },
      { name: "TRUJILLO", country: "Peru", region: "South America", lon: -79.0, lat: -8.1, weather: "Pacific Mist", tempC: 20, tzOffset: -5 },
      { name: "LIMA", country: "Peru", region: "South America", lon: -77.0, lat: -12.0, weather: "Garúa Fog", tempC: 21, tzOffset: -5 },
      { name: "CUSCO", country: "Peru", region: "South America", lon: -72.0, lat: -13.5, weather: "Andean Freeze", tempC: 7, tzOffset: -5 },
      { name: "AREQUIPA", country: "Peru", region: "South America", lon: -71.5, lat: -16.4, weather: "Crisp/Clear", tempC: 13, tzOffset: -5 },
      { name: "LA PAZ", country: "Bolivia", region: "South America", lon: -68.1, lat: -16.5, weather: "Altiplano Frost", tempC: 5, tzOffset: -4 },
    ]
  },
  20: {
    day: 20,
    title: "Southern Cone & Patagonia Frontier",
    description: "Glacial fjords, Argentine pampas, and the southernmost tip of Cape Horn.",
    route: [
      { name: "SUCRE", country: "Bolivia", region: "South America", lon: -65.3, lat: -19.0, weather: "Pleasant", tempC: 15, tzOffset: -4 },
      { name: "SALTA", country: "Argentina", region: "South America", lon: -65.4, lat: -24.8, weather: "Warm Starlit", tempC: 20, tzOffset: -3 },
      { name: "ASUNCION", country: "Paraguay", region: "South America", lon: -57.6, lat: -25.3, weather: "Summer Heat", tempC: 29, tzOffset: -3 },
      { name: "CORDOBA", country: "Argentina", region: "South America", lon: -64.2, lat: -31.4, weather: "Mild Night", tempC: 22, tzOffset: -3 },
      { name: "MENDOZA", country: "Argentina", region: "South America", lon: -68.8, lat: -32.9, weather: "Andean Dry", tempC: 21, tzOffset: -3 },
      { name: "SANTIAGO", country: "Chile", region: "South America", lon: -70.7, lat: -33.4, weather: "Clear Night", tempC: 18, tzOffset: -3 },
      { name: "CONCEPCION", country: "Chile", region: "South America", lon: -73.0, lat: -36.8, weather: "Coastal Breeze", tempC: 16, tzOffset: -3 },
      { name: "BUENOS AIRES", country: "Argentina", region: "South America", lon: -58.4, lat: -34.6, weather: "Summer Evening", tempC: 24, tzOffset: -3 },
      { name: "MONTEVIDEO", country: "Uruguay", region: "South America", lon: -56.2, lat: -34.9, weather: "River Mist", tempC: 22, tzOffset: -3 },
      { name: "BARILOCHE", country: "Argentina", region: "South America", lon: -71.3, lat: -41.1, weather: "Lake Wind", tempC: 10, tzOffset: -3 },
      { name: "PUNTA ARENAS", country: "Chile", region: "South America", lon: -70.9, lat: -53.2, weather: "Patagonian Gale", tempC: 6, tzOffset: -3 },
      { name: "USHUAIA", country: "Argentina", region: "South America", lon: -68.3, lat: -54.8, weather: "End-of-World Chill", tempC: 4, tzOffset: -3 },
    ]
  },
  21: {
    day: 21,
    title: "Brazil, Amazonia & Atlantic Coast",
    description: "Deep Amazon rainforest sweep flowing into the great Atlantic metropolis of Brazil.",
    route: [
      { name: "MANAUS", country: "Brazil", region: "South America", lon: -60.0, lat: -3.1, weather: "Rainforest Steam", tempC: 27, tzOffset: -4 },
      { name: "BELEM", country: "Brazil", region: "South America", lon: -48.5, lat: -1.5, weather: "Equatorial Warm", tempC: 26, tzOffset: -3 },
      { name: "FORTALEZA", country: "Brazil", region: "South America", lon: -38.5, lat: -3.7, weather: "Tropical Wind", tempC: 28, tzOffset: -3 },
      { name: "NATAL", country: "Brazil", region: "South America", lon: -35.2, lat: -5.8, weather: "Atlantic Trade", tempC: 27, tzOffset: -3 },
      { name: "RECIFE", country: "Brazil", region: "South America", lon: -34.9, lat: -8.1, weather: "Warm Rain", tempC: 28, tzOffset: -3 },
      { name: "SALVADOR", country: "Brazil", region: "South America", lon: -38.5, lat: -13.0, weather: "Breezy Night", tempC: 26, tzOffset: -3 },
      { name: "BRASILIA", country: "Brazil", region: "South America", lon: -47.9, lat: -15.8, weather: "Cerrado Rain", tempC: 21, tzOffset: -3 },
      { name: "BELO HORIZONTE", country: "Brazil", region: "South America", lon: -43.9, lat: -19.9, weather: "Mild/Cloudy", tempC: 22, tzOffset: -3 },
      { name: "RIO DE JANEIRO", country: "Brazil", region: "South America", lon: -43.2, lat: -22.9, weather: "Copacabana Warmth", tempC: 27, tzOffset: -3 },
      { name: "SAO PAULO", country: "Brazil", region: "South America", lon: -46.6, lat: -23.5, weather: "Summer Drizzle", tempC: 21, tzOffset: -3 },
      { name: "CURITIBA", country: "Brazil", region: "South America", lon: -49.3, lat: -25.4, weather: "Highland Cool", tempC: 17, tzOffset: -3 },
      { name: "PORTO ALEGRE", country: "Brazil", region: "South America", lon: -51.2, lat: -30.0, weather: "Pampas Wind", tempC: 23, tzOffset: -3 },
    ]
  },
  22: {
    day: 22,
    title: "Sahara, Maghreb & Nile Valley",
    description: "Crossing the vast sands of the Sahara to the historic fertile delta of Egypt.",
    route: [
      { name: "CASABLANCA", country: "Morocco", region: "North Africa", lon: -7.6, lat: 33.6, weather: "Coastal Chill", tempC: 13, tzOffset: 1 },
      { name: "RABAT", country: "Morocco", region: "North Africa", lon: -6.8, lat: 34.0, weather: "Brisk", tempC: 12, tzOffset: 1 },
      { name: "MARRAKECH", country: "Morocco", region: "North Africa", lon: -8.0, lat: 31.6, weather: "Starlit Desert", tempC: 9, tzOffset: 1 },
      { name: "ALGIERS", country: "Algeria", region: "North Africa", lon: 3.0, lat: 36.7, weather: "Winter Rain", tempC: 11, tzOffset: 1 },
      { name: "TUNIS", country: "Tunisia", region: "North Africa", lon: 10.2, lat: 36.8, weather: "Mediterranean Mist", tempC: 12, tzOffset: 1 },
      { name: "TRIPOLI", country: "Libya", region: "North Africa", lon: 13.2, lat: 32.9, weather: "Brisk Night", tempC: 14, tzOffset: 2 },
      { name: "ALEXANDRIA", country: "Egypt", region: "North Africa", lon: 29.9, lat: 31.2, weather: "Sea Gusts", tempC: 15, tzOffset: 2 },
      { name: "CAIRO", country: "Egypt", region: "North Africa", lon: 31.2, lat: 30.0, weather: "Crisp/Clear", tempC: 13, tzOffset: 2 },
      { name: "LUXOR", country: "Egypt", region: "North Africa", lon: 32.6, lat: 25.7, weather: "Desert Night", tempC: 11, tzOffset: 2 },
      { name: "KHARTOUM", country: "Sudan", region: "East Africa", lon: 32.5, lat: 15.6, weather: "Warm Sands", tempC: 22, tzOffset: 2 },
      { name: "NOUAKCHOTT", country: "Mauritania", region: "West Africa", lon: -15.9, lat: 18.1, weather: "Harmattan Haze", tempC: 20, tzOffset: 0 },
      { name: "DAKAR", country: "Senegal", region: "West Africa", lon: -17.4, lat: 14.7, weather: "Ocean Wind", tempC: 23, tzOffset: 0 },
    ]
  },
  23: {
    day: 23,
    title: "Sub-Saharan Savanna & Cape Horn",
    description: "From West African rhythms across the Serengeti down to Table Mountain.",
    route: [
      { name: "ACCRA", country: "Ghana", region: "West Africa", lon: -0.2, lat: 5.6, weather: "Tropical Warm", tempC: 27, tzOffset: 0 },
      { name: "LAGOS", country: "Nigeria", region: "West Africa", lon: 3.4, lat: 6.5, weather: "Humid Night", tempC: 28, tzOffset: 1 },
      { name: "ABIDJAN", country: "Ivory Coast", region: "West Africa", lon: -4.0, lat: 5.3, weather: "Warm Showers", tempC: 27, tzOffset: 0 },
      { name: "DOUALA", country: "Cameroon", region: "Central Africa", lon: 9.7, lat: 4.1, weather: "Warm Mist", tempC: 26, tzOffset: 1 },
      { name: "KINSHASA", country: "DR Congo", region: "Central Africa", lon: 15.3, lat: -4.4, weather: "Congo Thunder", tempC: 25, tzOffset: 1 },
      { name: "KIGALI", country: "Rwanda", region: "East Africa", lon: 30.1, lat: -1.9, weather: "Misty Hills", tempC: 19, tzOffset: 2 },
      { name: "NAIROBI", country: "Kenya", region: "East Africa", lon: 36.8, lat: -1.3, weather: "Highland Breeze", tempC: 17, tzOffset: 3 },
      { name: "DAR ES SALAAM", country: "Tanzania", region: "East Africa", lon: 39.3, lat: -6.8, weather: "Indian Ocean Heat", tempC: 28, tzOffset: 3 },
      { name: "LUSAKA", country: "Zambia", region: "Southern Africa", lon: 28.3, lat: -15.4, weather: "Summer Storm", tempC: 22, tzOffset: 2 },
      { name: "HARARE", country: "Zimbabwe", region: "Southern Africa", lon: 31.0, lat: -17.8, weather: "Mild/Clear", tempC: 20, tzOffset: 2 },
      { name: "JOHANNESBURG", country: "South Africa", region: "Southern Africa", lon: 28.0, lat: -26.2, weather: "Highveld Breeze", tempC: 18, tzOffset: 2 },
      { name: "CAPE TOWN", country: "South Africa", region: "Southern Africa", lon: 18.4, lat: -33.9, weather: "Table Bay Gusts", tempC: 21, tzOffset: 2 },
    ]
  },
  24: {
    day: 24,
    title: "Christmas Eve: The Worldwide Midnight Odyssey",
    description: "The grand finale! Delivering joy across every ocean, continent, and household on Earth.",
    route: [
      { name: "AUCKLAND", country: "New Zealand", region: "Oceania", lon: 174.8, lat: -36.8, weather: "Starlit Pacific", tempC: 19, tzOffset: 13 },
      { name: "SYDNEY", country: "Australia", region: "Oceania", lon: 151.2, lat: -33.9, weather: "Summer Evening", tempC: 23, tzOffset: 11 },
      { name: "TOKYO", country: "Japan", region: "East Asia", lon: 139.7, lat: 35.7, weather: "Crisp/Clear", tempC: 3, tzOffset: 9 },
      { name: "BEIJING", country: "China", region: "East Asia", lon: 116.4, lat: 39.9, weather: "Freezing Cold", tempC: -4, tzOffset: 8 },
      { name: "DELHI", country: "India", region: "South Asia", lon: 77.2, lat: 28.6, weather: "Winter Fog", tempC: 12, tzOffset: 5.5 },
      { name: "DUBAI", country: "UAE", region: "Middle East", lon: 55.3, lat: 25.2, weather: "Clear Desert", tempC: 22, tzOffset: 4 },
      { name: "NAIROBI", country: "Kenya", region: "East Africa", lon: 36.8, lat: -1.3, weather: "Highland Breeze", tempC: 17, tzOffset: 3 },
      { name: "CAIRO", country: "Egypt", region: "North Africa", lon: 31.2, lat: 30.0, weather: "Crisp/Clear", tempC: 13, tzOffset: 2 },
      { name: "KRAKOW", country: "Poland", region: "Europe", lon: 19.9, lat: 50.1, weather: "Powder Snow", tempC: -3, tzOffset: 1 },
      { name: "LONDON", country: "UK", region: "Europe", lon: -0.1, lat: 51.5, weather: "Brisk/Cloudy", tempC: 6, tzOffset: 0 },
      { name: "RIO", country: "Brazil", region: "South America", lon: -43.2, lat: -22.9, weather: "Copacabana Warmth", tempC: 27, tzOffset: -3 },
      { name: "NEW YORK", country: "USA", region: "North America", lon: -74.0, lat: 40.7, weather: "Cold Snow", tempC: 2, tzOffset: -5 },
      { name: "MEXICO CITY", country: "Mexico", region: "Central America", lon: -99.1, lat: 19.4, weather: "Cool Night", tempC: 11, tzOffset: -6 },
      { name: "LOS ANGELES", country: "USA", region: "North America", lon: -118.2, lat: 34.0, weather: "Pleasant", tempC: 14, tzOffset: -8 },
      { name: "HONOLULU", country: "USA", region: "Pacific", lon: -157.8, lat: 21.3, weather: "Aloha Breeze", tempC: 24, tzOffset: -10 }
    ]
  }
};

export const ADVENT_DAYS_COUNT = 24;

export function getAdventDay(dayNumber: number): AdventDay {
  const clamped = Math.max(1, Math.min(ADVENT_DAYS_COUNT, Math.round(dayNumber)));
  return ADVENT_SCHEDULES[clamped] || ADVENT_SCHEDULES[24];
}
