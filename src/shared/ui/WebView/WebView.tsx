import { useState, type ComponentType, type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import { useTranslation } from '@shared/lib/i18n';
import { EmptyState } from '../EmptyState';
import { Spinner } from '../Spinner';
import { isAllowedUrl } from './origin';

// The props this wrapper passes. The library declares its component as
// Component<WebViewProps & P> with P defaulting to undefined, which TypeScript
// reduces to `never`, so the subset is stated here.
type NativeProps = {
  testID?: string | undefined;
  source: { uri: string };
  style: StyleProp<ViewStyle>;
  originWhitelist: string[];
  onShouldStartLoadWithRequest: (request: { url: string }) => boolean;
  onMessage: (event: { nativeEvent: { data: string } }) => void;
  onLoadEnd?: (() => void) | undefined;
  onError: () => void;
  onHttpError: () => void;
  startInLoadingState: boolean;
  renderLoading: () => ReactElement;
  allowFileAccess: boolean;
  allowsLinkPreview: boolean;
  mixedContentMode: 'never';
  setSupportMultipleWindows: boolean;
};

const NativeWebView = RNWebView as unknown as ComponentType<NativeProps>;

type Props = {
  uri: string;
  // Origins this view may load, such as ['https://pay.example.com']. Anything
  // else is stopped and reported through onBlocked.
  allowedOrigins: readonly string[];
  // A link that left the allowed origins, or a tel: or mailto: link. Open it
  // with openUrl from @shared/lib/linking if the app should follow it.
  onBlocked?: (url: string) => void;
  // window.ReactNativeWebView.postMessage(...) from the page.
  onMessage?: (data: string) => void;
  onLoadEnd?: () => void;
  testID?: string;
};

// For pages the app must show inside itself: a payment or 3-D Secure step,
// terms, a help centre. It only ever loads the origins it is given.
export function WebView({
  uri,
  allowedOrigins,
  onBlocked,
  onMessage,
  onLoadEnd,
  testID,
}: Props) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  if (!isAllowedUrl(uri, allowedOrigins) || failed) {
    return (
      <EmptyState
        icon="triangle-alert"
        title={t('errorTitle')}
        {...(isAllowedUrl(uri, allowedOrigins) && {
          actionLabel: t('retry'),
          onAction: () => setFailed(false),
        })}
      />
    );
  }

  return (
    <NativeWebView
      testID={testID}
      source={{ uri }}
      style={styles.fill}
      originWhitelist={[...allowedOrigins]}
      onShouldStartLoadWithRequest={request => {
        if (isAllowedUrl(request.url, allowedOrigins)) {
          return true;
        }
        onBlocked?.(request.url);
        return false;
      }}
      onMessage={event => onMessage?.(event.nativeEvent.data)}
      onLoadEnd={onLoadEnd}
      onError={() => setFailed(true)}
      onHttpError={() => setFailed(true)}
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <Spinner size="large" />
        </View>
      )}
      // A page gets no more reach into the device than it needs.
      allowFileAccess={false}
      allowsLinkPreview={false}
      mixedContentMode="never"
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center' },
});
