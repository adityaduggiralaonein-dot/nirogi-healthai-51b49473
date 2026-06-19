// Complete Nirogi AI sports & exercise library — 87 activities across 10 categories.
// Each activity carries a MET value (metabolic equivalent) used to estimate
// calories burned: kcal = MET * 3.5 * weightKg / 200 * minutes.

export type SportActivity = {
  name: string;
  category: SportCategory;
  met: number; // moderate-intensity MET
  gps: boolean; // distance trackable
};

export type SportCategory =
  | "Running & Walking"
  | "Cycling & Wheeled"
  | "Water Sports"
  | "Racquet & Court"
  | "Team & Field"
  | "Strength & Gym"
  | "Mind & Body"
  | "Combat Sports"
  | "Outdoor & Adventure"
  | "Dance & Others";

export const SPORT_CATEGORIES: SportCategory[] = [
  "Running & Walking",
  "Cycling & Wheeled",
  "Water Sports",
  "Racquet & Court",
  "Team & Field",
  "Strength & Gym",
  "Mind & Body",
  "Combat Sports",
  "Outdoor & Adventure",
  "Dance & Others",
];

export const ACTIVITIES: SportActivity[] = [
  // Running & Walking
  { name: "Outdoor Running", category: "Running & Walking", met: 9.8, gps: true },
  { name: "Indoor Running / Treadmill", category: "Running & Walking", met: 8.0, gps: false },
  { name: "Outdoor Walking", category: "Running & Walking", met: 3.8, gps: true },
  { name: "Indoor Walking", category: "Running & Walking", met: 3.0, gps: false },
  { name: "Hiking", category: "Running & Walking", met: 6.0, gps: true },
  { name: "Trail Running", category: "Running & Walking", met: 10.5, gps: true },
  // Cycling & Wheeled
  { name: "Outdoor Cycling", category: "Cycling & Wheeled", met: 8.0, gps: true },
  { name: "Indoor Cycling / Stationary Bike", category: "Cycling & Wheeled", met: 7.0, gps: false },
  { name: "Hand Cycling", category: "Cycling & Wheeled", met: 6.0, gps: true },
  { name: "Wheelchair / Rolling", category: "Cycling & Wheeled", met: 5.0, gps: true },
  // Water Sports
  { name: "Pool Swimming", category: "Water Sports", met: 7.0, gps: false },
  { name: "Open Water Swimming", category: "Water Sports", met: 8.3, gps: true },
  { name: "Surfing", category: "Water Sports", met: 5.0, gps: false },
  { name: "Outdoor Rowing", category: "Water Sports", met: 7.0, gps: true },
  { name: "Indoor Rowing", category: "Water Sports", met: 7.0, gps: false },
  { name: "Sailing", category: "Water Sports", met: 3.0, gps: true },
  { name: "Water Polo", category: "Water Sports", met: 10.0, gps: false },
  { name: "Water Fitness / Aqua Aerobics", category: "Water Sports", met: 5.5, gps: false },
  { name: "Paddling", category: "Water Sports", met: 5.0, gps: true },
  // Racquet & Court
  { name: "Tennis", category: "Racquet & Court", met: 7.3, gps: false },
  { name: "Badminton", category: "Racquet & Court", met: 5.5, gps: false },
  { name: "Squash", category: "Racquet & Court", met: 12.0, gps: false },
  { name: "Pickleball", category: "Racquet & Court", met: 6.0, gps: false },
  { name: "Racquetball", category: "Racquet & Court", met: 10.0, gps: false },
  { name: "Table Tennis", category: "Racquet & Court", met: 4.0, gps: false },
  { name: "Handball", category: "Racquet & Court", met: 8.0, gps: false },
  { name: "Volleyball", category: "Racquet & Court", met: 4.0, gps: false },
  // Team & Field
  { name: "Cricket", category: "Team & Field", met: 5.0, gps: true },
  { name: "Soccer / Football", category: "Team & Field", met: 7.0, gps: true },
  { name: "Football — American", category: "Team & Field", met: 8.0, gps: true },
  { name: "Rugby", category: "Team & Field", met: 8.3, gps: true },
  { name: "Basketball", category: "Team & Field", met: 6.5, gps: false },
  { name: "Baseball", category: "Team & Field", met: 5.0, gps: false },
  { name: "Softball", category: "Team & Field", met: 5.0, gps: false },
  { name: "Hockey", category: "Team & Field", met: 8.0, gps: true },
  { name: "Lacrosse", category: "Team & Field", met: 8.0, gps: true },
  { name: "Track & Field", category: "Team & Field", met: 9.0, gps: true },
  { name: "Curling", category: "Team & Field", met: 4.0, gps: false },
  // Strength & Gym
  { name: "Strength Training", category: "Strength & Gym", met: 5.0, gps: false },
  { name: "Functional Strength Training", category: "Strength & Gym", met: 5.5, gps: false },
  { name: "Core Training", category: "Strength & Gym", met: 4.0, gps: false },
  { name: "HIIT", category: "Strength & Gym", met: 8.0, gps: false },
  { name: "Cross Training", category: "Strength & Gym", met: 6.0, gps: false },
  { name: "Elliptical", category: "Strength & Gym", met: 5.0, gps: false },
  // Mind & Body
  { name: "Yoga", category: "Mind & Body", met: 3.0, gps: false },
  { name: "Pilates", category: "Mind & Body", met: 3.0, gps: false },
  { name: "Tai Chi", category: "Mind & Body", met: 3.0, gps: false },
  { name: "Barre", category: "Mind & Body", met: 3.5, gps: false },
  { name: "Flexibility & Stretching", category: "Mind & Body", met: 2.5, gps: false },
  { name: "Mind & Body", category: "Mind & Body", met: 2.5, gps: false },
  // Combat Sports
  { name: "Boxing", category: "Combat Sports", met: 9.0, gps: false },
  { name: "Kickboxing", category: "Combat Sports", met: 9.0, gps: false },
  { name: "Martial Arts", category: "Combat Sports", met: 10.0, gps: false },
  { name: "Wrestling", category: "Combat Sports", met: 6.0, gps: false },
  { name: "Fencing", category: "Combat Sports", met: 6.0, gps: false },
  // Outdoor & Adventure
  { name: "Climbing", category: "Outdoor & Adventure", met: 8.0, gps: false },
  { name: "Downhill Skiing", category: "Outdoor & Adventure", met: 6.0, gps: true },
  { name: "Cross Country Skiing", category: "Outdoor & Adventure", met: 9.0, gps: true },
  { name: "Snowboarding", category: "Outdoor & Adventure", met: 5.3, gps: true },
  { name: "Snow Sports", category: "Outdoor & Adventure", met: 5.3, gps: true },
  { name: "Golf", category: "Outdoor & Adventure", met: 4.8, gps: true },
  { name: "Hunting", category: "Outdoor & Adventure", met: 5.0, gps: false },
  { name: "Fishing", category: "Outdoor & Adventure", met: 3.5, gps: false },
  { name: "Equestrian Sports", category: "Outdoor & Adventure", met: 5.5, gps: true },
  { name: "Archery", category: "Outdoor & Adventure", met: 3.5, gps: false },
  // Dance & Others
  { name: "Dance", category: "Dance & Others", met: 5.0, gps: false },
  { name: "Social Dance", category: "Dance & Others", met: 4.5, gps: false },
  { name: "Jump Rope", category: "Dance & Others", met: 11.0, gps: false },
  { name: "Stair Stepper", category: "Dance & Others", met: 8.0, gps: false },
  { name: "Stairs", category: "Dance & Others", met: 8.0, gps: false },
  { name: "Step Training", category: "Dance & Others", met: 7.0, gps: false },
  { name: "Disc Sports", category: "Dance & Others", met: 8.0, gps: true },
  { name: "Gymnastics", category: "Dance & Others", met: 4.0, gps: false },
  { name: "Fitness Gaming", category: "Dance & Others", met: 5.0, gps: false },
  { name: "Cooldown", category: "Dance & Others", met: 2.5, gps: false },
  { name: "Mixed Cardio", category: "Dance & Others", met: 6.0, gps: false },
  { name: "Multisport / Triathlon", category: "Dance & Others", met: 9.0, gps: true },
  { name: "Bowling", category: "Dance & Others", met: 3.0, gps: false },
  { name: "Other", category: "Dance & Others", met: 4.0, gps: false },
];

export function findActivity(name: string): SportActivity | undefined {
  return ACTIVITIES.find((a) => a.name === name);
}

/** Estimate calories burned. Falls back to a 70kg adult if no weight given. */
export function estimateCalories(met: number, minutes: number, weightKg?: number | null): number {
  const w = weightKg && weightKg > 0 ? weightKg : 70;
  return Math.round((met * 3.5 * w) / 200 * minutes);
}
