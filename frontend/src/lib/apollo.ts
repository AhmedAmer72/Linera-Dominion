import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

// Configuration for connecting to Linera GraphQL endpoints
const LINERA_CONFIG = {
  // These will be replaced with actual testnet URLs
  graphqlEndpoint: process.env.NEXT_PUBLIC_LINERA_GRAPHQL || 'http://localhost:9001/graphql',
  faucetEndpoint: process.env.NEXT_PUBLIC_LINERA_FAUCET || 'http://localhost:8080',
};

// Create Apollo Client for Linera
export function createLineraClient(endpoint?: string) {
  const httpLink = new HttpLink({
    uri: endpoint || LINERA_CONFIG.graphqlEndpoint,
    fetchOptions: {
      mode: 'cors',
    },
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Cache policies for game data
            dominionState: {
              merge: true,
            },
            fleets: {
              merge: false,
            },
            buildings: {
              merge: false,
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
  });
}

// Default client instance
export const lineraClient = createLineraClient();

// Helper to construct GraphQL endpoint from chain ID and app ID
export function buildGraphQLEndpoint(baseUrl: string, chainId: string, appId: string): string {
  return `${baseUrl}/chains/${chainId}/applications/${appId}`;
}

// Linera-specific types
export interface LineraConnection {
  chainId: string;
  appId: string;
  endpoint: string;
}

export { LINERA_CONFIG };
