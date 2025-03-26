"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useInventory } from "@/lib/inventory-context"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { sales, inventory, markAsSold, moveToInventory } = useInventory()
  const { toast } = useToast()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const handleMarkAsSold = (id: string) => {
    markAsSold(id)
    toast({
      title: "Item sold",
      description: "Item has been marked as sold",
    })
  }

  const handleMoveToInventory = (id: string) => {
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

  // Get farm stall items
  const farmStallItems = inventory.filter((item) => item.inFarmStall && !item.sold)

  // Group farm stall items
  const groupedFarmStallItems = farmStallItems.reduce((groups, item) => {
    const type = item.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(item)
    return groups
  }, {})

  const getGroupSummary = (items) => {
    const totalWeight = items.reduce((sum, item) =>
      item.type.startsWith('Flowers') ? sum + item.weight : sum + item.weight, 0
    )
    const totalValue = items.reduce((sum, item) => sum + item.salePrice, 0)
    return { totalWeight, totalValue, count: items.length }
  }

  // Calculate sales data
  const salesData = sales.reduce((acc, sale) => {
    const date = new Date(sale.soldDate).toLocaleDateString()
    const existingDay = acc.find(day => day.date === date)

    if (existingDay) {
      existingDay.sales += sale.salePrice
      existingDay.profit += sale.salePrice - sale.costPrice
    } else {
      acc.push({
        date,
        sales: sale.salePrice,
        profit: sale.salePrice - sale.costPrice
      })
    }
    return acc
  }, [])

  // Add these calculations after your existing data calculations (around line 83)
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0)
  const totalProfit = salesData.reduce((sum, day) => sum + day.profit, 0)
  const totalItemsSold = sales.length
  const itemsInFarmStall = farmStallItems.length

  // Calculate enterprise performance
  const enterprisePerformance = sales.reduce((acc, sale) => {
    const type = sale.type
    if (!acc[type]) {
      acc[type] = {
        sales: 0,
        profit: 0,
        count: 0,
      }
    }
    acc[type].sales += sale.salePrice
    acc[type].profit += sale.salePrice - sale.costPrice
    acc[type].count += 1
    return acc
  }, {})

  // Calculate market segment performance
  const marketPerformance = sales.reduce((acc, sale) => {
    const market = sale.type.startsWith('Flowers')
      ? 'Cut Flowers'
      : sale.fromExternalBatch
        ? 'External Produce'
        : 'Feel Good Farm'

    if (!acc[market]) {
      acc[market] = {
        sales: 0,
        profit: 0,
        count: 0,
      }
    }
    acc[market].sales += sale.salePrice
    acc[market].profit += sale.salePrice - sale.costPrice
    acc[market].count += 1
    return acc
  }, {})

  // Sort enterprises by profit
  const topEnterprises = Object.entries(enterprisePerformance)
    .sort(([, a], [, b]) => b.profit - a.profit)
    .slice(0, 5)

  // Sort market segments by profit
  const marketSegments = Object.entries(marketPerformance)
    .sort(([, a], [, b]) => b.profit - a.profit)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime sales value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime profit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsSold}</div>
            <p className="text-xs text-muted-foreground">
              Total items sold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farm Stall Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemsInFarmStall}</div>
            <p className="text-xs text-muted-foreground">
              Items currently in stall
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Farm Stall Section */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Stall Inventory</CardTitle>
          <CardDescription>
            Currently available items in the farm stall
          </CardDescription>
        </CardHeader>
        <CardContent>
          {farmStallItems.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedFarmStallItems).map(([type, items]) => {
                const { totalWeight, totalValue, count } = getGroupSummary(items as any[])
                return (
                  <Collapsible
                    key={type}
                    open={openGroups.includes(type)}
                    onOpenChange={() => toggleGroup(type)}
                  >
                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-none shadow-xl">
                      <CardContent className="p-4 space-y-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{type}</h3>
                              <p className="text-sm text-muted-foreground">
                                {count} items •
                                {type.startsWith('Flowers')
                                  ? ` ${totalWeight} bunches`
                                  : ` ${totalWeight.toFixed(2)} kg total`
                                }
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
                              className="transform hover:scale-102 transition-all duration-200 hover:bg-zinc-800/50"
                            >
                              <div className="flex justify-between items-center p-2 rounded-lg border">
                                <div>
                                  {item.type.startsWith('Flowers') ? (
                                    <p className="text-sm">1 bunch</p>
                                  ) : (
                                    <p className="text-sm">{item.weight.toFixed(2)} kg</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Cost: ${item.costPrice.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-bold mr-4">${item.salePrice.toFixed(2)}</p>
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
                            </div>
                          ))}
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No items currently in farm stall
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Analysis Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Best performing products by profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEnterprises.map(([type, data]) => (
                <div key={type} className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{type}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.count} items sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-500">
                      ${data.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${data.sales.toFixed(2)} sales
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Segment Performance</CardTitle>
            <CardDescription>Performance by market segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketSegments.map(([market, data]) => (
                <div key={market} className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{market}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.count} items sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-500">
                      ${data.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${data.sales.toFixed(2)} sales
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>
            Your sales and profit over time
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sales" name="Sales ($)" fill="#8884d8" />
                <Bar dataKey="profit" name="Profit ($)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No sales data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

