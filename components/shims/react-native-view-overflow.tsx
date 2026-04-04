import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";

export default forwardRef<View, ViewProps>(function ViewOverflowShim(
  props,
  ref,
) {
  return <View ref={ref} {...props} style={[{ overflow: "visible" }, props.style]} />;
});
