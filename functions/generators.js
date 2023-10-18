const path = require('path')
const fs = require('fs')
const puppeteer = require('puppeteer')
const { compressPDF } = require('ghostscript-node')
const ejs = require('ejs')
const json2csv = require('json2csv').parse

async function generatePDF(
	templatesPath,
	filesPath,
	transformedData,
	type,
	cliente,
	divisa,
	desdeFecha,
	hastaFecha,
	res
) {
	// Function to format numbers with dot as thousand separator and comma as decimal separator
	function formatNumber(number) {
		if (number !== undefined && number !== null) {
			return parseFloat(number).toLocaleString('es-AR', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})
		} else {
			return ''
		}
	}

	// Render the HTML using EJS
	const templatePath = path.join(templatesPath, `${type}.ejs`)
	ejs.renderFile(templatePath, { data: transformedData, formatNumber: formatNumber }, async (err, html) => {
		if (err) {
			console.log(transformedData)
			return res.status(500).json({ error: `${err}` })
		}

		if (html) {
			console.log('HTML generated successfully')
		}

		// Generate a PDF from the HTML
		const browser = await puppeteer.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		const page = await browser.newPage()
		await page.setContent(html)
		const pdfBuffer = await page.pdf()

		await browser.close()

		if (pdfBuffer) {
			console.log('PDF generated')
		} else {
			res.status(500).send('PDF could not be generated')
		}

		// Compress PDF
		const compressedPdfBuffer = await compressPDF(pdfBuffer)

		if (compressedPdfBuffer) {
			console.log('PDF compressed')
		} else {
			res.status(500).send('PDF could not be compressed')
		}

		const now = new Date()
		const formattedDate = now
			.toLocaleString('es-AR', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			})
			.replace(/[\/:, ]/g, '')

		let pdfFilename = `${formattedDate}_${type}`

		if (type === 'movimientos') {
			if (desdeFecha && hastaFecha) {
				pdfFilename += `_desde${desdeFecha}_hasta${hastaFecha}.pdf`
			} else if (desdeFecha) {
				pdfFilename += `_desde${desdeFecha}.pdf`
			} else if (hastaFecha) {
				pdfFilename += `_hasta${hastaFecha}.pdf`
			}
		} else if (type === 'caja') {
			pdfFilename += `_${divisa}.pdf`
		} else if (type === 'ctacte') {
			pdfFilename += `_${cliente}.pdf`
		}

		// Save the PDF to a volume
		const pdfPath = path.join(filesPath, 'pdfs', pdfFilename)
		fs.writeFileSync(pdfPath, compressedPdfBuffer)

		console.log(`${pdfPath} has been saved`)
		res.status(200).send(`${pdfPath} has been generated and saved.`)
	})
}

const generateCSV = (filesPath, jsonData, type, cliente, divisa, desdeFecha, hastaFecha, res) => {
	const fields = Object.keys(jsonData[0])
	const csv = json2csv(jsonData, { fields })

	if (!csv) {
		res.status(500).send('CSV could not be generated')
	}

	const now = new Date()
	const formattedDate = now
		.toLocaleString('es-AR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
		.replace(/[\/:, ]/g, '')

	let csvFilename = `${formattedDate}_${type}`

	if (type === 'movimientos') {
		if (desdeFecha && hastaFecha) {
			csvFilename += `_desde${desdeFecha}_hasta${hastaFecha}.csv`
		} else if (desdeFecha) {
			csvFilename += `_desde${desdeFecha}.csv`
		} else if (hastaFecha) {
			csvFilename += `_hasta${hastaFecha}.csv`
		}
	} else if (type === 'caja') {
		csvFilename += `_${divisa}.csv`
	} else if (type === 'ctacte') {
		csvFilename += `_${cliente}.csv`
	}

	const csvPath = path.join(filesPath, 'csvs', csvFilename)

	fs.writeFileSync(csvPath, csv) // Using synchronous writeFile for simplicity

	console.log('CSV file successfully created.')
	res.status(200).send(`${csvPath} has been generated and saved.`)
}

module.exports = {
	generatePDF,
	generateCSV,
}
