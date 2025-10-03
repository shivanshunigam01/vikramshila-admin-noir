// src/pages/ReportsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import {
  CalendarDays,
  LineChart as LineIcon,
  BarChart3,
  PieChart as PieIcon,
  Map as MapIcon,
  RefreshCw,
  Download as DownloadIcon,
  Filter as FilterIcon,
  CalendarRange,
} from "lucide-react";
import {
  ReportsAPI,
  type EnquiryRow,
  type ConversionRow,
  type SalesRow,
  type CostingRow,
  type MovementSummaryRow,
  type Granularity,
  saveBlob,
  type FiltersPayload,
} from "@/services/reportsService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO, lastDayOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

/* ------------------- Utils ------------------- */
const fmt = (iso?: string) => {
  if (!iso) return "";
  const d = typeof iso === "string" ? parseISO(iso) : new Date(iso);
  return format(d, "dd MMM");
};

function CalendarHeatmap({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const byDate = new Map<string, number>(
    data.map((d) => [d.date.slice(0, 10), d.value])
  );
  const today = new Date();
  const cells: { key: string; value: number }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, value: byDate.get(key) || 0 });
  }
  return (
    <div className="grid grid-cols-8 gap-1">
      {cells.map((c) => {
        const intensity = c.value === 0 ? 0 : Math.ceil((c.value / max) * 4);
        const shades = [
          "bg-muted",
          "bg-blue-900/30",
          "bg-blue-900/50",
          "bg-blue-900/70",
          "bg-blue-900",
        ];
        return (
          <div
            key={c.key}
            className={cn("h-6 w-6 rounded-sm border", shades[intensity])}
            title={`${c.key}: ${c.value}`}
          />
        );
      })}
    </div>
  );
}

/* ----- Select helpers ----- */
const ALL = "__all__";
const toSelectValue = (v: string) => (v && v.length ? v : ALL);
const fromSelectValue = (v: string) => (v === ALL ? "" : v);
const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#e11d48",
  "#0ea5e9",
];

/* ----- Date helpers for month/year pickers (Week REMOVED) ----- */
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => String(currentYear - i)); // last 12 years
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  idx: i, // 0..11
  label: format(new Date(2024, i, 1), "MMM"), // static year just for label
}));

function setYearRange(y: number): DateRange {
  const from = new Date(y, 0, 1);
  const to = new Date(y, 11, 31);
  return { from, to };
}
function setMonthRange(y: number, m0: number): DateRange {
  const from = new Date(y, m0, 1);
  const to = lastDayOfMonth(from);
  return { from, to };
}

