'use client';

import { useState, useRef } from 'react';
import { useSetupPIN } from '@/hooks/useAuth';
import { useTypography } from '@/hooks/useTypography';
import { useSecurity } from '@/hooks/useSecurity';
import { useTheme } from '@/hooks/useTheme';
import {
  useNotificationPreferences,
  useUserDevices,
  usePushNotificationSetup,
} from '@/hooks/useNotifications';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  ShieldCheck,
  ChevronRight,
  KeyRound,
  ArrowLeft,
  Type,
  Eye,
  Bell,
  Smartphone,
  Laptop,
  Radio,
  Video,
  MessageSquare,
  Sparkles,
  CreditCard,
  Share2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sun,
  Moon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ENV } from '@/constants/env';

export default function SettingsPage() {
  const { fontSize, setFontSize } = useTypography();
  const { watermarkEnabled, setWatermarkEnabled } = useSecurity();
  const { theme, setTheme } = useTheme();
  const [isChangingPIN, setIsChangingPIN] = useState(false);
  const [step, setStep] = useState<'new' | 'confirm'>('new');
  const [newPIN, setNewPIN] = useState(['', '', '', '']);
  const [confirmPIN, setConfirmPIN] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setupPIN = useSetupPIN();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light Mode',
      description: 'Clean, high-clarity light theme',
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: 'Dark Mode',
      description: 'Reduced eye strain in low-light',
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: 'Use System Settings',
      description: 'Matches operating system theme',
      icon: Laptop,
    },
  ];

  // Push notifications & preferences hooks
  const {
    permission,
    isRegistering,
    supportDetails,
    enablePushNotifications,
    disablePushNotifications,
  } = usePushNotificationSetup();

  const { data: preferences, updatePreferences } = useNotificationPreferences();
  const { data: devices = [], deactivateDevice } = useUserDevices();

  const hasActiveDevices = devices.length > 0;
  const isPushActive = permission === 'granted' && (preferences?.push_enabled ?? true) && hasActiveDevices;

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const target = step === 'new' ? newPIN : confirmPIN;
    const setter = step === 'new' ? setNewPIN : setConfirmPIN;
    
    const newDigits = [...target];
    newDigits[index] = digit;
    setter(newDigits);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && digit) {
      if (step === 'new') {
        setTimeout(() => {
          setStep('confirm');
          inputRefs.current[0]?.focus();
        }, 300);
      } else {
        void handleFinish();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const target = step === 'new' ? newPIN : confirmPIN;
    if (e.key === 'Backspace' && !target[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFinish = async () => {
    const pinCode = newPIN.join('');
    const confirmCode = confirmPIN.join('');

    if (pinCode !== confirmCode) {
      toast.error('PINs do not match');
      setConfirmPIN(['', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    try {
      await setupPIN.mutateAsync({ pin: pinCode });
      toast.success('PIN updated successfully!');
      setIsChangingPIN(false);
      setNewPIN(['', '', '', '']);
      setConfirmPIN(['', '', '', '']);
      setStep('new');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to update PIN';
      toast.error(errorMessage);
    }
  };

  if (isChangingPIN) {
    return (
      <div className="space-y-6 px-4 py-6 bg-background min-h-screen text-foreground">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => { setIsChangingPIN(false); setStep('new'); }}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-semibold">{step === 'new' ? 'Set New PIN' : 'Confirm New PIN'}</h1>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="pt-8 pb-10 flex flex-col items-center">
            <div className="flex justify-between gap-3 w-full max-w-[280px]">
              {(step === 'new' ? newPIN : confirmPIN).map((digit, index) => (
                <input
                  key={`pin-input-${index}`}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-label={`Digit ${index + 1}`}
                  className={cn(
                    "w-full h-14 bg-muted border border-input rounded-xl text-center text-lg font-bold text-foreground focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                    digit && "border-purple-500 bg-purple-500/10"
                  )}
                  disabled={setupPIN.isPending}
                  maxLength={1}
                />
              ))}
            </div>

            <p className="mt-8 text-sm text-muted-foreground text-center max-w-[240px]">
              {step === 'new' 
                ? 'Enter a 4-digit PIN for your account.' 
                : 'Re-enter your new PIN to confirm.'}
            </p>

            <Button 
              type="button"
              onClick={step === 'new' ? () => newPIN.join('').length === 4 && setStep('confirm') : handleFinish}
              className="mt-8 w-full max-w-[280px] h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
              disabled={setupPIN.isPending || (step === 'new' ? newPIN.join('').length < 4 : confirmPIN.join('').length < 4)}
            >
              {setupPIN.isPending ? <Loader2 className="size-5 animate-spin" /> : step === 'new' ? 'Continue' : 'Update PIN'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 bg-background min-h-screen text-foreground">
      <h1 className="text-lg font-semibold">Settings</h1>

      <div className="space-y-6">
        {/* Appearance Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Appearance
          </h2>
          <div className="p-4 bg-card border border-border rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sun className="size-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Theme Mode</p>
                <p className="text-xs text-muted-foreground">Choose light, dark, or system preference</p>
              </div>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              role="radiogroup"
              aria-label="Theme mode selection"
            >
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setTheme(opt.value);
                      toast.success(`Theme set to ${opt.label}`);
                    }}
                    className={cn(
                      'flex items-center sm:flex-col sm:items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 ring-1 ring-purple-500/40 shadow-sm'
                        : 'border-border bg-background hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-colors shrink-0',
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm font-semibold', isSelected ? 'text-foreground' : 'text-foreground/90')}>
                          {opt.label}
                        </p>
                        {isSelected && (
                          <span className="size-2 rounded-full bg-purple-600 sm:hidden" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Display Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Display</h2>
          <div className="space-y-4">
            <div className="p-4 bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Type className="size-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Font Size</p>
                  <p className="text-xs text-muted-foreground">Adjust the app text size</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'standard', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all border",
                      fontSize === size 
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20" 
                        : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Eye className="size-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Content Watermark</p>
                  <p className="text-xs text-muted-foreground">Traceable ID on top of media</p>
                </div>
              </div>
              <Switch
                checked={watermarkEnabled}
                onCheckedChange={(checked: boolean) => {
                  setWatermarkEnabled(checked);
                  toast.success(`Watermark ${checked ? 'enabled' : 'disabled'}`);
                }}
                aria-label="Toggle content watermark"
              />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Notifications</h2>
          <div className="space-y-4">
            {/* Master Push Notification Toggle Card */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg mt-0.5">
                    <Bell className="size-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">Allow Notifications</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold',
                          isPushActive
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : permission === 'denied'
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                            : 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        {isPushActive ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-400" />
                            ON
                          </span>
                        ) : (
                          'OFF'
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {isPushActive
                        ? 'Notifications are active on this browser'
                        : 'Turn on to receive instant alerts for live events, drops, and messages'}
                    </p>
                  </div>
                </div>

                {/* Master On/Off Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  {isRegistering ? (
                    <Loader2 className="size-4 animate-spin text-purple-400" />
                  ) : (
                    <Switch
                      checked={isPushActive}
                      onCheckedChange={async (checked: boolean) => {
                        if (checked) {
                          if (permission === 'denied') {
                            toast.error('Notifications are blocked by your browser settings. Please allow notifications in your site settings.');
                            return;
                          }
                          await enablePushNotifications();
                        } else {
                          await disablePushNotifications();
                        }
                      }}
                      aria-label="Toggle allow notifications"
                    />
                  )}
                </div>
              </div>

              {/* iOS Safari Home Screen Setup Notice */}
              {supportDetails.needsHomeScreenAdd && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-lg flex items-start gap-3">
                  <Share2 className="size-4 text-sky-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-800 dark:text-sky-200">
                    <p className="font-semibold text-sky-700 dark:text-sky-300 mb-0.5">iOS Web Push Setup</p>
                    <p className="leading-relaxed">
                      To enable notifications on iOS: Tap the Safari <span className="font-semibold">Share</span> icon, select <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span>, and open Zexy from your home screen.
                    </p>
                  </div>
                </div>
              )}

              {/* Browser Permission Denied Notice */}
              {permission === 'denied' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-200">
                    <p className="font-semibold text-rose-700 dark:text-rose-300 mb-0.5">Permission Denied in Browser</p>
                    <p className="leading-relaxed">
                      Notifications are currently blocked by your browser settings. Click the lock or site settings icon in your address bar and set Notifications to &ldquo;Allow&rdquo;.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Category Preferences */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Category Preferences
              </p>

              {/* Live Alerts */}
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-rose-500/10 rounded-lg">
                    <Radio className="size-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Creator Live Alerts</p>
                    <p className="text-[11px] text-muted-foreground">When your subscribed creators go live</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.live_alerts_enabled ?? true}
                  onCheckedChange={(val) => updatePreferences.mutate({ live_alerts_enabled: val })}
                  aria-label="Toggle live alerts"
                />
              </div>

              {/* Content Updates */}
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg">
                    <Video className="size-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">New Content Drops</p>
                    <p className="text-[11px] text-muted-foreground">When creators publish exclusive posts & media</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.content_updates_enabled ?? true}
                  onCheckedChange={(val) => updatePreferences.mutate({ content_updates_enabled: val })}
                  aria-label="Toggle content updates"
                />
              </div>

              {/* Chat Messages */}
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <MessageSquare className="size-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Chat Messages</p>
                    <p className="text-[11px] text-muted-foreground">Direct replies and creator message alerts</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.chat_notifications_enabled ?? true}
                  onCheckedChange={(val) => updatePreferences.mutate({ chat_notifications_enabled: val })}
                  aria-label="Toggle chat messages"
                />
              </div>

              {/* Subscription Reminders */}
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <CreditCard className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Subscriptions & Renewals</p>
                    <p className="text-[11px] text-muted-foreground">Billing confirmations and renewal reminders</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.subscription_reminders_enabled ?? true}
                  onCheckedChange={(val) => updatePreferences.mutate({ subscription_reminders_enabled: val })}
                  aria-label="Toggle subscription reminders"
                />
              </div>

              {/* Announcements */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <Sparkles className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Platform Announcements</p>
                    <p className="text-[11px] text-muted-foreground">Important updates, feature drops, and news</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.announcements_enabled ?? true}
                  onCheckedChange={(val) => updatePreferences.mutate({ announcements_enabled: val })}
                  aria-label="Toggle announcements"
                />
              </div>
            </div>

            {/* Registered Devices List */}
            <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Registered Devices ({devices.length})
                </p>
              </div>

              {devices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No active devices registered yet. Enable push notifications above to register this device.
                </p>
              ) : (
                <div className="space-y-2">
                  {devices.map((device) => {
                    const isMobile =
                      device.platform === 'android' ||
                      device.platform === 'ios' ||
                      device.browser?.includes('mobile');

                    return (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 bg-muted/40 border border-border/80 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                            {isMobile ? (
                              <Smartphone className="size-4" />
                            ) : (
                              <Laptop className="size-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {device.device_label || `${device.browser} on ${device.platform}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Registered: {new Date(device.created_at).toLocaleDateString()}
                              {device.last_used_at &&
                                ` · Active: ${new Date(device.last_used_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deactivateDevice.mutate(device.id)}
                          disabled={deactivateDevice.isPending}
                          className="size-8 text-muted-foreground hover:text-rose-500 hover:bg-muted"
                          title="Unregister device"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Security</h2>
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => setIsChangingPIN(true)}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
              aria-label="Change login PIN"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <KeyRound className="size-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Change login PIN</p>
                  <p className="text-xs text-muted-foreground">Update your 4-digit security PIN</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Support</h2>
          <div className="space-y-2">
            <button 
              type="button"
              onClick={async () => {
                toast.info('Simulating API error…');
                try {
                  const res = await fetch(`${ENV.API_BASE_URL}/api/v1/debug/force-crash-test-500`);
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(data.message || 'API Error');
                    Sentry.captureException(new Error(data.message || 'API Error'), {
                      tags: { context: 'fan_settings_debug' },
                      extra: { data }
                    });
                  }
                } catch (err) {
                  Sentry.captureException(err, {
                    tags: { context: 'fan_settings_debug' },
                  });
                  toast.error('Network Error: Make sure API server is reachable');
                }
              }}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
              aria-label="Simulate API Error"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Loader2 className="size-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Simulate API Error</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </button>

            <button 
              type="button"
              onClick={() => {
                toast.info('Forcing app crash…');
                setTimeout(() => {
                  throw new Error('FAN WEB HARD CRASH: Testing Sentry Session Replay');
                }, 500);
              }}
              className="w-full flex items-center justify-between p-4 bg-red-500/05 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
              aria-label="Force App Crash"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <ShieldCheck className="size-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-500">Force App Crash</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </button>

            <button 
              type="button"
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
              aria-label="Privacy Policy"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ShieldCheck className="size-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Privacy Policy</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

