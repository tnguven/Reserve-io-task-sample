export type Event = {
  id: string;
  title: string;
  content: string;
  total_seats: number;
  seats?: string[];
};

export type Seat = { score: number; value: string };
