FROM ghcr.io/astral-sh/uv:alpine

RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

EXPOSE 8001

CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8001"]
