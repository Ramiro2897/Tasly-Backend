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
    const { phraseId, updatedDate, editedName } = req.body;
    console.log('datos de la frase', phraseId, updatedDate, editedName);

    // 🔹 Validación de datos requeridos
    if (!phraseId || !updatedDate || !editedName) {
      return res.status(400).json({
        errors: { errorUpdate: 'Faltan datos para actualizar la frase.' }
      });
    }

    // 🔹 Validación de fecha (convertimos `updatedDate` al mismo formato para evitar errores)
    const date = new Date();
    const today = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date).split('/').reverse().join('-');

    
    console.log('fecha actual colombiana', today);

    const formattedDate = new Date(updatedDate).toISOString().split('T')[0];
    console.log(formattedDate, 'fecha formateada...')

    if (formattedDate < today) {
      return res.status(400).json({
        errors: { errorUpdate: 'Fecha de actualización pasada.' }
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

    // 🔹 Actualización de la frase
    const updateResult: QueryResult = await pool.query(
      'UPDATE phrases SET created_at = $1, phrase = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [updatedDate, editedName, phraseId, user.id]
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
