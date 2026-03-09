"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

interface StaffTableProps {
  staff: StaffMember[];
  brands: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}

export function StaffTable({ staff, brands, locations }: StaffTableProps) {
  const getBrandName = (brandId: string) =>
    brands.find((b) => b.id === brandId)?.name ?? "Unknown";

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return "-";
    return locations.find((l) => l.id === locationId)?.name ?? "Unknown";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default" as const;
      case "manager":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (staff.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No staff members found.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div>
                <p className="font-medium">{member.name}</p>
                {member.email && (
                  <p className="text-xs text-gray-500">{member.email}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(member.role)}>
                {member.role}
              </Badge>
            </TableCell>
            <TableCell>{getBrandName(member.brandId)}</TableCell>
            <TableCell>{getLocationName(member.locationId)}</TableCell>
            <TableCell>
              <Badge variant={member.isActive ? "default" : "secondary"}>
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
