import React, { forwardRef, useContext, useMemo, useId } from "react";
import { ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";

import { cn } from "@/lib/utils";

// Themes
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within <ChartContainer>");
  return context;
}

// Chart Container
export const ChartContainer = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactElement;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs ...", // keep your styles
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

// Chart style
export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, cfg]) => cfg.color || cfg.theme);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => {
            return `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : "";
  })
  .join("\n")}
}`;
          })
          .join("\n"),
      }}
    />
  );
};

// Tooltip & Legend
export const ChartTooltip = RechartsTooltip;
export const ChartLegend = RechartsLegend;

// Tooltip Content
export const ChartTooltipContent = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsTooltip> & {
    hideLabel?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }
>((props, ref) => {
  const { config } = useChart();
  const { active, payload, hideLabel = false, indicator = "dot", label, labelFormatter, labelKey, nameKey } = props;

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) return null;
    const [item] = payload;
    const key = `${labelKey || item.dataKey || item.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string" ? config[label as keyof typeof config]?.label || label : itemConfig?.label;

    if (labelFormatter) return <div className="font-medium">{labelFormatter(value, payload)}</div>;
    if (!value) return null;
    return <div className="font-medium">{value}</div>;
  }, [payload, hideLabel, label, labelFormatter, config, labelKey]);

  if (!active || !payload?.length) return null;

  return (
    <div
      ref={ref}
      className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background p-2.5 text-xs shadow-xl"
    >
      {!tooltipLabel ? null : tooltipLabel}
      {payload.map((item) => {
        const key = `${nameKey || item.name || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const indicatorColor = item.color || item.payload?.fill;

        return (
          <div key={item.dataKey} className="flex w-full items-center gap-2">
            {itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <div className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: indicatorColor }} />
            )}
            <span>{itemConfig?.label || item.name}</span>
            {item.value !== undefined && <span>{item.value.toLocaleString()}</span>}
          </div>
        );
      })}
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltip";

// Legend Content
export const ChartLegendContent = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { payload?: any[]; hideIcon?: boolean; nameKey?: string }
>(({ payload, hideIcon = false, nameKey, ...props }, ref) => {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div ref={ref} className="flex items-center gap-4" {...props}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        return (
          <div key={item.value} className="flex items-center gap-1.5">
            {!hideIcon && itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: item.color }} />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

// Helper function
function getPayloadConfigFromPayload(config: ChartConfig, payload: any, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;
  const p = "payload" in payload && typeof payload.payload === "object" ? payload.payload : payload;
  const configKey = key in p ? (p[key] as string) : key;
  return config[configKey] || config[key];
}
