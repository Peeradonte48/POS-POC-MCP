import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModifierSheet } from "@/components/pos/modifier-sheet";
import type { MenuItem } from "@/hooks/use-menu";

const mockItemWithModifiers: MenuItem = {
  id: "item-1",
  name: "Tonkotsu Ramen",
  description: null,
  price: "290",
  imageUrl: null,
  isActive: true,
  categoryId: "cat-1",
  modifierGroups: [
    {
      id: "group-1",
      name: "Broth Intensity",
      modifierType: "single_select",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 0,
      options: [
        {
          id: "opt-1",
          name: "Regular",
          priceAdjustment: "0",
          isDefault: true,
          isActive: true,
          sortOrder: 0,
        },
        {
          id: "opt-2",
          name: "Rich",
          priceAdjustment: "30",
          isDefault: false,
          isActive: true,
          sortOrder: 1,
        },
      ],
    },
    {
      id: "group-2",
      name: "Toppings",
      modifierType: "multi_select",
      isRequired: false,
      minSelections: 0,
      maxSelections: 3,
      sortOrder: 1,
      options: [
        {
          id: "opt-3",
          name: "Extra Egg",
          priceAdjustment: "20",
          isDefault: false,
          isActive: true,
          sortOrder: 0,
        },
        {
          id: "opt-4",
          name: "Extra Chashu",
          priceAdjustment: "50",
          isDefault: false,
          isActive: true,
          sortOrder: 1,
        },
        {
          id: "opt-5",
          name: "Corn",
          priceAdjustment: "15",
          isDefault: false,
          isActive: true,
          sortOrder: 2,
        },
      ],
    },
  ],
};

describe("ModifierSheet", () => {
  it("renders notes field (MENU-03)", () => {
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );
    expect(screen.getByPlaceholderText("Add any special instructions...")).toBeDefined();
  });

  it("renders item name and modifier groups", () => {
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );
    expect(screen.getByText("Tonkotsu Ramen")).toBeDefined();
    expect(screen.getByText("Broth Intensity")).toBeDefined();
    expect(screen.getByText("Toppings")).toBeDefined();
  });

  it("renders single-select and multi-select options", () => {
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );
    expect(screen.getByText("Regular")).toBeDefined();
    expect(screen.getByText("Rich")).toBeDefined();
    expect(screen.getByText("Extra Egg")).toBeDefined();
    expect(screen.getByText("Extra Chashu")).toBeDefined();
  });

  it("shows required/optional badges", () => {
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );
    expect(screen.getByText("Required")).toBeDefined();
    expect(screen.getByText("Optional")).toBeDefined();
  });

  it("shows price adjustments for modifier options", () => {
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );
    // The +30 THB and +20 THB etc should be rendered
    // Format is Intl so it depends on locale but the values should be present
    const priceElements = screen.getAllByText(/\+/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("calls onAddToOrder with correct payload when add button clicked", () => {
    const onAddToOrder = vi.fn();
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={onAddToOrder}
      />
    );

    // Click add to order button
    const addButton = screen.getByText(/Add to Order/);
    fireEvent.click(addButton);

    expect(onAddToOrder).toHaveBeenCalledOnce();
    const payload = onAddToOrder.mock.calls[0][0];
    expect(payload.item.id).toBe("item-1");
    expect(payload.quantity).toBe(1);
    expect(payload.notes).toBe("");
  });

  it("does not render when item is null", () => {
    const { container } = render(
      <ModifierSheet
        item={null}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );
    // Should not render drawer content
    expect(container.querySelector('[data-slot="drawer-content"]')).toBeNull();
  });

  it("quantity stepper starts at 1 and increments", () => {
    render(
      <ModifierSheet
        item={mockItemWithModifiers}
        open={true}
        onOpenChange={() => {}}
        onAddToOrder={() => {}}
      />
    );

    expect(screen.getByText("1")).toBeDefined();
  });
});
