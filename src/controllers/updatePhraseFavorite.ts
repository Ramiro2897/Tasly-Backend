import { Request, Response } from 'express';
import { pool } from '../index'; // Importamos la conexión a la base de datos

export const updatePhraseFavorite = async (req: Request, res: Response): Promise<Response> => {
  try {
     // Verificar si el usuario está autenticado
     const user = (req as any).user;
     if (!user) {
       return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
     }

    const phraseId = req.headers['phrase-id']; 
    const favorite = req.headers['favorite'];
    console.log('datos de la frase para favorita', favorite, phraseId)
    const favoriteBool = favorite === 'true'; // Convertimos "true" en true y "false" en false

    // Validamos que phraseId y favoriteBool estén presentes y en el formato correcto
    if (!phraseId || typeof favoriteBool !== 'boolean') {
      return res.status(400).json({
        errors: { general: 'Error inesperado.' }
      });
    }

    // Realizamos la actualización en la base de datos
    const result = await pool.query(
      'UPDATE phrases SET favorite = $1 WHERE id = $2 RETURNING *',
      [favoriteBool, phraseId]
    );    

    // Si no se encuentra la frase
    if (result.rows.length === 0) {
      return res.status(404).json({ errors: { general: 'Frase no encontrada.' } });
    }

    // Respondemos con la frase actualizada
    return res.status(200).json({ phrase: result.rows[0] });

  } catch (error) {
    console.error('Error al actualizar el estado de favorito:', error);
    return res.status(500).json({
      errors: { server: 'Error al actualizar el estado de favorito.' }
    });
  }
};
