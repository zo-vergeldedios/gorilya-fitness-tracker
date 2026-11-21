import { useEffect, useRef, useState } from "react";

function getEndTime(seconds) {
  return Date.now() + seconds * 1000;
}

function getRemainingSeconds(endTime) {
  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const endTime = useRef(null);
  const interval = useRef(null);
  const isRunningRef = useRef(false);

  const stopTimer = () => {
    clearInterval(interval.current);
    interval.current = null;
    isRunningRef.current = false;
  };

  const updateRemaining = () => {
    if (!endTime.current) return;

    const remaining = getRemainingSeconds(endTime.current);
    setSecondsLeft(remaining);

    if (remaining === 0) {
      stopTimer();
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunningRef.current) {
        const remaining = getRemainingSeconds(endTime.current);
        setSecondsLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval.current);
          interval.current = null;
          isRunningRef.current = false;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval.current);
    };
  }, []);

  const startTimer = () => {
    if (isRunningRef.current || secondsLeft === 0) return;

    clearInterval(interval.current);
    const remaining = Math.max(0, secondsLeft - 1);
    endTime.current = getEndTime(remaining);
    setSecondsLeft(remaining);
    isRunningRef.current = true;
    interval.current = setInterval(updateRemaining, 250);
  };

  const resetTimer = () => {
    stopTimer();
    endTime.current = null;
    setSecondsLeft(60);
  };

  const addThirtySeconds = () => {
    if (isRunningRef.current) {
      endTime.current = Math.min(endTime.current + 30000, Date.now() + 600000);
      updateRemaining();
      return;
    }

    setSecondsLeft(Math.min(600, secondsLeft + 30));
  };

  return (
    <section className="rest-timer" aria-label="Rest timer">
      <div className="rest-timer-label">Rest timer:</div>
      <div className="rest-timer-row">
        <button
          className="change-day-button rest-timer-control"
          type="button"
          aria-label="Start rest timer"
          onClick={startTimer}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M5 3.5v11l9-5.5-9-5.5z" fill="currentColor" />
          </svg>
        </button>
        <button
          className="change-day-button rest-timer-control"
          type="button"
          aria-label="Stop and reset rest timer"
          onClick={resetTimer}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <rect x="4" y="4" width="10" height="10" rx="1" fill="currentColor" />
          </svg>
        </button>
        <div className="rest-timer-countdown" role="timer">
          {`${secondsLeft}s`}
        </div>
        <button
          className="change-day-button rest-timer-option"
          type="button"
          aria-label="Add 30 seconds"
          onClick={addThirtySeconds}
        >
          +30s
        </button>
      </div>
    </section>
  );
}

export default RestTimer;
