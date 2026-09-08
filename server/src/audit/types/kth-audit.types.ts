export interface KthPolygon {
  id: string;
  kthName: string;
  areaHa: number;
  color: string;
  coordinates: Array<[number, number]>;
}

export interface KthLog {
  id: string;
  timestamp: string;
  kthName: string;
  action: string;
  detail: string;
  status: string;
}
