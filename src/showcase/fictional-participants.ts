/**
 * 25 CLEARLY-FICTIONAL participants for the showcase.
 *
 * These are invented personas — not real people. Their source links use the
 * reserved `pairpilot-demo` / `pairpilot.demo` handle namespace so they cannot
 * be mistaken for any real individual's official profile. No real person is
 * profiled. Interests are drawn from a controlled, non-sensitive pool so that
 * genuine overlaps and complementary pairings emerge in the simulation.
 */

export interface FictionalSeed {
  firstName: string;
  lastName: string;
  profession: string;
  city: string;
  /** Non-sensitive interest tags (lowercase, from the controlled pool). */
  tags: string[];
}

/** Adjacency between interests — used to score complementary (non-identical) fit. */
export const INTEREST_ADJACENCY: Record<string, string[]> = {
  "trail running": ["hiking", "cycling", "marathons"],
  cycling: ["trail running", "hiking"],
  hiking: ["camping", "trail running", "landscape photography"],
  camping: ["hiking", "landscape photography"],
  "rock climbing": ["hiking", "camping"],
  yoga: ["swimming", "meditation"],
  swimming: ["yoga", "cycling"],
  "specialty coffee": ["home cooking", "baking"],
  "home cooking": ["baking", "specialty coffee", "gardening"],
  baking: ["home cooking", "specialty coffee"],
  "jazz piano": ["guitar", "music production"],
  guitar: ["jazz piano", "music production"],
  "music production": ["jazz piano", "guitar"],
  "film photography": ["landscape photography", "travel"],
  "landscape photography": ["film photography", "travel", "hiking"],
  travel: ["languages", "landscape photography"],
  languages: ["travel", "reading sci-fi"],
  "board games": ["chess", "reading sci-fi"],
  chess: ["board games"],
  "reading sci-fi": ["creative writing", "board games", "languages"],
  "creative writing": ["reading sci-fi"],
  gardening: ["home cooking", "pottery"],
  pottery: ["painting", "gardening"],
  painting: ["pottery", "film photography"],
  marathons: ["trail running"],
  meditation: ["yoga"],
};

export const FICTIONAL_SEEDS: FictionalSeed[] = [
  { firstName: "Mira", lastName: "Alvarez", profession: "Backend engineer", city: "Austin", tags: ["trail running", "specialty coffee", "board games"] },
  { firstName: "Dev", lastName: "Kapoor", profession: "Data scientist", city: "Toronto", tags: ["cycling", "chess", "home cooking"] },
  { firstName: "Noa", lastName: "Bergström", profession: "UX designer", city: "Stockholm", tags: ["film photography", "travel", "pottery"] },
  { firstName: "Theo", lastName: "Okafor", profession: "Product manager", city: "London", tags: ["board games", "jazz piano", "specialty coffee"] },
  { firstName: "Lena", lastName: "Petrova", profession: "Mechanical engineer", city: "Berlin", tags: ["rock climbing", "hiking", "landscape photography"] },
  { firstName: "Caleb", lastName: "Mwangi", profession: "DevOps engineer", city: "Nairobi", tags: ["trail running", "guitar", "reading sci-fi"] },
  { firstName: "Yuki", lastName: "Tanaka", profession: "Illustrator", city: "Osaka", tags: ["painting", "travel", "baking"] },
  { firstName: "Sofia", lastName: "Rossi", profession: "Research scientist", city: "Milan", tags: ["swimming", "languages", "home cooking"] },
  { firstName: "Arjun", lastName: "Nair", profession: "Frontend engineer", city: "Bengaluru", tags: ["cycling", "music production", "board games"] },
  { firstName: "Hana", lastName: "Kim", profession: "Data engineer", city: "Seoul", tags: ["yoga", "specialty coffee", "reading sci-fi"] },
  { firstName: "Mateo", lastName: "Garcia", profession: "Civil engineer", city: "Madrid", tags: ["hiking", "guitar", "travel"] },
  { firstName: "Freya", lastName: "Johansen", profession: "Marine biologist", city: "Bergen", tags: ["swimming", "landscape photography", "gardening"] },
  { firstName: "Omar", lastName: "Haddad", profession: "Security analyst", city: "Amman", tags: ["chess", "creative writing", "specialty coffee"] },
  { firstName: "Priya", lastName: "Sharma", profession: "ML engineer", city: "Pune", tags: ["trail running", "baking", "languages"] },
  { firstName: "Ivan", lastName: "Horvat", profession: "Game developer", city: "Zagreb", tags: ["board games", "music production", "reading sci-fi"] },
  { firstName: "Elodie", lastName: "Laurent", profession: "Architect", city: "Lyon", tags: ["pottery", "film photography", "cycling"] },
  { firstName: "Daniel", lastName: "Owens", profession: "Teacher", city: "Dublin", tags: ["guitar", "hiking", "home cooking"] },
  { firstName: "Aisha", lastName: "Bello", profession: "Economist", city: "Lagos", tags: ["travel", "languages", "chess"] },
  { firstName: "Lucas", lastName: "Silva", profession: "Mobile developer", city: "São Paulo", tags: ["cycling", "jazz piano", "specialty coffee"] },
  { firstName: "Nina", lastName: "Kovač", profession: "Physiotherapist", city: "Ljubljana", tags: ["yoga", "swimming", "gardening"] },
  { firstName: "Sam", lastName: "Fisher", profession: "Technical writer", city: "Portland", tags: ["reading sci-fi", "creative writing", "baking"] },
  { firstName: "Zara", lastName: "Ahmed", profession: "Biomedical engineer", city: "Manchester", tags: ["rock climbing", "camping", "painting"] },
  { firstName: "Tom", lastName: "Becker", profession: "Cloud architect", city: "Munich", tags: ["trail running", "chess", "guitar"] },
  { firstName: "Leila", lastName: "Nasser", profession: "Journalist", city: "Beirut", tags: ["travel", "film photography", "creative writing"] },
  { firstName: "Kenji", lastName: "Sato", profession: "Robotics engineer", city: "Nagoya", tags: ["board games", "landscape photography", "cycling"] },
];
