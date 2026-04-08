import React, { Component } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Easing,
  Image,
  type ColorValue,
  type ImageSourcePropType,
  TouchableWithoutFeedback,
} from "react-native";
import ViewOverflow from "react-native-view-overflow";

const AnimatedViewOverflow = Animated.createAnimatedComponent(ViewOverflow);

type FluidBottomNavigationValue = {
  icon?: ImageSourcePropType;
  renderIcon?: (state: { active: boolean; color: string }) => ReactNode;
  title: string;
};

type FluidBottomNavigationProps = {
  onPress: (tabIndex: number) => void;
  selectedTab?: number;
  tintColor?: ColorValue;
  values: FluidBottomNavigationValue[];
};

type FluidBottomNavigationState = {
  lastSelectedIndex: number | null;
};

class TabBar extends Component<
  FluidBottomNavigationProps,
  FluidBottomNavigationState
> {
  animatedBubbleValues: Animated.Value[];
  animatedImageValues: Animated.Value[];
  animatedItemValues: Animated.Value[];
  animatedMiniBubbleValues: Animated.Value[];

  static defaultProps = {
    tintColor: "rgb(76, 83, 221)",
  };

  state: FluidBottomNavigationState = {
    lastSelectedIndex: null,
  };

  constructor(props: FluidBottomNavigationProps) {
    super(props);

    this.animatedItemValues = [];
    this.animatedBubbleValues = [];
    this.animatedMiniBubbleValues = [];
    this.animatedImageValues = [];

    this.props.values.forEach((_, index) => {
      this.animatedItemValues[index] = new Animated.Value(0);
      this.animatedBubbleValues[index] = new Animated.Value(0);
      this.animatedImageValues[index] = new Animated.Value(0);
      this.animatedMiniBubbleValues[index] = new Animated.Value(0);
    });
  }

  componentDidMount() {
    this.syncSelection(this.props.selectedTab ?? 0);
  }

  componentDidUpdate(prevProps: FluidBottomNavigationProps) {
    if (prevProps.values.length !== this.props.values.length) {
      this.resetAnimatedValues();
      this.syncSelection(this.props.selectedTab ?? 0);
      return;
    }

    if (prevProps.selectedTab !== this.props.selectedTab) {
      this.syncSelection(this.props.selectedTab ?? 0);
    }
  }

  resetAnimatedValues() {
    this.animatedItemValues = [];
    this.animatedBubbleValues = [];
    this.animatedMiniBubbleValues = [];
    this.animatedImageValues = [];

    this.props.values.forEach((_, index) => {
      const isSelected = index === (this.props.selectedTab ?? 0);
      const value = isSelected ? 1 : 0;
      const itemValue = isSelected ? -30 : 0;

      this.animatedItemValues[index] = new Animated.Value(itemValue);
      this.animatedBubbleValues[index] = new Animated.Value(value);
      this.animatedImageValues[index] = new Animated.Value(value);
      this.animatedMiniBubbleValues[index] = new Animated.Value(value);
    });
  }

  syncSelection(selectedTab: number) {
    if (selectedTab === this.state.lastSelectedIndex) {
      return;
    }

    this.startAnimation(selectedTab);

    if (this.state.lastSelectedIndex !== null) {
      this.endAnimation(this.state.lastSelectedIndex);
    }

    this.setState({
      lastSelectedIndex: selectedTab,
    });
  }

  startAnimation = (index: number) => {
    Animated.parallel([
      Animated.timing(this.animatedItemValues[index], {
        toValue: -30,
        duration: 500,
        delay: 300,
        easing: Easing.in(Easing.elastic(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(this.animatedMiniBubbleValues[index], {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(this.animatedBubbleValues[index], {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.out(Easing.ease)),
        useNativeDriver: true,
      }),
      Animated.timing(this.animatedImageValues[index], {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  };

  endAnimation = (index: number) => {
    Animated.parallel([
      Animated.timing(this.animatedItemValues[index], {
        toValue: 0,
        duration: 400,
        delay: 350,
        useNativeDriver: true,
      }),
      Animated.timing(this.animatedMiniBubbleValues[index], {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }),
      Animated.timing(this.animatedBubbleValues[index], {
        toValue: 0,
        duration: 750,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(this.animatedImageValues[index], {
        toValue: 0,
        duration: 400,
        delay: 350,
        useNativeDriver: false,
      }),
    ]).start();
  };

  renderAnimatedIcon(item: FluidBottomNavigationValue, index: number) {
    const animatedColorValues = this.animatedImageValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [String(this.props.tintColor), "rgb(255, 255, 255)"],
    });

    if (item.renderIcon) {
      const inactiveOpacity = this.animatedImageValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      });

      const activeOpacity = this.animatedImageValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.iconLayer, { opacity: inactiveOpacity }]}
          >
            {item.renderIcon({
              active: false,
              color: String(this.props.tintColor),
            })}
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.iconLayer, { opacity: activeOpacity }]}
          >
            {item.renderIcon({
              active: true,
              color: "rgb(255, 255, 255)",
            })}
          </Animated.View>
        </>
      );
    }

    return (
      <Animated.Image
        source={item.icon}
        style={[
          styles.image,
          {
            tintColor: animatedColorValues,
          },
        ]}
      />
    );
  }

  renderButtons() {
    return this.props.values.map((item, index) => {
      const animatedItemStyle = {
        transform: [{ translateY: this.animatedItemValues[index] }],
      };

      const animatedBubbleScaleValues = this.animatedBubbleValues[
        index
      ].interpolate({
        inputRange: [0, 0.25, 0.4, 0.525, 0.8, 1],
        outputRange: [0.01, 3, 1.65, 1.65, 3.2, 3],
      });

      const animatedBubbleStyle = {
        transform: [{ scale: animatedBubbleScaleValues }],
      };

      const animatedMiniBubbleTranslateValues = this.animatedMiniBubbleValues[
        index
      ].interpolate({
        inputRange: [0, 1],
        outputRange: [13, 0],
      });

      const animatedMiniBubbleHeightValues = this.animatedMiniBubbleValues[
        index
      ].interpolate({
        inputRange: [0, 0.01, 1],
        outputRange: [0, 1, 1],
      });

      const animatedMiniBubbleStyle = {
        opacity: animatedMiniBubbleHeightValues,
        transform: [{ translateY: animatedMiniBubbleTranslateValues }],
      };

      const animatedTitleValues = this.animatedBubbleValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [60, 60],
      });

      const animatedTitleStyle = {
        transform: [{ translateY: animatedTitleValues }],
      };

      return (
        <TouchableWithoutFeedback
          key={index}
          onPress={() => {
            if (index === this.state.lastSelectedIndex) {
              return;
            }

            this.startAnimation(index);

            if (this.state.lastSelectedIndex !== null) {
              this.endAnimation(this.state.lastSelectedIndex);
            }

            this.setState({
              lastSelectedIndex: index,
            });

            this.props.onPress(index);
          }}
        >
          <AnimatedViewOverflow style={[styles.item, animatedItemStyle]}>
            <Image
              style={styles.itemMask}
              source={require("@logisticinfotech/react-native-bottom-navigation/assets/mask.png")}
            />
            <Animated.View
              style={[
                styles.bubble,
                { backgroundColor: this.props.tintColor },
                animatedBubbleStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.miniBubble,
                { backgroundColor: this.props.tintColor },
                animatedMiniBubbleStyle,
              ]}
            />
            {this.renderAnimatedIcon(item, index)}
            <Animated.View style={[styles.titleContainer, animatedTitleStyle]}>
              <Animated.Text
                adjustsFontSizeToFit={true}
                numberOfLines={1}
                style={{
                  color: this.props.tintColor,
                }}
              >
                {item.title}
              </Animated.Text>
            </Animated.View>
          </AnimatedViewOverflow>
        </TouchableWithoutFeedback>
      );
    });
  }

  render() {
    return (
      <AnimatedViewOverflow style={styles.container}>
        {this.renderButtons()}
      </AnimatedViewOverflow>
    );
  }
}

const styles = {
  bubble: {
    alignSelf: "center" as const,
    backgroundColor: "#4C53DD",
    borderRadius: 8.5,
    height: 17,
    position: "absolute" as const,
    width: 17,
  },
  container: {
    alignItems: "center" as const,
    backgroundColor: "white",
    flexDirection: "row" as const,
    height: 60,
    justifyContent: "space-around" as const,
    width: "100%" as const,
  },
  iconLayer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "absolute" as const,
  },
  image: {},
  item: {
    alignItems: "center" as const,
    backgroundColor: "white",
    borderRadius: 30,
    height: 60,
    justifyContent: "center" as const,
    width: 60,
  },
  itemMask: {
    position: "absolute" as const,
    tintColor: "white",
  },
  miniBubble: {
    alignSelf: "center" as const,
    backgroundColor: "#4C53DD",
    borderRadius: 11,
    height: 22,
    position: "absolute" as const,
    width: 22,
  },
  titleContainer: {
    alignItems: "center" as const,
    flex: 1,
    justifyContent: "center" as const,
    left: 0,
    position: "absolute" as const,
    right: 0,
    top: 0,
  },
};

export default TabBar;
