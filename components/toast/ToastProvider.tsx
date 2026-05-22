import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error';

type ShowOpts = {
  /** Mặc định: success ~2.2s, error ~3.2s */
  duration?: number;
  /** Gọi sau khi toast ẩn xong (kể cả khi chạm để đóng) */
  onHidden?: () => void;
};

type ToastContextValue = {
  showSuccess: (message: string, opts?: ShowOpts) => void;
  showError: (message: string, opts?: ShowOpts) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 2200,
  error: 3200,
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải dùng bên trong ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<{ type: ToastType; message: string } | null>(
    null,
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOnHidden = useRef<(() => void) | undefined>(undefined);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const runHide = useCallback(() => {
    clearTimer();
    const cb = pendingOnHidden.current;
    pendingOnHidden.current = undefined;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setPayload(null);
        cb?.();
      }
    });
  }, [clearTimer, opacity, scale]);

  const show = useCallback(
    (type: ToastType, message: string, opts?: ShowOpts) => {
      clearTimer();
      pendingOnHidden.current = opts?.onHidden;
      opacity.setValue(0);
      scale.setValue(0.92);
      setPayload({ type, message });

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 9,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const ms = opts?.duration ?? DEFAULT_DURATION[type];
      hideTimer.current = setTimeout(() => {
        runHide();
      }, ms);
    },
    [clearTimer, opacity, scale, runHide],
  );

  const showSuccess = useCallback(
    (message: string, opts?: ShowOpts) => show('success', message, opts),
    [show],
  );

  const showError = useCallback(
    (message: string, opts?: ShowOpts) => show('error', message, opts),
    [show],
  );

  const hide = useCallback(() => {
    runHide();
  }, [runHide]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, hide }}>
      <View style={styles.flex}>
        {children}
        {payload ? (
          <View
            style={[StyleSheet.absoluteFill, styles.overlay]}
            pointerEvents="box-none"
          >
            <Pressable style={styles.backdrop} onPress={runHide} />
            <View style={styles.center} pointerEvents="box-none">
              <Animated.View
                style={[
                  styles.card,
                  payload.type === 'success' ? styles.cardSuccess : styles.cardError,
                  { opacity, transform: [{ scale }] },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    payload.type === 'success' ? styles.iconOk : styles.iconBad,
                  ]}
                >
                  <Ionicons
                    name={payload.type === 'success' ? 'checkmark' : 'close'}
                    size={28}
                    color="#fff"
                  />
                </View>
                <Text style={styles.message}>{payload.message}</Text>
              </Animated.View>
            </View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { zIndex: 9999, elevation: 9999 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    maxWidth: 320,
    width: '100%',
    borderRadius: AppEco.radiusLg,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...AppEco.shadowSoft,
  },
  cardSuccess: {
    backgroundColor: AppEco.surface,
    borderWidth: 1.5,
    borderColor: AppEco.border,
  },
  cardError: {
    backgroundColor: AppEco.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(220, 38, 38, 0.35)',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconOk: {
    backgroundColor: AppEco.success,
  },
  iconBad: {
    backgroundColor: AppEco.danger,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: AppEco.text,
    textAlign: 'center',
    lineHeight: 24,
  },
});
