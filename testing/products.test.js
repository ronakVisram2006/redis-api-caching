const request = require("supertest");
const { app } = require("../src/app");

describe("Products API", () => {
    test("GET /products/:id returns an existing product", async () => {
        const response = await request(app)
            .get("/products/1");

        expect(response.statusCode).toBe(200);
        expect(response.body.product.id).toBe(1);
    });
});