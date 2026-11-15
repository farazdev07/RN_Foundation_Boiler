import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { getErrorMessage } from '@shared/api';
import { useZodForm } from '@shared/lib/form';
import { useTranslation } from '@shared/lib/i18n';
import {
  Button,
  FormCheckbox,
  FormTextInput,
  Text,
  makeStyles,
} from '@shared/ui';
import { loginSchema } from '../model/loginSchema';
import { rememberedUsername } from '../model/rememberedUsername';
import { useLogin } from '../model/useLogin';

const useStyles = makeStyles(({ spacing }) => ({
  form: { gap: spacing.md },
}));

// The reference form: a zod schema, useZodForm, and Form* fields. Copy this
// shape for any new form.
export function LoginForm() {
  const styles = useStyles();
  const { t } = useTranslation('auth');
  const { submit, isLoading, error, reset } = useLogin();

  const schema = useMemo(() => loginSchema(t('required')), [t]);
  const { control, submitWith, setFocus, subscribe } = useZodForm(schema, {
    defaultValues: {
      username: rememberedUsername.get() ?? '',
      password: '',
      remember: true,
    },
  });

  // A server error describes the last attempt, so editing a field clears it.
  useEffect(
    () => subscribe({ formState: { values: true }, callback: () => reset() }),
    [subscribe, reset],
  );

  const onSubmit = submitWith(submit);

  return (
    <View style={styles.form}>
      <FormTextInput
        control={control}
        name="username"
        testID="login-username"
        label={t('username')}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
      />
      <FormTextInput
        control={control}
        name="password"
        testID="login-password"
        label={t('password')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <FormCheckbox control={control} name="remember" label={t('rememberMe')} />
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
