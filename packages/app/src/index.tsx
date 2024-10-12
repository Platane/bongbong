import * as React from "react";
import { createRoot } from "react-dom/client";

class ErrorBoundary extends React.Component<{ children: any }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) return <h1>something bad happened</h1>;
    return this.props.children;
  }
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<ErrorBoundary>wip</ErrorBoundary>);
