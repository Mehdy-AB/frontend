import * as LucideIcons from 'lucide-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Render a named Lucide icon to an SVG string.
 * Used for stamp HTML generation and PNG rendering where we need raw SVG markup.
 */
export function getIconSvgString(
    iconName: string,
    size: number = 24,
    color: string = '#000000'
): string {
    const IconComponent = (LucideIcons as any)[iconName];

    if (!IconComponent) {
        // Fallback: generic circle if icon name is invalid
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
    }

    try {
        const markup = renderToStaticMarkup(
            React.createElement(IconComponent, {
                width: size,
                height: size,
                color: color,
                strokeWidth: 2,
            })
        );
        return markup;
    } catch {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
    }
}
