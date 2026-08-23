export const CIN_REGEX = {
  // Format malgache: 12 chiffres, souvent groupés par 3
  NUMERO: /(\d{3}\s?\d{3}\s?\d{3}\s?\d{3}|\d{12})/,
  DATE: /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/g,
  NOM: /(?:Anarana|Nom)\s*[:\-]?\s*([A-ZÀ-Ÿ\s\-']+)/i,
  PRENOMS: /(?:Fanampiny|Pr[ée]noms?)\s*[:\-]?\s*([A-ZÀ-Ÿa-z\s\-']+)/i,
};

export const COMMUNES_MG = [
  'Antananarivo', 'Antsiranana', 'Fianarantsoa', 'Mahajanga', 'Toamasina', 'Toliara',
  'Antsirabe', 'Ambatolampy', 'Ambositra', 'Manakara', 'Morondava', 'Tôlanaro'
];

export const MOCK_CIN_SAMPLES = [
  {
    numero_cin: '101 234 567 890',
    nom: 'RAKOTONDRABE',
    prenoms: 'Fanasinjaka Joan',
    date_naissance: '1998-05-14',
    lieu_naissance: 'Antananarivo',
    sexe: 'M' as const,
    adresse: 'Lot II M 32 Bis Andraisoro Antananarivo',
    date_emission: '2022-03-10',
    lieu_emission: 'Antananarivo',
    profession: 'Développeur'
  },
  {
    numero_cin: '301 123 456 789',
    nom: 'RANDRIANARISOA',
    prenoms: 'Miora Lalaina',
    date_naissance: '1995-11-02',
    lieu_naissance: 'Fianarantsoa',
    sexe: 'F' as const,
    adresse: 'Lot IVH 78 Isoraka Antananarivo',
    date_emission: '2021-07-22',
    lieu_emission: 'Fianarantsoa',
    profession: 'Enseignante'
  }
];
