import { AppEco } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type DialogMode = 'message' | 'confirm';

type DialogPayload = {
  mode: DialogMode;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  destructive: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type ShowMessageOpts = {
  title: string;
  message: string;
  confirmText?: string;
  onClose?: () => void;
};

type ShowConfirmOpts = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type AppDialogContextValue = {
  showMessage: (opts: ShowMessageOpts) => void;
  showConfirm: (opts: ShowConfirmOpts) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog phải dùng bên trong AppDialogProvider');
  }
  return ctx;
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogPayload | null>(null);

  const close = useCallback(() => setDialog(null), []);

  const showMessage = useCallback((opts: ShowMessageOpts) => {
    setDialog({
      mode: 'message',
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText ?? 'Đồng ý',
      cancelText: '',
      destructive: false,
      onConfirm: () => {
        close();
        opts.onClose?.();
      },
    });
  }, [close]);

  const showConfirm = useCallback((opts: ShowConfirmOpts) => {
    setDialog({
      mode: 'confirm',
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText ?? 'Xác nhận',
      cancelText: opts.cancelText ?? 'Huỷ',
      destructive: opts.destructive ?? false,
      onConfirm: () => {
        close();
        opts.onConfirm?.();
      },
      onCancel: () => {
        close();
        opts.onCancel?.();
      },
    });
  }, [close]);

  const value = useMemo(
    () => ({ showMessage, showConfirm }),
    [showMessage, showConfirm],
  );

  const handleBackdrop = () => {
    if (dialog?.mode === 'message') {
      dialog.onConfirm?.();
      return;
    }
    dialog?.onCancel?.();
  };

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <Modal
        visible={dialog != null}
        transparent
        animationType="fade"
        onRequestClose={handleBackdrop}
      >
        <Pressable style={styles.overlay} onPress={handleBackdrop}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.iconWrap,
                dialog?.destructive ? styles.iconWrapDanger : styles.iconWrapPrimary,
              ]}
            >
              {dialog?.destructive ? (
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={28}
                  color={AppEco.danger}
                />
              ) : (
                <Ionicons
                  name={dialog?.mode === 'confirm' ? 'help-circle-outline' : 'information-circle-outline'}
                  size={28}
                  color={AppEco.primary}
                />
              )}
            </View>

            <Text style={styles.title}>{dialog?.title}</Text>
            <Text style={styles.message}>{dialog?.message}</Text>

            <View style={dialog?.mode === 'confirm' ? styles.actionsRow : styles.actionsSingle}>
              {dialog?.mode === 'confirm' ? (
                <>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary]}
                    onPress={() => dialog.onCancel?.()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnSecondaryText}>{dialog.cancelText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      dialog.destructive ? styles.btnDanger : styles.btnPrimary,
                    ]}
                    onPress={() => dialog.onConfirm?.()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnPrimaryText}>{dialog.confirmText}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary, styles.btnFull]}
                  onPress={() => dialog?.onConfirm?.()}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnPrimaryText}>{dialog?.confirmText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppDialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 78, 74, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusXl,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: AppEco.radiusFull,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapPrimary: {
    backgroundColor: AppEco.surfaceMuted,
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppEco.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: AppEco.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionsSingle: {
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: AppEco.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: {
    flex: 0,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: AppEco.primary,
    ...AppEco.shadowCard,
  },
  btnDanger: {
    backgroundColor: AppEco.danger,
    ...AppEco.shadowCard,
  },
  btnSecondary: {
    backgroundColor: AppEco.surfaceMuted,
    borderWidth: 2,
    borderColor: AppEco.border,
  },
  btnPrimaryText: {
    color: AppEco.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondaryText: {
    color: AppEco.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
