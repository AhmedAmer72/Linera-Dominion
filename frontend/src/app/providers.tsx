'use client';

import { ApolloProvider } from '@apollo/client';
import { lineraClient } from '@/lib/apollo';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={lineraClient}>
      {children}
    </ApolloProvider>
  );
}
