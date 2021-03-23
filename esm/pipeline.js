import { streamValues } from 'stream-json/streamers/StreamValues'
import { parser as jsonParser } from 'stream-json'
import { chain } from 'stream-chain'

export function createPipeline(input) {
	return chain([
		input,
		jsonParser({ jsonStreaming: true }),
		streamValues(),
		data => data.value,
	])
}

export function pipe(pipeline, client, definition, { mutation, query, error }) {
	const operationType = definition.definitions[0].operation
	switch (operationType) {
		case 'mutation':
			pipeline.on('data', async variables => {
				try {
					const result = await client.mutate({
						mutation: definition,
						variables,
					})
					mutation && mutation(JSON.stringify(result.data))
				} catch (e) {
					error && error(e)
				}
			})
			break
		case 'query':
			pipeline.on('data', async variables => {
				try {
					const result = await client.query({
						query: definition,
						variables,
					})
					query && query(JSON.stringify(result.data))
				} catch (e) {
					error && error(e)
				}
			})
			break
	}
}
