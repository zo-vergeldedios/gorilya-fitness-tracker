import { useState, useEffect } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
// import fitDexLogo from "./assets/fitDex-logo.png";
import gorilyaLogo from "./assets/gorilya.png";
// import "./App.css";

function compareWorkoutOrder(a, b) {
  return a.workout_index - b.workout_index || a.id - b.id;
}

function ShowErrorOrSuccessMessage({ message }) {
  return <span id="successAndErrorMessage">{message}</span>;
}

function EditWorkout({
  workout,
  workouts,
  setWorkouts,
  setSuccessAndErrorMessage,
  userToken,
  draft,
  updateDraft,
  saveWorkout,
}) {
  return (
    <li>
      <input
        id="workout-name-input"
        type="text"
        onChange={(e) => updateDraft(workout.id, "workout_name", e.target.value)}
        className="li-info li-workout-name"
        value={draft?.workout_name ?? workout.workout_name}
      />
      <input
        type="text"
        onChange={(e) => updateDraft(workout.id, "sets", e.target.value)}
        className="li-info"
        value={draft?.sets ?? workout.sets}
      />
      <input
        type="text"
        onChange={(e) => updateDraft(workout.id, "reps", e.target.value)}
        className="li-info"
        value={draft?.reps ?? workout.reps}
      />
      <input
        type="text"
        onChange={(e) => updateDraft(workout.id, "weight", e.target.value)}
        className="li-info"
        value={draft?.weight ?? workout.weight}
      />
      <button
        className="saveAndDeleteButton"
        onClick={() => {
          setWorkouts(workouts.filter((wo) => wo.id !== workout.id));
          fetch(`${import.meta.env.VITE_API_URL}/delete`, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: workout.id,
              user_token: userToken,
            }),
          })
            .then((res) => {
              console.log({ success: "workout successfully deleted" });
              setSuccessAndErrorMessage("Workout deleted");
              return res.json;
              // TODO: success message
            })
            .catch(function (error) {
              console.log(error);
              setSuccessAndErrorMessage("Failed to delete the workout");
              // TODO: failure message
            });
        }}
      >
        ❌
      </button>
      <button
        className="saveAndDeleteButton"
        onClick={() => saveWorkout(workout.id).catch(() => {})}
      >
        ✅
      </button>
    </li>
  );
}

function ShowProgram({
  wo,
  workouts,
  setWorkouts,
  setSuccessAndErrorMessage,
  weekdayIndex,
  userToken,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: wo.id });

  return (
    <div
      className="workout-div"
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition,
      }}
    >
      {/* TODO: Change each class name */}
      <button
        type="button"
        className="saveAndDeleteButton drag-handle"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className="workout-title">{wo.workout_name}</span>
      <span className="workout-title">{wo.sets}</span>
      <span className="workout-title">{wo.reps}</span>
      <span className="workout-title">{wo.weight}</span>
      <button
        className="edit-button"
        onClick={() => {
          setWorkouts(
            workouts.map((wo2) => {
              if (wo2.id === wo.id) {
                wo2.editing = true;
              }
              return wo2;
            }),
          );

          fetch(`${import.meta.env.VITE_API_URL}/update`, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: wo.id,
              workout_name: wo.workout_name,
              sets: wo.sets,
              reps: wo.reps,
              weight: wo.weight,
              editing: true,
              weekday_index: weekdayIndex,
              user_token: userToken,
              workout_index: wo.workout_index,
            }),
          })
            .then((res) => {
              setSuccessAndErrorMessage("Workout ready for edit");
              console.log({ success: "workout ready for edit" });
              return res.json;
            })
            .then((data) => {
              console.log(data);
            })
            .catch(function (error) {
              setSuccessAndErrorMessage("Workout NOT ready for edit");
              console.log(error);
            });
        }}
      >
        Edit
      </button>
    </div>
    // console.log("check")
  );
}

