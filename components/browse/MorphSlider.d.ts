import { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface MorphSliderItem {
  image: string;
  caption?: string;
}

export interface MorphSliderRef {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export interface MorphSliderProps {
  items?: MorphSliderItem[];
  startIndex?: number;
  transition?: 'melt' | 'ripple' | 'shear' | 'swirl';
  duration?: number;
  ease?: string;
  intensity?: number;
  scale?: number;
  aberration?: number;
  drift?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  radius?: number;
  overlayColor?: string;
  showCaptions?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onSlideChange?: (index: number) => void;
  className?: string;
}

declare const MorphSlider: ForwardRefExoticComponent<MorphSliderProps & RefAttributes<MorphSliderRef>>;
export default MorphSlider;
