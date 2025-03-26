"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useInventory } from "@/lib/inventory-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default function FarmStall() {
  const { inventory, markAsSold, moveToInventory } = useInventory()
  const { toast } = useToast()
  const [view, setView] = useState("active")
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const handleMarkAsSold = (id) => {
    markAsSold(id)
    toast({
      title: "Item sold",
      description: "Item has been marked as sold",
    })
  }

  const handleMoveToInventory = (id) => {
    moveToInventory(id)
    toast({
      title: "Item moved",
      description: "Item has been moved back to inventory",
    })
  }

  const toggleGroup = (type: string) => {
    setOpenGroups(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const activeItems = inventory.filter((item) => item.inFarmStall && !item.sold)

  // Group items by type
  const groupedItems = activeItems.reduce((groups, item) => {
    const type = item.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(item)
    return groups
  }, {})

  // Calculate group summaries
  const getGroupSummary = (items) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    const totalValue = items.reduce((sum, item) => sum + item.salePrice, 0)
    return { totalWeight, totalValue, count: items.length }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Farm Stall</CardTitle>
          <CardDescription>Manage items in the farm stall</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([type, items]) => {
              const { totalWeight, totalValue, count } = getGroupSummary(items as any[])
              return (
                <Collapsible
                  key={type}
                  open={openGroups.includes(type)}
                  onOpenChange={() => toggleGroup(type)}
                >
                  <Card>
                    <CardContent className="p-4">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{type}</h3>
                            <p className="text-sm text-muted-foreground">
                              {count} items • {totalWeight.toFixed(2)} kg total
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${totalValue.toFixed(2)}</p>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-4 space-y-2">
                        {(items as any[]).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 rounded-lg border"
                          >
                            <div>
                              <p className="text-sm">{item.weight.toFixed(2)} kg</p>
                              <p className="text-xs text-muted-foreground">
                                Cost: ${item.costPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600/20 hover:bg-green-500/30 text-green-400 border border-green-800/50"
                                onClick={() => handleMarkAsSold(item.id)}
                              >
                                Sold
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-600/20 hover:bg-blue-500/30 text-blue-400 border border-blue-800/50"
                                onClick={() => handleMoveToInventory(item.id)}
                              >
                                To Storage
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              )
            })}
            {activeItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No items in farm stall
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

