import { useEffect, useState } from "react";




export default function Loader({ loadingDone, onFinish }) {
  const [percent, setPercent] = useState(0);
  const [animDone, setAnimDone] = useState(false);




  useEffect(() => {
    const maxDuration = 3200;    // total animation time
    const minDuration = 880;

    const duration = Math.floor(Math.random() * (maxDuration - minDuration) + minDuration);



    const start = Date.now();

    // 1) drive the percent value
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.min((elapsed / duration) * 100, 100);
      setPercent(next);
    }, 50);

    // 2) mark animation as done after exactly maxDuration
    const animTimer = setTimeout(() => {
      setPercent(100);
      setAnimDone(true);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(animTimer);
    };
  }, []);

  // 3) when *both* the animation and data are done, fire onFinish once
  useEffect(() => {
    if (animDone && loadingDone) {
      // tiny pause so user sees the bar at 100%
      const finishTimer = setTimeout(onFinish, 100);
      return () => clearTimeout(finishTimer);
    }
  }, [animDone, loadingDone, onFinish]);

  // 4) stay visible until both percent=100 & loadingDone
  if (percent === 100 && loadingDone) return null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-purple-700 transition-all duration-50"
          style={{ width: `${percent}%` }}
        />
      </div>
      
      {/* <p className="text-gray-700">Loading… {Math.floor(percent)}%</p> */}

      <p className="text-gray-700">
        {Math.floor(percent) <= 20
          ? "Initializing..."
          : Math.floor(percent) <= 68
          ? "Loading Data..."
          : "Rendering Opportunities..."}{" "}
        {Math.floor(percent)}%
      </p>


    </div>
  );
}
