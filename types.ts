
export interface HistoricalEntity {
  name: string;
  color: string;
  boundaryPoints: [number, number][]; // Simple polygons for visualization
  description: string;
}

export interface HistoryData {
  year: number;
  label: string;
  entities: HistoricalEntity[];
}

export interface MapPosition {
  center: [number, number];
  zoom: number;
}
