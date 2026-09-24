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

async function startServer() {
    await redisClient.connect();

    app.get("/", async (req, res) => {
        await redisClient.set("message", "Hello from Redis!");

        const message = await redisClient.get("message");

        res.json({ message });
    });

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();