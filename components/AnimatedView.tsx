import { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedViewProps extends ViewProps {
  animation?: 'fade' | 'slide' | 'scale';
  delay?: number;
}

export function AnimatedView({
  children,
  animation = 'fade',
  delay = 0,
  style,
  ...props
}: AnimatedViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle = { opacity: opacity.value };

    switch (animation) {
      case 'slide':
        return {
          ...baseStyle,
          transform: [{ translateY: translateY.value }],
        };
      case 'scale':
        return {
          ...baseStyle,
          transform: [{ scale: scale.value }],
        };
      default:
        return baseStyle;
    }
  });

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
}