// Genetic Algorithm (reworked) – now group-aware using CourseGroup
import { Course, ScheduleSection, Section, CourseGroup, UserPreferences } from '../shared/types';
import { calculateScore } from './scoring';

// ----- Representation -----
// Each genome index corresponds to one CourseGroup; value is selected course+section or null.
export interface SelectedSection { courseCode: string; sectionCode: string; }
export type Genome = (SelectedSection | null)[];

interface Individual { genome: Genome; fitness: number; units: number; }

export interface GAInput {
  courseGroups: CourseGroup[];    // New grouping structure
  courses: Course[];              // Full course list with sections
  preferences?: any[];            // Legacy per-course preference objects
  userPreferences?: UserPreferences; // Global weighted preferences (contains weights)
  minUnits?: number;
  maxUnits?: number;
}

interface GAParams { populationSize: number; generations: number; crossoverRate: number; mutationRate: number; elitism: number; seed?: number; }
const DEFAULT_PARAMS: GAParams = { populationSize: 120, generations: 160, crossoverRate: 0.85, mutationRate: 0.07, elitism: 4 };
export interface GAResult { best: Individual; history: { gen: number; best: number; avg: number }[]; population: Individual[]; }

// ----- Helpers -----
function buildCourseIndex(courses: Course[]): Record<string, Course> {
  const idx: Record<string, Course> = {};
  for (const c of courses) idx[c.courseCode] = c;
  return idx;
}

function genomeToSchedule(genome: Genome, courseIndex: Record<string, Course>): ScheduleSection[] {
  const schedule: ScheduleSection[] = [];
  for (const gene of genome) {
    if (!gene) continue;
    const course = courseIndex[gene.courseCode];
    if (!course) continue; // stale gene safety
    const section = course.sections.find(s => s.sectionCode === gene.sectionCode);
    if (!section) continue;
    schedule.push({
      courseName: course.courseName,
      courseCode: course.courseCode,
      sectionCode: section.sectionCode,
      professor: section.professor,
      schedule: section.schedule
    });
  }
  return schedule;
}

function calcUnits(genome: Genome, courseIndex: Record<string, Course>): number {
  let total = 0;
  for (const gene of genome) if (gene) {
    const c = courseIndex[gene.courseCode];
    if (c) total += c.units || 0;
  }
  return total;
}

function conflictPenalty(schedule: ScheduleSection[]): number {
  let penalty = 0;
  for (let i=0;i<schedule.length;i++) {
    for (let j=i+1;j<schedule.length;j++) {
      const A = schedule[i];
      const B = schedule[j];
      for (const sa of A.schedule) for (const sb of B.schedule) if (sa.day===sb.day) {
        const as = +sa.start.slice(0,2)*60 + +sa.start.slice(3);
        const ae = +sa.end.slice(0,2)*60 + +sa.end.slice(3);
        const bs = +sb.start.slice(0,2)*60 + +sb.start.slice(3);
        const be = +sb.end.slice(0,2)*60 + +sb.end.slice(3);
        if (as < be && ae > bs) penalty += 100000; // hard conflict
      }
    }
  }
  return penalty;
}

function fitness(
  ind: Individual,
  courseIndex: Record<string, Course>,
  legacyPrefs: any[]|undefined,
  userPrefs: UserPreferences | undefined,
  minUnits=0,
  maxUnits=Infinity,
  courseGroups?: CourseGroup[]
): number {
  const schedule = genomeToSchedule(ind.genome, courseIndex);
  const units = calcUnits(ind.genome, courseIndex);
  let penalty = conflictPenalty(schedule);
  if (units < minUnits) penalty += (minUnits-units)*5000;
  if (units > maxUnits) penalty += (units-maxUnits)*5000;
  const raw = calculateScore(schedule as any, legacyPrefs as any, ind.genome as any, courseGroups as any, userPrefs as any);
  ind.units = units;
  return raw - penalty;
}

// ----- Initialization -----
// Seeded RNG utilities for reproducible runs
type RNG = { random: () => number };
function mulberry32(seed: number): RNG {
  let t = seed >>> 0;
  return { random: () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }};
}

function makeDeterministicSeed(input: GAInput): number {
  const s = JSON.stringify({
    groups: input.courseGroups?.map(g=>({ c:g.courseCodes, p:g.priority, a:(g as any).isActive })) ?? [],
    courses: input.courses?.map(c=>({ code:c.courseCode, u:c.units||0, n:c.sections?.length||0 })) ?? [],
    prefs: input.userPreferences ?? {},
    min: input.minUnits ?? 0,
    max: input.maxUnits ?? 999,
  });
  let hash = 2166136261 >>> 0; // FNV-1a
  for (let i=0;i<s.length;i++) { hash ^= s.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function initializePopulation(popSize: number, courseGroups: CourseGroup[], courseIndex: Record<string, Course>, rng: RNG): Individual[] {
  const population: Individual[] = [];
  for (let p=0; p<popSize; p++) {
    const genome: Genome = [];
    for (let gi=0; gi<courseGroups.length; gi++) {
      const group = courseGroups[gi];
      if (!group.courseCodes.length) { genome.push(null); continue; }
      // Decide select or not
      if (rng.random() < 0.55) {
        // pick a random courseCode that has sections
        const shuffled = [...group.courseCodes].sort(()=>rng.random()-0.5);
        let chosen: SelectedSection | null = null;
        for (const code of shuffled) {
          const course = courseIndex[code];
            if (course && course.sections.length) {
              const section = course.sections[Math.floor(rng.random()*course.sections.length)];
              chosen = { courseCode: code, sectionCode: section.sectionCode };
              break;
            }
        }
        genome.push(chosen);
      } else genome.push(null);
    }
    population.push({ genome, fitness: 0, units: 0 });
  }
  return population;
}

// ----- Selection -----
function tournament(pop: Individual[], k=3, rng?: RNG): Individual {
  let best: Individual | null = null;
  for (let i=0;i<k;i++) {
  const r = rng ? rng.random() : Math.random();
  const cand = pop[Math.floor(r*pop.length)];
    if (!best || cand.fitness > best.fitness) best = cand;
  }
  return best!;
}

// ----- Crossover -----
function crossover(a: Individual, b: Individual, rate: number, rng: RNG): [Individual, Individual] {
  if (rng.random() > rate || a.genome.length === 0) return [JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b))];
  const point = Math.floor(rng.random()*a.genome.length);
  const g1: Genome = [];
  const g2: Genome = [];
  for (let i=0;i<a.genome.length;i++) {
    if (i <= point) { g1[i] = a.genome[i]; g2[i] = b.genome[i]; }
    else { g1[i] = b.genome[i]; g2[i] = a.genome[i]; }
  }
  return [ { genome: g1, fitness:0, units:0 }, { genome: g2, fitness:0, units:0 } ];
}

