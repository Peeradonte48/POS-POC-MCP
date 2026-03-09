import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PinPad } from "@/components/pos/pin-pad";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { OrderPanel } from "@/components/pos/order-panel";

describe("Smoke tests", () => {
  it("renders PinPad without errors", () => {
    render(<PinPad onSubmit={() => {}} />);
    expect(screen.getByText("0")).toBeDefined();
  });

  it("renders CategorySidebar without errors", () => {
    render(
      <CategorySidebar
        categories={[]}
        selectedCategoryId={null}
        onSelectCategory={() => {}}
      />
    );
    expect(screen.getByText("All Items")).toBeDefined();
  });

  it("renders MenuGrid with empty state", () => {
    render(
      <MenuGrid items={[]} isLoading={false} onSelectItem={() => {}} />
    );
    expect(screen.getByText("No items in this category")).toBeDefined();
  });

  it("renders MenuGrid loading state", () => {
    const { container } = render(
      <MenuGrid items={[]} isLoading={true} onSelectItem={() => {}} />
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  it("renders OrderPanel with empty state", () => {
    render(
      <OrderPanel
        items={[]}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
        onClearOrder={() => {}}
        onSwitchUser={() => {}}
      />
    );
    expect(screen.getByText("No items added")).toBeDefined();
    expect(screen.getByText("Order")).toBeDefined();
  });
});
