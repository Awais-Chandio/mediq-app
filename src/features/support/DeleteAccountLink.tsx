import React from 'react';
import { Linking, type ViewStyle } from 'react-native';
import { UserX } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import AppButton from '../../components/ui/AppButton';
import { WEB_APP_URL } from '../../config/web';
import { toastService } from '../../services/toastService';

/**
 * Google Play: an app that lets people sign in must let them ask for their
 * account to be deleted from inside the app. The request form and what is
 * kept or removed live on the web (mediq-web /delete-account, EN + UR), the
 * same URL as the Play listing's "Delete account" link.
 */
export const DELETE_ACCOUNT_URL = `${WEB_APP_URL}/delete-account`;

export const openDeleteAccount = async () => {
  try {
    await Linking.openURL(DELETE_ACCOUNT_URL);
  } catch {
    toastService.error(`Couldn't open the browser. Visit ${DELETE_ACCOUNT_URL} to delete your account.`);
  }
};

/** "Delete account" on every role's profile / settings screen. */
export const DeleteAccountLink = ({ style }: { style?: ViewStyle }) => {
  const { colors } = useTheme();
  return (
    <AppButton
      title="Delete account"
      testID="delete-account-link"
      variant="ghost"
      size="sm"
      leftIcon={<UserX size={16} color={colors.error} />}
      textStyle={{ color: colors.error }}
      accessibilityHint="Opens the MediQ account deletion page in your browser"
      onPress={openDeleteAccount}
      style={style}
    />
  );
};

export default DeleteAccountLink;
