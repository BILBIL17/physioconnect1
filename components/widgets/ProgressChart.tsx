
import React from 'react';

interface ProgressChartProps {
    data: number[];
    labels: string[];
    target: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data, labels, target }) => {
    const chartHeight = 150;
    const chartWidth = 300; // viewbox width, will scale
    const barPadding = 10;
    const barWidth = (chartWidth - barPadding * (data.length + 1)) / data.length;
    const maxValue = Math.max(target, ...data);

    if (maxValue === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[202px] bg-gray-50 rounded-lg">
                 <h3 className="text-lg font-bold text-center text-[#37474f] mb-2">Weekly Progress</h3>
                <p className="text-[#78909c]">Complete a session to see your chart.</p>
            </div>
        );
    }

    const scaleY = (value: number) => chartHeight - (value / maxValue) * chartHeight;

    return (
        <div>
             <h3 className="text-lg font-bold text-center text-[#37474f] mb-2">Weekly Progress</h3>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} className="w-full h-auto" aria-labelledby="chart-title" role="img">
                <title id="chart-title">Bar chart showing weekly exercise sessions completed.</title>
                {/* Y-axis grid lines and target line */}
                <g className="grid">
                     <line
                        x1="0"
                        y1={scaleY(target)}
                        x2={chartWidth}
                        y2={scaleY(target)}
                        stroke="#00838f"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                    />
                     <text x={chartWidth} y={scaleY(target) - 4} textAnchor="end" fill="#00838f" fontSize="8" fontWeight="bold">Target</text>
                </g>

                {/* Bars and labels */}
                {data.map((value, index) => {
                    const x = barPadding + index * (barWidth + barPadding);
                    const y = scaleY(value);
                    const height = Math.max(0, chartHeight - y);

                    return (
                        <g key={index}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={height}
                                fill="#00bfa5"
                                rx="4"
                                ry="4"
                                className="transition-all duration-300"
                            >
                                <title>{labels[index]}: {value} sessions</title>
                            </rect>
                            <text
                                x={x + barWidth / 2}
                                y={height > 15 ? y + 15 : y - 5}
                                textAnchor="middle"
                                fill={height > 15 ? "white" : "#37474f"}
                                fontSize="10"
                                fontWeight="bold"
                            >
                                {value}
                            </text>
                            <text
                                x={x + barWidth / 2}
                                y={chartHeight + 15}
                                textAnchor="middle"
                                fill="#78909c"
                                fontSize="10"
                            >
                                {labels[index]}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default ProgressChart;
