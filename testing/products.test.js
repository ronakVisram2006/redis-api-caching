const request = require("supertest");
const { app, redisClient } = require("../src/app");

beforeAll(async () => {
    await redisClient.connect();
});

afterAll(async () => {
    await redisClient.quit();
});

describe("Products API", () => {
    test("GET /products/:id returns an existing product", async () => {
        const response = await request(app)
            .get("/products/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.product.id).toBe(1);
    });

    test("second request uses Redis cache", async () => {
        await redisClient.del("product:1");

        const firstResponse = await request(app)
            .get("/products/1");

        const secondResponse = await request(app)
            .get("/products/1");

        expect(firstResponse.body.source).toBe("Database");
        expect(secondResponse.body.source).toBe("Redis cache");
    });
});