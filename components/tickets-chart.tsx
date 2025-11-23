'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type TicketsPoint = {
  name: string;
  tickets: number;
};

export function TicketsChart({ data }: { data: TicketsPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets Sold</CardTitle>
        <CardDescription>Monthly ticket sales performance</CardDescription>
      </CardHeader>
      <CardContent className="min-h-40">
        {data.length > 15 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="tickets"
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div>
              <h3 className="text-center font-medium">
                Chart Unavailable — Insufficient Data
              </h3>
              <p className="text-muted-foreground text-sm">
                Requires 20+ transactions to display Chart analytics.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
