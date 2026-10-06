const express = require("express")
const { telegramWebhook } = require("../controllers/telegram.controller")

const router = express.Router()

router.post("/webhook", telegramWebhook)

module.exports = router