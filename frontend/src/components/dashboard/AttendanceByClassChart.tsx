import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AttendanceByClassData {
  name: string;
  value: number;
  color: string;
}

interface AttendanceByClassChartProps {
  data: AttendanceByClassData[];
}

const AttendanceByClassChart = ({ data }: AttendanceByClassChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Taux de présence']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AttendanceByClassChart;
