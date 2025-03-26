"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useInventory } from "@/lib/inventory-context"

export default function Dashboard() {
  const { sales, inventory } = useInventory()
  const [timeframe, setTimeframe] = useState("week")
  const [salesData, setSalesData] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCost: 0,
    profit: 0,
    itemsSold: 0,
    currentInventoryCount: 0,
    currentInventoryValue: 0
  })

  useEffect(() => {
    // Calculate stats based on sales data
    const totalSales = sales.reduce((sum, sale) => sum + sale.salePrice, 0)
    const totalCost = sales.reduce((sum, sale) => sum + sale.costPrice, 0)
    const profit = totalSales - totalCost
    const itemsSold = sales.length

    // Only count unsold items in current inventory
    const currentInventory = inventory.filter(item => !item.sold)

    setStats({
      totalSales,
      totalCost,
      profit,
      itemsSold,
      currentInventoryCount: currentInventory.length,
      currentInventoryValue: currentInventory.reduce((sum, item) => sum + item.salePrice, 0)
    })

    // Generate chart data based on timeframe
    const now = new Date()
    let filteredSales = []

    if (timeframe === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filteredSales = sales.filter((sale) => new Date(sale.date) >= oneWeekAgo)
    } else if (timeframe === "month") {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      filteredSales = sales.filter((sale) => new Date(sale.date) >= oneMonthAgo)
    } else {
      filteredSales = sales
    }

    // Group sales by date
    const salesByDate = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = {
          date,
          sales: 0,
          profit: 0,
        }
      }
      acc[date].sales += sale.salePrice
      acc[date].profit += sale.salePrice - sale.costPrice
      return acc
    }, {})

    setSalesData(Object.values(salesByDate))
  }, [sales, timeframe])

  // Get farm stall items
  const farmStallItems = inventory.filter(item => item.inFarmStall && !item.sold)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {timeframe === "week" ? "This week" : timeframe === "month" ? "This month" : "All time"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.profit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {timeframe === "week" ? "This week" : timeframe === "month" ? "This month" : "All time"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsSold}</div>
            <p className="text-xs text-muted-foreground">
              {timeframe === "week" ? "This week" : timeframe === "month" ? "This month" : "All time"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentInventoryCount}</div>
            <p className="text-xs text-muted-foreground">Items in stock</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>
            <Tabs defaultValue="week" className="w-[400px]" onValueChange={setTimeframe}>
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
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

      {/* New Farm Stall Section */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Stall Inventory</CardTitle>
          <CardDescription>
            Currently available items in the farm stall
          </CardDescription>
        </CardHeader>
        <CardContent>
          {farmStallItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmStallItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 rounded-lg border bg-card"
                >
                  <div>
                    <h3 className="font-medium">{item.type}</h3>
                    <p className="text-sm text-muted-foreground">{item.weight.toFixed(2)} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${item.salePrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Cost: ${item.costPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No items currently in farm stall
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

