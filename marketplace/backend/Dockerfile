# Utiliza una imagen base de Python
FROM python:3.11-slim-buster

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Establece variables de entorno para Python (buenas prácticas)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copia los archivos de requerimientos
COPY requirements.txt .

# Instala las dependencias
# Es buena idea actualizar pip primero y usar --no-cache-dir para mantener la imagen más ligera
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de tu aplicación
COPY . .

# Recopila los archivos estáticos (esto es para que WhiteNoise los sirva)
# Asegúrate que WhiteNoise está en requirements.txt y configurado en settings.py
RUN python manage.py collectstatic --noinput --clear

# Expone el puerto en el que Gunicorn escuchará
EXPOSE 8000

# Define el comando para ejecutar tu aplicación Django con Gunicorn
# Reemplaza 'tu_proyecto_django.wsgi:application' con la ruta correcta a tu archivo wsgi.py
# Por ejemplo, si tu wsgi.py está en una carpeta llamada 'mi_proyecto_django' dentro de /app,
# entonces sería 'mi_proyecto_django.wsgi:application'
CMD ["bash", "-c", "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000"]
#  && python manage.py populate_all_data