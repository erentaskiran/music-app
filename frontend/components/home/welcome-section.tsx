"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function WelcomeSection() {
  const [greeting, setGreeting] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<string | null>(null)

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) {
        setGreeting('Good morning')
      } else if (hour < 18) {
        setGreeting('Good afternoon')
      } else {
        setGreeting('Good evening')
      }
      
      setCurrentTime(new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }))
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (greeting === null || currentTime === null) {
    return (
      <section className="mb-8">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary/20 via-accent/20 to-chart-4/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-chart-4/10 animate-pulse" />
          <CardContent className="relative z-10 p-8">
            <p className="text-sm text-muted-foreground mb-1">&nbsp;</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Ready to discover something new? Explore your personalized recommendations and favorite tracks.
            </p>
          </CardContent>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-chart-4/20 rounded-full blur-3xl" />
        </Card>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary/20 via-accent/20 to-chart-4/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-chart-4/10 animate-pulse" />
        <CardContent className="relative z-10 p-8">
          <p className="text-sm text-muted-foreground mb-1">{currentTime}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {greeting}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Ready to discover something new? Explore your personalized recommendations and favorite tracks.
          </p>
        </CardContent>
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-chart-4/20 rounded-full blur-3xl" />
      </Card>
    </section>
  )
}
