import { useState, useEffect } from "react";

interface JsonEditorProps<T> {
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  rows?: number;
}

export function JsonEditor<T>({ value, onChange, placeholder, rows = 8 }: JsonEditorProps<T>) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (next: string) => {
    setText(next);
    try {
      const parsed = JSON.parse(next);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  return (
    <div className="space-y-1">
      <textarea
        className="w-full border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-mono"
        rows={rows}
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
      />
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
