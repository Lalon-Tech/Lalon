import React from 'react';

export interface LogoTransformOptions {
  logoScale?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
}

/**
 * Returns inline CSSProperties for rendering the Somiti logo with user-configured
 * scale (zoom) and translation (offset X and Y), keeping it centered and within bounds.
 */
export function getLogoTransformStyle(
  options?: LogoTransformOptions,
  extraStyle?: React.CSSProperties
): React.CSSProperties {
  const scale = typeof options?.logoScale === 'number' && !isNaN(options.logoScale)
    ? Math.max(0.4, Math.min(3.0, options.logoScale))
    : 1;

  const offsetX = typeof options?.logoOffsetX === 'number' && !isNaN(options.logoOffsetX)
    ? Math.max(-60, Math.min(60, options.logoOffsetX))
    : 0;

  const offsetY = typeof options?.logoOffsetY === 'number' && !isNaN(options.logoOffsetY)
    ? Math.max(-60, Math.min(60, options.logoOffsetY))
    : 0;

  return {
    transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
    transformOrigin: 'center center',
    transition: 'transform 0.12s ease-out',
    ...extraStyle,
  };
}
