'use client';

import { ApolloProvider } from '@apollo/client';
import { lineraClient } from '@/lib/apollo';
import { LineraProvider } from '@/lib/linera/LineraProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={lineraClient}>
      <LineraProvider>
        {children}
      </LineraProvider>
    </ApolloProvider>
  );
}
