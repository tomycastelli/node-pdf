# NodeJS PDF Generator
The application exposes an API for requesting various types of reports. When one of the generating endpoints is hit it queries a MySQL database and with the use of EJS for HTML templating, produces an HTML which is used by Puppeteer to generate a PDF.
