/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from '@app/App';
import { initMonitoring } from '@app/monitoring/sentry'; // @unit:sentry
import { name as appName } from './app.json';

initMonitoring(); // @unit:sentry
AppRegistry.registerComponent(appName, () => App);
