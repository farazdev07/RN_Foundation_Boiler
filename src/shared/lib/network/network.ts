import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

// A captive portal or a router with no uplink reports isConnected while no
// request can succeed, so isInternetReachable === false counts as offline. null
// means "not probed yet" and is not evidence of an outage.
export const isOnline = ({
  isConnected,
  isInternetReachable,
}: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean =>
  isConnected === true && isInternetReachable !== false;

export const subscribeToConnectivity = (
  listener: (online: boolean) => void,
): (() => void) => NetInfo.addEventListener(state => listener(isOnline(state)));

export const useIsOnline = (): boolean => {
  const [online, setOnline] = useState(true);

  useEffect(() => subscribeToConnectivity(setOnline), []);

  return online;
};
