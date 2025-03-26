"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useInventory } from "@/lib/inventory-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FarmStall() {
  const { inventory, markAsSold, moveToInventory } = useInventory()
  const { toast } = useToast()
  const [view, setView] = useState("active")

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

  const activeItems = inventory.filter((item) => item.inFarmStall && !item.sold)
  const soldItems = inventory.filter((item) => item.sold)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Farm Stall</h2>

      <Tabs defaultValue="active" onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="active">Active Items ({activeItems.length})</TabsTrigger>
          <TabsTrigger value="sold">Sold Items ({soldItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Items in Farm Stall</CardTitle>
              <CardDescription>All vegetables currently displayed in the farm stall</CardDescription>
            </CardHeader>
            <CardContent>
              {activeItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No items in the farm stall. Move items from inventory to display them here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{item.type}</h3>
                            <p className="text-sm text-muted-foreground">{item.weight.toFixed(2)} kg</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">R{item.salePrice.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Cost: R{item.costPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => handleMarkAsSold(item.id)}
                          >
                            Sold
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleMoveToInventory(item.id)}
                          >
                            To Storage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sold">
          <Card>
            <CardHeader>
              <CardTitle>Sold Items</CardTitle>
              <CardDescription>History of all sold items from the farm stall</CardDescription>
            </CardHeader>
            <CardContent>
              {soldItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No items have been sold yet.</div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {soldItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.weight.toFixed(2)} kg</TableCell>
                          <TableCell>R{item.salePrice.toFixed(2)}</TableCell>
                          <TableCell
                            className={item.salePrice - item.costPrice > 0 ? "text-green-600" : "text-red-600"}
                          >
                            R{(item.salePrice - item.costPrice).toFixed(2)}
                          </TableCell>
                          <TableCell>{new Date(item.soldDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

