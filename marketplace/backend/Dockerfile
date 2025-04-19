# Utiliza una imagen base de Python
FROM python:3.11-slim-buster

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de requerimientos
COPY requirements.txt .

# Instala las dependencias
RUN pip install -r requirements.txt

# Copia el resto del código de tu aplicación
COPY . .

# Recopila los archivos estáticos (si los tienes)
RUN python manage.py collectstatic --noinput

# Define el comando para ejecutar tu aplicación Django (ajústalo según tu configuración)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Expone el puerto en el que correrá Django
EXPOSE 8000