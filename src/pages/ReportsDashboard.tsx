// src/components/ReportsDashboard.tsx
// Dynamic dark-themed dashboard for all reports

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  CalendarDays,
  LineChart as LineIcon,
  BarChart3,
  PieChart as PieIcon,
  Map as MapIcon, // ✅ rename to avoid shadowing global Map
  RefreshCw,
} from "lucide-react";
import {
  ReportsAPI,
  type EnquiryRow,
  type ConversionRow,
  type SalesRow,
  type CostingRow,
  type MovementSummaryRow,
  type Granularity,
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
import { format, parseISO } from "date-fns";

/* ------------------------------ utils ------------------------------ */
const fmt = (iso?: string) => (iso ? format(parseISO(iso), "dd MMM") : "");

/** Simple 8-week calendar heatmap */
function CalendarHeatmap({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const byDate = new Map<string, number>(
    data.map((d) => [d.date.slice(0, 10), d.value])
  );

  // last 8 weeks ~ 56 days
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
            className={`h-6 w-6 rounded-sm ${shades[intensity]} border border-border`}
            title={`${c.key}: ${c.value}`}
          />
        );
      })}
    </div>
  );
}

/* ---------------------------- main component ---------------------------- */
export default function ReportsDashboard() {
  // Filters
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [from, setFrom] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
  );
  const [to, setTo] = useState<string>(new Date().toISOString());
  const [branchId, setBranchId] = useState<string>("");
  const [dseId, setDseId] = useState<string>("");
  const [segment, setSegment] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [status, setStatus] = useState<string>("all");

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

  /* ------------------------------- Fetch ------------------------------- */
  const loadAll = async () => {
    setLoading(true);
    try {
      const [enq, conv, sal, cost] = await Promise.all([
        ReportsAPI.enquiries({
          granularity,
          from,
          to,
          branchId: branchId || undefined,
          dseId: dseId || undefined,
          status,
        }),
        ReportsAPI.conversions({
          granularity,
          from,
          to,
          branchId: branchId || undefined,
          dseId: dseId || undefined,
        }),
        ReportsAPI.salesC3({
          granularity,
          from,
          to,
          branchId: branchId || undefined,
          dseId: dseId || undefined,
          segment: segment || undefined,
          model: model || undefined,
        }),
        ReportsAPI.costing({
          granularity,
          from,
          to,
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
        from,
        to,
      });
      setMovementSummary(data);
    } finally {
      setLoadingMovement(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity, from, to, branchId, dseId, segment, model, status]);

  useEffect(() => {
    loadMovement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dseId, granularity, from, to]);

  /* ------------------------------ Derived ------------------------------ */
  const enquirySeries = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of enquiries) {
      const k = r.timeBucket.slice(0, 10);
      m.set(k, (m.get(k) || 0) + (r.count || 0));
    }
    return Array.from(m.entries()).map(([date, value]) => ({ date, value }));
  }, [enquiries]);

  const conversionSeries = useMemo(
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

  const salesSeries = useMemo(() => {
    const key = (r: SalesRow) => `${r.timeBucket}|${r.segment ?? "All"}`;
    const acc = new Map<
      string,
      { time: string; segment: string; units: number }
    >();
    for (const r of sales) {
      const k = key(r);
      const prev = acc.get(k);
      if (prev) prev.units += r.units;
      else
        acc.set(k, {
          time: r.timeBucket,
          segment: r.segment || "All",
          units: r.units,
        });
    }
    return Array.from(acc.values());
  }, [sales]);

  const costingSeries = useMemo(
    () =>
      costing.map((r) => ({
        time: r.timeBucket,
        avgProfit: r.avgProfit,
        netDealerCost: r.totalNetDealerCost,
        quoted: r.totalQuoted,
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

  /* ------------------------------ Render ------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reports & Analytics
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card/60 backdrop-blur">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-6">
          <div>
            <Label>Granularity</Label>
            <Select
              value={granularity}
              onValueChange={(v) => setGranularity(v as Granularity)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>From (ISO)</Label>
            <Input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
            />
          </div>
          <div>
            <Label>To (ISO)</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
            />
          </div>

          <div>
            <Label>Branch</Label>
            <Input
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              placeholder="branch id (optional)"
            />
          </div>

          <div>
            <Label>DSE</Label>
            <Input
              value={dseId}
              onChange={(e) => setDseId(e.target.value)}
              placeholder="user id (optional)"
            />
          </div>

          <div>
            <Label>Status (Enquiries)</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger>
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

          <div>
            <Label>Segment (Sales)</Label>
            <Input
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder="e.g. SCV Cargo"
            />
          </div>
          <div>
            <Label>Model (Sales)</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Tata Intra V70"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Enquiries (last 8 wks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap data={enquirySeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LineIcon className="h-4 w-4" />
              Avg Profit (Costing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              ₹
              {(
                costing.reduce((a, c) => a + c.avgProfit, 0) /
                Math.max(1, costing.length)
              ).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across selected window
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total C3 Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {sales.reduce((a, c) => a + (c.units || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All segments/models in view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieIcon className="h-4 w-4" />
              Avg Conv % (C0→C3)
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
            <p className="text-xs text-muted-foreground mt-1">Across buckets</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Conversions */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel by Stage & Conversion</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={conversionSeries}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={fmt} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip labelFormatter={(v) => fmt(String(v))} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="C0" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="C1" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="C2" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="C3" dot={false} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Conv"
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row 2: Sales & Costing */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales (C3 Units) by Segment</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesSeries}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={fmt} />
                <YAxis />
                <Tooltip labelFormatter={(v) => fmt(String(v))} />
                <Legend />
                <Bar dataKey="units" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internal Costing (Avg Profit & Totals)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={costingSeries}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={fmt} />
                <YAxis />
                <Tooltip labelFormatter={(v) => fmt(String(v))} />
                <Legend />
                <Line type="monotone" dataKey="avgProfit" dot={false} />
                <Line type="monotone" dataKey="quoted" dot={false} />
                <Line type="monotone" dataKey="netDealerCost" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie: Source mix (if present in enquiries) */}
      <Card>
        <CardHeader>
          <CardTitle>Enquiry Source Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {(() => {
                const bySrc = new Map<string, number>();
                for (const r of enquiries) {
                  const key = r.source || "unknown";
                  bySrc.set(key, (bySrc.get(key) || 0) + r.count);
                }
                const rows = Array.from(bySrc.entries()).map(
                  ([name, value]) => ({
                    name,
                    value,
                  })
                );
                return (
                  <Pie dataKey="value" data={rows} label outerRadius={100}>
                    {rows.map((_, idx) => (
                      <Cell key={idx} />
                    ))}
                  </Pie>
                );
              })()}
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DSE Movement summary */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            DSE Movement (pings / {granularity})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMovement}
            disabled={!dseId || loadingMovement}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {loadingMovement ? "Loading…" : "Refresh Movement"}
          </Button>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movementSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={fmt} />
              <YAxis />
              <Tooltip labelFormatter={(v) => fmt(String(v))} />
              <Legend />
              <Line type="monotone" dataKey="pings" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {!dseId && (
            <div className="text-xs text-muted-foreground mt-2">
              Enter a DSE (User ID) above to load movement summary. Use the
              GeoJSON endpoint to render the route on your map.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
