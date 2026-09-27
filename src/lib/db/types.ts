import { Constraints, Flat, Person } from "@/lib/types";

export interface Db {
  getConstraints(person: Person): Promise<Constraints | null>;
  setConstraints(constraints: Constraints): Promise<void>;
  getAllConstraints(): Promise<Partial<Record<Person, Constraints>>>;
  listFlats(): Promise<Flat[]>;
  addFlat(flat: Flat): Promise<void>;
  deleteFlat(id: string): Promise<void>;
}