/* ------------------- Component ------------------- */
export default function ReportsPage() {
  // Filters
  const [granularity, setGranularity] = useState<Granularity>("day");
  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(today.getDate() - 29);
  const [range, setRange] = useState<DateRange | undefined>({
    from: thirtyAgo,
    to: today,
  });

  // If somehow "week" was persisted, coerce to "day"
  useEffect(() => {
    if (granularity === "week") {
      setGranularity("day" as Granularity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromDate = useMemo(
    () => (range?.from ? format(range.from, "yyyy-MM-dd") : ""),
    [range?.from]
  );
  const toDate = useMemo(
    () => (range?.to ? format(range.to, "yyyy-MM-dd") : fromDate),
    [range?.to, fromDate]
  );

  const [branchId, setBranchId] = useState<string>("");
  const [dseId, setDseId] = useState<string>("");
  const [segment, setSegment] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("");

  const [filters, setFilters] = useState<FiltersPayload | null>(null);

  // Data
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [costing, setCosting] = useState<CostingRow[]>([]);
  const [movementSummary, setMovementSummary] = useState<MovementSummaryRow[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [loadingMovement, setLoadingMovement] = useState(false);

  /* ----- Robust local start/end-of-day → ISO (fix day-wise range) ----- */
  const toLocalStartISO = (d?: string) => {
    if (!d) return undefined;
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt.toISOString();
  };
  const toLocalEndISO = (d?: string) => {
    if (!d) return undefined;
    const dt = new Date(d);
    dt.setHours(23, 59, 59, 999);
    return dt.toISOString();
  };

  const fromISO = toLocalStartISO(fromDate);
  const toISO = toLocalEndISO(toDate);

  /* ------------------- Fetch ------------------- */
  const loadFilters = async () => {
    try {
      const data = await ReportsAPI.filters();
      const cleaned: FiltersPayload = {
        branches: (data.branches || []).filter((b) => !!b),
        dses: (data.dses || []).filter((u) => !!u?.id),
        segments: (data.segments || []).filter((s) => !!s),
        models: (data.models || []).filter((m) => !!m),
      };
      setFilters(cleaned);
    } catch {
      setFilters({ branches: [], dses: [], segments: [], models: [] });
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [enq, conv, sal, cost] = await Promise.all([
        ReportsAPI.enquiries({
          granularity,
          from: fromISO,
          to: toISO,
          branchId: branchId || undefined,
          dseId: dseId || undefined,
          status,
          source: source || undefined,
        }),
        ReportsAPI.conversions({
          granularity,
          from: fromISO,
          to: toISO,
          branchId: branchId || undefined,
          dseId: dseId || undefined,
        }),
        ReportsAPI.salesC3({
          granularity,
          from: fromISO,
          to: toISO,
          branchId: branchId || undefined,
          dseId: dseId || undefined,
          segment: segment || undefined,
          model: model || undefined,
        }),
        ReportsAPI.costing({
          granularity,
          from: fromISO,
          to: toISO,
          branchId: branchId || undefined,
        }),
      ]);
      setEnquiries(enq);
      setConversions(conv);
      setSales(sal);
      setCosting(cost);
    } finally {
      setLoading(false);
    }
  };

  const loadMovement = async () => {
    if (!dseId) {
      setMovementSummary([]);
      return;
    }
    setLoadingMovement(true);
    try {
      const data = await ReportsAPI.movementSummary({
        userId: dseId,
        granularity,
        from: fromISO,
        to: toISO,
      });
      setMovementSummary(data);
    } finally {
      setLoadingMovement(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);
  useEffect(() => {
    loadAll();
  }, [
    granularity,
    fromDate,
    toDate,
    branchId,
    dseId,
    segment,
    model,
    status,
    source,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);
  useEffect(() => {
    loadMovement();
  }, [dseId, granularity, fromDate, toDate]); // eslint-disable-line

  /* When changing granularity to month/year, normalize the range to a clean month/year window */
  useEffect(() => {
    if (!range?.from) return;
    if (granularity === "month") {
      const y = range.from.getFullYear();
      const m0 = range.from.getMonth();
      setRange(setMonthRange(y, m0));
    } else if (granularity === "year") {
      const y = range.from.getFullYear();
      setRange(setYearRange(y));
    }
    // For "day" we keep the explicit day-range as selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  /* ------------------- Derived Data ------------------- */
  const enquirySeries = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of enquiries) {
      const k = r.timeBucket.slice(0, 10);
      m.set(k, (m.get(k) || 0) + (r.count || 0));
    }
    return Array.from(m.entries()).map(([date, value]) => ({ date, value }));
  }, [enquiries]);

  const enquiryStatusPie = useMemo(() => {
    const by: Record<string, number> = {};
    for (const r of enquiries) {
      const k = r.status || "Unknown";
      by[k] = (by[k] || 0) + (r.count || 0);
    }
    return Object.entries(by).map(([name, value]) => ({ name, value }));
  }, [enquiries]);

  const sourceOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of enquiries) {
      if (r.source) s.add(String(r.source));
    }
    return Array.from(s.values()).sort();
  }, [enquiries]);

  const conversionsLine = useMemo(
    () =>
      conversions.map((r) => ({
        time: r.timeBucket,
        C0: r.byStage?.C0 || 0,
        C1: r.byStage?.C1 || 0,
        C2: r.byStage?.C2 || 0,
        C3: r.byStage?.C3 || 0,
        Conv: r.conversionC0toC3 || 0,
      })),
    [conversions]
  );

  const latestConversionPie = useMemo(() => {
    if (!conversions.length) return [] as { name: string; value: number }[];
    const last = conversions[conversions.length - 1];
    const by = last.byStage || {};
    return ["C0", "C1", "C2", "C3"].map((k) => ({
      name: k,
      value: (by as any)[k] || 0,
    }));
  }, [conversions]);

  const salesSeries = useMemo(
    () =>
      sales.map((r) => ({
        time: r.timeBucket,
        segment: r.segment || "All",
        units: r.units,
      })),
    [sales]
  );

  const salesBySegmentPie = useMemo(() => {
    const by: Record<string, number> = {};
    for (const r of sales) {
      const seg = r.segment || "All";
      by[seg] = (by[seg] || 0) + (r.units || 0);
    }
    return Object.entries(by).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const costingSeries = useMemo(
    () =>
      costing.map((r) => ({
        time: r.timeBucket,
        avgProfit: r.avgProfit,
        totalProfit: r.totalProfit,
        totalExShowroom: r.totalExShowroom,
        vehicles: r.vehicles,
      })),
    [costing]
  );

  const movementSeries = useMemo(
    () =>
      movementSummary.map((r) => ({
        time: r.timeBucket,
        pings: r.pings,
      })),
    [movementSummary]
  );

  /* ------------------- Downloads ------------------- */
  const downloadCSV = async (
    kind: "enq" | "conv" | "sales" | "cost" | "move" | "all"
  ) => {
    const common = {
      granularity,
      from: fromISO,
      to: toISO,
      branchId: branchId || undefined,
    };
    const safe = (s: string) => s || "NA";
    const name = (base: string) =>
      `${base}_${safe(fromDate)}_${safe(toDate)}_${granularity}.csv`.replace(
        /\s+/g,
        "_"
      );

    if (kind === "all") {
      await downloadCSV("enq");
      await downloadCSV("conv");
      await downloadCSV("sales");
      await downloadCSV("cost");
      if (dseId) await downloadCSV("move");
      return;
    }

    if (kind === "enq") {
      const blob = await ReportsAPI.enquiriesCSV({
        ...common,
        dseId: dseId || undefined,
        status,
        source: source || undefined,
      });
      return saveBlob(blob, name("enquiries"));
    }
    if (kind === "conv") {
      const blob = await ReportsAPI.conversionsCSV({
        ...common,
        dseId: dseId || undefined,
      });
      return saveBlob(blob, name("conversions"));
    }
    if (kind === "sales") {
      const blob = await ReportsAPI.salesC3CSV({
        ...common,
        dseId: dseId || undefined,
        segment: segment || undefined,
        model: model || undefined,
      });
      return saveBlob(blob, name("sales_c3"));
    }
    if (kind === "cost") {
      const blob = await ReportsAPI.costingCSV(common);
      return saveBlob(blob, name("internal_costing"));
    }
    if (kind === "move") {
      if (!dseId) return;
      const blob = await ReportsAPI.movementSummaryCSV({
        userId: dseId,
        granularity,
        from: fromISO,
        to: toISO,
      });
      return saveBlob(blob, name("dse_movement"));
    }
  };

  const clearAll = () => {
    setBranchId("");
    setDseId("");
    setSegment("");
    setModel("");
    setStatus("all");
    setSource("");
  };

  /* ------------------- UI ------------------- */
  return (
    <div className="space-y-6">
      {/* 🔹 Filters bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FilterIcon className="h-4 w-4" />
              <span>Report Filters</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV("all")}
              >
                <DownloadIcon className="h-4 w-4 mr-2" /> Export all CSV
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAll}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Filters grid */}
          <div className="grid gap-3 md:grid-cols-12">
            {/* Granularity */}
            <div>
              <Label className="text-xs">Granularity</Label>
              <Select
                value={granularity}
                onValueChange={(v) => setGranularity(v as Granularity)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  {/* Week removed */}
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range (granularity-aware; Week removed) */}
            <div className="md:col-span-3">
              <Label className="text-xs">Date Range</Label>

              {granularity === "year" ? (
                // Year-only selector
                <Select
                  value={
                    range?.from
                      ? format(range.from, "yyyy")
                      : String(currentYear)
                  }
                  onValueChange={(year) => {
                    const y = parseInt(year, 10);
                    setRange(setYearRange(y));
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : granularity === "month" ? (
                // Month + Year selectors
                <div className="flex gap-2">
                  <Select
                    value={
                      range?.from
                        ? format(range.from, "yyyy")
                        : String(currentYear)
                    }
                    onValueChange={(year) => {
                      const y = parseInt(year, 10);
                      const m0 = range?.from
                        ? range.from.getMonth()
                        : new Date().getMonth();
                      setRange(setMonthRange(y, m0));
                    }}
                  >
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      range?.from
                        ? String(range.from.getMonth())
                        : String(new Date().getMonth())
                    }
                    onValueChange={(m) => {
                      const m0 = parseInt(m, 10);
                      const y = range?.from
                        ? range.from.getFullYear()
                        : currentYear;
                      setRange(setMonthRange(y, m0));
                    }}
                  >
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(({ idx, label }) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // Day: default range calendar
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-9 font-normal"
                    >
                      <CalendarRange className="mr-2 h-4 w-4" />
                      {fromDate && toDate ? (
                        <span>
                          {format(parseISO(fromDate), "dd MMM yyyy")} –{" "}
                          {format(parseISO(toDate), "dd MMM yyyy")}
                        </span>
                      ) : (
                        <span>Select dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="range"
                      numberOfMonths={2}
                      selected={range}
                      onSelect={setRange}
                      defaultMonth={range?.from}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Branch */}
            <div className="md:col-span-2">
              <Label className="text-xs">Branch</Label>
              <Select
                value={toSelectValue(branchId)}
                onValueChange={(v) => setBranchId(fromSelectValue(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {(filters?.branches || []).map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DSE */}
            <div className="md:col-span-2">
              <Label className="text-xs">DSE</Label>
              <Select
                value={toSelectValue(dseId)}
                onValueChange={(v) => setDseId(fromSelectValue(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All DSEs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {(filters?.dses || []).map((u) => (
                    <SelectItem key={String(u.id)} value={String(u.id)}>
                      {u.name || String(u.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Segment */}
            <div>
              <Label className="text-xs">Segment (Sales)</Label>
              <Select
                value={toSelectValue(segment)}
                onValueChange={(v) => setSegment(fromSelectValue(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {(filters?.segments || []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <Label className="text-xs">Model (Sales)</Label>
              <Select
                value={toSelectValue(model)}
                onValueChange={(v) => setModel(fromSelectValue(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {(filters?.models || []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs">Status (Enquiries)</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="all" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="C0">C0</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="C3">C3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div>
              <Label className="text-xs">Source (Enquiries)</Label>
              <Select
                value={toSelectValue(source)}
                onValueChange={(v) => setSource(fromSelectValue(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {sourceOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 KPI Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Enquiries (8wks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap data={enquirySeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <LineIcon className="h-4 w-4" />
              Avg Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              ₹
              {(
                costing.reduce((a, c) => a + (c.avgProfit || 0), 0) /
                Math.max(1, costing.length)
              ).toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total C3 Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {sales.reduce((a, c) => a + (c.units || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieIcon className="h-4 w-4" />
              Avg Conv %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {(
                conversions.reduce((a, c) => a + (c.conversionC0toC3 || 0), 0) /
                Math.max(1, conversions.length)
              ).toFixed(1)}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Enquiries */}
      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Enquiries</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCSV("enq")}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-[320px]">
            <ResponsiveContainer>
              <BarChart data={enquirySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmt} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={enquiryStatusPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {enquiryStatusPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Conversions */}
      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Lead Funnel</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCSV("conv")}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-[320px]">
            <ResponsiveContainer>
              <LineChart data={conversionsLine}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={fmt} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="C0" />
                <Line type="monotone" dataKey="C1" />
                <Line type="monotone" dataKey="C2" />
                <Line type="monotone" dataKey="C3" />
                <Line type="monotone" dataKey="Conv" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={latestConversionPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {latestConversionPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Sales */}
      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Sales (C3 Units)</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCSV("sales")}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-[320px]">
            <ResponsiveContainer>
              <BarChart data={salesSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={fmt} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="units" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={salesBySegmentPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {salesBySegmentPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Costing */}
      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle>Internal Costing</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCSV("cost")}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer>
            <LineChart data={costingSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={fmt} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgProfit" />
              <Line type="monotone" dataKey="totalProfit" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 🔹 Movement */}
      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle className="flex gap-2">
            <MapIcon className="h-4 w-4" />
            DSE Movement
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!dseId}
              onClick={() => downloadCSV("move")}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadMovement}
              disabled={!dseId || loadingMovement}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loadingMovement ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer>
            <LineChart data={movementSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={fmt} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pings" />
            </LineChart>
          </ResponsiveContainer>
          {!dseId && (
            <div className="text-xs text-muted-foreground mt-2">
              Select a DSE above to view movement
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
