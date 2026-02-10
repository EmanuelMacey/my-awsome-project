
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PromotionBannerProps {
  messages?: string[];
  speed?: number;
  backgroundColor?: string;
  textColor?: string;
}

const DEFAULT_MESSAGES = [
  '🎉 Welcome to MaceyRunners! Your one-stop delivery solution',
  '🍔 Order from your favorite restaurants with fast delivery',
  '🛍️ Need groceries? We deliver from Massy, Bounty & more!',
  '💊 Pharmacy errands made easy - Medicine Chest, Mike\'s & more',
  '📄 Government services? We handle documents & GRA errands',
  '🚚 Track your order in real-time with live driver location',
  '💬 Chat with your driver directly through the app',
  '⭐ Rate your experience and help us improve',
  '🎯 New to the app? Browse stores and start shopping now!',
  '💡 Tip: Save your favorite addresses for faster checkout',
  '🔔 Enable notifications to never miss order updates',
  '🎁 Special offers coming soon - stay tuned!',
];

export function PromotionBanner({
  messages = DEFAULT_MESSAGES,
  speed = 50,
  backgroundColor = '#FF8C42',
  textColor = '#FFFFFF',
}: PromotionBannerProps) {
  const insets = useSafeAreaInsets();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [textWidth, setTextWidth] = useState(0);

  const currentMessage = messages[currentMessageIndex];

  // Calculate safe top padding for devices with notches
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const safeTopPadding = Math.max(insets.top, statusBarHeight);

  useEffect(() => {
    console.log('🎪 Starting promotion banner animation');
    
    // Reset animation
    translateX.setValue(SCREEN_WIDTH);

    // Calculate animation duration based on text width and speed
    const distance = SCREEN_WIDTH + textWidth;
    const duration = (distance / speed) * 1000; // Convert to milliseconds

    // Start animation
    const animation = Animated.timing(translateX, {
      toValue: -textWidth,
      duration: duration,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        // Move to next message
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentMessageIndex, textWidth, messages.length, speed, translateX]);

  const handleTextLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== textWidth) {
      setTextWidth(width);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor, marginTop: safeTopPadding }]}>
      <Animated.View
        style={[
          styles.textContainer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Text
          style={[styles.text, { color: textColor }]}
          onLayout={handleTextLayout}
          numberOfLines={1}
        >
          {currentMessage}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    overflow: 'hidden',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
