import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Thứ 2', count: 400 },
  { name: 'Thứ 3', count: 300 },
  { name: 'Thứ 4', count: 600 },
  { name: 'Thứ 5', count: 800 },
  { name: 'Thứ 6', count: 500 },
  { name: 'Thứ 7', count: 900 },
  { name: 'CN', count: 1100 },
];

const Charts = () => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3>Thống kê số lượng bản tin thu thập</h3>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#1890ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;