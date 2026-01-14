# Tasly API - Backend

API de **Tasly** para gestión de usuarios, tareas, frases y metas. Esta documentación incluye todos los endpoints, request y responses, y cómo interactuar con la API.

---

## 🏗️ Estructura del Backend

```

backend/
├─ src/
│  ├─ controllers/         # Lógica de negocio de cada recurso
│  ├─ middleware/          # Middlewares (ej: verifyToken)
│  ├─ routes/              # Rutas de la API
│  └─ index.ts             # Archivo principal
├─ package.json
├─ tsconfig.json
├─ .env
└─ ...

````

---

## ⚡ Servidor

- **URL Base:** `http://localhost:3000/api`
- **Formato de datos:** JSON
- **Autenticación:** Bearer Token JWT en headers `Authorization`

---

## 🔐 Auth

### Register - Registro de usuario

- **POST** `/auth/register`
- **Request body:**

```json
{
  "username": "JuanPerez",
  "password": "Password123"
}
````

* **Responses:**

| Código | Descripción                                                        |
| ------ | ------------------------------------------------------------------ |
| 201    | Usuario registrado con éxito. Retorna `token` y `user`.            |
| 400    | Error de validación (usuario ya existe, contraseña inválida, etc.) |

---

### Login - Inicio de sesión

* **POST** `/auth/login`
* **Request body:**

```json
{
  "username": "JuanPerez",
  "password": "Password123"
}
```

* **Responses:**

| Código | Descripción                                    |
| ------ | ---------------------------------------------- |
| 200    | Login exitoso. Retorna `token` y `user`.       |
| 400    | Usuario no encontrado o contraseña incorrecta. |
| 500    | Error interno del servidor.                    |

---

### Logout - Cerrar sesión

* **POST** `/auth/logout`
* **Headers:**

  * `Authorization: Bearer <token>`
* **Responses:**

| Código | Descripción                  |
| ------ | ---------------------------- |
| 200    | Sesión cerrada correctamente |
| 401    | Token inválido o no enviado  |

---

## 📋 Tareas (Tasks)

### Crear tarea

* **POST** `/task`
* **Headers:** `Authorization: Bearer <token>`
* **Body:**

```json
{
  "title": "Mi tarea",
  "description": "Descripción de la tarea"
}
```

* **Response:** 201 OK + tarea creada

### Consultar tareas del usuario

* **GET** `/loadTasks`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** Lista de tareas del usuario

### Actualizar estado de tarea

* **PUT** `/updateTask`
* **Headers:** `Authorization: Bearer <token>`
* **Body:**

```json
{
  "taskId": 1,
  "completed": true
}
```

### Actualizar tarea

* **PUT** `/taskUpdate`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** Todos los campos que se pueden modificar (title, description, etc.)

### Eliminar tarea

* **DELETE** `/deleteTask`
* **Headers:** `Authorization: Bearer <token>`
* **Body:**

```json
{
  "taskId": 1
}
```

---

## 📝 Frases (Phrases)

### Crear frase

* **POST** `/phrase`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "text": "Mi frase motivacional" }`

### Consultar frases del usuario

* **GET** `/loadPhrases`
* **Headers:** `Authorization: Bearer <token>`

### Actualizar frase

* **PUT** `/phraseUpdate`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "phraseId": 1, "text": "Nueva frase" }`

### Eliminar frase

* **DELETE** `/deletePhrase`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "phraseId": 1 }`

### Actualizar favorita

* **PUT** `/updateFavorite`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "phraseId": 1, "favorite": true }`

---

## 🎯 Metas (Goals)

### Crear meta

* **POST** `/goals`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "name": "Meta 1", "target": 100 }`

### Consultar metas del usuario

* **GET** `/loadGoals`
* **Headers:** `Authorization: Bearer <token>`

### Actualizar meta

* **PUT** `/goalUpdate`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "goalId": 1, "note": "Nueva nota" }`

### Avanzar en meta

* **PUT** `/goalAdvance`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "goalId": 1, "newValue": 25 }`

### Eliminar meta

* **DELETE** `/deleteGoal`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "goalId": 1 }`

---

## 🔍 Búsquedas

* **GET** `/searchTasks` → Buscar tareas por texto

* **GET** `/searchPhrases` → Buscar frases por texto

* **GET** `/searchGoals` → Buscar metas por texto

* Todos requieren `Authorization: Bearer <token>`

---

## 📊 Resumen de tareas diarias

* **GET** `/tasklistAll` → Retorna resumen de tareas completadas/no completadas
* **GET** `/tasklist` → Últimas tareas del usuario

---

## ⚙️ Notas importantes

* Todos los endpoints que modifican datos requieren **JWT Bearer Token**.
* La contraseña debe cumplir:

  * Entre 6 y 20 caracteres
  * Al menos una mayúscula
  * Al menos un número
* El username debe tener entre 3 y 15 caracteres.
* Las fechas y tiempos se manejan en **hora de Colombia** para los cron jobs de archivado.

---


