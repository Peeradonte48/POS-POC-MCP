export interface ERPCategory {
  erpId: string;
  name: string;
  parentErpId?: string;
  sortOrder: number;
  imageUrl?: string;
}

export interface ERPModifier {
  name: string;
  priceAdjustment: number;
  isDefault?: boolean;
}

export interface ERPModifierGroup {
  name: string;
  type: "single_select" | "multi_select";
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number;
  options: ERPModifier[];
}

export interface ERPMenuItem {
  erpId: string;
  categoryErpId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  modifierGroups?: ERPModifierGroup[];
}

export interface ERPSyncResponse {
  categories: ERPCategory[];
  items: ERPMenuItem[];
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  categoriesSynced: number;
  errors?: string[];
}
