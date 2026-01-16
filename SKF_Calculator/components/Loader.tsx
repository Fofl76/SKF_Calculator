import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

const BAR_WIDTH = 13.6;
const BAR_HEIGHT = 32;
const BAR_GAP = 20;
const ANIM_DURATION = 800;

const Loader: React.FC = () => {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (anim: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: ANIM_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: ANIM_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );

    const anims = [
      createAnim(a1, 0),
      createAnim(a2, ANIM_DURATION * 0.16),
      createAnim(a3, ANIM_DURATION * 0.32),
    ];

    Animated.stagger(ANIM_DURATION * 0.08, anims).start();

    return () => {
      a1.stopAnimation();
      a2.stopAnimation();
      a3.stopAnimation();
    };
  }, [a1, a2, a3]);

  const interpStyle = (anim: Animated.Value) => ({
    height: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [BAR_HEIGHT, BAR_HEIGHT + 8, BAR_HEIGHT],
    }),
    opacity: anim.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.75, 1, 0.75],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, -8, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.loader}>
      <View style={styles.inner}>
        <Animated.View style={[styles.bar, interpStyle(a1), { marginRight: BAR_GAP }]} />
        <Animated.View style={[styles.bar, interpStyle(a2), { marginRight: BAR_GAP }]} />
        <Animated.View style={[styles.bar, interpStyle(a3)]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  inner: {
    width: BAR_WIDTH * 3 + BAR_GAP * 2 + 40,
    height: BAR_HEIGHT + 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    backgroundColor: '#076fe5',
    borderRadius: 4,
  },
});

export default Loader;

