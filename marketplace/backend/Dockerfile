FROM python:3.11-slim-buster


RUN apt-get update && apt-get install -y curl --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput --clear

EXPOSE 8000


CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
