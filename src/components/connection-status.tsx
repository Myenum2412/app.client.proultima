'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const supabase = createClient();
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;

    const checkConnection = async () => {
      try {
        // Simple ping to check if Supabase is reachable
        await supabase
          .from('staff')
          .select('id')
          .limit(1);
        
        setConnectionStatus('connected');
        setLastUpdate(new Date());
        reconnectAttempts = 0;
      } catch (error) {
        // console.log('Connection check failed:', error);
        if (reconnectAttempts < maxReconnectAttempts) {
          setConnectionStatus('reconnecting');
          reconnectAttempts++;
          reconnectTimeout = setTimeout(checkConnection, 2000 * reconnectAttempts);
        } else {
          setConnectionStatus('disconnected');
        }
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Initial check
    checkConnection();

    // Listen for online/offline events
    const handleOnline = () => {
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      reconnectAttempts = 0;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3" />;
      case 'disconnected':
        return <WifiOff className="h-3 w-3" />;
      case 'reconnecting':
        return <AlertCircle className="h-3 w-3 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Online';
      case 'disconnected':
        return 'Offline';
      case 'reconnecting':
        return 'Reconnecting...';
    }
  };

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'default' as const;
      case 'disconnected':
        return 'destructive' as const;
      case 'reconnecting':
        return 'secondary' as const;
    }
  };

  return (
    <Badge 
      variant={getStatusVariant()} 
      className={` items-center gap-1 text-xs hidden sm:flex ${className}`}
      title={`Last update: ${lastUpdate.toLocaleTimeString()}`}
    >
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
}
