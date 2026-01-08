import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../index'; 

export const register = async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  try {
    // Validar si el nombre de usuario está vacío
    if (!username || username.trim() === '') {
      return res.status(400).json({
        errors: { username: 'Nombre de usuario vacío.' }
      });
    }
    // Validar longitud del nombre de usuario
    if (username.length < 3) {
      return res.status(400).json({
        errors: { username: 'Ingresa al menos 3 caracteres.' }
      });
    }
    if (username.length > 15) {
      return res.status(400).json({
        errors: { username: 'Sobrepasa los 15 caracteres.' }
      });
    }

    // Validar si la contraseña está vacía
    if (!password || password.trim() === '') {
      return res.status(400).json({
        errors: { password: 'La contraseña no puede estar vacía.' }
      });
    }
    // Validar longitud de la contraseña
    if (password.length < 6) {
      return res.status(400).json({
        errors: { password: 'Ingresa al menos 6 caracteres.' }
      });
    }
    if (password.length > 20) {
      return res.status(400).json({
        errors: { password: 'Sobrepasa los 20 caracteres.' }
      });
    }
    // Validar si la contraseña contiene al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        errors: { password: 'Ingresa al menos una mayúscula.' }
      });
    }
    // Validar si la contraseña contiene al menos un número
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        errors: { password: 'Ingresa al menos un número.' }
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        errors: { username: 'El usuario ya está registrado' }
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el usuario en la base de datos
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const user = newUser.rows[0];

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secretkey',
    );

    return res.status(201).json({ message: 'Usuario registrado con éxito', token, user });
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
