const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

// Read the JSON data from the file
const jsonFilePath = 'example.json'; // Replace with the actual path to your JSON file
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

// Load the EJS template
const templatePath = path.join(__dirname, 'views', 'ctacte.ejs');

// Render the EJS template
ejs.renderFile(templatePath, { data: jsonData }, (err, html) => {
  if (err) {
    console.error('Error rendering EJS template:', err);
  } else {
    // Log the generated HTML to the console
    console.log(html);
  }
});

