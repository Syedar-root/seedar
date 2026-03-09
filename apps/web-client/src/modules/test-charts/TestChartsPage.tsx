import { LineChart, BarChart, PieChart } from '@seedar/ui-react';

const lineData = [
  { month: '1月', sales: 120 },
  { month: '2月', sales: 200 },
  { month: '3月', sales: 150 },
  { month: '4月', sales: 280 },
  { month: '5月', sales: 190 },
];

const barData = [
  { category: 'A', value: 100 },
  { category: 'B', value: 200 },
  { category: 'C', value: 150 },
  { category: 'D', value: 280 },
];

const pieData = [
  { category: '苹果', value: 400 },
  { category: '香蕉', value: 300 },
  { category: '橙子', value: 200 },
  { category: '葡萄', value: 150 },
];

export function TestChartsPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>图表组件测试</h1>
      
      <div style={{ marginBottom: 40 }}>
        <h2>折线图</h2>
        <LineChart
          data={lineData}
          xField="month"
          yField="sales"
          seriesName="销量"
          width={600}
          height={300}
        />
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2>柱状图</h2>
        <BarChart
          data={barData}
          xField="category"
          yField="value"
          seriesName="数值"
          width={600}
          height={300}
        />
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2>饼图</h2>
        <PieChart
          data={pieData}
          categoryField="category"
          valueField="value"
          width={400}
          height={300}
        />
      </div>
    </div>
  );
}
