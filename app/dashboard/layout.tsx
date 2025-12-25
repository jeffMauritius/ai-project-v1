import { Metadata } from 'next'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayoutClient from './DashboardLayoutClient'

export const metadata: Metadata = {
  title: 'Tableau de bord - MonMariage.ai',
  description: 'Gérez votre mariage et accédez à vos informations personnelles',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
