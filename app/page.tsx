"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Dashboard from "@/components/dashboard"
import Inventory from "@/components/inventory"
import FarmStall from "@/components/farm-stall"
import WeighingCalculator from "@/components/weighing-calculator"
import { Menu, Package, Scale, Store } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const isMobile = useMobile()

  return (
    <div className="container mx-auto p-4">
      {isMobile ? (
        <div className="space-y-4">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="farmstall">Farm Stall</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "inventory" && <Inventory />}
            {activeTab === "farmstall" && <FarmStall />}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="farmstall">Farm Stall</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          <TabsContent value="inventory">
            <Inventory />
          </TabsContent>
          <TabsContent value="farmstall">
            <FarmStall />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

