import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EAB308', // Gold
  '#10B981', // Emerald
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F43F5E', // Rose
];

interface Particle {
  id: number;
  startX: number;
  size: number;
  isCircle: boolean;
  isRibbon: boolean;
  color: string;
  driftX: number;
  animValue: Animated.Value;
  duration: number;
  delay: number;
  rotation: number;
}

interface ConfettiEffectProps {
  active: boolean;
  count?: number;
  onComplete?: () => void;
}

export function ConfettiEffect({ active, count = 42, onComplete }: ConfettiEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate confetti particles
    const newParticles: Particle[] = Array.from({ length: count }).map((_, index) => {
      const isCircle = index % 3 === 0;
      const isRibbon = index % 3 === 1;
      return {
        id: Date.now() + index,
        startX: Math.random() * SCREEN_WIDTH,
        size: isRibbon ? 6 : 8 + Math.random() * 6,
        isCircle,
        isRibbon,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        driftX: (Math.random() - 0.5) * 120, // Horizontal sway
        animValue: new Animated.Value(0),
        duration: 2200 + Math.random() * 1000,
        delay: Math.random() * 350,
        rotation: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
      };
    });

    setParticles(newParticles);

    // Launch animations
    const animations = newParticles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.animValue, {
          toValue: 1,
          duration: p.duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(animations).start(() => {
      if (isMounted.current) {
        setParticles([]);
        if (onComplete) onComplete();
      }
    });
  }, [active, count]);

  if (particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => {
        const translateY = p.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, SCREEN_HEIGHT + 40],
        });

        const translateX = p.animValue.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, p.driftX * 0.4, p.driftX * -0.2, p.driftX * 0.8, p.driftX],
        });

        const rotate = p.animValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotation}deg`],
        });

        const opacity = p.animValue.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        const scale = p.animValue.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0.6, 1, 0.85],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.startX,
                backgroundColor: p.color,
                width: p.size,
                height: p.isRibbon ? p.size * 2.2 : p.size,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                transform: [
                  { translateY },
                  { translateX },
                  { rotate },
                  { scale },
                ],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: -20,
  },
});
