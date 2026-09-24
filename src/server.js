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
const port = 3000;

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

async function startServer() {
    await redisClient.connect();

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

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();