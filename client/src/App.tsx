import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/ReferenceHome";
import Workspace from "./pages/Workspace";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/for-business">
        <Workspace mode="business" />
      </Route>
      <Route path="/for-professionals">
        <Workspace mode="professional" />
      </Route>
      <Route path="/ops">
        <Workspace mode="ops" />
      </Route>
      <Route path="/dashboard">
        <Workspace mode="ops" />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
