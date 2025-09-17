// src/services/reportsService.ts
// Client services for all Reports APIs

import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL as string;

/* ------------------------------ Types ------------------------------ */
export type Granularity = "day" | "week" | "month" | "year";

export type EnquiryRow = {
  timeBucket: string; // ISO
  branch?: string | null;
  dseId?: string | null;
  status?: "C0" | "C1" | "C2" | "C3";
  source?: string | null;
  count: number;
};

export type ConversionRow = {
  timeBucket: string; // ISO
  branch?: string | null;
  dseId?: string | null;
  byStage: Partial<Record<"C0" | "C1" | "C2" | "C3", number>>;
  total: number;
  conversionC0toC3: number; // %
};

export type SalesRow = {
  timeBucket: string;
  branch?: string | null;
  dseId?: string | null;
  segment?: string | null;
  model?: string | null;
  units: number;
};

export type CostingRow = {
  timeBucket: string;
  branch?: string | null;
  vehicles: number;
  totalExShowroom: number;
  totalAdders: number;
  totalEarnings: number;
  totalNetDealerCost: number;
  totalQuoted: number;
  totalProfit: number;
  avgProfit: number;
};

export type MovementPolyline = {
  success: boolean;
  points: [number, number][];
  count: number;
};
export type MovementSummaryRow = { timeBucket: string; pings: number };

// Keep GeoJSON loose to avoid requiring @types/geojson in your app
export type ReportsGeoJSON = { type: "FeatureCollection"; features: any[] };

/* ------------------------------ Helpers ------------------------------ */
const authHeader = () => {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const get = async <T,>(url: string, params?: Record<string, any>) => {
  const res = await axiosInstance.get<T>(`${API_URL}${url}`, {
    params,
    headers: authHeader(),
  });
  // @ts-ignore
  return (res.data?.data ?? res.data) as T;
};

const post = async <T,>(url: string, body?: any) => {
  const res = await axiosInstance.post<T>(`${API_URL}${url}`, body, {
    headers: authHeader(),
  });
  // @ts-ignore
  return (res.data?.data ?? res.data) as T;
};

/* ------------------------------ Services ------------------------------ */
export const ReportsAPI = {
  enquiries: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
    dseId?: string;
    status?: string;
    source?: string;
  }) => get<EnquiryRow[]>(`/reports/enquiries`, params),

  conversions: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
    dseId?: string;
  }) => get<ConversionRow[]>(`/reports/conversions`, params),

  salesC3: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
    dseId?: string;
    segment?: string;
    model?: string;
  }) => get<SalesRow[]>(`/reports/sales-c3`, params),

  costing: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
  }) => get<CostingRow[]>(`/reports/internal-costing`, params),

  movementPolyline: (params: {
    userId: string;
    date?: string;
    from?: string;
    to?: string;
  }) => get<MovementPolyline>(`/reports/dse/movement/polyline`, params),

  movementGeoJSON: (params: {
    userId: string;
    date?: string;
    from?: string;
    to?: string;
  }) => get<ReportsGeoJSON>(`/reports/dse/movement/geojson`, params),

  movementSummary: (params: {
    userId: string;
    granularity?: Granularity;
    from?: string;
    to?: string;
  }) => get<MovementSummaryRow[]>(`/reports/dse/movement/summary`, params),

  // Ingest ping from device
  postPing: (body: {
    userId: string;
    lat: number;
    lng: number;
    speed?: number;
    accuracy?: number;
    deviceId?: string;
  }) => post(`/reports/dse/ping`, body),
};
