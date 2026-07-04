import type { MapConfig, MapId } from "../types";
import { OUTPOST_MAP } from "./outpost";
import { HOSPITAL_MAP } from "./hospital";

export const MAPS: Record<MapId, MapConfig> = {
  outpost: OUTPOST_MAP,
  hospital: HOSPITAL_MAP,
};

export function getMapConfig(id: MapId): MapConfig {
  return MAPS[id];
}

export function getAllMaps(): MapConfig[] {
  return Object.values(MAPS);
}
