export const DEFAULT_VERSION = "latest";
export const DEFAULT_PORTS = {
  mysql: 3306,
  server: 8090,
  web: 8080,
} as const;

export const DEFAULT_DB_NAME = "seedar_prod";
export const DEFAULT_DB_USER = "seedar";
export const DEFAULT_DOCKER_ORG = "syedarhandsome";
export const DEFAULT_SERVER_IMAGE = `${DEFAULT_DOCKER_ORG}/seedar-server`;
export const DEFAULT_WEB_IMAGE = `${DEFAULT_DOCKER_ORG}/seedar-web`;
export const MIN_NODE_MAJOR = 18;

export const REQUIRED_ENV_KEYS = [
  "SEEDAR_VERSION",
  "SEEDAR_INSTALL_ROOT",
  "SEEDAR_INSTANCE_ID",
  "SEEDAR_PROJECT_NAME",
  "MYSQL_PORT",
  "SERVER_PORT",
  "WEB_PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "MYSQL_ROOT_PASSWORD",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "AES_SECRET",
] as const;

export const VALID_SERVICES = ["mysql", "server", "web", "migrate"] as const;

export const ENV_RENDER_ORDER = [
  "SEEDAR_VERSION",
  "SEEDAR_INSTALL_ROOT",
  "SEEDAR_INSTANCE_ID",
  "SEEDAR_PROJECT_NAME",
  "MYSQL_PORT",
  "SERVER_PORT",
  "WEB_PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "MYSQL_ROOT_PASSWORD",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "AES_SECRET",
] as const;

export const COMPOSE_TEMPLATE = `name: \${SEEDAR_PROJECT_NAME}

services:
  mysql:
    image: mysql:8.4
    container_name: \${SEEDAR_PROJECT_NAME}-mysql
    restart: unless-stopped
    environment:
      TZ: Asia/Shanghai
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: \${MYSQL_DATABASE}
      MYSQL_USER: \${MYSQL_USER}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD}
    ports:
      - "\${MYSQL_PORT}:3306"
    volumes:
      - "\${SEEDAR_INSTALL_ROOT}/data/mysql:/var/lib/mysql"
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "mysqladmin ping -h 127.0.0.1 -uroot -p$$MYSQL_ROOT_PASSWORD --silent",
        ]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 20s
    networks:
      - seedar-net

  server:
    image: ${DEFAULT_SERVER_IMAGE}:\${SEEDAR_VERSION}
    container_name: \${SEEDAR_PROJECT_NAME}-server
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      TZ: Asia/Shanghai
      NODE_ENV: production
      DB_HOST: \${DB_HOST}
      DB_PORT: \${DB_PORT}
      DB_USERNAME: \${DB_USERNAME}
      DB_PASSWORD: \${DB_PASSWORD}
      DB_DATABASE: \${DB_DATABASE}
      AES_SECRET: \${AES_SECRET}
      PORT: 3000
    ports:
      - "\${SERVER_PORT}:3000"
    networks:
      - seedar-net

  migrate:
    image: ${DEFAULT_SERVER_IMAGE}:\${SEEDAR_VERSION}
    restart: "no"
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      TZ: Asia/Shanghai
      NODE_ENV: production
      DB_HOST: \${DB_HOST}
      DB_PORT: \${DB_PORT}
      DB_USERNAME: \${DB_USERNAME}
      DB_PASSWORD: \${DB_PASSWORD}
      DB_DATABASE: \${DB_DATABASE}
      AES_SECRET: \${AES_SECRET}
      PORT: 3000
    command:
      [
        "node",
        "node_modules/typeorm/cli.js",
        "-d",
        "dist/config/typeorm.datasource.js",
        "migration:run",
      ]
    networks:
      - seedar-net

  web:
    image: ${DEFAULT_WEB_IMAGE}:\${SEEDAR_VERSION}
    container_name: \${SEEDAR_PROJECT_NAME}-web
    restart: unless-stopped
    depends_on:
      - server
    ports:
      - "\${WEB_PORT}:80"
    networks:
      - seedar-net

networks:
  seedar-net:
    driver: bridge
`;
