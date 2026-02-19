import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app header", () => {
  render(<App />);
  expect(screen.getByText(/Simple Notes Manager/i)).toBeInTheDocument();
});
