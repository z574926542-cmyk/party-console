import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import MainLayout from "./components/layout/MainLayout";
import ConsolePage from "./pages/ConsolePage";
import StagePage from "./pages/StagePage";
import WheelPage from "./pages/WheelPage";
import PeripheralPage from "./pages/PeripheralPage";
import ToolsPage from "./pages/ToolsPage";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={ConsolePage} />
        <Route path="/stage" component={StagePage} />
        <Route path="/wheel" component={WheelPage} />
        <Route path="/peripheral" component={PeripheralPage} />
        <Route path="/tools" component={ToolsPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster position="top-right" theme="dark" />
            <Router />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
