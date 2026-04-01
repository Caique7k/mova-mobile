import type { IconNode } from "lucide";
import {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
  type SvgProps,
} from "react-native-svg";

const iconElements = {
  circle: Circle,
  ellipse: Ellipse,
  line: Line,
  path: Path,
  polygon: Polygon,
  polyline: Polyline,
  rect: Rect,
} as const;

type IconElementName = keyof typeof iconElements;

type LucideIconProps = Omit<SvgProps, "children"> & {
  color?: string;
  icon: IconNode;
  size?: number;
  strokeWidth?: number;
};

export function LucideIcon({
  color = "#525252",
  icon,
  size = 20,
  strokeWidth = 2,
  ...props
}: LucideIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {icon.map(([tagName, attributes], index) => {
        const Element =
          iconElements[tagName as IconElementName] ?? iconElements.path;

        return <Element key={`${tagName}-${index}`} {...attributes} />;
      })}
    </Svg>
  );
}
