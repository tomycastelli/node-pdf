const express = require('express')
const path = require('path')
const mysql = require('mysql2')
require('dotenv').config()

const app = express()
const port = 3001

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`)
})

const connection = mysql.createConnection(process.env.DATABASE_URL)

if (connection) {
	console.log('Connected to Maika DB successfully!')
}

const queryDir = path.join(__dirname, 'queries')
const templatesPath = path.join(__dirname, 'views')
const filesPath = path.join(__dirname, 'files')

const generateReportRouter = require('./routes/generateReport')(queryDir, templatesPath, filesPath, connection)

// Use the routes
app.use('/generate-report', generateReportRouter)

// Error handling
app.use((err, req, res, next) => {
	console.error(err) // Log the error for debugging purposes
})
