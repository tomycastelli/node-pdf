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
	return new Promise(async (resolve, reject) => {
		function formatNumbers(number) {
			if (number !== undefined && number !== null) {
				const formatter = new Intl.NumberFormat('es-AR', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})
				return formatter.format(parseFloat(number))
			}
			return ''
		}

		const templatePath = path.join(templatesPath, `${type}.ejs`)
		ejs.renderFile(templatePath, { data: transformedData, formatNumber: formatNumber }, async (err, html) => {
			if (err) {
				console.log(transformedData)
				reject({ error: `${err}` })
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

			if (!pdfBuffer) {
				reject({ error: 'PDF could not be generated' })
			}

			// Compress PDF
			const compressedPdfBuffer = await compressPDF(pdfBuffer)

			if (!compressedPdfBuffer) {
				reject({ error: 'PDF could not be compressed' })
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

			const pdfPath = path.join(filesPath, 'pdfs', pdfFilename)
			fs.writeFileSync(pdfPath, compressedPdfBuffer)

			console.log(`${pdfPath} has been saved`)

			const response = { filename: pdfFilename, filepath: pdfPath }
			resolve(response)
		})
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

	const response = { filename: csvFilename, filepath: csvPath }

	return response
}

module.exports = {
	generatePDF,
	generateCSV,
}
