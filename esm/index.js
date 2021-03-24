import { Command } from 'commander'

import { connect } from './graphql/connect'
import { findDefinitionByName, parseFile } from './graphql/document'
import { createPipeline, pipeDefinition, pipeDocument } from './pipeline'

const program = new Command()
program
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

if (options.insecure) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const pipeline = createPipeline(process.stdin)
const client = connect({
	uri: options?.uri,
	token: options?.token,
	adminSecret: options?.adminSecret,
})

const handlers = {
	mutation: console.log,
	query: console.log,
	error: x => {
		console.error(x)
		process.exit(1)
	},
}

if (graphqlOperation) {
	const definition = findDefinitionByName(graphqlDocument, graphqlOperation)
	pipeDefinition(pipeline, client, definition, handlers)
} else {
	pipeDocument(pipeline, client, graphqlDocument, handlers)
}

