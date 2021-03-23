import { parse as graphqlParse } from 'graphql/language/parser'
import fs from 'fs'

export function findDefinitionByName(document, name) {
	let result = null

	for (const definition of document.definitions) {
		if (definition.name.value === name) {
			result = definition
			break
		}
	}

	if (result) {
		return ({
			kind: 'Document',
			definitions: [
				result,
			],
		})
	}

	return null
}

export function parseFile(path) {
	return graphqlParse(fs.readFileSync(path, { encoding: 'utf8', flag: 'r' }))
}
