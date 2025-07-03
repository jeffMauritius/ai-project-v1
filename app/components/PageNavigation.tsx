import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageNavigationProps {
  title?: string
  href?: string
}

export function PageNavigation({ title = "Retour", href = "/" }: PageNavigationProps) {
  return (
    <div className="flex items-center space-x-1">
      <Link
        href={href}
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {title}
      </Link>
    </div>
  )
}