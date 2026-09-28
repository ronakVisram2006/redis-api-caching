# Redis API Caching

A backend REST API built with Node.js and Express that uses Redis as a caching layer alongside PostgreSQL. The project demonstrates cache hits and misses, TTL-based expiration, cache invalidation, Dockerised services, and automated API testing.

## Overview

This project was built to explore how caching can improve the performance of applications that repeatedly access the same data.

PostgreSQL is used as the persistent database, while Redis temporarily stores frequently requested data. When a request is made, the API checks Redis first. If the data is cached, it can be returned without querying PostgreSQL. If it is not cached, the API retrieves the data from PostgreSQL and stores it in Redis for future requests.

## Architecture

```text
Client
  |
  v
Express REST API
  |
  +---------> Redis
  |             |
  |             +-- Cache hit -> Return cached data
  |
  +---------> PostgreSQL
                |
                +-- Cache miss -> Retrieve data
                                  |
                                  v
                                Redis
```

## Technologies

* Node.js
* Express
* PostgreSQL
* Redis
* Docker
* Jest
* Supertest

## Features

### Redis Caching

Product data is cached in Redis to reduce repeated queries to PostgreSQL.

A typical request follows this process:

```text
Request
   |
   v
Check Redis
   |
   +-- Cache hit --> Return cached data
   |
   +-- Cache miss
          |
          v
     Query PostgreSQL
          |
          v
     Store result in Redis
          |
          v
      Return data
```

### TTL-Based Expiration

Cached products are stored with a 30-second TTL.

```js
await redisClient.setEx(
    cacheKey,
    30,
    JSON.stringify(product)
);
```

This prevents cached data from remaining in Redis indefinitely and provides a fallback mechanism for stale data.

### Cache Invalidation

When a product is updated through the API, its corresponding Redis cache entry is deleted.

```js
await redisClient.del(`product:${productId}`);
```

This ensures that the next request retrieves the updated value from PostgreSQL rather than returning an outdated cached value.

### REST API

The API currently supports:

| Method | Endpoint        | Description                 |
| ------ | --------------- | --------------------------- |
| GET    | `/products`     | Retrieve all products       |
| GET    | `/products/:id` | Retrieve a specific product |
| PUT    | `/products/:id` | Update a product            |

A request for a non-existent product returns a `404` response.

## Example

Request:

```text
GET /products/1
```

On a cache miss:

```json
{
    "source": "Database",
    "product": {
        "id": 1,
        "name": "Laptop",
        "price": 899
    }
}
```

On a subsequent cache hit:

```json
{
    "source": "Redis cache",
    "product": {
        "id": 1,
        "name": "Laptop",
        "price": 899
    }
}
```

## Testing

The project uses Jest and Supertest for automated API testing.

The test suite covers:

* Retrieving an existing product
* Cache miss followed by a cache hit
* Cache invalidation after updating a product
* Returning `404` for a non-existent product
* Verifying that cached products have the expected TTL

Run the tests with:

```bash
npm test
```

## Running the Project

### Prerequisites

Make sure the following are installed:

* Node.js
* Docker Desktop
* npm

### Install dependencies

```bash
npm install
```

### Start the services

PostgreSQL and Redis are run using Docker.

The application expects:

```text
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

Make sure the required Docker containers are running before starting the API.

### Start the API

```bash
node src/server.js
```

The API will run on:

```text
http://localhost:3000
```

## Project Structure

```text
redis-api-caching/
├── src/
│   ├── app.js
│   └── server.js
├── testing/
│   └── products.test.js
├── package.json
├── package-lock.json
└── .gitignore
```

## Limitations

The current implementation uses application-level cache invalidation. When a product is updated through the API, its Redis entry is explicitly deleted.

However, if PostgreSQL is modified directly outside of the API, Redis is not automatically notified. This could temporarily result in stale cached data until the TTL expires.

A larger production system could address this using approaches such as database change events, event-driven cache invalidation, or other cache consistency strategies.

## What I Learned

This project gave me practical experience with:

* Designing a REST API with Express
* Connecting an application to PostgreSQL
* Using Redis as an application-level cache
* Understanding cache hits and cache misses
* Implementing TTL-based expiration
* Handling cache invalidation
* Running infrastructure with Docker
* Writing automated API tests
* Considering cache consistency and stale data
* Understanding the trade-offs introduced by caching

## Future Improvements

Potential improvements for a larger implementation could include:

* Environment variables for configuration and credentials
* More comprehensive error handling
* Additional API endpoints
* Database migrations and seed scripts
* More extensive integration testing
* Event-driven cache invalidation
* Performance benchmarking with and without Redis
