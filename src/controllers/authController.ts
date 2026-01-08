import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../index';
import { v4 as uuidv4 } from 'uuid';

export const login = async (req: Request, res: Response): Promise<Response> => {
    const { username, password } = req.body;

    // Validaciones de entrada
    if (!username || username.trim() === '') {
        return res.status(400).json({ errors: { username: 'El nombre de usuario no puede estar vacío.' } });
    }

    if (!password || password.trim() === '') {
        return res.status(400).json({ errors: { password: 'La contraseña no puede estar vacía.' } });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(400).json({ errors: { username: 'Usuario no encontrado' } });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ errors: { password: 'Contraseña incorrecta' } });
        }

        // Generar un nuevo UUID
        const newUuid = uuidv4();
        await pool.query('UPDATE users SET uuid = $1 WHERE id = $2', [newUuid, user.id]);

        // ⚠️ Asegurar que JWT_SECRET esté definido
        if (!process.env.JWT_SECRET) {
            console.error('FALTA LA VARIABLE JWT_SECRET');
            return res.status(500).json({ errors: { general: 'Error interno del servidor' } });
        }

        // Generar token sin expiración
        const token = jwt.sign(
            { id: user.id, username: user.username},
            process.env.JWT_SECRET as string
        );

        console.log('Token generado:', token);

        return res.json({
            token,
            user: { id: user.id, username: user.username }  // No enviar info sensible
        });

    } catch (error: any) {
        console.error('Error en login:', error.message || error);
        return res.status(500).json({ errors: { general: 'Error del servidor, intenta de nuevo más tarde.' } });
    }
};
