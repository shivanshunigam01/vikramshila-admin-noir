// src/services/reportsService.ts
import axiosInstance from "@/api/axiosInstance";

const API_URL = import.meta.env.VITE_API_URL as string;

export type Granularity = "day" | "week" | "month" | "year";

/* ---------------------- Response row types ---------------------- */
export type EnquiryRow = {
  timeBucket: string; // ISO string bucket
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
  totalProfit: number;
  avgProfit: number;
};

export type MovementPolyline = {
  success: boolean;
  points: [number, number][];
  count: number;
};

export type MovementSummaryRow = { timeBucket: string; pings: number };

export type ReportsGeoJSON = { type: "FeatureCollection"; features: any[] };

export type FiltersPayload = {
  branches: string[];
  dses: { id: string; name: string }[];
  segments: string[];
  models: string[];
};

/* ---------------------- Helpers ---------------------- */
const authHeader = () => {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const get = async <T,>(url: string, params?: Record<string, any>) => {
  const res = await axiosInstance.get<T>(`${API_URL}${url}`, {
    params,
    headers: authHeader(),
    responseType: "json",
  });
  // @ts-ignore
  return (res.data?.data ?? res.data) as T;
};

const getCSV = async (url: string, params?: Record<string, any>) => {
  const res = await axiosInstance.get(`${API_URL}${url}`, {
    params: { ...(params || {}), format: "csv" },
    headers: authHeader(),
    responseType: "blob",
  });
  return res.data as Blob;
};

/* ---------------------- API wrapper ---------------------- */
export const ReportsAPI = {
  filters: () => get<FiltersPayload>(`/reports/filters`),

  enquiries: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
    dseId?: string;
    status?: string;
    source?: string;
  }) => get<EnquiryRow[]>(`/reports/enquiries`, params),
  enquiriesCSV: (params: any) => getCSV(`/reports/enquiries`, params),

  conversions: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
    dseId?: string;
  }) => get<ConversionRow[]>(`/reports/conversions`, params),
  conversionsCSV: (params: any) => getCSV(`/reports/conversions`, params),

  salesC3: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
    dseId?: string;
    segment?: string;
    model?: string;
  }) => get<SalesRow[]>(`/reports/sales-c3`, params),
  salesC3CSV: (params: any) => getCSV(`/reports/sales-c3`, params),

  costing: (params: {
    granularity?: Granularity;
    from?: string;
    to?: string;
    branchId?: string;
  }) => get<CostingRow[]>(`/reports/internal-costing`, params),
  costingCSV: (params: any) => getCSV(`/reports/internal-costing`, params),

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
  movementSummaryCSV: (params: any) =>
    getCSV(`/reports/dse/movement/summary`, params),

  // DSE ping ingestion
  postPing: (body: {
    userId: string;
    lat: number;
    lng: number;
    speed?: number;
    accuracy?: number;
    deviceId?: string;
  }) =>
    axiosInstance.post(`${API_URL}/reports/dse/ping`, body, {
      headers: authHeader(),
    }),
};

/* ---------------------- Blob Save Utility ---------------------- */
export const saveBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
