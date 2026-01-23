import { timeToMinutes } from "../utils/time.utils";

type TimeTask = {
  id: number;
  taskName: string;
  status: "pending" | "in_progress" | "completed";
  startDateTime: string;
  endDateTime: string;
};

export const getUpcomingTask = (
  tasks: TimeTask[],
  lookaheadMinutes = 10
): TimeTask | null => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const pendingTasks = tasks.filter(t => t.status === "pending");
  if (!pendingTasks.length) return null;

  const upcoming = pendingTasks
    .map(t => {
      const start = timeToMinutes(t.startDateTime);
      return { task: t, diff: start - nowMinutes };
    })
    .filter(t => t.diff >= 0 && t.diff <= lookaheadMinutes)
    .sort((a, b) => a.diff - b.diff);

  return upcoming.length ? upcoming[0].task : null;
};
