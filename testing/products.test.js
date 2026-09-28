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

    test("updating a product invalidates its cache", async () => {
        await redisClient.del("product:1");

        const firstResponse = await request(app)
            .get("/products/1");

        expect(firstResponse.body.source).toBe("Database");

        const updateResponse = await request(app)
            .put("/products/1")
            .send({
                name: "Updated Laptop",
                price: 999
            });

        expect(updateResponse.statusCode).toBe(200);

        const secondResponse = await request(app)
            .get("/products/1");

        expect(secondResponse.body.source).toBe("Database");
        expect(secondResponse.body.product.name).toBe("Updated Laptop");
    });

    test("GET /products/:id returns 404 for non-existing product", async () => {
        const response = await request(app)
            .get("/products/9999");

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("Product not found");
    });

    test("cached product has a TTL", async () => {
    await redisClient.del("product:1");

    await request(app)
        .get("/products/1");

    const ttl = await redisClient.ttl("product:1");

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30);
});
});