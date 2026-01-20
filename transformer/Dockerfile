FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY transform.py .

# Expor porta 8080 para o servidor HTTP
EXPOSE 8080

# Executar como servidor HTTP
ENV PORT=8080
CMD ["python", "transform.py"]
