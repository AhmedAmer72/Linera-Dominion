import { useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useGameStore } from '@/store/gameStore';
import {
  GET_DOMINION_STATE,
  BUILD_STRUCTURE,
  BUILD_SHIPS,
  CREATE_FLEET,
  SEND_FLEET,
  START_RESEARCH,
} from '@/lib/queries';

// Hook to sync Linera state with the game store
export function useLineraSync() {
  const { connected, chainId, appId, setResources } = useGameStore();

  // Query game state if connected
  const { data, loading, error, refetch } = useQuery(GET_DOMINION_STATE, {
    skip: !connected,
    pollInterval: 5000, // Poll every 5 seconds
  });

  // Update store when data changes
  useEffect(() => {
    if (data) {
      setResources({
        iron: data.iron || 0,
        deuterium: data.deuterium || 0,
        crystals: data.crystals || 0,
      });
    }
  }, [data, setResources]);

  return { loading, error, refetch, connected };
}

// Hook for building operations
export function useBuildMutation() {
  const [buildMutation, { loading, error }] = useMutation(BUILD_STRUCTURE);

  const build = useCallback(
    async (buildingType: string, x: number, y: number) => {
      try {
        const result = await buildMutation({
          variables: { buildingType, x, y },
        });
        return result.data;
      } catch (err) {
        console.error('Build failed:', err);
        throw err;
      }
    },
    [buildMutation]
  );

  return { build, loading, error };
}

// Hook for fleet operations
export function useFleetMutations() {
  const [createFleetMutation] = useMutation(CREATE_FLEET);
  const [sendFleetMutation] = useMutation(SEND_FLEET);

  const createFleet = useCallback(
    async (ships: { shipType: string; quantity: number }[], name?: string) => {
      try {
        const result = await createFleetMutation({
          variables: { ships, name },
        });
        return result.data;
      } catch (err) {
        console.error('Create fleet failed:', err);
        throw err;
      }
    },
    [createFleetMutation]
  );

  const sendFleet = useCallback(
    async (
      fleetId: string,
      destinationX: number,
      destinationY: number,
      cargo?: { iron: number; deuterium: number; crystals: number }
    ) => {
      try {
        const result = await sendFleetMutation({
          variables: { fleetId, destinationX, destinationY, cargo },
        });
        return result.data;
      } catch (err) {
        console.error('Send fleet failed:', err);
        throw err;
      }
    },
    [sendFleetMutation]
  );

  return { createFleet, sendFleet };
}

// Hook for research operations
export function useResearchMutation() {
  const [researchMutation, { loading, error }] = useMutation(START_RESEARCH);

  const startResearch = useCallback(
    async (technology: string) => {
      try {
        const result = await researchMutation({
          variables: { technology },
        });
        return result.data;
      } catch (err) {
        console.error('Research failed:', err);
        throw err;
      }
    },
    [researchMutation]
  );

  return { startResearch, loading, error };
}

// Hook to check connection status
export function useConnectionStatus() {
  const { connected, chainId, appId, setConnection } = useGameStore();

  const connect = useCallback(
    (newChainId: string, newAppId: string) => {
      setConnection(newChainId, newAppId);
    },
    [setConnection]
  );

  return { connected, chainId, appId, connect };
}
