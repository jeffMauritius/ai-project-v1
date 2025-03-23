import { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}