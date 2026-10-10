"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * 趋势折线图（Recharts 封装，移动端自适应）
 */
export default function TrendChart({
  data,
  dataKey,
  color = "var(--color-brand)",
  unit = "",
  height = 200,
  yDomain,
}: {
  data: { [k: string]: string | number }[];
  dataKey: string;
  color?: string;
  unit?: string;
  height?: number;
  yDomain?: [number | "auto", number | "auto"];
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ececee" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={{ stroke: "#ececee" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            domain={yDomain ?? ["auto", "auto"]}
            width={44}
          />
          <Tooltip
            formatter={(v) => [`${v ?? "--"} ${unit}`, ""] as [string, string]}
            contentStyle={{ borderRadius: 12, border: "1px solid #ececee", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.2}
            dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
