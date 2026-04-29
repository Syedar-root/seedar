import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
} from "#pkg/seedar/types";
import type { ISpec } from "@visactor/vchart";
import { createPanelFormatterResolver } from "../../../../utils/formatting/applyQueryFormatting";
import { sqlResultToObjects } from "./transformChartSpec";

type ChartDatum = Record<string, unknown>;

const toFieldName = (field: string | string[] | undefined): string | undefined => {
  if (Array.isArray(field)) {
    return field[0];
  }
  return field;
};

const cloneChartSpec = <T extends ISpec>(spec: T): T =>
  JSON.parse(JSON.stringify(spec)) as T;

const inferRoleByField = (
  field: string | undefined,
  metricFields: Set<string>,
): "metric" | "dimension" => {
  if (!field) {
    return "dimension";
  }

  return metricFields.has(field) ? "metric" : "dimension";
};

const createChartValueFormatter = ({
  formatting,
  data,
}: {
  formatting?: PanelFormattingConfig;
  data: ExecuteQueryResponse;
}) => {
  const resolver = createPanelFormatterResolver({
    formatting,
    columnMappings: data.columnMappings,
  });

  const metricFields = new Set(
    (data.columnMappings || [])
      .filter((mapping) => mapping.type === "metric")
      .flatMap((mapping) => [
        mapping.alias,
        mapping.displayName,
        mapping.businessName,
      ])
      .filter((value): value is string => Boolean(value)),
  );

  const formatFieldValue = (
    field: string | undefined,
    value: unknown,
    surface: "tooltip" | "data_label",
  ): string | number => {
    const mapping = resolver.findMappingByField(field);
    return resolver.format(value, {
      surface,
      role: mapping?.type || inferRoleByField(field, metricFields),
      mapping,
    });
  };

  return {
    formatFieldValue,
    metricFields,
  };
};

const enhanceLabelFormatting = <T extends ISpec>(
  spec: T,
  options: ReturnType<typeof createChartValueFormatter>,
): T => {
  const nextSpec = spec as unknown as Record<string, unknown>;
  const type = String(nextSpec.type || "");
  const configuredSourceField =
    nextSpec.label &&
    typeof nextSpec.label === "object" &&
    typeof (nextSpec.label as Record<string, unknown>).sourceField === "string"
      ? ((nextSpec.label as Record<string, unknown>)
          .sourceField as string)
      : undefined;

  const valueField =
    toFieldName(nextSpec.yField as string | string[] | undefined) ||
    toFieldName(nextSpec.valueField as string | string[] | undefined);

  if (!nextSpec.label || typeof nextSpec.label !== "object") {
    return spec;
  }

  const nextLabel = {
    ...(nextSpec.label as Record<string, unknown>),
    formatMethod: (text: string | string[], datum?: ChartDatum) => {
      const textValue = Array.isArray(text) ? text[0] : text;
      const fallbackField =
        configuredSourceField && configuredSourceField !== "auto"
          ? toFieldName(
              nextSpec[configuredSourceField] as string | string[] | undefined,
            ) || configuredSourceField
          : type === "pie" ||
              type === "rose" ||
              type === "radar" ||
              type === "funnel"
            ? toFieldName(
                nextSpec.valueField as string | string[] | undefined,
              )
            : valueField;
      const value =
        datum && fallbackField && datum[fallbackField] !== undefined
          ? datum[fallbackField]
          : textValue;

      return String(
        options.formatFieldValue(fallbackField, value, "data_label"),
      );
    },
  };

  nextSpec.label = nextLabel;
  return nextSpec as T;
};

const buildTooltipContent = (
  label: string,
  field: string | undefined,
  options: ReturnType<typeof createChartValueFormatter>,
) => ({
  key: () => label,
  value: (datum: ChartDatum) =>
    String(
      options.formatFieldValue(
        field,
        field && datum[field] !== undefined ? datum[field] : undefined,
        "tooltip",
      ),
    ),
});

const enhanceTooltipFormatting = <T extends ISpec>(
  spec: T,
  rawRows: ChartDatum[],
  options: ReturnType<typeof createChartValueFormatter>,
): T => {
  const nextSpec = spec as unknown as Record<string, unknown>;
  const type = String(nextSpec.type || "");

  const xField = toFieldName(nextSpec.xField as string | string[] | undefined);
  const yField = toFieldName(nextSpec.yField as string | string[] | undefined);
  const categoryField = toFieldName(
    nextSpec.categoryField as string | string[] | undefined,
  );
  const valueField = toFieldName(
    nextSpec.valueField as string | string[] | undefined,
  );
  const seriesField = toFieldName(
    nextSpec.seriesField as string | string[] | undefined,
  );
  const sizeField = toFieldName(nextSpec.sizeField as string | string[] | undefined);

  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  const labelByField = new Map<string, string>(
    headers.map((header) => [
      header,
      options.formatFieldValue(header, header, "tooltip").toString() === header
        ? header
        : header,
    ]),
  );

  const tooltipContent = [];

  if (type === "pie" || type === "rose" || type === "radar" || type === "funnel") {
    if (categoryField) {
      tooltipContent.push(
        buildTooltipContent(
          labelByField.get(categoryField) || categoryField,
          categoryField,
          options,
        ),
      );
    }
    if (valueField) {
      tooltipContent.push(
        buildTooltipContent(
          labelByField.get(valueField) || valueField,
          valueField,
          options,
        ),
      );
    }
  } else {
    if (xField) {
      tooltipContent.push(
        buildTooltipContent(labelByField.get(xField) || xField, xField, options),
      );
    }
    if (yField) {
      tooltipContent.push(
        buildTooltipContent(labelByField.get(yField) || yField, yField, options),
      );
    }
    if (sizeField) {
      tooltipContent.push(
        buildTooltipContent(
          labelByField.get(sizeField) || sizeField,
          sizeField,
          options,
        ),
      );
    }
  }

  if (seriesField) {
    tooltipContent.push(
      buildTooltipContent(
        labelByField.get(seriesField) || seriesField,
        seriesField,
        options,
      ),
    );
  }

  if (tooltipContent.length === 0) {
    return spec;
  }

  nextSpec.tooltip = {
    ...(typeof nextSpec.tooltip === "object" && nextSpec.tooltip
      ? (nextSpec.tooltip as Record<string, unknown>)
      : {}),
    mark: {
      ...(isPlainObject(nextSpec.tooltip) && isPlainObject(nextSpec.tooltip.mark)
        ? (nextSpec.tooltip.mark as Record<string, unknown>)
        : {}),
      content: tooltipContent,
    },
  };

  return nextSpec as T;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const applyChartFormattingToSpec = <T extends ISpec>({
  spec,
  data,
  formatting,
}: {
  spec: T;
  data: ExecuteQueryResponse;
  formatting?: PanelFormattingConfig;
}): T => {
  if (!formatting) {
    return spec;
  }

  const rawRows = sqlResultToObjects(data.results);
  const formatterOptions = createChartValueFormatter({
    formatting,
    data,
  });

  let nextSpec = cloneChartSpec(spec);
  nextSpec = enhanceLabelFormatting(nextSpec, formatterOptions);
  nextSpec = enhanceTooltipFormatting(nextSpec, rawRows, formatterOptions);

  return nextSpec;
};
