import { Component } from 'react';
import ScaffoldCard from '../ScaffoldCard';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof console !== 'undefined') {
      console.error('ErrorBoundary caught an error', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScaffoldCard
          name="ErrorBoundary"
          category="Layout & Core Structure"
          description="Scaffold fallback UI rendered when descendant components throw."
        />
      );
    }

    return this.props.children;
  }
}
