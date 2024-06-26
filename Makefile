set-env:
	@[ -f ./.env ] && true || cp env.example .env;

install:
	pnpm install

test-unit: install
	pnpm run test:server:unit

test-integration: install
	pnpm run test:server:integration

start: set-env
	docker compose -f docker-compose.yml up

stop:
	docker compose -f docker-compose.yml down