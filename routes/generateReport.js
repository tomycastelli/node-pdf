const express = require('express')
const fs = require('fs')
const path = require('path')
const { transformCuenta, transformCaja, addCambioToObjects } = require('../functions/dataUtils')
const { generatePDF, generateCSV } = require('../functions/generators')
const { uploadFile } = require('../s3')

const router = express.Router()

// Assuming you have an object to store the cache
const reportCache = {}

module.exports = (queryDir, templatesPath, filesPath, connection) => {
	router.post('/', async (req, res) => {
		const { fileType, type, cliente, divisa, desdeFecha, hastaFecha } = req.query

		if (!['pdf', 'csv'].includes(fileType)) {
			return res.status(400).json({ error: 'Invalid filetype value' })
		}

		if (!['ctacte', 'caja', 'saldos', 'movimientos'].includes(type)) {
			return res.status(400).json({ error: 'Invalid type value.' })
		}

		if (type == 'ctacte' && !cliente) {
			return res.status(400).json({ error: 'Cliente parameter missing' })
		} else if (type == 'caja' && !divisa) {
			return res.status(400).json({ error: 'Divisa parameter missing' })
		}

		// Grab JSON by making a query
		const queryFile = `${type}.sql`
		const queryPath = path.join(queryDir, queryFile)

		if (fs.existsSync(queryPath)) {
			let query = fs.readFileSync(queryPath, 'utf8')

			const params = []
			let condition = ''

			// Append query conditions
			if (type == 'movimientos') {
				if (desdeFecha && hastaFecha) {
					condition = ` WHERE DATE(o.fecha) BETWEEN ? AND ?`
					params.push(desdeFecha, hastaFecha)
				} else if (desdeFecha) {
					condition = ` WHERE DATE(o.fecha) >= ?`
					params.push(desdeFecha)
				} else if (hastaFecha) {
					condition = ` WHERE DATE(o.fecha) <= ?`
					params.push(hastaFecha)
				}
				query = query + condition + ' ORDER BY o.fecha DESC;'
			} else if (type == 'caja') {
				condition = ` WHERE c.tipo = 'caja' AND t.divisa = ?;`
				params.push(divisa)
				query += condition
			} else if (type == 'ctacte') {
				condition = ` WHERE c.tipo = 'cuenta corriente' AND c1.id = ?;`
				params.push(cliente)
				query += condition
			}

			connection.query(query, params, async (error, results) => {
				if (error) {
					return res.status(500).json({ error: 'Database query error.' })
				}

				const jsonData = results

				// Caching logic
				const currentTimestamp = new Date().getTime()

				// Check if the report of the same type has been generated in the last 10 minutes
				if (
					(type === 'caja' &&
						reportCache[`${type}_${divisa}`] &&
						currentTimestamp - reportCache[`${type}_${divisa}`] < 600000) ||
					(!['caja', 'ctacte'].includes(type) && reportCache[type] && currentTimestamp - reportCache[type] < 600000)
				) {
					return res.status(429).json({ error: 'Report recently generated. Please try again later.' })
				}

				if (jsonData.length == 0) {
					return res.status(500).json({ error: 'The query returned no rows' })
				} else if (jsonData.length > 0) {
					console.log(`Query of type ${type} done successfully`)

					let transformedData

					if (type == 'ctacte') {
						transformedData = transformCuenta(jsonData)
					} else if (type == 'caja') {
						transformedData = transformCaja(jsonData)
					} else if (type == 'movimientos') {
						transformedData = addCambioToObjects(jsonData)
					} else if (type == 'saldos') {
						transformedData = jsonData.map(item => {
							return {
								cliente: item.cliente,
								usd: parseFloat(item.usd),
								usdt: parseFloat(item.usdt),
								ars: parseFloat(item.ars),
								eur: parseFloat(item.eur),
								brl: parseFloat(item.brl),
							}
						})
					}

					let response

					if (fileType == 'pdf') {
						response = await generatePDF(
							templatesPath,
							filesPath,
							transformedData,
							type,
							cliente,
							divisa,
							desdeFecha,
							hastaFecha,
							res
						)

						if (JSON.stringify(response) !== '{}') {
							const result = await uploadFile(response.filepath, response.filename)
							console.log(result)
							res.status(200).json(result)
						}
					} else if (fileType == 'csv') {
						response = generateCSV(filesPath, jsonData, type, cliente, divisa, desdeFecha, hastaFecha, res)
						console.log(response)
						if (JSON.stringify(response) !== '{}') {
							const result = await uploadFile(response.filepath, response.filename)
							console.log(result)
							res.status(200).json(result)
						}
					}

					// Store the timestamp in the cache after generating the report
					if (type === 'caja') {
						reportCache[`${type}_${divisa}`] = currentTimestamp
					} else {
						reportCache[type] = currentTimestamp
					}
				}
			})
		}
	})

	return router
}
