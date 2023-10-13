const express = require('express');
const ejs = require('ejs');
const puppeteer = require("puppeteer")
const fs = require('fs');
const path = require('path');
const { compressPDF } = require('ghostscript-node');
const mysql = require('mysql2');
const { organizeData } = require('./dataUtils'); // Import the function
require('dotenv').config();

const app = express();
const port = 3001;

const connection = mysql.createConnection(process.env.DATABASE_URL);

console.log('Connected to Maika DB successfully!');

const queryDir = path.join(__dirname, 'queries');
const templatesPath = path.join(__dirname, 'views');
const pdfsPath = path.join(__dirname, 'pdfs');

app.use(express.json());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/generate-pdf', async (req, res) => {
  const type = req.query.type;
  const dynamicVariable = req.query.dynamicVariable;

  if (!['ctacte', 'caja', 'saldos', 'movimientos'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type value.' });
  }

  // Grab JSON by making a query
  const queryFile = `${type}.sql`;
  const queryPath = path.join(queryDir, queryFile);

  if (dynamicVariable && fs.existsSync(queryPath)) {
    const query = fs.readFileSync(queryPath, 'utf8');

    connection.query(query, dynamicVariable, (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error.' });
      }

      const jsonData = results;

      if (jsonData) {
        console.log(`Query of type ${type} done successfully`);

        // Apply the organizeData function to jsonData
        const organizedData = organizeData(jsonData);

        // Render the HTML using EJS
        const templatePath = path.join(templatesPath, `${type}.ejs`);
        ejs.renderFile(templatePath, organizedData, (err, html) => {
          if (err) {
            console.log(organizedData)
            return res.status(500).json({ error: "HTML couldn't be generated" });
          }

          if (html) {
            console.log("HTML generated successfully")
          }

          // Generate a PDF from the HTML
          const generatePDF = async () => {
            const browser = await puppeteer.launch({
              "headless": "new",
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfBuffer = await page.pdf();

            await browser.close();

            // Compress PDF
            const compressedPdfBuffer = await compressPDF(pdfBuffer);

            const now = new Date();
            const formattedDate = now.toLocaleString('es-AR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(/[\/:, ]/g, '');

            const pdfFilename = `${formattedDate}_${type}_${dynamicVariable}.pdf`;

            // Save the PDF to a volume
            const pdfPath = path.join(pdfsPath, pdfFilename);
            fs.writeFileSync(pdfPath, compressedPdfBuffer);

            console.log(`${pdfPath} generated and saved`)
            res.send(`${pdfPath} generated and saved.`);
            browser.close();
          };

          generatePDF();
        });
      }
    });
  }
});

app.get('/get-pdf/:filename', (req, res) => {
  const pdfFilename = req.params.filename;
  const pdfPath = path.join(pdfsPath, pdfFilename);
  res.sendFile(pdfPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err); // Log the error for debugging purposes

  if (!res.headersSent) {
    // Set a response status code and send an error message if headers haven't been sent
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});
