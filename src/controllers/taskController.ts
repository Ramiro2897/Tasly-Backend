import { Request, Response } from "express";
import { pool } from "../index";

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

  const user = (req as any).user;
  if (!user) {
    return res
      .status(401)
      .json({ errors: { general: "Usuario no autenticado" } });
  }

  // 🕒 Hora actual en la zona del usuario
  const nowUser = new Date(
    new Date().toLocaleString("en-US", { timeZone: timeZone || "UTC" })
  );

  console.log("🕒 nowUser:", nowUser.toISOString(), "(zona usuario)");

  const today = `${nowUser.getFullYear()}-${String(
    nowUser.getMonth() + 1
  ).padStart(2, "0")}-${String(nowUser.getDate()).padStart(2, "0")}`;

  console.log("📅 today string:", today);

  // Validación de nombre
  if (!task || task.trim() === "") {
    return res.status(400).json({
      errors: { task_name: "El nombre de la tarea no puede estar vacío." },
    });
  }
  if (task.length > 40) {
    return res.status(400).json({
      errors: { task_name: "Nombre de la tarea muy extenso." },
    });
  }

  // Validación de fechas
  if (!startDate || !endDate) {
    return res.status(400).json({
      errors: { date: "Las fechas de inicio y fin son obligatorias." },
    });
  }

  // Convertimos fechas a objetos Date en la zona del usuario
  const startDateObj = new Date(
    new Date(`${startDate}T00:00:00`).toLocaleString("en-US", { timeZone: timeZone || "UTC" })
  );
  const endDateObj = new Date(
    new Date(`${endDate}T23:59:59`).toLocaleString("en-US", { timeZone: timeZone || "UTC" })
  );

  if (startDateObj < nowUser) {
    return res.status(400).json({
      errors: { date: "Fecha de inicio en el pasado.", startDate },
    });
  }
  if (endDateObj < startDateObj) {
    return res.status(400).json({
      errors: { date: "Fecha final menor que la de inicio." },
    });
  }

  // Validación de horas
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

  // Validación clave: hora no puede ser hacia atrás
  if (startTime) {
    const [hours, minutes] = startTime.split(":").map(Number);
    const taskStart = new Date(startDateObj);
    taskStart.setHours(hours, minutes, 0, 0);

    console.log("⏱ taskStart:", taskStart.toISOString());
    console.log("⏱ nowUser:", nowUser.toISOString());

    if (taskStart < nowUser) {
      return res.status(400).json({
        errors: {
          time_hour: "La hora de inicio no puede ser anterior a la hora actual.",
        },
      });
    }
  }

  // Validación categoría y prioridad
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
