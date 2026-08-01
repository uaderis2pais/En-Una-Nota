// Dataset de canciones de prueba en español con URLs de preview activas de iTunes API
export const MOCK_SONGS = [
  {
    id: '1',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    album: 'VIDA',
    year: '2017',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e2/ef/f0/e2eff0bc-c51d-7de5-9280-6891ddcee71b/18UMGIM85289.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/40/5b/e7/405be722-3ec9-ba27-7469-002182d57b39/mzaf_14120258742032474456.plus.aac.p.m4a',
    startTime: 0.0 // Inicio exacto en la primera nota de guitarra
  },
  {
    id: '2',
    title: 'La Camisa Negra',
    artist: 'Juanes',
    album: 'Mi Sangre',
    year: '2004',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/1d/ad/211dad4f-69f6-9ac3-4c3b-3116dd3de4d4/06UMGIM24053.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/84/de/46/84de46ef-f9f8-c6ad-fb6e-f6d5ca7571b7/mzaf_17789816509198950478.plus.aac.p.m4a',
    startTime: 0.0 // Inicio exacto en rasgueo inicial
  },
  {
    id: '3',
    title: 'Bailando',
    artist: 'Enrique Iglesias ft. Descemer Bueno & Gente de Zona',
    album: 'SEX and LOVE',
    year: '2014',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c7/18/3e/c7183ef7-49f1-8941-03cf-ad17ca8b97ea/00602537854097.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ac/cf/ed/accfedc1-7df3-2632-46a8-feac0de516ae/mzaf_8802538013104327631.plus.aac.p.m4a',
    startTime: 0.0 // Inicio instrumental
  },
  {
    id: '4',
    title: 'Chantaje',
    artist: 'Shakira ft. Maluma',
    album: 'El Dorado',
    year: '2016',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/60/9f/7f/609f7f34-c239-73e8-32da-96fd5f2cba77/886446480060.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ce/25/45/ce254583-d1ac-db76-c02e-a4ceeab5e2de/mzaf_7277323164917214654.plus.aac.p.m4a',
    startTime: 0.0 // Sintetizador inicial
  },
  {
    id: '5',
    title: 'Provenza',
    artist: 'Karol G',
    album: 'MAÑANA SERÁ BONITO',
    year: '2022',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/9b/01/44/9b0144e6-21ae-b53f-2b25-ef6c594b18a3/22UM1IM38716.rgb.jpg/600x600bb.jpg',
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e0/c6/79/e0c679cf-4837-132a-f1e2-065faf13e0d4/mzaf_16649152643389056902.plus.aac.p.m4a',
    startTime: 0.0 // Loop intro
  }
];

// Nuevos intervalos de tiempo (7 intentos en total): 0.3s, 0.8s, 1.5s, 2.5s, 4s, 5s, 7s
export const ATTEMPT_TIMES = [0.3, 0.8, 1.5, 2.5, 4, 5, 7];
export const TOTAL_ATTEMPTS = ATTEMPT_TIMES.length; // 7
