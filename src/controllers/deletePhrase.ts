import { Request, Response } from 'express';
import { pool } from '../index'; // Importamos la conexión a la base de datos

export const deletePhrase = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verificar si el usuario está autenticado
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
    }


    const phraseId = Number(req.headers['phrase-id']); 
    // const userId = req.headers['user-id'];
    console.log('Datos al eliminar:', { phraseId, userId: user.id });

     // Validamos que phraseId sea valido
    if (!phraseId || isNaN(phraseId)) {
      return res.status(400).json({
        errors: { general: 'ID de la frase no válido.' }
      });
    }


     // Validamos que phraseId esté presente
     if (!phraseId) {
      return res.status(400).json({
        errors: { general: 'Fallo en el ID de la frase.' }
      });
    }

    // Verificamos que la tarea pertenezca al usuario antes de eliminarla
    const taskResult = await pool.query(
      'SELECT * FROM phrases WHERE id = $1 AND user_id = $2',
      [phraseId, user.id ]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ errors: { general: 'frase no encontrada o no pertenece al usuario.' } });
    }

    // Eliminamos la tarea
    await pool.query('DELETE FROM phrases WHERE id = $1', [phraseId]);

    // Respondemos con un mensaje de éxito
    return res.status(200).json({ message: 'frase eliminada correctamente.' });

  } catch (error) {
    console.error('Error al eliminar la frase:', error);
    return res.status(500).json({
      errors: { server: 'Error al eliminar la tarea.' }
    });
  }
};
