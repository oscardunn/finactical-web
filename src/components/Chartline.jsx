import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function ChartLine({ labels, data, title }) {
  const cfg = {
    labels,
    datasets: [
      {
        label: title || "Series",
        data,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
      },
    ],
  };
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { maxRotation: 0 } } },
  };
  return (
    <div className="h-72">
      <Line data={cfg} options={opts} />
    </div>
  );
}
