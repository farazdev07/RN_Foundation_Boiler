import { useRef, useState, type ComponentRef } from 'react';
import { View, type TextInput as RNTextInput } from 'react-native';
import { getErrorMessage } from '@shared/api';
import { useTranslation } from '@shared/lib/i18n';
import { Button, Checkbox, Text, TextInput, makeStyles } from '@shared/ui';
import { rememberedUsername } from '../model/rememberedUsername';
import { useLogin } from '../model/useLogin';

const useStyles = makeStyles(({ spacing }) => ({
  form: { gap: spacing.md },
}));

export function LoginForm() {
  const styles = useStyles();
  const { t } = useTranslation('auth');
  const { submit, isLoading, error, reset } = useLogin();
  const passwordRef = useRef<ComponentRef<typeof RNTextInput>>(null);

  const [username, setUsername] = useState(
    () => rememberedUsername.get() ?? '',
  );
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showRequired, setShowRequired] = useState(false);

  const onSubmit = () => {
    if (!username.trim() || !password) {
      setShowRequired(true);
      return;
    }
    submit({ username: username.trim(), password, remember });
  };

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) {
      reset();
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        testID="login-username"
        label={t('username')}
        value={username}
        onChangeText={edit(setUsername)}
        error={showRequired && !username.trim() ? t('required') : undefined}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextInput
        ref={passwordRef}
        testID="login-password"
        label={t('password')}
        value={password}
        onChangeText={edit(setPassword)}
        error={showRequired && !password ? t('required') : undefined}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <Checkbox
        label={t('rememberMe')}
        checked={remember}
        onChange={setRemember}
      />
      {error ? (
        <Text color="error" accessibilityRole="alert">
          {getErrorMessage(error)}
        </Text>
      ) : null}
      <Button
        testID="login-submit"
        title={t('signIn')}
        loading={isLoading}
        onPress={onSubmit}
      />
    </View>
  );
}
