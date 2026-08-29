export interface Athlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city: string;
  country: string;
  profile_medium: string;
  profile: string;
  bio?: string;
  follower_count?: number;
  friend_count?: number;
}

export interface ActivityMap {
  id: string;
  summary_polyline: string;
  resource_state?: number;
}

export interface Activity {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  total_elevation_gain: number; // in meters
  type: string;
  sport_type: string;
  start_date: string; // ISO format
  start_date_local: string;
  timezone: string;
  average_speed: number; // in m/s
  max_speed: number; // in m/s
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories: number;
  gear_id?: string;
  map?: ActivityMap;
  suffer_score?: number;
  has_heartrate?: boolean;
  pr_count?: number;
  device_name?: string;
  elev_high?: number;
  elev_low?: number;
}

export interface GearItem {
  id: string;
  primary: boolean;
  name: string;
  nickname?: string;
  distance: number; // in meters
  brand_name?: string;
  model_name?: string;
  description?: string;
  image_url?: string;
  max_distance_km?: number; // default 800km recommended
  retired?: boolean;
}

export interface StravaStats {
  all_run_totals: {
    count: number;
    distance: number; // meters
    moving_time: number; // seconds
    elevation_gain: number; // meters
    calories?: number;
  };
  ytd_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
  recent_run_totals?: {
    count: number;
    distance: number;
    moving_time: number;
    elevation_gain: number;
  };
}

export interface RecordItem {
  rank: number;
  timeFormatted: string;
  timeSeconds: number;
  activityName: string;
  activityId: number;
  date: string;
  distanceKm: number;
  paceFormatted: string;
}

export interface StravaDataset {
  last_updated: string;
  athlete: Athlete;
  stats: StravaStats;
  gear: GearItem[];
  activities: Activity[];
  records?: {
    top5k: RecordItem[];
    top10k: RecordItem[];
    top15k: RecordItem[];
  };
}
