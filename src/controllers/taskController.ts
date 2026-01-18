import { Request, Response } from "express";
import { pool } from "../index";

// Función para obtener la hora actual según la zona horaria del usuario
function getUserNow(timeZone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now).reduce((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {} as Record<string, string>);

  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
}

export const createTask = async (
  req: Request,
  res: Response
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

  console.log("📥 Datos recibidos del cliente:", {
    task,
    startDate,
    endDate,
    startTime,
    endTime,
    category,
    priority,
    timeZone,
  });

  // Verificar si el usuario está autenticado
  const user = (req as any).user;
  if (!user) {
    return res
      .status(401)
      .json({ errors: { general: "Usuario no autenticado" } });
  }

  // 🕒 Hora actual según la zona del usuario
  const nowUser = getUserNow(timeZone || "UTC");
  console.log("🕒 nowUser:", nowUser.toISOString(), "(zona usuario)");

  const today = `${nowUser.getFullYear()}-${String(nowUser.getMonth() + 1).padStart(2, "0")}-${String(nowUser.getDate()).padStart(2, "0")}`;
  console.log("📅 today string:", today);

  // Validación de nombre de tarea
  if (!task || task.trim() === "") {
    return res.status(400).json({ errors: { task_name: "El nombre de la tarea no puede estar vacío." } });
  }
  if (task.length > 40) {
    return res.status(400).json({ errors: { task_name: "Nombre de la tarea muy extenso." } });
  }

  // Validación de fechas
  if (!startDate || !endDate) {
    return res.status(400).json({ errors: { date: "Las fechas de inicio y fin son obligatorias." } });
  }

  const startDateObj = new Date(`${startDate}T00:00:00`);
  const endDateObj = new Date(`${endDate}T23:59:59`);

  if (startDateObj < nowUser) {
    return res.status(400).json({ errors: { date: "Fecha de inicio en el pasado.", startDate } });
  }
  if (endDateObj < startDateObj) {
    return res.status(400).json({ errors: { date: "Fecha final menor que la de inicio." } });
  }

  // Validación de horas
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return res.status(400).json({ errors: { time_hour: "Debes ingresar hora de inicio y hora de fin." } });
  }
  if (startTime && endTime && startTime >= endTime) {
    return res.status(400).json({ errors: { time_hour: "La hora final debe ser mayor que la hora de inicio." } });
  }

  // Validación: hora no puede ser hacia atrás
  if (startTime) {
    const [hours, minutes] = startTime.split(":").map(Number);
    const taskStart = new Date(startDateObj);
    taskStart.setHours(hours, minutes, 0, 0);

    console.log("⏱ taskStart:", taskStart.toISOString());
    console.log("⏱ nowUser:", nowUser.toISOString());

    if (taskStart < nowUser) {
      return res.status(400).json({
        errors: { time_hour: "La hora de inicio no puede ser anterior a la hora actual." },
      });
    }
  }

  // Validación categoría y prioridad
  if (!category || category.trim() === "") {
    return res.status(400).json({ errors: { category: "La categoría de la tarea es obligatoria." } });
  }
  if (!priority || priority.trim() === "") {
    return res.status(400).json({ errors: { priority: "La prioridad de la tarea es obligatoria." } });
  }

  console.log("💾 Datos que se van a insertar:", {
    task,
    startDate,
    endDate,
    startTime,
    endTime,
    category,
    priority,
    userId: user.id,
  });

  try {
    const result = await pool.query(
      `INSERT INTO tasks 
      (task_name, start_date, end_date, start_time, end_time, category, priority, complete, created_at, updated_at, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,$9) RETURNING *`,
      [task, startDate, endDate, startTime || null, endTime || null, category, priority, false, user.id]
    );

    return res.status(201).json({
      message: "Tarea creada con éxito",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Error en la creación de tarea:", error);
    return res.status(500).json({ errors: { general: "Error del servidor, intenta de nuevo más tarde." } });
  }
};
