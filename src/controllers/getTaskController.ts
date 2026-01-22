import { Request, Response } from 'express';
import { pool } from '../index';  // Importamos la conexión a la base de datos

// trea una sola tarea y es la ultima jajaj
export const getTasks = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const result = await pool.query(
      'SELECT id, task_name, status, created_at, start_date FROM tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );
    
    // console.log('Tareas obtenidas de la base de datos:', result.rows); 
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener las tareas:', error);
    return res.status(500).json({
      errors: { server: 'Error al obtener las tareas.' }
    });
  }
};

// longitud de tareas para mostrar
export const getDailyTasksSummary = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ errors: { general: "Falta la fecha para filtrar tareas" } });
    }
    console.log("Fecha recibida para filtrar tareas:", date);

    // 2️⃣ Consulta resumen de tareas
    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed
      FROM tasks
      WHERE user_id = $1
        AND archived = false
        AND start_date <= $2
        AND end_date >= $2;
      `,
      [user.id, date]
    );

     // 3️⃣ Consulta tareas con horas
    const timeTasksResult = await pool.query(
      `
      SELECT
        id,
        task_name AS "taskName",
        status,
        (start_date + start_time) AS "startDateTime",
        (end_date + end_time) AS "endDateTime"
      FROM tasks
      WHERE user_id = $1
        AND archived = false
        AND start_time IS NOT NULL
        AND end_time IS NOT NULL
        AND start_date <= $2
        AND end_date >= $2;
      `,
      [user.id, date]
    );

    const summary = summaryResult.rows[0];
    console.log('objeto summary', summary)
    console.log('las horas', timeTasksResult.rows);

    return res.status(200).json({
      total: Number(summary.total),
      pending: Number(summary.pending),
      inProgress: Number(summary.in_progress),
      completed: Number(summary.completed),

      // bloque SOLO para horas
      timeTasks: timeTasksResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errors: { server: 'Error al obtener el resumen diario.' }
    });
  }
};


