// src/types/pinya.ts

export type Member = {
  nickname: string;
  passwordHash?: string;
  name?: string;
  surname?: string;
  position?: string | null; // e.g., "Baix", "Crossa", "Vent"
  missingPosition?: boolean; // true if position is empty
};

export type PinyaPosition = {
  id: string;
  label: string;
  x: number;
  y: number;
  rotation?: number;
  member?: Member; // assigned member
};

export type PinyaLayout = {
  id: string;
  name: string;
  folder?: string;      // optional
  castellType: string;
  positions: {
    id: string;
    label: string;
    x: number;
    y: number;
    member?: Member;
    rotation?: number;
  }[];
};
