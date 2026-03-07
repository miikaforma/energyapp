"use client";

// https://github.com/ruuvi/com.ruuvi.station.webui/blob/master/src/components/BigValue.jsx

import React from "react";

interface ColorRGB {
    r: number;
    g: number;
    b: number;
}

interface BigValueProps {
    value: number | string | null | undefined;
    unit: string;
    alertActive?: boolean;
    label?: string;
    showExtras?: boolean;
}

const valueStyle: React.CSSProperties = {
    //fontFamily: "oswald",
    fontFamily: "'Roboto','Roboto Fallback'",
    fontWeight: "bold",
    color: 'rgba(255, 255, 255, 0.7)'
};

const unitStyle: React.CSSProperties = {
    //fontFamily: "oswald",
    fontFamily: "'Roboto','Roboto Fallback'",
    fontWeight: "bold",
    color: 'rgba(255, 255, 255, 0.7)',
    maxWidth: 100,
    fontSize: 14,
    top: 9,
    position: "absolute",
    marginLeft: 6,
    whiteSpace: "nowrap",
};

const labelStyle: React.CSSProperties = {
    //fontFamily: "mulish",
    fontFamily: "'Roboto','Roboto Fallback'",
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 6,
};

const SCALE_COLORS: Record<string, ColorRGB> = {
    UNHEALTHY: { r: 237, g: 80, b: 33 }, // Red
    POOR: { r: 247, g: 156, b: 33 }, // Orange
    MODERATE: { r: 247, g: 225, b: 62 }, // Yellow
    GOOD: { r: 150, g: 204, b: 72 }, // Green
    EXCELLENT: { r: 75, g: 200, b: 185 }, // Turquoise
};

const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v));

const rgb = ({ r, g, b }: ColorRGB): string =>
    `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

function colorAtValueRounded(val: number | null | undefined): ColorRGB {
    const v = clamp(val ?? 0, 0, 100);

    if (v < 9.5) return SCALE_COLORS.UNHEALTHY as ColorRGB;
    if (v < 49.5) return SCALE_COLORS.POOR as ColorRGB;
    if (v < 79.5) return SCALE_COLORS.MODERATE as ColorRGB;
    if (v < 89.5) return SCALE_COLORS.GOOD as ColorRGB;
    return SCALE_COLORS.EXCELLENT as ColorRGB;
}

function rgbaString(color: string | ColorRGB, alpha: number): string {
    const c = typeof color === "string" ? color : rgb(color);
    if (c.startsWith("rgb(")) {
        const nums = c
            .replace("rgb(", "")
            .replace(")", "")
            .split(",")
            .map((n) => parseInt(n.trim(), 10));
        return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
    }
    return c;
}

export default function BigValue({
    value,
    unit,
    alertActive,
    label,
    showExtras,
}: BigValueProps) {
    const colorMode = "dark";
    let extras: React.ReactNode = <></>;

    if (unit === "/100" && value != null && value !== "-") {
        const trackBg =
            colorMode === "dark" ? "rgb(7, 28, 27)" : "rgb(235, 240, 241)";
        const numValue = clamp(parseFloat(value as string), 0, 100);
        const markerColor = colorAtValueRounded(numValue);
        const markerLeft = `${numValue}%`;
        const glow = rgbaString(markerColor, 0.8);

        const barHeight = 4;

        const barStyle: React.CSSProperties = {
            position: "relative",
            width: "100%",
            marginBottom: -barHeight / 2,
            marginTop: -barHeight / 2,
            height: barHeight,
            borderRadius: 4,
            backgroundColor: trackBg,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
            overflow: "visible",
        };

        const fillStyle: React.CSSProperties = {
            position: "absolute",
            height: "100%",
            width: `${numValue}%`,
            background: rgb(markerColor),
            borderRadius: 4,
        };

        const markerStyle: React.CSSProperties = {
            position: "absolute",
            left: markerLeft,
            width: 5,
            height: barHeight,
            borderRadius: 6,
            background: rgb(markerColor),
            transform: "translateX(-50%)",
            boxShadow: `0 0 10px 3px ${glow}, 0 0 1px 1px ${rgbaString(
                markerColor,
                0.9
            )}`,
            zIndex: 1,
            pointerEvents: "none",
        };

        if (label) {
            extras = (
                <div
                    style={barStyle}
                    aria-label={`Value ${Math.round(numValue)} out of 100`}
                >
                    <div style={fillStyle} />
                    <div style={markerStyle} />
                </div>
            );
        }
    }

    const isMobile =
        typeof window !== "undefined" ? window.innerWidth <= 768 : false;
    const alertColor = "#ff8700";

    return (
        <div>
            <div style={{ position: "relative" }}>
                <span
                    style={{
                        ...valueStyle,
                        color: alertActive ? alertColor : 'rgba(255, 255, 255, 0.7)',
                        fontSize: isMobile ? 34 : 38,
                    }}
                >
                    {value ?? "-"}
                </span>
                <span style={unitStyle}>{unit}</span>
                {label && <span style={labelStyle}>{label}</span>}
            </div>
            {extras}
        </div>
    );
}
