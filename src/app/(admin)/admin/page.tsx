import { db } from "@/db";
import { brands, locations, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Building2, MapPin, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

async function getCounts() {
  const [brandCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(brands);
  const [locationCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(locations);
  const [staffCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  return {
    brands: brandCount.count,
    locations: locationCount.count,
    staff: staffCount.count,
  };
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const stats = [
    {
      title: "Brands",
      count: counts.brands,
      icon: <Building2 className="h-8 w-8 text-blue-500" />,
      href: "/admin/brands",
      description: "Manage your restaurant brands",
    },
    {
      title: "Locations",
      count: counts.locations,
      icon: <MapPin className="h-8 w-8 text-green-500" />,
      href: "/admin/locations",
      description: "Configure locations and settings",
    },
    {
      title: "Staff",
      count: counts.staff,
      icon: <Users className="h-8 w-8 text-purple-500" />,
      href: "/admin/staff",
      description: "Manage staff accounts and roles",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.count}</div>
                <CardDescription className="mt-1">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
