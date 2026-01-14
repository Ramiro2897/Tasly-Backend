import { Request, Response } from 'express';
import { pool } from '../index';  
import { QueryResult } from 'pg'; 

export const updateGoal = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 🔹 Verificar si el usuario está autenticado y obtener su ID del token
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }
    const { goalId, editedDescription } = req.body;
    // console.log('datos de la frase', goalId, editedDescription);

    // 🔹 Validación de datos requeridos
    if (!goalId || !editedDescription) {
      return res.status(400).json({
        errors: { errorUpdate: 'Faltan datos para agregar la nota.' }
      });
    }

    // 🔹 Verificamos si la frase pertenece al usuario
    const goalResult: QueryResult = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, user.id]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ errors: { errorUpdate: 'La meta no pertenece al usuario.' } });
    }

    // 🔹 Actualización de la frase
    const updateResult: QueryResult = await pool.query(
      'UPDATE goals SET updated_at = NOW(), description = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [editedDescription, goalId, user.id]
    );    

    // 🔹 Verificamos si se actualizó correctamente
    if ((updateResult.rowCount ?? 0) > 0) {
      return res.status(200).json({ message: 'meta actualizada correctamente.', updatedGoal: updateResult.rows[0] });
    }

    return res.status(400).json({
      errors: { errorUpdate: 'No se pudo actualizar la meta, verifica los datos.' }
    });

  } catch (error) {
    console.error('💥 Error al actualizar la meta:', error);
    return res.status(500).json({
      errors: { errorUpdate: 'Error al actualizar la meta.' }
    });
  }
};

export const advanceGoal = async (req: Request, res: Response) => {
  try {
    const { goalId, newValue } = req.body;

    if (!goalId || !newValue) {
      return res.status(400).json({ errors: { errorUpdate: "Faltan datos requeridos." } });
    }

    const numericValue = Number(newValue);

    if (isNaN(numericValue) || numericValue < 1 || numericValue > 100) {
      return res.status(400).json({ errors: { errorUpdate: "Ingreso u valor de 1 a 100" } });
    }

    // Obtener el valor actual y la fecha de finalización de la meta
    const { rows } = await pool.query("SELECT current_value, end_date FROM goals WHERE id = $1", [goalId]);

    if (rows.length === 0) {
      return res.status(404).json({ errors: { errorUpdate: "Meta no encontrada." } });
    }

    const currentValue = Number(rows[0].current_value);
    const endDate = new Date(rows[0].end_date);
    const today = new Date();

    // Comparar la fecha de finalización con la fecha actual
    if (endDate < today) {
      return res.status(400).json({ errors: { errorUpdate: "No puedes avanzar, meta vencida." } });
    }

    if (numericValue < currentValue) {
      return res.status(400).json({ errors: { errorUpdate: "El avance no puede retroceder." } });
    }

    // Actualizar el valor de la meta
    await pool.query("UPDATE goals SET current_value = $1, updated_at = NOW() WHERE id = $2", [numericValue, goalId]);

    res.json({ message: "Avance actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar el avance:", error);
    res.status(500).json({ errors: { general: "Error interno del servidor." } });
  }
};
