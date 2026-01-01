FROM --platform=linux/arm64 python:3.12-slim-bookworm as build

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py badwords.json ./
COPY web/ ./web/
# COPY cert.pem key.pem ./

CMD [ "python3", "./server.py" ]