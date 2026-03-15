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
    expect(screen.getByText("auth.connect")).toBeInTheDocument();
    expect(screen.getByText("auth.notConnected")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    useAuthStore.setState({ loading: true });
    renderWithProviders(<AuthStatus />);
    expect(screen.getByText("auth.connecting")).toBeInTheDocument();
  });

  it("shows email and disconnect when authenticated", () => {
    useAuthStore.setState({
      auth: { isAuthenticated: true, email: "user@gmail.com" },
      loading: false,
    });
    renderWithProviders(<AuthStatus />);
    expect(screen.getByText("user@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("auth.disconnect")).toBeInTheDocument();
  });
});
