import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ClaimCountdownProps {
  expiresAt?: string | null;
  onExpire?: () => void;
  className?: string;
}

export const ClaimCountdown: React.FC<ClaimCountdownProps> = ({
  expiresAt,
  onExpire,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalSeconds: number;
  }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 86400
  });

  useEffect(() => {
    if (!expiresAt) {
      // Default to 24h if not specified yet
      return;
    }

    const calculateTime = () => {
      const targetTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalSeconds: 0
        });
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalSeconds: totalSec
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-semibold ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        <span>Claim window expired</span>
      </div>
    );
  }

  const isUrgent = timeLeft.totalSeconds < 3600 * 2; // Under 2 hours remaining

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-semibold tracking-tight transition-colors ${
        isUrgent
          ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
          : 'bg-emerald-100/90 border-emerald-300 text-emerald-900'
      } ${className}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-700' : 'text-emerald-700'}`} />
      <span>
        Claim window: {String(timeLeft.hours).padStart(2, '0')}h :{' '}
        {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
        {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
};
