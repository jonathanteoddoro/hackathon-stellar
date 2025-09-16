import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface NodeVariablesFormProps {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}

export const NodeVariablesForm: React.FC<NodeVariablesFormProps> = ({
  variables,
  onChange,
}) => {
  const addVariable = () => {
    const newKey = `var${Object.keys(variables).length + 1}`;
    onChange({
      ...variables,
      [newKey]: "",
    });
  };

  const removeVariable = (keyToRemove: string) => {
    const newVariables = { ...variables };
    delete newVariables[keyToRemove];
    onChange(newVariables);
  };

  const updateVariableKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey) return;

    const newVariables = { ...variables };
    const value = newVariables[oldKey];
    delete newVariables[oldKey];

    // Avoid key conflicts
    if (Object.prototype.hasOwnProperty.call(newVariables, newKey)) {
      return; // Don't update if key already exists
    }

    newVariables[newKey] = value;
    onChange(newVariables);
  };

  const updateVariableValue = (key: string, value: string) => {
    onChange({
      ...variables,
      [key]: value,
    });
  };

  const variableEntries = Object.entries(variables);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white/90">
          Custom Variables
        </div>
        <button
          onClick={addVariable}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white"
          title="Add Variable"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {variableEntries.length === 0 ? (
        <div className="text-xs text-white/50 p-3 bg-white/5 rounded">
          No custom variables defined. Variables can be used to pass data
          between nodes.
        </div>
      ) : (
        <div className="space-y-3">
          {variableEntries.map(([key, value], index) => (
            <div key={`${key}-${index}`} className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-white/70 block mb-1">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateVariableKey(key, e.target.value)}
                  className="w-full px-2 py-1 bg-white/5 border border-white/15 rounded text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="variable_name"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-white/70 block mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateVariableValue(key, e.target.value)}
                  className="w-full px-2 py-1 bg-white/5 border border-white/15 rounded text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="variable_value"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removeVariable(key)}
                  className="w-6 h-6 grid place-items-center rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                  title="Remove Variable"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          <div className="text-xs text-white/60 bg-blue-400/10 p-2 rounded border border-blue-400/20">
            <strong>Tip:</strong> Variables defined here will be available as
            outputs for other nodes to use. They will appear in the "variables"
            object in the output payload.
          </div>
        </div>
      )}
    </div>
  );
};
