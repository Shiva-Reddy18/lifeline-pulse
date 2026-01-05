import { motion } from 'framer-motion';
import { Heart, AlertTriangle } from 'lucide-react';

interface EmergencyButtonProps {
  onTrigger: () => void;
  isLoading?: boolean;
}

export function EmergencyButton({ onTrigger, isLoading }: EmergencyButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing rings */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-primary/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full bg-primary/40"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 0.2, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
      />

      {/* Main button */}
      <motion.button
        onClick={onTrigger}
        disabled={isLoading}
        className="relative z-10 w-48 h-48 rounded-full emergency-button flex flex-col items-center justify-center gap-2 text-white disabled:opacity-70"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isLoading ? (
          <motion.div
            className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            <Heart className="w-14 h-14 fill-white" />
            <span className="text-2xl font-bold tracking-wide">EMERGENCY</span>
            <span className="text-sm opacity-90">Tap for help</span>
          </>
        )}
      </motion.button>

      {/* Warning indicator */}
      <motion.div
        className="absolute -bottom-16 flex items-center gap-2 text-muted-foreground"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">For medical emergencies only</span>
      </motion.div>
    </div>
  );
}
