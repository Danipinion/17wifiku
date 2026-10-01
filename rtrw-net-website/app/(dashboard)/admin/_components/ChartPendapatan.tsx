// app/(dashboard)/admin/_components/ChartPendapatan.tsx
"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type ChartData = {
  name: string;
  Total: number;
};

export function ChartPendapatan({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              `Rp${new Intl.NumberFormat("id-ID").format(value as number)}`
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#cbd5e1" }}
            formatter={(value) => [
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(value as number),
              "Total",
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Total"
            stroke="#3b82f6"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="Total Pendapatan"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
