import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth, useSignUp, useSSO } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link, useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';

// Android browser warm-up
const useWarmUpBrowser = () => {
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

WebBrowser.maybeCompleteAuthSession();

// --- Apple Logo SVG ---
function AppleLogo({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                fill={color}
            />
        </Svg>
    );
}

// --- Google Logo SVG ---
function GoogleLogo({ size = 20 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
            />
            <Path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <Path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <Path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </Svg>
    );
}

export default function SignUpScreen() {
    useWarmUpBrowser();

    const { signUp, errors, fetchStatus } = useSignUp();
    const { isSignedIn } = useAuth();
    const { startSSOFlow } = useSSO();
    const router = useRouter();
    const colors = useThemeColors();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [code, setCode] = useState('');
    const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);

    const loading = fetchStatus === 'fetching';

    const onSignUp = async () => {
        if (!email.trim() || !password.trim()) return;

        const { error } = await signUp.password({
            emailAddress: email.trim(),
            password: password,
        });

        if (error) {
            console.error('Sign up error:', JSON.stringify(error, null, 2));
            return;
        }

        if (!error) {
            await signUp.verifications.sendEmailCode();
        }
    };

    const onVerify = async () => {
        if (!code.trim()) return;

        await signUp.verifications.verifyEmailCode({
            code: code.trim(),
        });

        if (signUp.status === 'complete') {
            await signUp.finalize({
                navigate: ({ session, decorateUrl }) => {
                    const url = decorateUrl('/');
                    if (typeof url === 'string' && url.startsWith('http')) {
                        // web
                    } else {
                        router.replace(url as Href);
                    }
                },
            });
        } else {
            console.error('Sign-up not complete:', signUp);
        }
    };

    const onOAuthPress = useCallback(async (strategy: 'oauth_apple' | 'oauth_google') => {
        setOauthLoading(strategy === 'oauth_apple' ? 'apple' : 'google');
        try {
            const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
                strategy,
                redirectUrl: Linking.createURL('/oauth-native-callback', { scheme: 'unutmaapp' }),
            });

            if (createdSessionId) {
                setActive!({
                    session: createdSessionId,
                    navigate: async ({ session, decorateUrl }) => {
                        if (session?.currentTask) {
                            console.log(session?.currentTask);
                            return;
                        }
                        router.replace(decorateUrl('/') as Href);
                    },
                });
            } else {
                if (signUp?.status === 'missing_requirements') {
                    console.warn('OAuth signUp missing requirements:', signUp.missingFields);
                }
            }
        } catch (err) {
            console.error('OAuth error:', JSON.stringify(err, null, 2));
        } finally {
            setOauthLoading(null);
        }
    }, [startSSOFlow, router]);

    const styles = makeStyles(colors);

    // Signed in or complete — render nothing
    if (signUp.status === 'complete' || isSignedIn) {
        return null;
    }

    // Doğrulama aşaması
    const needsVerification =
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields?.includes('email_address') &&
        signUp.missingFields?.length === 0;

    if (needsVerification) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.inner}>
                    <View style={styles.headerSection}>
                        <View style={styles.verifyIconContainer}>
                            <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.appName}>Email Doğrulama</Text>
                        <Text style={styles.subtitle}>
                            {email} adresine gönderilen kodu girin
                        </Text>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="keypad-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Doğrulama kodu"
                                placeholderTextColor={colors.textMuted}
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                autoComplete="one-time-code"
                            />
                        </View>

                        {errors?.fields?.code && (
                            <Text style={styles.errorText}>{errors.fields.code.message}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                            onPress={onVerify}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.signInButtonText}>Doğrula</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={() => signUp.verifications.sendEmailCode()}
                            disabled={loading}
                        >
                            <Text style={styles.resendText}>Yeni kod gönder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.appName}>unutma</Text>
                    <Text style={styles.subtitle}>Yeni hesap oluştur</Text>
                </View>

                {/* OAuth Buttons */}
                <View style={styles.oauthSection}>
                    <TouchableOpacity
                        style={styles.appleButton}
                        onPress={() => onOAuthPress('oauth_apple')}
                        disabled={oauthLoading !== null}
                        activeOpacity={0.8}
                    >
                        {oauthLoading === 'apple' ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <AppleLogo size={20} color="#fff" />
                                <Text style={styles.appleButtonText}>Apple ile kayıt ol</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={() => onOAuthPress('oauth_google')}
                        disabled={oauthLoading !== null}
                        activeOpacity={0.8}
                    >
                        {oauthLoading === 'google' ? (
                            <ActivityIndicator color="#333" size="small" />
                        ) : (
                            <>
                                <GoogleLogo size={20} />
                                <Text style={styles.googleButtonText}>Google ile kayıt ol</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.textMuted + '30' }]} />
                    <Text style={styles.dividerText}>veya</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.textMuted + '30' }]} />
                </View>

                {/* Form */}
                <View style={styles.formSection}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />
                    </View>

                    {errors?.fields?.emailAddress && (
                        <Text style={styles.errorText}>{errors.fields.emailAddress.message}</Text>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifre (min. 8 karakter)"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    </View>

                    {errors?.fields?.password && (
                        <Text style={styles.errorText}>{errors.fields.password.message}</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.signInButton, (loading || !email || !password) && styles.signInButtonDisabled]}
                        onPress={onSignUp}
                        disabled={loading || !email || !password}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signInButtonText}>Kayıt Ol</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Clerk CAPTCHA */}
                <View nativeID="clerk-captcha" />

                {/* Footer */}
                <View style={styles.footerSection}>
                    <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
                    <Link href="/sign-in" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Giriş Yap</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const makeStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.backgroundDark,
        },
        inner: {
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 28,
        },
        headerSection: {
            alignItems: 'center',
            marginBottom: 32,
        },
        verifyIconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        appName: {
            fontSize: 42,
            fontWeight: '800',
            color: colors.primary,
            letterSpacing: -1,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textMuted,
            letterSpacing: 0.3,
            textAlign: 'center',
            paddingHorizontal: 20,
        },
        // OAuth
        oauthSection: {
            gap: 12,
            marginBottom: 24,
        },
        appleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: '#000',
            borderRadius: 14,
            height: 52,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
        },
        appleButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
        },
        googleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: '#fff',
            borderRadius: 14,
            height: 52,
            borderWidth: 1,
            borderColor: '#ddd',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
        },
        googleButtonText: {
            color: '#333',
            fontSize: 16,
            fontWeight: '600',
        },
        // Divider
        divider: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        dividerLine: {
            flex: 1,
            height: 1,
        },
        dividerText: {
            marginHorizontal: 16,
            fontSize: 13,
            color: colors.textMuted,
            fontWeight: '500',
        },
        // Form
        formSection: {
            gap: 14,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.textMuted + '30',
            paddingHorizontal: 16,
            height: 54,
        },
        inputIcon: {
            marginRight: 12,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: colors.textLight,
        },
        eyeButton: {
            padding: 4,
        },
        errorText: {
            color: colors.red,
            fontSize: 13,
            marginTop: -8,
            marginLeft: 4,
        },
        signInButton: {
            backgroundColor: colors.primary,
            borderRadius: 14,
            height: 54,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        signInButtonDisabled: {
            opacity: 0.6,
        },
        signInButtonText: {
            color: '#fff',
            fontSize: 17,
            fontWeight: '700',
            letterSpacing: 0.3,
        },
        resendButton: {
            alignItems: 'center',
            paddingVertical: 10,
        },
        resendText: {
            fontSize: 15,
            color: colors.primary,
            fontWeight: '600',
        },
        footerSection: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 32,
        },
        footerText: {
            fontSize: 15,
            color: colors.textMuted,
        },
        linkText: {
            fontSize: 15,
            color: colors.primary,
            fontWeight: '600',
        },
    });
