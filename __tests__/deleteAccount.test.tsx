/**
 * Google Play account deletion: every signed-in role can reach "Delete
 * account" in the app, and it opens the web page the Play listing points at.
 */
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../src/lib/supabase', () => ({ supabase: { rpc: jest.fn(), from: jest.fn() } }));
// moti's skeleton resolves its own React copy under Jest (see skeletonResolution.test.ts).
jest.mock('../src/components/ui/Skeleton', () => ({ Skeleton: () => null }));
jest.mock('../src/services/toastService', () => ({ toastService: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }));

import { supabase } from '../src/lib/supabase';
import { toastService } from '../src/services/toastService';
import { WEB_APP_URL } from '../src/config/web';
import { DELETE_ACCOUNT_URL, DeleteAccountLink } from '../src/features/support/DeleteAccountLink';
import { HelpButton } from '../src/features/support/HelpButton';

declare const __dirname: string;
const fs = require('fs') as { readFileSync(p: string, e: string): string };
const path = require('path') as { join(...p: string[]): string };
const read = (rel: string) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const byId = (root: ReactTestInstance, id: string) => root.findAll(node => node.props.testID === id)[0];
const has = (root: ReactTestInstance, id: string) => root.findAll(node => node.props.testID === id).length > 0;

const mount = async (element: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <SafeAreaProvider initialMetrics={metrics}>{element}</SafeAreaProvider>
      </QueryClientProvider>,
    );
  });
  return renderer;
};

afterEach(() => jest.restoreAllMocks());

describe('Delete account link', () => {
  it('points at the web app /delete-account page', () => {
    expect(DELETE_ACCOUNT_URL).toBe(`${WEB_APP_URL}/delete-account`);
    expect(DELETE_ACCOUNT_URL).toMatch(/^https:\/\/[^/]+\/delete-account$/);
  });

  it('opens that page in the browser', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const renderer = await mount(<DeleteAccountLink />);
    const link = byId(renderer.root, 'delete-account-link');
    expect(link).toBeDefined();
    await act(async () => {
      await link.props.onPress();
    });
    expect(open).toHaveBeenCalledWith(DELETE_ACCOUNT_URL);
    act(() => renderer.unmount());
  });

  it('no browser: tells the person the address instead', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no activity'));
    const renderer = await mount(<DeleteAccountLink />);
    await act(async () => {
      await byId(renderer.root, 'delete-account-link').props.onPress();
    });
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining(DELETE_ACCOUNT_URL));
    act(() => renderer.unmount());
  });

  it('is in the Help sheet (owner Today, reception desk, doctor dashboard)', async () => {
    (supabase.rpc as unknown as jest.Mock).mockResolvedValue({ data: {}, error: null });
    const renderer = await mount(<HelpButton />);
    expect(has(renderer.root, 'delete-account-link')).toBe(false);
    await act(async () => {
      byId(renderer.root, 'help-button').props.onPress();
    });
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });
    expect(has(renderer.root, 'delete-account-link')).toBe(true);
    act(() => renderer.unmount());
  });
});

describe('every role can reach it', () => {
  // Each role's profile / settings screen renders <DeleteAccountLink />.
  it.each([
    ['patient profile', 'src/features/profile/components/ProfileScreen.tsx'],
    ['patient settings', 'src/features/profile/components/SettingsScreen.tsx'],
    ['doctor profile', 'src/features/doctor/screens/ProfileScreen.tsx'],
    ['admin system tab', 'src/features/admin/components/AdminManageScreen.tsx'],
    ['help sheet', 'src/features/support/HelpButton.tsx'],
  ])('%s', (_role, file) => {
    expect(read(file)).toMatch(/<DeleteAccountLink\b/);
  });

  // Owners and receptionists have no profile screen: the Help sheet in their
  // headers is where they find it.
  it.each([
    ['receptionist desk', 'src/features/staff/screens/ReceptionScreen.tsx'],
    ['owner Today', 'src/features/staff/screens/OwnerHomeScreen.tsx'],
  ])('%s has the Help button', (_role, file) => {
    expect(read(file)).toMatch(/<HelpButton\b/);
  });
});
