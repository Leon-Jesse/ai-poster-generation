import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"

interface PlaceholderProps {
  title: string
  description?: string
}

export default function Placeholder({ title, description = "This page is under construction. Please check back later." }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
      <div className="bg-muted p-4 rounded-full">
        <Construction className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-[500px]">{description}</p>
      <div className="pt-4">
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
