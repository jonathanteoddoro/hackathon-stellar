import React from "react";

interface NodeParameterFormProps {
  requiredParams: Record<string, string>;
  currentValues: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  nodeType: string;
}

export const NodeParameterForm: React.FC<NodeParameterFormProps> = ({
  requiredParams,
  currentValues,
  onChange,
  nodeType,
}) => {
  const handleValueChange = (key: string, value: string) => {
    const paramType = requiredParams[key];
    let convertedValue: unknown = value;

    // Convert value based on expected type
    if (paramType === "number") {
      convertedValue = value === "" ? "" : Number(value);
    } else if (paramType === "boolean") {
      convertedValue = value === "true";
    } else if (paramType === "object") {
      try {
        convertedValue = value === "" ? {} : JSON.parse(value);
      } catch {
        convertedValue = value; // Keep as string if invalid JSON
      }
    }

    onChange({
      ...currentValues,
      [key]: convertedValue,
    });
  };

  const renderInput = (key: string, type: string) => {
    const value = currentValues[key];

    switch (type) {
      case "boolean":
        return (
          <select
            value={value?.toString() || "false"}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={value?.toString() || ""}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Enter a number"
          />
        );

      case "object":
        return (
          <textarea
            value={
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : value?.toString() || ""
            }
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
            rows={3}
            placeholder='{"key": "value"}'
          />
        );

      default: // string
        return (
          <input
            type="text"
            value={value?.toString() || ""}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Enter text"
          />
        );
    }
  };

  const getFieldHint = (key: string, type: string) => {
    // Node-specific hints
    if (nodeType.includes("cron") && key === "time") {
      return 'Use cron expression format (e.g., "0 0 * * *" for daily)';
    }
    if (nodeType.includes("compound") && key === "minThreshold") {
      return "Minimum threshold for auto compound (default: 5)";
    }
    if (nodeType.includes("email")) {
      if (key === "transporter") return "Email service configuration object";
      if (key === "from") return "Sender email address";
      if (key === "to") return "Recipient email address";
    }
    if (nodeType.includes("blend")) {
      if (key === "userAddress") return "Stellar wallet address";
      if (key === "amount") return "Amount to supply/borrow";
      if (key === "asset") return "Asset symbol (e.g., USDC, XLM)";
    }

    // Generic type hints
    switch (type) {
      case "number":
        return "Enter a numeric value";
      case "boolean":
        return "Select true or false";
      case "object":
        return "Enter a valid JSON object";
      default:
        return "Enter text value";
    }
  };

  if (!requiredParams || Object.keys(requiredParams).length === 0) {
    return (
      <div className="text-xs text-white/50 p-3 bg-white/5 rounded">
        No required parameters for this node type
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-white/90 mb-3">
        Required Parameters
      </div>
      {Object.entries(requiredParams).map(([key, type]) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/90">{key}</label>
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
              {type}
            </span>
          </div>
          {renderInput(key, type)}
          <div className="text-xs text-white/60">{getFieldHint(key, type)}</div>
        </div>
      ))}
    </div>
  );
};
