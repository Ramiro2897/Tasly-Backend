import { Request, Response } from "express";
import { pool } from "../index";

// Función para obtener la fecha actual del usuario como string YYYY-MM-DD
function getTodayString(timeZone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const dateObj: Record<string, string> = {};
  parts.forEach(p => { if (p.type !== "literal") dateObj[p.type] = p.value; });

  return `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
}

// Función para obtener la hora actual del usuario en minutos desde medianoche
function getNowInMinutes(timeZone: string): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const timeObj: Record<string, string> = {};
  parts.forEach(p => { if (p.type !== "literal") timeObj[p.type] = p.value; });

  const hours = parseInt(timeObj.hour, 10);
  const minutes = parseInt(timeObj.minute, 10);
  return hours * 60 + minutes;
}

export const createTask = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { task, startDate, endDate, startTime, endTime, category, priority, timeZone } = req.body;

  // Usuario autenticado
  const user = (req as any).user;
  if (!user) return res.status(401).json({ errors: { general: "Usuario no autenticado" } });

  // Fecha y hora actuales del usuario
  const today = getTodayString(timeZone || "UTC");
  const nowInMinutes = getNowInMinutes(timeZone || "UTC");

  // Validación nombre tarea
  if (!task || task.trim() === "") return res.status(400).json({ errors: { task_name: "El nombre de la tarea no puede estar vacío." } });
  if (task.length > 40) return res.status(400).json({ errors: { task_name: "Nombre de la tarea muy extenso." } });

  // Validación fechas
  if (!startDate || !endDate) return res.status(400).json({ errors: { date: "Las fechas de inicio y fin son obligatorias." } });

  if (startDate < today) return res.status(400).json({ errors: { date: "Fecha de inicio en el pasado.", startDate } });
  if (endDate < startDate) return res.status(400).json({ errors: { date: "Fecha final menor que la de inicio." } });

  // Validación horas
  if ((startTime && !endTime) || (!startTime && endTime)) return res.status(400).json({ errors: { time_hour: "Debes ingresar hora de inicio y hora de fin." } });
  if (startTime && endTime && startTime >= endTime) return res.status(400).json({ errors: { time_hour: "La hora final debe ser mayor que la hora de inicio." } });

  if (startTime) {
    const [h, m] = startTime.split(":").map(Number);
    const taskStartInMinutes = h * 60 + m;

    // Si la tarea es hoy, no puede empezar en el pasado
    if (startDate === today && taskStartInMinutes < nowInMinutes) {
      return res.status(400).json({ errors: { time_hour: "La hora de inicio no puede ser anterior a la hora actual." } });
    }
  }

  // Validación categoría y prioridad
  if (!category || category.trim() === "") return res.status(400).json({ errors: { category: "La categoría de la tarea es obligatoria." } });
  if (!priority || priority.trim() === "") return res.status(400).json({ errors: { priority: "La prioridad de la tarea es obligatoria." } });


  try {
    const result = await pool.query(
      `INSERT INTO tasks 
      (task_name, start_date, end_date, start_time, end_time, category, priority, complete, created_at, updated_at, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,$9) RETURNING *`,
      [task, startDate, endDate, startTime || null, endTime || null, category, priority, false, user.id]
    );

    return res.status(201).json({ message: "Tarea creada con éxito", task: result.rows[0] });
  } catch (error) {
    console.error("Error en la creación de tarea:", error);
    return res.status(500).json({ errors: { general: "Error del servidor, intenta de nuevo más tarde." } });
  }
};
