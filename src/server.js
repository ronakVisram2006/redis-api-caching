const { app, redisClient } = require("./app");

const port = 3000;

async function startServer() {
    await redisClient.connect();

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();