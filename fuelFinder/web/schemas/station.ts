export type Station = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  latest_price?: number | null;
  recorded_at?: string;
  prices?: { price: number; recorded_at: string }[];
};
