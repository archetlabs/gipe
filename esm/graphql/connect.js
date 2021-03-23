import { WebSocketLink } from '@apollo/client/link/ws'
import { ApolloClient } from '@apollo/client/core'
import { InMemoryCache } from '@apollo/client/cache'
import ws from 'ws'

export function connect({ uri, adminSecret, token }) {
	const defaultOptions = {
		watchQuery: {
			fetchPolicy: 'no-cache',
			errorPolicy: 'ignore',
		},
		query: {
			fetchPolicy: 'no-cache',
			errorPolicy: 'all',
		},
		mutate: {
			errorPolicy: 'all',
		},
	}
	
	const link = new WebSocketLink({
		uri, 
		webSocketImpl: ws,
		options: {
			reconnect: true,
			connectionParams: {
				headers: {
					'Content-Type': 'application/json',
					...(adminSecret ? ({ 'x-hasura-admin-secret': adminSecret }) : null),
					...(token ? ({ 'Authorization': `Bearer ${token}` }) : null),
				},
			},
		}
	})
	
	const cache = new InMemoryCache({
		addTypename: false,
	})
	
	const client = new ApolloClient({
		link,
		cache,
		defaultOptions,
	})

	return client
}

