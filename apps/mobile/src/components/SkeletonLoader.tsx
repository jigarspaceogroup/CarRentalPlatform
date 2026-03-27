import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius } from '../theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadiusSize?: number;
  style?: StyleProp<ViewStyle>;
}

function SkeletonBlock({ width, height, borderRadiusSize, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius: borderRadiusSize ?? borderRadius.md,
          backgroundColor: colors.gray[200],
          opacity,
        },
        style,
      ]}
    />
  );
}

export function VehicleCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonBlock width="100%" height={160} borderRadiusSize={0} />
      <View style={skeletonStyles.body}>
        <SkeletonBlock width="70%" height={18} />
        <SkeletonBlock width="40%" height={14} style={{ marginTop: 6 }} />
        <View style={skeletonStyles.row}>
          <SkeletonBlock width={60} height={24} />
          <SkeletonBlock width={50} height={24} />
        </View>
        <SkeletonBlock width="50%" height={22} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View style={skeletonStyles.categoryCard}>
      <SkeletonBlock width="100%" height={80} borderRadiusSize={borderRadius.md} />
      <SkeletonBlock width="60%" height={14} style={{ marginTop: 8, alignSelf: 'center' }} />
    </View>
  );
}

export function BannerSkeleton() {
  return (
    <SkeletonBlock
      width="100%"
      height={160}
      borderRadiusSize={borderRadius.lg}
    />
  );
}

export function HorizontalVehicleSkeleton() {
  return (
    <View style={skeletonStyles.horizontalCard}>
      <SkeletonBlock width={140} height={100} borderRadiusSize={borderRadius.md} />
      <View style={skeletonStyles.horizontalBody}>
        <SkeletonBlock width={100} height={16} />
        <SkeletonBlock width={60} height={14} style={{ marginTop: 6 }} />
        <SkeletonBlock width={80} height={18} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
  },
  body: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  categoryCard: {
    width: '48%',
    marginBottom: 12,
  },
  horizontalCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
  },
  horizontalBody: {
    padding: 10,
  },
});

export default SkeletonBlock;
