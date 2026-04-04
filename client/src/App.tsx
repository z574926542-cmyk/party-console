import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import MainLayout from "./components/layout/MainLayout";
import ConsolePage from "./pages/ConsolePage";
import StagePage from "./pages/StagePage";
import WheelPage from "./pages/WheelPage";
import PeripheralPage from "./pages/PeripheralPage";
import LibraryPage from './pages/LibraryPage';
import ImageManagerPage from './pages/ImageManagerPage';
import NotFound from './pages/NotFound';

function Router() {
  return (
    <WouterRouter hook={useHashLocation}>
    <MainLayout>
      <Switch>
        <Route path="/" component={ConsolePage} />
        <Route path="/stage" component={StagePage} />
        <Route path="/wheel" component={WheelPage} />
        <Route path="/peripheral" component={PeripheralPage} />
        <Route path="/library" component={LibraryPage} />
        <Route path="/images" component={ImageManagerPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <TooltipProvider>
            <Toaster position="top-right" />
            <Router />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
