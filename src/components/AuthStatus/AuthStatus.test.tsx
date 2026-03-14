import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { useAuthStore } from "@/stores/auth";
import { AuthStatus } from "./AuthStatus";

describe("AuthStatus", () => {
  beforeEach(() => {
    useAuthStore.setState({ auth: { isAuthenticated: false }, loading: false });
  });

  it("shows connect button when not authenticated", () => {
    renderWithProviders(<AuthStatus />);
    expect(screen.getByText("Connect")).toBeInTheDocument();
    expect(screen.getByText("Google Drive not connected")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    useAuthStore.setState({ loading: true });
    renderWithProviders(<AuthStatus />);
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("shows email and disconnect when authenticated", () => {
    useAuthStore.setState({
      auth: { isAuthenticated: true, email: "user@gmail.com" },
      loading: false,
    });
    renderWithProviders(<AuthStatus />);
    expect(screen.getByText("user@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Disconnect")).toBeInTheDocument();
  });
});
