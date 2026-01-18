import { Request, Response } from "express";
import { pool } from "../index";

export const createTask = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const {
    task,
    startDate,
    endDate,
    startTime,
    endTime,
    category,
    priority,
    timeZone, 
  } = req.body;

  // Verificar si el usuario está autenticado
  const user = (req as any).user;
  if (!user) {
    return res
      .status(401)
      .json({ errors: { general: "Usuario no autenticado" } });
  }

  // 🕒 Hora actual SEGÚN LA ZONA DEL USUARIO
  const nowUser = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: timeZone || "UTC", 
    })
  );

  const today =
    nowUser.getFullYear() +
    "-" +
    String(nowUser.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(nowUser.getDate()).padStart(2, "0");

  // validamos el nombre de la tarea
  if (task.length > 40) {
    return res.status(400).json({
      errors: { task_name: "Nombre de la tarea muy extenso." },
    });
  }

  if (!task || task.trim() === "") {
    return res.status(400).json({
      errors: { task_name: "El nombre de la tarea no puede estar vacío." },
    });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({
      errors: { date: "Las fechas de inicio y fin son obligatorias." },
    });
  }

  if (startDate < today) {
    return res.status(400).json({
      errors: { date: "Fecha de inicio en el pasado.", startDate },
    });
  }

  if (endDate < startDate) {
    return res.status(400).json({
      errors: { date: "Fecha final menor que la de inicio." },
    });
  }

  // ⏰ Validación de horas (coherencia)
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return res.status(400).json({
      errors: { time_hour: "Debes ingresar hora de inicio y hora de fin." },
    });
  }

  if (startTime && endTime && startTime >= endTime) {
    return res.status(400).json({
      errors: {
        time_hour: "La hora final debe ser mayor que la hora de inicio.",
      },
    });
  }

  // ⏰ VALIDACIÓN CLAVE: hora no puede ser hacia atrás
  if (startTime && startDate === today) {
  const taskStartDateTime = new Date(
    `${startDate}T${startTime}:00`
  );

  const taskStartInUserTZ = new Date(
    taskStartDateTime.toLocaleString("en-US", {
      timeZone: timeZone || "UTC",
    })
  );

  if (taskStartInUserTZ < nowUser) {
    return res.status(400).json({
      errors: {
        time_hour:
          "La hora de inicio no puede ser anterior a la hora actual.",
      },
    });
   }
  }

  if (!category || category.trim() === "") {
    return res.status(400).json({
      errors: { category: "La categoría de la tarea es obligatoria." },
    });
  }

  if (!priority || priority.trim() === "") {
    return res.status(400).json({
      errors: { priority: "La prioridad de la tarea es obligatoria." },
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (task_name, start_date, end_date, start_time, end_time, category, priority, complete, created_at, updated_at, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $9) RETURNING *`,
      [
        task,
        startDate,
        endDate,
        startTime || null,
        endTime || null,
        category,
        priority,
        false,
        user.id,
      ]
    );

    return res.status(201).json({
      message: "Tarea creada con éxito",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Error en la creación de tarea:", error);
    return res.status(500).json({
      errors: { general: "Error del servidor, intenta de nuevo más tarde." },
    });
  }
};
