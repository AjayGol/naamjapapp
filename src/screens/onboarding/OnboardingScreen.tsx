import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Text, Button, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: {
    iconSet: 'MaterialIcons';
    iconName: string;
  };
};

type Props = {
  onDone: () => void;
};

export const OnboardingScreen: React.FC<Props> = ({ onDone }) => {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const slides = useMemo<Slide[]>(
    () => [
      {
        key: 'track',
        title: 'Track Your Naam Jap',
        body: 'Count every chant and stay focused with a simple, distraction-free counter.',
        icon: { iconSet: 'MaterialIcons', iconName: 'self-improvement' },
      },
      {
        key: 'goals',
        title: 'Build Daily Consistency',
        body: 'Set daily goals and gentle reminders to keep your practice steady.',
        icon: { iconSet: 'MaterialIcons', iconName: 'flag' },
      },
      {
        key: 'stats',
        title: 'See Your Progress',
        body: 'Review streaks and stats to celebrate your growth over time.',
        icon: { iconSet: 'MaterialIcons', iconName: 'bar-chart' },
      },
    ],
    [],
  );

  const goNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const complete = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.onboardingDone, 'true');
    onDone();
  };

  return (
    <Screen style={[styles.screen, { paddingHorizontal: 0 }]}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key}
        onMomentumScrollEnd={event => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.hero}>
              <View
                style={[
                  styles.heroRing,
                  { borderColor: colors.border },
                ]}
              />
              <View
                style={[
                  styles.heroAccent,
                  { backgroundColor: colors.primary + '22' },
                ]}
              />
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Icon
                  iconSet={item.icon.iconSet}
                  iconName={item.icon.iconName}
                  size={34}
                  color={colors.primary}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text weight="bold" variant="xl" style={styles.title}>
                {item.title}
              </Text>
              <Text color="textSecondary" style={styles.body}>
                {item.body}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, i) => {
            const isActive = i === index;
            return (
              <View
                key={slide.key}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.primary : colors.border,
                    width: isActive ? 18 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {index < slides.length - 1 ? (
          <View style={styles.actions}>
            <Button label="Next" onPress={goNext} style={styles.primaryButton} />
            <Pressable onPress={complete} style={styles.skipButton}>
              <Text color="textSecondary">Skip</Text>
            </Pressable>
          </View>
        ) : (
          <Button label="Continue" onPress={complete} style={styles.primaryButton} />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 24,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  heroRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
  },
  heroAccent: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 20,
    right: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    gap: 16,
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  actions: {
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
  },
  skipButton: {
    paddingVertical: 4,
  },
});
