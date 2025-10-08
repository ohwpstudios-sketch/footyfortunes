// src/types/shims-jsx.d.ts
import React from 'react';

/**
 * Treat any .jsx import as a React component.
 * This satisfies TS7016 when importing .jsx from .tsx files.
 */
declare module '*.jsx' {
  const C: React.ComponentType<any>;
  export default C;
}
