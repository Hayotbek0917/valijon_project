FROM ghcr.io/astral-sh/uv:alpine

RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

RUN chmod +x scripts/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
