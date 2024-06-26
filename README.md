# A sample task for reserve a seat from an event

Sample application for a small task. Nodejs for server and redis for primary-db.

## Main folder structure

```shell
scripts\                # Initialize script for redis config
pkg\            
   |--cors\             # Nginx reverse proxy setup
   |--server\           # Express server
docker-compose.dev.yml  # main orchestrator
docker-compose-test.yml # run redis as integration tests deps
Dockerfile.server       # Server image
Makefile                # main works
```

### Quick start

makefile support is one of a dependency to run prepared command. Make start will run the database and all the apps. When its done
just visit the http://localhost to render the login page.

``` makefile
make start
```

Try this is make file support doesn't exist. Run the commands manually.

``` shell
# cd to the root of the project
cp env.example .env && \
docker compose -f docker-compose.dev.yml up -d
```

### Basic commands from the root

``` json
"scripts": {
  "test:unit": "pnpm run test:server:unit && pnpm run test:client:unit",
  "test:server:unit": "pnpm --filter=@task/api test:unit",
  "test:client:unit": "pnpm --filter=@task/client test:unit",
  "test:server:integration": "docker compose -f docker-compose-test.yml up -d && pnpm --filter=@task/api test:integration && docker compose -f docker-compose-test.yml down",
},
```

### To run the tests 

``` shell
pnpm install
pnpm run test:server:unit # to run the unit tests
pnpm run test:server:integration # to run the supertest for server api 
```

### .env

Default I set up env for make the local stuff works. DOMAIN will be responsible for shortUrl prefix.

```dotenv
REDIS_HOST=redis
REDIS_PORT=6379

ENABLE_SWAGGER=true
SWAGGER_TARGET=http://localhost:8080

PORT=8080

TOKEN_MAX_AGE=600
TOKEN_SECRET="ac1fd9fd2bb74e0280bd302ac1fd9fd2bb74e0280bd302"

RATE_WINDOW_MS=30000
RATE_LIMIT=50
RATE_LEGACY_HEADER=false

MAX_HOLDS_PER_USER=5
HOLD_DURATION=60

NODE_ENV=production
```

## Objective

The main goal is to create a service that supports a busy online reservation system using NodeJs,
Redis and Docker.

### Description

You have been asked to design and develop the REST API service that will manage the event seat
reservations of our new application.
The service is required to expose the following endpoints:

- Create an event.
  - An event consists of several seats. The total number of seats is required to create the event and it could be anything between 10 and 1,000 (included).
- List available seats for a given event. 
  - The list of available seats should only include the seats that are not “in Hold” and not yet fully Reserved.
- Hold a particular seat.
  - Users can “Hold” a seat for a limited amount of time. This is particularly useful when other parts of the system are, for example, completing the confirmation flow and payment.
  - In order to Hold a seat, your system will require the user identifier. For this exercise, the user will simply be identified by an UUID.
  - A user can hold a seat for a configured maximum time of seconds, after which the seat will become available to other users. You can default this to 60 seconds.
- Reserve a particular seat.
  - A user can complete the reservation of a seat, only if the user is “Holding” the relevant seat.
  - After the reservation, this seat becomes permanently assigned to the user.

### Bonus

- Limit the number of seats a given user can hold in one event.
- Add an endpoint to “refresh” a Hold on a seat.

### Deliverables

- Overall design document.
- API specification.
- Source code for your application. We hope to find comments in your code that validate any decisions you needed to make.
- Application should include a Docker compose file and any required information to start the project.