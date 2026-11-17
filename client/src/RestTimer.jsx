import { useEffect, useRef, useState } from "react";

function getEndTime(duration) {
  return Date.now() + duration * 1000;
}

function getRemainingSeconds(endTime) {
  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
}

function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const endTime = useRef(null);
  const interval = useRef(null);
  const isRunningRef = useRef(false);

  const stopTimer = () => {
    clearInterval(interval.current);
    interval.current = null;
    isRunningRef.current = false;
    setIsRunning(false);
  };

  const updateRemaining = () => {
    if (!endTime.current) return;

    const remaining = getRemainingSeconds(endTime.current);
    setSecondsLeft(remaining);

    if (remaining === 0) {
      stopTimer();
      navigator.vibrate?.(200);
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
          setIsRunning(false);
          navigator.vibrate?.(200);
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
    if (isRunningRef.current) return;

    clearInterval(interval.current);
    const remaining = secondsLeft === 0 ? duration : secondsLeft;
    endTime.current = getEndTime(remaining);
    setSecondsLeft(remaining);
    isRunningRef.current = true;
    setIsRunning(true);
    interval.current = setInterval(updateRemaining, 250);
  };

  const pauseTimer = () => {
    if (!isRunningRef.current) return;

    stopTimer();
    endTime.current = null;
  };

  const resetTimer = () => {
    stopTimer();
    endTime.current = null;
    setSecondsLeft(duration);
  };

  const changeDuration = (nextDuration) => {
    stopTimer();
    endTime.current = null;
    setDuration(nextDuration);
    setSecondsLeft(nextDuration);
  };

  return (
    <section className="rest-timer" aria-label="Rest timer">
      <div className="rest-timer-label">Rest timer:</div>
      <div className="rest-timer-row">
        <div className="rest-timer-actions">
          <button
            className="change-day-button rest-timer-control"
            type="button"
            aria-label="Start rest timer"
            aria-pressed={isRunning}
            onClick={startTimer}
          >
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path d="M5 3.5v11l9-5.5-9-5.5z" fill="currentColor" />
            </svg>
          </button>
          <button
            className="change-day-button rest-timer-control"
            type="button"
            aria-label="Stop rest timer"
            aria-pressed={!isRunning}
            onClick={pauseTimer}
          >
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <rect x="4" y="4" width="10" height="10" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="change-day-button rest-timer-control"
            type="button"
            aria-label="Reset rest timer"
            onClick={resetTimer}
          >
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M14.5 8A5.5 5.5 0 1 0 13 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M13 4v4h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="rest-timer-countdown" role="timer">
          {secondsLeft === 0 ? <span className="glow-text">Rest over</span> : `${secondsLeft}s`}
        </div>
        <div className="rest-timer-options">
          {[90, 120].map((option) => (
            <button
              className="change-day-button rest-timer-option"
              key={option}
              type="button"
              aria-label={`${option} seconds`}
              aria-pressed={duration === option}
              onClick={() => changeDuration(option)}
            >
              {option}s
            </button>
          ))}
        </div>
      </div>
      <div className="rest-timer-announcement" aria-live="polite" aria-atomic="true">
        {secondsLeft === 0 ? <span className="glow-text">Rest over</span> : null}
      </div>
    </section>
  );
}

export default RestTimer;
