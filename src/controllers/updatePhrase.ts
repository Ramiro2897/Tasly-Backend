import { Request, Response } from 'express';
import { pool } from '../index';  
import { QueryResult } from 'pg'; 

export const updatePhrase = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 🔹 Verificar si el usuario está autenticado y obtener su ID del token
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }

    // 🔹 Extraemos los datos del cuerpo de la petición
    const { phraseId, editedName, createdAt, timezone } = req.body;
    console.log('datos de la frase', phraseId, editedName);

    // 🔹 Validación de datos requeridos
    if (!phraseId || !editedName || !createdAt || !timezone) {
      return res.status(400).json({
        errors: { errorUpdate: 'Faltan datos' }
      });
    }

    // 🔹 Verificamos si la frase pertenece al usuario
    const phraseResult: QueryResult = await pool.query(
      'SELECT id FROM phrases WHERE id = $1 AND user_id = $2',
      [phraseId, user.id]
    );

    if (phraseResult.rows.length === 0) {
      return res.status(404).json({ errors: { errorUpdate: 'La frase no pertenece al usuario.' } });
    }

    // 🔹 Actualización de la frase usando la fecha y zona del usuario
    const updateResult: QueryResult = await pool.query(
      `
      UPDATE phrases
      SET 
        phrase = $1,
        created_at = $3
      WHERE id = $2 AND user_id = $4
      RETURNING *
      `,
      [editedName, phraseId, createdAt, user.id]
    );

    // 🔹 Verificamos si se actualizó correctamente
    if ((updateResult.rowCount ?? 0) > 0) {
      return res.status(200).json({ message: 'Frase actualizada correctamente.', updatedPhrase: updateResult.rows[0] });
    }

    return res.status(400).json({
      errors: { errorUpdate: 'No se pudo actualizar la frase, verifica los datos.' }
    });

  } catch (error) {
    console.error('💥 Error al actualizar la frase:', error);
    return res.status(500).json({
      errors: { errorUpdate: 'Error al actualizar la frase.' }
    });
  }
};
