const express = require('express')
const path = require('path')
const mysql = require('mysql2')
const { getFiles, getFileDownload } = require('./s3')
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

app.get('/files', async (req, res) => {
	const result = await getFiles()
	if (result) {
		return res.status(200).json(result.Contents)
	} else {
		return res.status(500).json({ error: 'Could not get files' })
	}
})

app.get('/file-url', async (req, res) => {
	const { filename } = req.query
	if (!filename) {
		return res.status(400).json({ error: 'Missing filename parameter' })
	}
	const result = await getFileDownload(filename)
	if (result) {
		return res.status(200).json(result)
	} else {
		return res.status(500).json({ error: 'Could not get file' })
	}
})

// Error handling
app.use((err, req, res, next) => {
	console.error(err) // Log the error for debugging purposes
})
