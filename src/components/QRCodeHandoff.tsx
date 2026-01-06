import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, CheckCircle, Scan, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { BloodGroup } from '@/types/emergency';

interface QRCodeHandoffProps {
  emergencyId: string;
  bloodGroup: BloodGroup;
  units: number;
  hospitalName: string;
  mode: 'generate' | 'scan';
  onVerified?: () => void;
}

export function QRCodeHandoff({ 
  emergencyId, 
  bloodGroup, 
  units, 
  hospitalName, 
  mode,
  onVerified 
}: QRCodeHandoffProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (mode === 'generate') {
      generateQRCode();
    }
  }, [mode, emergencyId]);

  // Countdown timer
  useEffect(() => {
    if (qrData && expiresIn > 0) {
      const timer = setTimeout(() => setExpiresIn(expiresIn - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiresIn === 0) {
      // Regenerate QR code
      generateQRCode();
    }
  }, [expiresIn, qrData]);

  const generateQRCode = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-handoff-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ emergencyId })
      });

      if (response.ok) {
        const data = await response.json();
        setQrData(data.qrPayload);
        setExpiresIn(300); // Reset timer
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (mode === 'generate') {
    return (
      <Card variant="elevated" className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="critical">SECURE HANDOFF</Badge>
          </div>
          <CardTitle>Blood Handoff QR Code</CardTitle>
          <CardDescription>
            Show this QR code to the receiving party for secure verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blood Info */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-xl">
            <BloodTypeBadge bloodGroup={bloodGroup} size="lg" />
            <div className="text-left">
              <p className="font-bold text-lg">{units} Unit{units > 1 ? 's' : ''}</p>
              <p className="text-sm text-muted-foreground">{hospitalName}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {isLoading ? (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-xl">
                <motion.div
                  className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : qrData ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-white rounded-xl shadow-lg"
              >
                <QRCodeSVG
                  value={qrData}
                  size={192}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: '/favicon.ico',
                    height: 24,
                    width: 24,
                    excavate: true
                  }}
                />
              </motion.div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-xl text-muted-foreground">
                Failed to generate
              </div>
            )}
          </div>

          {/* Expiry Timer */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className={expiresIn < 60 ? 'text-[hsl(var(--status-critical))]' : 'text-muted-foreground'}>
              Expires in {formatTime(expiresIn)}
            </span>
          </div>

          {/* Regenerate Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={generateQRCode}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate QR Code
          </Button>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg text-sm">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Secure Handoff</p>
              <p className="text-muted-foreground">
                This QR code is encrypted and expires automatically. Only verified hospital staff can scan it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scan mode
  return (
    <Card variant="elevated" className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
          <Scan className="w-8 h-8 text-secondary" />
        </div>
        <CardTitle>Scan Handoff QR</CardTitle>
        <CardDescription>
          Point your camera at the QR code to verify blood handoff
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Camera placeholder */}
        <div className="aspect-square max-w-xs mx-auto bg-muted rounded-xl flex items-center justify-center">
          {isScanning ? (
            <div className="text-center">
              <motion.div
                className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-lg mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm text-muted-foreground">Scanning...</p>
            </div>
          ) : (
            <div className="text-center p-4">
              <Scan className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Camera access required for scanning
              </p>
            </div>
          )}
        </div>

        <Button
          variant="hero"
          className="w-full gap-2"
          onClick={() => setIsScanning(!isScanning)}
        >
          <Scan className="w-5 h-5" />
          {isScanning ? 'Stop Scanning' : 'Start Scanner'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Alternatively, enter the OTP code manually if scanning doesn't work
        </p>
      </CardContent>
    </Card>
  );
}
