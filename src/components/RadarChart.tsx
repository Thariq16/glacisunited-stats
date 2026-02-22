import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarChartProps {
  data: Array<{
    category: string;
    value: number;
    fullMark?: number;
  }>;
  title?: string;
}

const CustomAngleLabel = ({ payload, x, y, cx, cy, ...rest }: any) => {
  const item = payload;
  // Offset label away from center
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = 14;
  const nx = x + (dx / dist) * offset;
  const ny = y + (dy / dist) * offset;

  return (
    <text
      {...rest}
      x={nx}
      y={ny}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-foreground font-semibold"
      fontSize={11}
    >
      {item.value}
    </text>
  );
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        className="fill-primary"
        fontSize={10}
        fontWeight="bold"
      >
        {Math.round(payload.value)}
      </text>
    </g>
  );
};

export function RadarChart({ data, title }: RadarChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
      <ResponsiveContainer width="100%" height={320}>
        <RechartsRadar data={data}>
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <PolarGrid
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={CustomAngleLabel}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#radarGradient)"
            dot={<CustomDot />}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
