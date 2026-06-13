FROM ghcr.io/astral-sh/uv:alpine

RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .
RUN chmod +x docker/entrypoint.sh

EXPOSE 8001

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["uv", "run", "python3", "manage.py", "runserver", "0.0.0.0:8001"]
