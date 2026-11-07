import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './lifecycle';
import { selectSessionStatus, type SessionStatus } from './sessionSlice';

export const useSessionStatus = (): SessionStatus =>
  useSelector(selectSessionStatus);

export const useLogout = (): (() => Promise<void>) => {
  const dispatch = useDispatch();
  return useCallback(() => logout(dispatch), [dispatch]);
};
