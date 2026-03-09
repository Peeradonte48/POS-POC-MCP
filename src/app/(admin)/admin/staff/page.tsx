"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StaffTable } from "@/components/admin/staff-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
  brandId: string;
  locationId: string | null;
  isActive: boolean | null;
  createdAt: Date;
}

interface Brand {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  brandId: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("cashier");
  const [formBrandId, setFormBrandId] = useState("");
  const [formLocationId, setFormLocationId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPin, setFormPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [staffRes, brandRes, locRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/brands"),
        fetch("/api/locations"),
      ]);
      if (staffRes.ok) setStaff(await staffRes.json());
      if (brandRes.ok) {
        const brandsData = await brandRes.json();
        setBrands(brandsData);
        if (brandsData.length > 0 && !formBrandId)
          setFormBrandId(brandsData[0].id);
      }
      if (locRes.ok) setLocations(await locRes.json());
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        name: formName,
        role: formRole,
        brandId: formBrandId,
        locationId: formLocationId || null,
      };

      if (formRole === "cashier") {
        body.pin = formPin;
      } else {
        body.email = formEmail;
        body.password = formPassword;
      }

      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create staff");
        return;
      }

      toast.success("Staff member created");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormRole("cashier");
    setFormEmail("");
    setFormPassword("");
    setFormPin("");
    setFormLocationId("");
  };

  const filteredLocations = locations.filter(
    (l) => l.brandId === formBrandId
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Name *</Label>
                <Input
                  id="staff-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Staff member name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role *</Label>
                <select
                  id="staff-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-brand">Brand *</Label>
                <select
                  id="staff-brand"
                  value={formBrandId}
                  onChange={(e) => {
                    setFormBrandId(e.target.value);
                    setFormLocationId("");
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-location">Location</Label>
                <select
                  id="staff-location"
                  value={formLocationId}
                  onChange={(e) => setFormLocationId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">No location</option>
                  {filteredLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {formRole === "cashier" ? (
                <div className="space-y-2">
                  <Label htmlFor="staff-pin">PIN (4-6 digits) *</Label>
                  <Input
                    id="staff-pin"
                    type="password"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    required
                    minLength={4}
                    maxLength={6}
                    pattern="[0-9]*"
                    placeholder="Enter PIN"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email *</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password *</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Staff"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading staff...</p>
      ) : (
        <StaffTable staff={staff} brands={brands} locations={locations} />
      )}
    </div>
  );
}
