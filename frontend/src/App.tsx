import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useAuthStore } from "./stores/auth.store";

// Layouts
import LayoutShell from "./components/layout/LayoutShell";
import AuthLayout from "./components/layout/AuthLayout";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ContentEditorPage from "./pages/content/ContentEditorPage";
import ContentLibraryPage from "./pages/content/ContentLibraryPage";
import ContentPreviewPage from "./pages/content/ContentPreviewPage";
import WorkflowBoardPage from "./pages/workflow/WorkflowBoardPage";
import PublishingCenterPage from "./pages/publishing/PublishingCenterPage";
import AnalyticsDashboardPage from "./pages/analytics/AnalyticsDashboardPage";
import MediaManagerPage from "./pages/media/MediaManagerPage";
import SettingsPage from "./pages/settings/SettingsPage";
import EditorialCalendarPage from "./pages/editorial/EditorialCalendarPage";
import TeamPage from "./pages/team/TeamPage";
import NotFoundPage from "./pages/errors/NotFoundPage";

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
      light: "#66BB6A",
      dark: "#1B5E20",
    },
    secondary: {
      main: "#1565C0",
      light: "#42A5F5",
      dark: "#0D47A1",
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

// Setup Apollo Client
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:3000/graphql",
  credentials: "include",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url:
      import.meta.env.VITE_GRAPHQL_WS_ENDPOINT || "ws://localhost:3000/graphql",
    connectionParams: () => {
      const token = useAuthStore.getState().token;
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  }),
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink,
);

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      ContentItem: {
        keyFields: ["id"],
      },
      User: {
        keyFields: ["id"],
      },
      Organization: {
        keyFields: ["id"],
      },
    },
  }),
});

/**
 * ProtectedRoute Component
 * Redirects unauthenticated users to login
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  const { verifyToken } = useAuthStore();

  useEffect(() => {
    // Verify authentication on app load
    verifyToken();
  }, [verifyToken]);

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Authentication Routes */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <DashboardPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/content"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <ContentLibraryPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/content/new"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <ContentEditorPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/content/:id/edit"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <ContentEditorPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/content/:id/preview"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <ContentPreviewPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/workflow"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <WorkflowBoardPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/publishing"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <PublishingCenterPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <AnalyticsDashboardPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/media"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <MediaManagerPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <SettingsPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <EditorialCalendarPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <LayoutShell>
                    <TeamPage />
                  </LayoutShell>
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ApolloProvider>
  );
};

export default App;
