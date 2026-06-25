import {
  hydrateAuthFromStorage,
  setAuthRouteChecker,
  setSessionExpiredHandler,
} from '@/src/auth/session';
import { router, useSegments } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppEco } from '@/constants/theme';

/** Khôi phục token trước khi render app; cấu hình redirect khi hết phiên. */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    setAuthRouteChecker(() => segmentsRef.current[0] === '(auth)');
  }, [segments]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (segmentsRef.current[0] === '(auth)') return;
      router.replace('/(auth)/login' as never);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    void hydrateAuthFromStorage().finally(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: AppEco.background,
        }}
      >
        <ActivityIndicator size="large" color={AppEco.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
