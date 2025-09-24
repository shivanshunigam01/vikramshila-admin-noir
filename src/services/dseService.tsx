import axios from "axios";

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_VITE_API_URL;

export interface AllDSEPoint {
  _id: string;
  user: string;
  lat: number;
  lon: number;
  ts: string;
  acc?: number;
  speed?: number;
  dseName: string;
  dsePhone: string;
}

export const getAllDSELatest = async (activeWithinMinutes?: number) => {
  const url = `${API}/tracking/latest-all-with-dse${
    activeWithinMinutes ? `?activeWithinMinutes=${activeWithinMinutes}` : ""
  }`;
  const { data } = await axios.get<AllDSEPoint[]>(url, {
    withCredentials: true,
  });
  return data;
};

export const exportOneDSECSV = (id: string, from?: string, to?: string) => {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const href = `${API}/tracking/export/dse/${id}.csv${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  window.open(href, "_blank");
};

// Reports
export type ReportAttendanceRow = {
  dseId: string;
  name: string;
  phone: string;
  present: boolean;
  first: string | null;
  last: string | null;
  pings: number;
  distanceKm: number;
};
export const getAttendance = async (dateISO: string) => {
  const { data } = await axios.get(`${API}/tracking/report/attendance`, {
    params: { date: dateISO },
    withCredentials: true,
  });
  return data as { date: string; rows: ReportAttendanceRow[] };
};
export const csvAttendanceUrl = (dateISO: string) =>
  `${API}/tracking/report/attendance.csv?date=${encodeURIComponent(dateISO)}`;

export type SummaryBucket = {
  key: string;
  first: string | null;
  last: string | null;
  pings: number;
  distanceKm: number;
};
export type SummaryAllRow = {
  dseId: string;
  name: string;
  phone: string;
  buckets: SummaryBucket[];
};
export const getSummaryAll = async (
  fromISO: string,
  toISO: string,
  bucket: "day" | "week" | "month"
) => {
  const { data } = await axios.get(`${API}/tracking/report/summary`, {
    params: { from: fromISO, to: toISO, bucket },
    withCredentials: true,
  });
  return data as {
    from: string;
    to: string;
    bucket: string;
    rows: SummaryAllRow[];
  };
};
export const getSummaryForDSE = async (
  id: string,
  fromISO: string,
  toISO: string,
  bucket: "day" | "week" | "month"
) => {
  const { data } = await axios.get(`${API}/tracking/report/summary/${id}`, {
    params: { from: fromISO, to: toISO, bucket },
    withCredentials: true,
  });
  return data as {
    dseId: string;
    name: string;
    phone: string;
    from: string;
    to: string;
    bucket: string;
    buckets: SummaryBucket[];
  };
};
export const csvSummaryAllUrl = (
  fromISO: string,
  toISO: string,
  bucket: "day" | "week" | "month"
) =>
  `${API}/tracking/report/summary.csv?from=${encodeURIComponent(
    fromISO
  )}&to=${encodeURIComponent(toISO)}&bucket=${bucket}`;
export const csvSummaryOneUrl = (
  id: string,
  fromISO: string,
  toISO: string,
  bucket: "day" | "week" | "month"
) =>
  `${API}/tracking/report/summary/${id}.csv?from=${encodeURIComponent(
    fromISO
  )}&to=${encodeURIComponent(toISO)}&bucket=${bucket}`;

export const csvLatestAllUrl = (activeWithinMinutes?: number) =>
  `${API}/tracking/export/latest-all${
    activeWithinMinutes ? `?activeWithinMinutes=${activeWithinMinutes}` : ""
  }`;
