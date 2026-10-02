# Plataforma y presentación de FordwardAI en un contenedor: ver docker-compose.yml.
FROM python:3.13-slim
# OpenMP para xgboost y lightgbm (las bibliotecas de requirements.txt lo necesitan en Linux).
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt
COPY . .
ENV PYTHONUTF8=1 PYTHONUNBUFFERED=1
EXPOSE 8765 8000
# Sin datos montados en /datos, la plataforma arranca la demo con la base sintética.
CMD ["sh", "docker/plataforma.sh"]
