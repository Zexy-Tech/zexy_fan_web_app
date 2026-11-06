'use client';

import { useState, useRef } from 'react';
import { useSetupPIN } from '@/hooks/useAuth';
import { useTypography } from '@/hooks/useTypography';
import { useTheme } from '@/hooks/useTheme';
import {
  useNotificationPreferences,
  useUserDevices,
  usePushNotificationSetup,
} from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import {
  Loader2,
  ChevronRight,
  KeyRound,
  ArrowLeft,
  Type,
  Bell,
  Smartphone,
  Laptop,
  Radio,
  Video,
  MessageSquare,
  Sparkles,
  CreditCard,
  Share2,
  AlertCircle,
  Trash2,
  Sun,
  Moon,
} from '@/components/ui/icons';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { IconComponent } from '@/components/ui/icons';

export default function SettingsPage() {
  const { fontSize, setFontSize } = useTypography();
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
      label: 'Light',
      description: 'Clean, high-clarity light theme',
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Reduced eye strain in low-light',
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: 'System',
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
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
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
                    "w-full h-14 bg-muted border border-input rounded-full text-center text-lg font-bold text-foreground focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none",
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
              className="mt-8 w-full max-w-[280px] h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full"
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
        <SettingsSection title="Appearance">
          <SettingRow icon={Sun} tone="bg-purple-500/10 text-purple-500" title="Theme">
            <Segmented
              ariaLabel="Theme mode"
              value={theme}
              options={themeOptions.map((o) => ({ value: o.value, label: o.label, content: <o.icon className="size-4" /> }))}
              onChange={(v) => {
                setTheme(v);
                toast.success(`Theme set to ${themeOptions.find((o) => o.value === v)?.label}`);
              }}
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Display">
          <SettingRow icon={Type} tone="bg-blue-500/10 text-blue-500" title="Font size">
            <Segmented
              ariaLabel="Font size"
              value={fontSize}
              options={FONT_SIZES.map((f) => ({ value: f.value, label: f.label, content: <span className={cn('font-semibold leading-none', f.className)}>A</span> }))}
              onChange={setFontSize}
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingRow
            icon={Bell}
            tone="bg-purple-500/10 text-purple-500"
            title="Allow notifications"
            badge={
              <Badge
                variant="outline"
                className={cn(
                  'px-1.5 py-0 text-[10px] font-semibold',
                  isPushActive
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                    : permission === 'denied'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                    : 'border-border bg-muted text-muted-foreground'
                )}
              >
                {isPushActive ? 'ON' : permission === 'denied' ? 'BLOCKED' : 'OFF'}
              </Badge>
            }
          >
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
          </SettingRow>
          {supportDetails.needsHomeScreenAdd && (
            <SettingNote icon={Share2} tone="text-sky-500">
              On iOS: tap Safari&apos;s <b>Share</b> icon, choose <b>Add to Home Screen</b>, then open Zexy from your home screen.
            </SettingNote>
          )}
          {permission === 'denied' && (
            <SettingNote icon={AlertCircle} tone="text-rose-500">
              Blocked by your browser. Open site settings (lock icon in the address bar) and set Notifications to <b>Allow</b>.
            </SettingNote>
          )}
        </SettingsSection>

        <SettingsSection title="Notify me about">
          {NOTIFICATION_CATEGORIES.map((c) => (
            <SettingRow key={c.key} icon={c.icon} tone={c.tone} title={c.title}>
              <Switch
                checked={preferences?.[c.key] ?? true}
                onCheckedChange={(val) => updatePreferences.mutate({ [c.key]: val })}
                aria-label={`Toggle ${c.title.toLowerCase()}`}
              />
            </SettingRow>
          ))}
        </SettingsSection>

        <SettingsSection title={`Registered devices (${devices.length})`}>
          {devices.length === 0 ? (
            <SettingNote icon={Smartphone} tone="text-muted-foreground">
              No devices yet. Turn on notifications to register this one.
            </SettingNote>
          ) : (
            devices.map((device) => {
              const isMobile =
                device.platform === 'android' || device.platform === 'ios' || device.browser?.includes('mobile');
              return (
                <SettingRow
                  key={device.id}
                  icon={isMobile ? Smartphone : Laptop}
                  tone="bg-muted text-muted-foreground"
                  title={device.device_label || `${device.browser} on ${device.platform}`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deactivateDevice.mutate(device.id)}
                    disabled={deactivateDevice.isPending}
                    className="size-8 text-muted-foreground hover:bg-muted hover:text-rose-500"
                    aria-label="Unregister device"
                    title="Unregister device"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </SettingRow>
              );
            })
          )}
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingRow icon={KeyRound} tone="bg-purple-500/10 text-purple-500" title="Change login PIN" onClick={() => setIsChangingPIN(true)} />
        </SettingsSection>

      </div>
    </div>
  );
}

const FONT_SIZES = [
  { value: 'compact' as const, label: 'Compact', className: 'text-[11px]' },
  { value: 'standard' as const, label: 'Standard', className: 'text-[13px]' },
  { value: 'large' as const, label: 'Large', className: 'text-[16px]' },
];

const NOTIFICATION_CATEGORIES = [
  { key: 'live_alerts_enabled', title: 'Creator live alerts', icon: Radio, tone: 'bg-rose-500/10 text-rose-500' },
  { key: 'content_updates_enabled', title: 'New content drops', icon: Video, tone: 'bg-purple-500/10 text-purple-500' },
  { key: 'chat_notifications_enabled', title: 'Chat messages', icon: MessageSquare, tone: 'bg-blue-500/10 text-blue-500' },
  { key: 'subscription_reminders_enabled', title: 'Subscriptions & renewals', icon: CreditCard, tone: 'bg-emerald-500/10 text-emerald-500' },
  { key: 'announcements_enabled', title: 'Platform announcements', icon: Sparkles, tone: 'bg-amber-500/10 text-amber-500' },
] as const;

/** A titled card whose rows are separated by a single divider line. */
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">{children}</div>
    </section>
  );
}

/** One single-line setting: tinted icon + title (+ badge) on the left, its control on the right.
 *  With `onClick` the whole row is a button with a chevron. */
function SettingRow({
  icon: Icon,
  tone,
  title,
  badge,
  children,
  onClick,
}: {
  icon: IconComponent;
  tone: string;
  title: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tone)}>
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        {badge}
      </span>
      {onClick ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : children}
    </>
  );
  const cls = 'flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'hover:bg-muted/50')} aria-label={title}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Short contextual note shown under a row (same card, same divider). */
function SettingNote({ icon: Icon, tone, children }: { icon: IconComponent; tone: string; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
      <Icon className={cn('mt-0.5 size-3.5 shrink-0', tone)} />
      <span>{children}</span>
    </p>
  );
}

/** Compact icon segmented control (radio group) that fits on a settings row. */
function Segmented<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: T;
  options: { value: T; label: string; content: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-0.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              'grid size-8 place-items-center rounded-full transition-colors',
              selected ? 'bg-purple-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.content}
          </button>
        );
      })}
    </div>
  );
}
