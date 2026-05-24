import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const weekdayLabel = (date) => new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(date));

const MoodChart = ({ entries = [] }) => {
  const weeklyEntries = [...entries]
    .filter((entry) => Date.now() - new Date(entry.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const labels = weeklyEntries.length ? weeklyEntries.map((entry) => weekdayLabel(entry.createdAt)) : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const scores = weeklyEntries.length ? weeklyEntries.map((entry) => entry.moodScore) : [3, 3, 3, 3, 3];

  const data = {
    labels,
    datasets: [
      {
        label: "Mood score",
        data: scores,
        borderColor: "#8FAF9B",
        backgroundColor: "rgba(143, 175, 155, 0.18)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#26332F",
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};

export default MoodChart;
