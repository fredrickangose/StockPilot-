import { useWindowDimensions } from "react-native";

export const WIDE_BREAKPOINT = 768;

/** True once the viewport is wide enough to treat as a desktop/laptop layout. */
export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}
