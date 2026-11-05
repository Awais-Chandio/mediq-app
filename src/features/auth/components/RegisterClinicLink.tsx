import React from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { clinicOnboardingUrl } from '../../../config/web';
import { toastService } from '../../../services/toastService';
import { scaleFont } from '../../../utils/responsive';

/**
 * Login screen: clinic owners register on the web (MediQ onboarding), then
 * sign in here. Opens the browser; no prices or payment links in the app.
 */
export const openClinicOnboarding = async () => {
  const url = clinicOnboardingUrl();
  try {
    await Linking.openURL(url);
  } catch {
    toastService.error(`Couldn't open the browser. Visit ${url} to register your clinic.`);
  }
};

export const RegisterClinicLink = () => {
  const { colors } = useTheme();
  return (
    <Pressable
      testID="register-clinic-link"
      onPress={openClinicOnboarding}
      accessibilityRole="link"
      accessibilityHint="Opens clinic registration in your browser"
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Naya clinic? <Text style={[styles.link, { color: colors.primary }]}>Register karein</Text>
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  text: { fontSize: scaleFont(13) },
  link: { fontWeight: '800' },
});

export default RegisterClinicLink;
