import { Request, Response } from 'express';
import { pool } from '../index';  
import { QueryResult } from 'pg';

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

export const updateTask = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    const { updatedDate, updatedStartTime, updatedEndTime, updatedPriority, timeZone } = req.body;
    const taskId = Number(req.body.taskId);

    console.log(updatedDate, updatedStartTime, updatedEndTime, updatedPriority, timeZone, 'lo que llega')
    if (!taskId || !updatedDate || !updatedPriority) {
      return res.status(400).json({ errors: { errorUpdate: 'Faltan datos para actualizar la tarea.' } });
    }

    const nowUser = getUserNow(timeZone || "UTC");
    // console.log('⏱ nowUser:', nowUser.toISOString());

    const todayStr = `${nowUser.getFullYear()}-${String(nowUser.getMonth()+1).padStart(2,"0")}-${String(nowUser.getDate()).padStart(2,"0")}`;
    // console.log('📅 today string:', todayStr);

    // Validación de fecha
    if (updatedDate < todayStr) {
      return res.status(400).json({
        errors: { errorUpdate: 'La fecha final no puede ser anterior al día de hoy.' },
      });
    }

    // Validación coherencia horas
    if ((updatedStartTime && !updatedEndTime) || (!updatedStartTime && updatedEndTime)) {
      return res.status(400).json({ errors: { errorUpdate: 'Debes ingresar hora de inicio y hora de fin.' } });
    }
    if (updatedStartTime && updatedEndTime && updatedStartTime >= updatedEndTime) {
      return res.status(400).json({ errors: { errorUpdate: 'La hora final debe ser mayor que la hora de inicio.' } });
    }

    // Obtener tarea
    const taskResult: QueryResult = await pool.query(
      'SELECT status, start_time, end_time FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, user.id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ errors: { errorUpdate: 'La tarea no pertenece al usuario.' } });
    }
    const taskData = taskResult.rows[0];

    //Si la tarea ya está completada, no se permite actualizar
    if (taskData.status === 'completed') {
      console.log('no se puede actualizar una tarea completa')
      return res.status(400).json({
        errors: {
          errorUpdate: 'No se puede actualizar una tarea que ya está completada.'
        }
      });
    }

    console.log(taskData.start_time, taskData.end_time, 'son nulos?')

    const hasUpdatedStart =
    updatedStartTime !== null && updatedStartTime !== undefined && updatedStartTime !== '';

    const hasUpdatedEnd =
    updatedEndTime !== null && updatedEndTime !== undefined && updatedEndTime !== '';

    // Validación de seguridad: no agregar horas si la tarea original no tiene
    if (
      (taskData.start_time === null || taskData.end_time === null) &&
      (hasUpdatedStart || hasUpdatedEnd)
    ) {
      return res.status(400).json({
        errors: {
          errorUpdate: 'No puedes agregar horas a una tarea que fue creada sin ellas.'
        }
      });
    }

    const updatedDateOnly = updatedDate.split('T')[0];
    // console.log(updatedStartTime, updatedEndTime, updatedDateOnly, todayStr, 'valores debug');

    // 🔹 Validaciones de hora
    if (taskData.status === 'in_progress') {
      console.log('🔹 Tarea en progreso: se valida solo hora final');
      if (updatedEndTime && updatedDateOnly === todayStr) {
        const [hEnd, mEnd] = updatedEndTime.split(':').map(Number);
        const endInMinutes = hEnd * 60 + mEnd;
        const nowMinutes = nowUser.getHours() * 60 + nowUser.getMinutes();
        console.log('⏱ nowMinutes:', nowMinutes, '⏱ endInMinutes:', endInMinutes);
        if (endInMinutes < nowMinutes) {
          return res.status(400).json({
            errors: { errorUpdate: 'La hora final no puede ser anterior a la hora actual.' }
          });
        }
      }
    } else {
      // Tarea NO en progreso: validar inicio y fin
      if (updatedStartTime && updatedDateOnly === todayStr) {
        const [hStart, mStart] = updatedStartTime.split(':').map(Number);
        const startInMinutes = hStart * 60 + mStart;
        const nowMinutes = nowUser.getHours() * 60 + nowUser.getMinutes();
        console.log('⏱ nowMinutes:', nowMinutes, '⏱ startInMinutes:', startInMinutes);
        if (startInMinutes < nowMinutes) {
          return res.status(400).json({
            errors: { errorUpdate: 'La hora de inicio no puede ser anterior a la hora actual.' }
          });
        }
      }
      if (updatedEndTime && updatedDateOnly === todayStr) {
        const [hEnd, mEnd] = updatedEndTime.split(':').map(Number);
        const endInMinutes = hEnd * 60 + mEnd;
        const nowMinutes = nowUser.getHours() * 60 + nowUser.getMinutes();
        console.log('⏱ nowMinutes:', nowMinutes, '⏱ endInMinutes:', endInMinutes);
        if (endInMinutes < nowMinutes) {
          console.log('valida la fecha final con la actual')
          return res.status(400).json({
            errors: { errorUpdate: 'La hora final no puede ser anterior a la hora actual.' }
          });
        }
      }
    }

    // Preparar valores para actualizar
    let startTimeToUpdate: string | null = updatedStartTime || null;
    let endTimeToUpdate: string | null = updatedEndTime || null;
    if (taskData.status === 'in_progress') startTimeToUpdate = taskData.start_time;

    const updateResult: QueryResult = await pool.query(
      `UPDATE tasks SET 
        end_date = $1, 
        start_time = $2, 
        end_time = $3, 
        priority = $4, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 AND user_id = $6`,
      [updatedDate, startTimeToUpdate, endTimeToUpdate, updatedPriority, taskId, user.id]
    );

    if ((updateResult.rowCount ?? 0) > 0) {
      const updatedTaskResult: QueryResult = await pool.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, user.id]
      );
      const updatedTask = updatedTaskResult.rows[0];
      return res.status(200).json({ task: updatedTask, message: 'Tarea actualizada correctamente.' });
    }

    return res.status(400).json({ errors: { errorUpdate: 'No se pudo actualizar la tarea, verifica los datos.' } });

  } catch (error) {
    console.error('💥 Error al actualizar la tarea:', error);
    return res.status(500).json({ errors: { errorUpdate: 'Error al actualizar la tarea.' } });
  }
};
