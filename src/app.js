const { Pool } = require("pg");
const express = require("express");
const { createClient } = require("redis");

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "productsdb"
});

const app = express();

app.use(express.json());

const redisClient = createClient({
    url: "redis://localhost:6379"
});

redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});

async function getProductsFromDatabase() {
    console.log("Getting products from PostgreSQL...");

    const result = await pool.query(
        "SELECT * FROM products ORDER BY id"
    );

    return result.rows;
}

app.get("/products", async (req, res) => {
    const cachedProducts = await redisClient.get("products");

    if (cachedProducts) {
        console.log("Cache hit!");

        return res.json({
            source: "Redis cache",
            products: JSON.parse(cachedProducts)
        });
    }

    console.log("Cache miss!");

    const products = await getProductsFromDatabase();

    await redisClient.setEx(
        "products",
        30,
        JSON.stringify(products)
    );

    res.json({
        source: "Database",
        products
    });
});

app.get("/products/:id", async (req, res) => {
    const productId = req.params.id;
    const cacheKey = `product:${productId}`;

    const cachedProduct = await redisClient.get(cacheKey);

    if (cachedProduct) {
        console.log("Cache hit!");

        return res.json({
            source: "Redis cache",
            product: JSON.parse(cachedProduct)
        });
    }

    console.log("Cache miss!");

    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [productId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    const product = result.rows[0];

    await redisClient.setEx(
        cacheKey,
        30,
        JSON.stringify(product)
    );

    res.json({
        source: "Database",
        product
    });
});

app.put("/products/:id", async (req, res) => {
    const productId = req.params.id;
    const { name, price } = req.body;

    const result = await pool.query(
        "UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *",
        [name, price, productId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    await redisClient.del(`product:${productId}`);

    res.json({
        message: "Product updated",
        product: result.rows[0]
    });
});

module.exports = {
    app,
    pool,
    redisClient
};