function App() {
  // const [error, setError] = useState("");
  // const [userHasHoverButton, setUserHasHoverButton] = useState(false);

  // const [selectedDay, setSelectedDay] = useState(0);
  const [newWorkout, setNewWorkout] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newSets, setNewSets] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [successAndErrorMessage, setSuccessAndErrorMessage] = useState("");

  const [userToken, setUserToken] = useState("");

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [weekdayIndex, setWeekdayIndex] = useState(new Date().getDay());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const updateDraft = (id, field, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...currentDrafts[id],
        [field]: value,
      },
    }));
  };

  const getNextWorkoutIndex = () => {
    const maxWorkoutIndex = workouts
      .filter((wo) => wo.weekday_index === weekdayIndex)
      .reduce(
        (maxIndex, wo) => Math.max(maxIndex, Number(wo.workout_index) || 0),
        0,
      );

    return maxWorkoutIndex + 1;
  };

  const saveWorkout = (id, assignedWorkoutIndex) => {
    const workout = workouts.find((wo) => wo.id === id);
    const draft = drafts[id];
    const isMoving = workout?.weekday_index !== weekdayIndex;

    if (!workout) {
      return Promise.reject(new Error("Workout not found"));
    }

    if (!draft && !isMoving) {
      setWorkouts((currentWorkouts) =>
        currentWorkouts.map((wo) =>
          wo.id === id ? { ...wo, editing: false } : wo,
        ),
      );
      return Promise.resolve();
    }

    const savedWorkoutIndex =
      assignedWorkoutIndex ?? (isMoving ? getNextWorkoutIndex() : workout.workout_index);
    const updated = {
      ...workout,
      ...draft,
      weekday_index: weekdayIndex,
      workout_index: savedWorkoutIndex,
      editing: false,
    };

    return fetch(`${import.meta.env.VITE_API_URL}/update`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: updated.id,
        workout_name: updated.workout_name,
        sets: updated.sets,
        reps: updated.reps,
        weight: updated.weight,
        editing: false,
        weekday_index: updated.weekday_index,
        user_token: userToken,
        workout_index: updated.workout_index,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update the workout");
        }

        setWorkouts((currentWorkouts) =>
          currentWorkouts.map((wo) => (wo.id === id ? { ...wo, ...updated } : wo)),
        );
        setDrafts((currentDrafts) => {
          const remainingDrafts = { ...currentDrafts };
          delete remainingDrafts[id];
          return remainingDrafts;
        });
        setSuccessAndErrorMessage("Workout updated");
        return res;
      })
      .catch((error) => {
        setSuccessAndErrorMessage("Failed to update the workout");
        throw error;
      });
  };

  const handleSaveAll = async () => {
    const editingWorkouts = workouts.filter((wo) => wo.editing === true);
    let nextWorkoutIndex = workouts
      .filter((wo) => wo.weekday_index === weekdayIndex)
      .reduce(
        (maxIndex, wo) => Math.max(maxIndex, Number(wo.workout_index) || 0),
        0,
      );
    const assignedWorkoutIndexes = {};

    editingWorkouts.forEach((wo) => {
      if (wo.weekday_index !== weekdayIndex) {
        nextWorkoutIndex += 1;
        assignedWorkoutIndexes[wo.id] = nextWorkoutIndex;
      }
    });

    const results = await Promise.allSettled(
      editingWorkouts.map((wo) =>
        saveWorkout(wo.id, assignedWorkoutIndexes[wo.id]),
      ),
    );
    const failures = results.filter((result) => result.status === "rejected").length;

    setSuccessAndErrorMessage(
      failures === 0
        ? "All workouts saved"
        : `${failures} workout${failures === 1 ? "" : "s"} failed to save`,
    );
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const currentDayWorkouts = workouts
      .filter((wo) => wo.weekday_index === weekdayIndex && !wo.editing)
      .sort(compareWorkoutOrder);
    const oldIndex = currentDayWorkouts.findIndex((wo) => wo.id === active.id);
    const newIndex = currentDayWorkouts.findIndex((wo) => wo.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedWorkouts = arrayMove(currentDayWorkouts, oldIndex, newIndex);
    const changedItems = reorderedWorkouts
      .map((wo, index) => ({ id: wo.id, workout_index: index }))
      .filter((item, index) => item.workout_index !== currentDayWorkouts[index].workout_index);

    if (changedItems.length === 0) return;

    const previousWorkouts = workouts;
    const updatedIndexes = new Map(
      reorderedWorkouts.map((wo, index) => [wo.id, index]),
    );
    const optimisticallyUpdatedWorkouts = workouts.map((wo) =>
      updatedIndexes.has(wo.id)
        ? { ...wo, workout_index: updatedIndexes.get(wo.id) }
        : wo,
    );

    setWorkouts(optimisticallyUpdatedWorkouts);
    fetch(`${import.meta.env.VITE_API_URL}/reorder`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_token: userToken,
        items: changedItems,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to reorder workouts");
        }
        setSuccessAndErrorMessage("Workout order updated");
      })
      .catch((error) => {
        setWorkouts(previousWorkouts);
        setSuccessAndErrorMessage("Failed to reorder workouts");
        console.log(error);
      });
  };

  // const [hiddenButton, setHiddenButton] = useState(true);
  // const hiddenButton = workouts.filter((wo) => wo.editing === true).length === 0;
  // const hiddenButton = workouts.every((wo) => !wo.editing);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      setSuccessAndErrorMessage("");
    }, 3000);
    return () => clearTimeout(timeoutID);
  }, [successAndErrorMessage]);
  // TODO - Get all of the components out of App().

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/list?token=${userToken}`)
      .then((res) => res.json())
      .then((res) => {
        setWorkouts(res);
        // setWorkouts(res.filter(wo => wo.user_token === our_user_token))
      });
  }, [userToken]);
  // TODO:
  // - add user_token column to workout table -
  // - add state for user_token in App
  //   - if empty, show input for user to add token
  // - server actions based on user token (fetch only from user_token, add user_token to new workouts, only allow update if user_token matches)

  const isButtonDisabled =
    typeof newSets !== "number" ||
    newSets === "" ||
    typeof newReps !== "number" ||
    newReps === "" ||
    typeof newWeight !== "number" ||
    newWeight === "" ||
    typeof newWorkout !== "string" ||
    newWorkout === "";

  

  return (
    <main>
      <img src={gorilyaLogo} alt="GorilyaFitnessTracker" />

      <div id="username-div">
        <p id="username-p">User Name:</p>
        <input
          value={userToken}
          onChange={(e) => setUserToken(e.target.value)}
        />
      </div>

      <div>
        {workouts.length > 0 ? (
          <h3 className="workout-checker glow-text">LET'S GO!!!</h3>
        ) : (
          <h3 className="workout-checker">Input a workout</h3>
        )}
      </div>

      <div className="workout-day">
        <h2 id="day-of-week-h2">Day of Week:</h2>
        <span id="day-of-week">
          <h2>{weekdays[weekdayIndex]}</h2>
        </span>
      </div>
      <div id="workout-section">
        <div id="workout-heading">
          <span aria-hidden="true" />
          <span className="workout-title-heading">Workout</span>
          <span className="workout-title-heading">Sets</span>
          <span className="workout-title-heading">Reps</span>
          <span className="workout-title-heading">Weights</span>
          <button
            className="edit-all-button"
            onClick={() => {
              setWorkouts(
                workouts.map((wo) => {
                  if (weekdayIndex === wo.weekday_index) {
                    wo.editing = true;

                    fetch(`${import.meta.env.VITE_API_URL}/update`, {
                      method: "POST",
                      mode: "cors",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: wo.id,
                        workout_name: wo.workout_name,
                        sets: wo.sets,
                        reps: wo.reps,
                        weight: wo.weight,
                        editing: true,
                        weekday_index: weekdayIndex,
                        user_token: userToken,
                        workout_index: wo.workout_index,
                      }),
                    })
                      .then((res) => {
                        return res.json;
                      })
                      .then((data) => {
                        console.log(data);
                      })
                      .catch(function (error) {
                        setSuccessAndErrorMessage(
                          "Workouts NOT ready for edit",
                        );
                        console.log(error);
                      });
                  }
                  return wo;
                }),
              );
            }}
          >
            Edit All
          </button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workouts
              .filter((wo) => wo.weekday_index === weekdayIndex && !wo.editing)
              .sort(compareWorkoutOrder)
              .map((wo) => wo.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul id="workoutplan-container">
              {workouts
                .filter((wo) => wo.weekday_index === weekdayIndex && !wo.editing)
                .sort(compareWorkoutOrder)
                .map((wo) => (
                  <ShowProgram
                    wo={wo}
                    key={wo.id}
                    workouts={workouts}
                    setWorkouts={setWorkouts}
                    setSuccessAndErrorMessage={setSuccessAndErrorMessage}
                    weekdayIndex={weekdayIndex}
                    userToken={userToken}
                  />
                ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <div id="change-day-button-div">
        <button
          className="change-day-button"
          onClick={() => {
            if (weekdayIndex > 0) {
              setWeekdayIndex(weekdayIndex - 1);
            } else if (weekdayIndex === 0) {
              setWeekdayIndex(6);
            }
          }}
        >
          Previous Day
        </button>
        <button
          className="change-day-button"
          onClick={() => {
            setWeekdayIndex((weekdayIndex + 1) % 7);
          }}
        >
          Next Day
        </button>
      </div>
      <h3 id="add-workout-title">Add Workout</h3>
      <div className="workout-container">
        <span>Workout Name:</span>
        <input
          value={newWorkout}
          id="workout-input"
          onChange={(e) => {
            setNewWorkout(e.target.value);
          }}
        />

        <span>Sets:</span>
        <input
          value={newSets}
          type="number"
          id="sets-input"
          onChange={(e) => {
            setNewSets(Number(e.target.value));
          }}
        />

        <span>Reps:</span>
        <input
          value={newReps}
          id="reps-input"
          type="number"
          onChange={(e) => {
            setNewReps(Number(e.target.value));
          }}
        />

        <span>Weight:</span>
        <input
          value={newWeight}
          id="weight-input"
          type="number"
          onChange={(e) => {
            setNewWeight(Number(e.target.value));
          }}
        />
      </div>
      <ShowErrorOrSuccessMessage message={successAndErrorMessage} />
      <button
        id="add-workout-button"
        className={isButtonDisabled ? "disabled" : ""}
        disabled={isButtonDisabled}
        onClick={() => {
          if (isButtonDisabled) return;
          let id = Math.floor(Math.random() * 1000000000);
          const newWorkoutIndex = getNextWorkoutIndex();

          setWorkouts([
            ...workouts,
            {
              editing: false,
              id: id,
              reps: newReps,
              sets: newSets,
              weight: newWeight,
              workout_name: newWorkout,
              weekday_index: weekdayIndex,
               workout_index: newWorkoutIndex,
            },
          ]);
          console.log(weekdayIndex);
          // workouts = [1, 2, 3]
          setNewWorkout(""); // !== -> newWorkout = ''
          setNewReps("");
          setNewWeight("");
          setNewSets("");
          // console.log([...workouts], "Workout array");
          fetch(`${import.meta.env.VITE_API_URL}/add`, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              editing: false,
              id: id,
              reps: newReps,
              sets: newSets,
              weight: newWeight,
              workout_name: newWorkout,
              weekday_index: weekdayIndex,
              user_token: userToken,
               workout_index: newWorkoutIndex,
            }),
          })
            .then((res) => {
              console.log({ success: "workout-added" });
              setSuccessAndErrorMessage("Workout successfully added");
              return res.json;
            })
            .catch(function (error) {
              setSuccessAndErrorMessage("Failed to add the workout");
              console.log(`Failed to add workout: ${error}`);
            });
        }}
      >
        Add Workout
      </button>

      <div id="edit-workout-container">
        <h3>Edit Workout</h3>
        <ul>
          {workouts
            .filter((wo) => wo.editing)
            .sort(compareWorkoutOrder)
            .map((workout) => (
              <EditWorkout
                workout={workout}
                key={workout.id}
                workouts={workouts}
                setWorkouts={setWorkouts}
                setSuccessAndErrorMessage={setSuccessAndErrorMessage}
                userToken={userToken}
                draft={drafts[workout.id]}
                updateDraft={updateDraft}
                saveWorkout={saveWorkout}
              />
            ))}
        </ul>

        <button
          className="save-all-button"
          hidden={workouts.every((wo) => !wo.editing)}
          onClick={handleSaveAll}
        >
          Save All Workouts
        </button>
      </div>
    </main>
  );
}

export default App;
