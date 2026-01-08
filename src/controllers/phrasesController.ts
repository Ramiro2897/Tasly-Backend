import { Request, Response } from 'express';
import { pool } from '../index';  // Importa la conexión desde index.ts

export const createPhrase = async (req: Request, res: Response): Promise<Response> => {
  // Verificar si el usuario está autenticado
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ errors: { general: "Usuario no autenticado" } });
  }

  const { phrase, author } = req.body;

  console.log('Datos recibidos:', req.body);


  if (!phrase || phrase.trim() === '') {
    console.log('Error: La frase no puede estar vacía.');
    return res.status(400).json({
      errors: { phrase: 'La frase es obligatoria.' }
    });
  }

  if (!author || author.trim() === '') {
    console.log('Error: El autor no puede estar vacío.');
    return res.status(400).json({
      errors: { author: 'El autor es obligatorio.' }
    });
  }
  
  const authorTrimmed = author.trim();
  const authorLength = authorTrimmed.length;
  
  console.log('Número de caracteres en el autor:', authorLength);
  
  if (authorLength > 25) {
    console.log('Error: El autor no puede tener más de 25 caracteres.');
    return res.status(400).json({
      errors: { author: 'El autor es muy extenso.' }
    });
  }
  
  try {
    console.log('Guardando frase en la base de datos...');
    
    const result = await pool.query(
      `INSERT INTO phrases (phrase, author, created_at, user_id)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3) RETURNING *`,
      [phrase, author, user.id]
    );
    
    const newPhrase = result.rows[0];
    return res.status(201).json({ message: 'Frase creada con éxito', phrase: newPhrase });

  } catch (error) {
    console.error('Error en la creación de frase:', error);
    return res.status(500).json({
      errors: { general: 'Error del servidor, intenta de nuevo más tarde.' }
    });
  }
};

