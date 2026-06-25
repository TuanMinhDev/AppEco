import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  FieldValues,
  Path,
  useController,
  UseControllerProps,
} from 'react-hook-form';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

/** Props giúp bàn phím tiếng Việt / IME hoạt động ổn trên iOS & Android */
export const vietnameseTextInputProps = {
  autoCorrect: true,
  spellCheck: true,
  autoComplete: 'off' as const,
  textContentType: 'none' as const,
} satisfies Partial<TextInputProps>;

function toInputString(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

const NON_VI_KEYBOARD_TYPES: TextInputProps['keyboardType'][] = [
  'phone-pad',
  'number-pad',
  'decimal-pad',
  'numeric',
  'email-address',
];

type OwnProps = TextInputProps & {
  label?: string;
  errorText?: string;
  onPressForgot?: () => void;
};

// Standalone mode (không dùng react-hook-form)
type StandaloneProps = OwnProps & {
  name?: undefined;
  control?: undefined;
};

// Controlled mode (dùng react-hook-form)
type ControlledProps<T extends FieldValues> = Omit<OwnProps, 'value' | 'onChangeText'> &
  UseControllerProps<T> & {
    name: Path<T>;
  };

type AppInputProps<T extends FieldValues> = StandaloneProps | ControlledProps<T>;

export function AppInput<T extends FieldValues = FieldValues>(props: AppInputProps<T>) {
  if (props.control !== undefined) {
    return <ControlledAppInput {...(props as ControlledProps<T>)} />;
  }
  return <BaseAppInput {...(props as StandaloneProps)} />;
}

// Component nội bộ: dùng react-hook-form
function ControlledAppInput<T extends FieldValues>({
  label,
  errorText,
  style,
  name,
  control,
  rules,
  defaultValue,
  keyboardType,
  ...inputProps
}: ControlledProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control, rules, defaultValue });

  const displayValue =
    value == null || value === undefined ? '' : String(value);

  return (
    <BaseAppInput
      label={label}
      style={style}
      value={displayValue}
      onChangeText={onChange}
      onBlur={onBlur}
      errorText={error?.message ?? errorText}
      keyboardType={keyboardType}
      {...inputProps}
    />
  );
}

// Component nền tảng: render UI thuần
function BaseAppInput({
  label,
  errorText,
  style,
  secureTextEntry,
  value,
  onChangeText,
  onFocus,
  onBlur,
  keyboardType,
  ...props
}: OwnProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry;
  const isControlled = value !== undefined;
  const externalValue = toInputString(value);
  const [text, setText] = useState(() => (isControlled ? externalValue : ''));
  const isFocusedRef = useRef(false);

  // Tránh ghi đè chữ đang gõ (Telex/VNI/IME) khi react-hook-form re-render
  useEffect(() => {
    if (!isControlled || isFocusedRef.current) return;
    setText(externalValue);
  }, [externalValue, isControlled]);

  const viProps =
    keyboardType && NON_VI_KEYBOARD_TYPES.includes(keyboardType)
      ? {}
      : vietnameseTextInputProps;

  const handleChangeText = (next: string) => {
    setText(next);
    onChangeText?.(next);
  };

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    isFocusedRef.current = true;
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    isFocusedRef.current = false;
    if (isControlled) setText(externalValue);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={AppEco.textMuted}
          secureTextEntry={isPassword && !isPasswordVisible}
          value={text}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType ?? 'default'}
          {...viProps}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={AppEco.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!errorText && <Text style={styles.error}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppEco.primary,
    paddingLeft: 4,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    borderRadius: AppEco.radiusLg,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: AppEco.surface,
    color: AppEco.text,
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  error: {
    color: AppEco.danger,
    fontSize: 12,
  },
});