// ----- Mutation -----
function mutate(ind: Individual, courseGroups: CourseGroup[], courseIndex: Record<string, Course>, rate: number, rng: RNG) {
  for (let i=0;i<ind.genome.length;i++) if (rng.random() < rate) {
    const group = courseGroups[i];
    if (!group.courseCodes.length) continue;
    const op = rng.random();
    const current = ind.genome[i];
    // 4 mutation types as specified
    if (current && op < 0.25) {
      // change selected section (same course)
      const course = courseIndex[current.courseCode];
      if (course && course.sections.length) {
        const others = course.sections.filter(s => s.sectionCode !== current.sectionCode);
        if (others.length) {
          const sec = others[Math.floor(rng.random()*others.length)];
          ind.genome[i] = { courseCode: course.courseCode, sectionCode: sec.sectionCode };
        }
      }
    } else if (current && op < 0.5) {
      // change to another course in same group
      const altCodes = group.courseCodes.filter(c => c !== current.courseCode);
      if (altCodes.length) {
        const code = altCodes[Math.floor(rng.random()*altCodes.length)];
        const course = courseIndex[code];
        if (course && course.sections.length) {
          const sec = course.sections[Math.floor(rng.random()*course.sections.length)];
          ind.genome[i] = { courseCode: code, sectionCode: sec.sectionCode };
        }
      }
    } else if (!current && op < 0.75) {
      // add a course (currently null)
      const shuffled = [...group.courseCodes].sort(()=>rng.random()-0.5);
      for (const code of shuffled) {
        const course = courseIndex[code];
        if (course && course.sections.length) {
          const sec = course.sections[Math.floor(rng.random()*course.sections.length)];
          ind.genome[i] = { courseCode: code, sectionCode: sec.sectionCode };
          break;
        }
      }
    } else {
      // remove existing selection (set null)
      if (current) ind.genome[i] = null;
    }
  }
}

// ----- Run GA -----
export function runGenetic(input: GAInput, params: Partial<GAParams> = {}): GAResult {
  const cfg = { ...DEFAULT_PARAMS, ...params };
  // Create RNG using provided seed or derive a deterministic one from inputs
  const seed = (cfg.seed ?? makeDeterministicSeed(input)) >>> 0;
  const rng = mulberry32(seed);
  const courseIndex = buildCourseIndex(input.courses);

  let population = initializePopulation(cfg.populationSize, input.courseGroups, courseIndex, rng);
  population.forEach(ind => ind.fitness = fitness(ind, courseIndex, input.preferences, input.userPreferences, input.minUnits, input.maxUnits, input.courseGroups));

  const history: { gen: number; best: number; avg: number }[] = [];
  for (let gen=0; gen<cfg.generations; gen++) {
    population.sort((a,b)=>b.fitness-a.fitness);
    const best = population[0].fitness;
    const avg = population.reduce((s,i)=>s+i.fitness,0)/population.length;
    history.push({ gen, best, avg });

    const next: Individual[] = [];
    for (let e=0; e<cfg.elitism && e<population.length; e++) next.push(JSON.parse(JSON.stringify(population[e])));

    while (next.length < cfg.populationSize) {
      const p1 = tournament(population, 3, rng);
      const p2 = tournament(population, 3, rng);
      const [c1,c2] = crossover(p1,p2,cfg.crossoverRate, rng);
  mutate(c1, input.courseGroups, courseIndex, cfg.mutationRate, rng);
  mutate(c2, input.courseGroups, courseIndex, cfg.mutationRate, rng);
  c1.fitness = fitness(c1, courseIndex, input.preferences, input.userPreferences, input.minUnits, input.maxUnits, input.courseGroups);
  c2.fitness = fitness(c2, courseIndex, input.preferences, input.userPreferences, input.minUnits, input.maxUnits, input.courseGroups);
      next.push(c1);
      if (next.length < cfg.populationSize) next.push(c2);
    }
    population = next;
  }
  population.sort((a,b)=>b.fitness-a.fitness);
  return { best: population[0], history, population };
}

export function convertBestToSchedule(result: GAResult, courses: Course[]) {
  const index = buildCourseIndex(courses);
  return genomeToSchedule(result.best.genome, index);
}
