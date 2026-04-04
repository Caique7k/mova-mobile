declare module "@logisticinfotech/react-native-bottom-navigation" {
  import type { ComponentType, ReactNode } from "react";
  import type { ColorValue, ImageSourcePropType } from "react-native";

  export type FluidBottomNavigationValue = {
    icon?: ImageSourcePropType;
    renderIcon?: (state: { active: boolean; color: string }) => ReactNode;
    title: string;
  };

  export type FluidBottomNavigationProps = {
    onPress: (tabIndex: number) => void;
    selectedTab?: number;
    tintColor?: ColorValue;
    values: FluidBottomNavigationValue[];
  };

  const FluidTabBar: ComponentType<FluidBottomNavigationProps>;
  export default FluidTabBar;
}
