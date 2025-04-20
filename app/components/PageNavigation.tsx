import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageNavigationProps {
  title?: string
  href?: string
}

const PageNavigation = ({ 
  title = "Retour aux produits",
  href = "/product"
}: PageNavigationProps) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" />
        <Link href={href} className="hover:text-primary transition-colors">
          {title}
        </Link>
      </div>
    </div>
  )
}

export default PageNavigation