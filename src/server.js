const express = require("express");
const { createClient } = require("redis");

const app = express();
const port = 3000;

const redisClient = createClient({
    url: "redis://localhost:6379"
});

redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});

async function getProductsFromDatabase() {
    console.log("Getting products from database...");

    await new Promise(resolve => setTimeout(resolve, 2000));

    return [
        { id: 1, name: "Laptop", price: 999 },
        { id: 2, name: "Keyboard", price: 79 },
        { id: 3, name: "Mouse", price: 49 }
    ];
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