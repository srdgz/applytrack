import type { ApplicationSource, ApplicationStatus, SalaryRange, WorkMode } from "@applytrack/core";

export const SEED_LOCALES = ["es", "en"] as const;
export type SeedLocale = (typeof SEED_LOCALES)[number];

export type Localized<T> = Readonly<Record<SeedLocale, T>>;

export type SeedStep = readonly [status: ApplicationStatus, daysAgo: number];

export interface SeedDefinition {
  readonly company: string;
  readonly position: Localized<string>;
  readonly workMode: WorkMode;
  readonly source: ApplicationSource;
  readonly path: readonly [SeedStep, ...SeedStep[]];
  readonly jobUrl?: string;
  readonly location?: Localized<string>;
  readonly salary?: SalaryRange;
  readonly tags: Localized<readonly string[]>;
  readonly notes?: Localized<string>;
  readonly archived?: boolean;
}

const same = <T>(value: T): Localized<T> => ({ es: value, en: value });

const remoteSpain: Localized<string> = { es: "Remoto (España)", en: "Remote (Spain)" };
const remoteEurope: Localized<string> = { es: "Remoto (Europa)", en: "Remote (Europe)" };

export const SEED: readonly SeedDefinition[] = [
  {
    company: "Nimbus Labs",
    position: { es: "Desarrollo Frontend (Vue)", en: "Frontend Developer (Vue)" },
    workMode: "remote",
    source: "linkedin",
    path: [["wishlist", 2]],
    jobUrl: "https://careers.nimbus-labs.example/frontend-vue",
    location: remoteSpain,
    tags: same(["Vue", "TypeScript"]),
    notes: {
      es: "Producto SaaS para clínicas. Revisar el stack antes de aplicar.",
      en: "SaaS product for clinics. Check the stack before applying.",
    },
  },
  {
    company: "Quokka Studio",
    position: { es: "Desarrollo React Native", en: "React Native Developer" },
    workMode: "hybrid",
    source: "company_site",
    path: [["wishlist", 5]],
    jobUrl: "https://quokka-studio.example/jobs/react-native",
    location: same("Valencia"),
    tags: { es: ["React Native", "Expo", "Agencia"], en: ["React Native", "Expo", "Agency"] },
  },
  {
    company: "Brisa Health",
    position: { es: "Ingeniería Frontend", en: "Frontend Engineer" },
    workMode: "remote",
    source: "infojobs",
    path: [["applied", 3]],
    location: remoteSpain,
    tags: same(["Vue", "Pinia"]),
  },
  {
    company: "Lince Software",
    position: { es: "Desarrollo Web", en: "Web Developer" },
    workMode: "onsite",
    source: "tecnoempleo",
    path: [["applied", 20]],
    location: same("Sevilla"),
    tags: { es: ["React", "Consultora"], en: ["React", "Consultancy"] },
  },
  {
    company: "Atlas Retail Tech",
    position: { es: "Desarrollo Móvil", en: "Mobile Developer" },
    workMode: "remote",
    source: "linkedin",
    path: [["applied", 9]],
    jobUrl: "https://jobs.atlas-retail.example/mobile",
    location: remoteEurope,
    tags: same(["React Native", "TypeScript"]),
  },
  {
    company: "Puerto Data",
    position: { es: "Desarrollo Frontend", en: "Frontend Developer" },
    workMode: "hybrid",
    source: "referral",
    path: [
      ["applied", 12],
      ["screening", 6],
    ],
    location: same("Bilbao"),
    tags: same(["React", "TypeScript"]),
    notes: {
      es: "Me refirió una antigua compañera. Primera llamada con RR. HH. hecha.",
      en: "Referred by a former colleague. First call with HR done.",
    },
  },
  {
    company: "Olivo Fintech",
    position: { es: "Desarrollo Vue", en: "Vue Developer" },
    workMode: "remote",
    source: "recruiter",
    path: [
      ["applied", 25],
      ["screening", 18],
    ],
    location: remoteSpain,
    salary: { min: 32000, max: 36000, currency: "EUR" },
    tags: same(["Vue", "Fintech"]),
  },
  {
    company: "Kraken Games",
    position: { es: "Desarrollo de Interfaces", en: "UI Developer" },
    workMode: "remote",
    source: "linkedin",
    path: [
      ["applied", 21],
      ["screening", 15],
      ["interviewing", 4],
    ],
    jobUrl: "https://kraken-games.example/careers/ui-developer",
    location: remoteEurope,
    tags: { es: ["React", "Videojuegos"], en: ["React", "Games"] },
    notes: {
      es: "Prueba técnica entregada. Próxima entrevista: equipo de producto.",
      en: "Take-home delivered. Next interview: product team.",
    },
  },
  {
    company: "Sierra Mobility",
    position: { es: "Ingeniería React Native", en: "React Native Engineer" },
    workMode: "hybrid",
    source: "company_site",
    path: [
      ["applied", 30],
      ["interviewing", 10],
    ],
    location: same("Madrid"),
    tags: same(["React Native", "Detox"]),
  },
  {
    company: "Tejo Cloud",
    position: { es: "Desarrollo Frontend", en: "Frontend Developer" },
    workMode: "remote",
    source: "referral",
    path: [
      ["applied", 35],
      ["screening", 28],
      ["interviewing", 20],
      ["offer", 2],
    ],
    location: remoteSpain,
    salary: { min: 34000, max: 38000, currency: "EUR" },
    tags: same(["Vue", "TypeScript", "AWS"]),
    notes: {
      es: "Oferta recibida. Responder antes del viernes.",
      en: "Offer received. Reply before Friday.",
    },
  },
  {
    company: "Mirlo Apps",
    position: { es: "Desarrollo Móvil", en: "Mobile Developer" },
    workMode: "remote",
    source: "linkedin",
    path: [
      ["applied", 60],
      ["interviewing", 50],
      ["offer", 42],
      ["accepted", 40],
    ],
    location: { es: "Remoto (Reino Unido)", en: "Remote (UK)" },
    salary: { min: 38000, max: 42000, currency: "GBP" },
    tags: same(["React Native", "RevenueCat"]),
  },
  {
    company: "Faro Labs",
    position: { es: "Desarrollo Frontend", en: "Frontend Developer" },
    workMode: "onsite",
    source: "infojobs",
    path: [
      ["applied", 40],
      ["screening", 33],
      ["rejected", 30],
    ],
    location: same("Barcelona"),
    tags: same(["Angular"]),
    archived: true,
  },
  {
    company: "Cobalto Systems",
    position: { es: "Desarrollo Vue", en: "Vue Developer" },
    workMode: "hybrid",
    source: "tecnoempleo",
    path: [
      ["applied", 15],
      ["rejected", 8],
    ],
    location: same("Málaga"),
    tags: { es: ["Vue", "Migración"], en: ["Vue", "Migration"] },
  },
  {
    company: "Nórdica Media",
    position: { es: "Responsable Frontend", en: "Frontend Lead" },
    workMode: "onsite",
    source: "recruiter",
    path: [
      ["applied", 45],
      ["interviewing", 38],
      ["withdrawn", 36],
    ],
    location: same("Oslo"),
    tags: same(["React", "Lead"]),
    notes: {
      es: "Exigía mudanza. Me retiré del proceso.",
      en: "Required relocation. Withdrew from the process.",
    },
  },
  {
    company: "Delta Commerce",
    position: { es: "Desarrollo React", en: "React Developer" },
    workMode: "remote",
    source: "linkedin",
    path: [
      ["applied", 50],
      ["no_response", 20],
    ],
    location: remoteEurope,
    salary: { min: 60000, max: 75000, currency: "USD" },
    tags: same(["React", "E-commerce"]),
  },
];
