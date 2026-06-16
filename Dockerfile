FROM node:20-alpine AS frontend
WORKDIR /build
COPY web_app/frontend/package*.json ./
RUN npm ci
COPY web_app/frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --from=frontend /build/dist web_app/frontend/dist
COPY . .
EXPOSE 8000
CMD ["uvicorn", "web_app.main:app", "--host", "0.0.0.0", "--port", "8000"]