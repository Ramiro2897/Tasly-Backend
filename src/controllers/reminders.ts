import { Request, Response } from "express";
import { getUpcomingTask } from "../services/taskReminder.service";
import { pool } from "../index";

export const checkUpcomingTasks = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log("⏰ checkUpcomingTasks ejecutándose");

    const today = new Date().toISOString().slice(0, 10);
    console.log("📅 Fecha hoy:", today);

    const result = await pool.query(
      `
      SELECT
        id,
        task_name AS "taskName",
        status,
        start_time AS "startDateTime",
        end_time   AS "endDateTime",
        user_id
      FROM tasks
      WHERE archived = false
        AND start_time IS NOT NULL
        AND end_time IS NOT NULL
        AND start_date <= $1
        AND end_date >= $1;
      `,
      [today]
    );

    console.log("📦 Tareas totales encontradas:", result.rows.length);

    if (result.rows.length === 0) {
      console.log("😴 No hay tareas hoy");
      return res.send("ok");
    }

    const tasksByUser: Record<number, any[]> = {};

    for (const task of result.rows) {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push(task);
    }

    console.log("👥 Usuarios con tareas:", Object.keys(tasksByUser).length);

    for (const userId in tasksByUser) {
      console.log(`🔍 Revisando usuario ${userId}`);

      const upcoming = getUpcomingTask(tasksByUser[userId]);

      if (upcoming) {
        console.log(
          `🔔 NOTIFICAR usuario ${userId} → ${upcoming.taskName}`
        );
      } else {
        console.log(`🟢 Usuario ${userId} sin tareas próximas`);
      }
    }

    return res.send("ok");
  } catch (error) {
    console.error("❌ Error en checkUpcomingTasks:", error);
    return res.status(500).send("error");
  }
};
