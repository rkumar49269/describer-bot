const express = require("express")
const healthRoutes = require("./routes/health.routes")
const telegramRoutes = require("./routes/telegram.routes")

const app = express()

app.use(express.json())

app.use("/health", healthRoutes)
app.use("/api/telegram", telegramRoutes)


module.exports = app;