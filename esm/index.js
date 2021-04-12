import { Command } from 'commander'
import _ from 'lodash'

import { connect } from './graphql/connect'
import { findDefinitionByName, parseFile } from './graphql/document'
import {
	executeDefinition,
	createPipeline,
	pipeDefinition,
	pipeDocument,
} from './pipeline'

const program = new Command()
program
	.option('-s, --single', 'execute a single operation, non-pipe mode')
	.option('-p, --path <path>', 'only available in single-mode, return operation result value at path')
	.option('-i, --insecure', 'disable ssl verification')
	.requiredOption('-u, --uri <uri>', 'uri of the graphql endpoint')
	.option('-a, --admin-secret <secret>', 'hasura admin secret')
	.option('-t, --token <token>', 'bearer token')
	.requiredOption('-d, --document <document>', 'graphql document path')
	.option('-n, --operation-name <name>', 'graphql operation name')
	.parse(process.argv)

const options = program.opts()
const graphqlPath = options?.document
const graphqlOperation = options?.operationName
const graphqlDocument = parseFile(graphqlPath)

function handleError(error) {
	console.error(error)
	process.exit(1)
}

function handleSuccess(data) {
	console.log(JSON.stringify(data))
}

if (options.insecure) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const client = connect({
	uri: options?.uri,
	token: options?.token,
	adminSecret: options?.adminSecret,
})

if (options.single) {
	if (graphqlOperation) {
		const definition = findDefinitionByName(graphqlDocument, graphqlOperation)
		executeDefinition(
			client,
			definition,
			options.path
			? (data => {
				console.log(_.get(data, options.path))
				process.exit(0)
			})
			: (data => {
				console.log(JSON.stringify(data))
				process.exit(0)
			}),
			handleError,
		)
	}
} else {
	const pipeline = createPipeline(process.stdin)
	pipeline.on('error', handleError)
	pipeline.on('end', () => process.exit(0))
	
	const handlers = {
		mutation: handleSuccess,
		query: handleSuccess,
		error: handleError,
	}
	
	if (graphqlOperation) {
		const definition = findDefinitionByName(graphqlDocument, graphqlOperation)
		pipeDefinition(pipeline, client, definition, handlers)
	} else {
		pipeDocument(pipeline, client, graphqlDocument, handlers)
	}
}
