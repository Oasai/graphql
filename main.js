const path = require("path")
const express = require("express")

const app = express()
const port = 8080

app.use(express.static(path.join(__dirname)))
app.use(express.static(path.join(__dirname, "src")))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "src", "html", "login.html"))
})

app.get("/data", (req, res) => {
    res.sendFile(path.join(__dirname, "src", "html", "data.html"))
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})
