import { Request, Response } from "express";
import { pool } from "../index";

export const checkDailyPendingTasks = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log("⏰ checkDailyPendingTasks ejecutándose");

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
      return res.json({ message: "No hay tareas hoy", data: {} });
    }

    const tasksByUser: Record<number, any[]> = {};
    for (const task of result.rows) {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push(task);
    }

    console.log("👥 Usuarios con tareas hoy:", Object.keys(tasksByUser).length);

    // Crear un objeto resumen para devolver al cliente
    const summary: Record<string, { pending: number; total: number }> = {};

    for (const userId in tasksByUser) {
      const userTasks = tasksByUser[userId];
      const pendingCount = userTasks.filter(t => t.status === "pending").length;
      summary[userId] = {
        pending: pendingCount,
        total: userTasks.length,
      };

      if (pendingCount > 0) {
        console.log(`🔔 Usuario ${userId} → ${pendingCount} tareas pendientes hoy`);
      } else {
        console.log(`🟢 Usuario ${userId} → No tienes tareas pendientes hoy`);
      }
    }

    // ✅ Devuelve el resumen al cliente
    return res.json({
      message: "Resumen de tareas pendientes por usuario",
      data: summary,
    });
  } catch (error) {
    console.error("❌ Error en checkDailyPendingTasks:", error);
    return res.status(500).json({ message: "Error al obtener tareas pendientes" });
  }
};
