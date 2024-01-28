interface SkeletonBarChartProps {
    dataSetCount?: number
    barCount?: number
}

export function SkeletonBarChart({ dataSetCount = 2, barCount = 24 }: SkeletonBarChartProps) {
    const barHeights: number[] = [];
    for (let i = 0; i < dataSetCount * barCount; i++) {
        let randomHeight;
        if (i % dataSetCount === 0) {
            // Generate a random height between 5 and 7 for consumption bars
            randomHeight = Math.random() * (7 - 5) + 5;
        } else {
            // Generate a random height between 0 and 0.5 for price bars most of the time
            randomHeight = Math.random() * (0.5 - 0);
            // Occasionally (5% of the time), generate a random height between 0.5 and 4.5
            if (Math.random() < 0.05) {
                randomHeight = 0.5 + Math.random() * (4.5 - 0.5);
            }
        }
        barHeights.push(randomHeight);
    }

    return (
        <div role="status" className="p-4 border border-gray-200 rounded shadow animate-pulse md:p-6 dark:border-gray-700">
            <div className="flex justify-center">
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2.5"></div>
            </div>
            <div className="flex items-baseline mt-4">
                {barHeights.map((height, index) => (
                    <div key={index} style={{ height: `${height}rem` }} className={`w-full bg-gray-200 ${index % 2 === 1 ? 'ms-1' : 'ms-2'} dark:bg-gray-700`}></div>
                ))}
            </div>
            <span className="sr-only">Loading...</span>
        </div>
    );
}
