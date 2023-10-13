const express = require('express');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = 3001;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const connection = mysql.createConnection(process.env.DATABASE_URL);

if (connection) {
  console.log('Connected to Maika DB successfully!');
}

const queryDir = path.join(__dirname, 'queries');
const templatesPath = path.join(__dirname, 'views');
const pdfsPath = path.join(__dirname, 'pdfs');


const generatePdfRouter = require('./routes/generatePdf')(queryDir, templatesPath, pdfsPath, connection)
const getPdfRouter = require('./routes/getPdf')(pdfsPath)

// Use the routes
app.use('/generate-pdf', generatePdfRouter)
app.use('/get-pdf', getPdfRouter)


// Error handling
app.use((err, req, res, next) => {
  console.error(err); // Log the error for debugging purposes
});
