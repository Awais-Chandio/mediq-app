/**
 * Login screen: "Naya clinic? Register karein" opens the web onboarding in the
 * browser. Google Play: no prices and no payment links in the app.
 */
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

jest.mock('../src/services/toastService', () => ({ toastService: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }));

import { toastService } from '../src/services/toastService';
import { WEB_APP_URL, clinicOnboardingUrl } from '../src/config/web';
import { RegisterClinicLink } from '../src/features/auth/components/RegisterClinicLink';

declare const __dirname: string;
const fs = require('fs') as { readFileSync(p: string, e: string): string };
const path = require('path') as { join(...p: string[]): string };
const read = (rel: string) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const NO_MONEY = /\bRs\.?\s?\d|price|pricing|\bpay(ment)?\b|upgrade|\bbuy\b|kharid|plan|settings\/plan|pay-claim|plan-claim/i;

const byId = (root: ReactTestInstance, id: string) => root.findAll(node => node.props.testID === id)[0];
const text = (root: ReactTestInstance) =>
  root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => [node.props.children].flat().filter(c => typeof c === 'string').join(''))
    .join('');

const mount = async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<RegisterClinicLink />);
  });
  return renderer;
};

afterEach(() => jest.restoreAllMocks());

describe('Register clinic link', () => {
  it('goes to the web onboarding, marked as opened from the app', () => {
    expect(clinicOnboardingUrl()).toBe(`${WEB_APP_URL}/onboarding?from=app`);
    expect(clinicOnboardingUrl()).toMatch(/^https:\/\/[^/]+\/onboarding\?from=app$/);
  });

  it('says "Naya clinic? Register karein"', async () => {
    const renderer = await mount();
    expect(text(renderer.root)).toBe('Naya clinic? Register karein');
    act(() => renderer.unmount());
  });

  it('opens the onboarding page in the browser', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const renderer = await mount();
    await act(async () => {
      await byId(renderer.root, 'register-clinic-link').props.onPress();
    });
    expect(open).toHaveBeenCalledWith(clinicOnboardingUrl());
    act(() => renderer.unmount());
  });

  it('no browser: tells the person the address instead', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no activity'));
    const renderer = await mount();
    await act(async () => {
      await byId(renderer.root, 'register-clinic-link').props.onPress();
    });
    expect(toastService.error).toHaveBeenCalledWith(expect.stringContaining('/onboarding?from=app'));
    act(() => renderer.unmount());
  });

  it('no prices and no payment links (Google Play)', async () => {
    const renderer = await mount();
    expect(text(renderer.root)).not.toMatch(NO_MONEY);
    expect(clinicOnboardingUrl()).not.toMatch(NO_MONEY);
    act(() => renderer.unmount());
  });

  it('is on the login screen', () => {
    expect(read('src/features/auth/components/LoginScreen.tsx')).toMatch(/<RegisterClinicLink\s*\/>/);
  });
});
