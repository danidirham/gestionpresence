import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface AttendanceByDayData {
  day: string;
  present: number;
  absent: number;
}

interface AttendanceByDayChartProps {
  data: AttendanceByDayData[];
}

// Formateur personnalisé pour les tooltips
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const presentValue = payload[0].value;
    const absentValue = payload[1]?.value || 0;
    const total = presentValue + absentValue;
    const presentPercent = total > 0 ? Math.round((presentValue / total) * 100) : 0;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
        <p className="font-semibold text-gray-800 dark:text-white">{label}</p>
        <p className="text-sm text-green-600 dark:text-green-400">
          <span className="font-medium">Présents:</span> {presentValue} ({presentPercent}%)
        </p>
        <p className="text-sm text-red-600 dark:text-red-400">
          <span className="font-medium">Absents:</span> {absentValue} ({100 - presentPercent}%)
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Total:</span> {total}
        </p>
      </div>
    );
  }
  return null;
};

const AttendanceByDayChart = ({ data }: AttendanceByDayChartProps) => {
  // Calculer la valeur maximale pour l'axe Y
  const maxValue = Math.max(
    ...data.map(item => item.present + item.absent)
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        barGap={0}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280' }}
          domain={[0, maxValue > 0 ? 'auto' : 10]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="circle"
        />
        <Bar
          dataKey="present"
          name="Présents"
          fill="#4ade80"
          radius={[4, 4, 0, 0]}
          stackId="a"
        >
          <LabelList
            dataKey="present"
            position="top"
            style={{ fontSize: '12px', fill: '#4ade80' }}
            formatter={(value: number) => (value > 0 ? value : '')}
          />
        </Bar>
        <Bar
          dataKey="absent"
          name="Absents"
          fill="#f87171"
          radius={[4, 4, 0, 0]}
          stackId="a"
        >
          <LabelList
            dataKey="absent"
            position="top"
            style={{ fontSize: '12px', fill: '#f87171' }}
            formatter={(value: number) => (value > 0 ? value : '')}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceByDayChart;
