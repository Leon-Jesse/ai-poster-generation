import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wand2, Image as ImageIcon, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Link
            to="/twitter"
            className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium"
            target="_blank"
          >
            Follow us on Twitter
          </Link>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            AI Poster Generation <br /> Made Simple.
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Create stunning posters in seconds with AuraDraw. Simply describe your idea, 
            and let our AI handle the rest. Perfect for marketing, events, and social media.
          </p>
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg" className="h-11 px-8">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="outline" size="lg" className="h-11 px-8">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24 rounded-lg">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Unlock your creativity with our powerful AI tools.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Wand2 className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <h3 className="font-bold">Text to Image</h3>
                <p className="text-sm text-muted-foreground">
                  Convert your text descriptions into high-quality poster images instantly.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <ImageIcon className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <h3 className="font-bold">Multiple Styles</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from a variety of artistic styles including Cyberpunk, Minimalist, and more.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <Zap className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <h3 className="font-bold">Fast Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Get your results in seconds. Optimized for speed and quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
