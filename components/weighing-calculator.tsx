"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useInventory } from "@/lib/inventory-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { ref, set, push } from "firebase/database"
import { db } from "@/lib/firebase"
import { onValue } from "firebase/database"
import { useRouter } from "next/navigation"

// Add this interface above the component
interface BatchItem {
  id: string;
  weight: number;
  costPrice: number;
  salePrice: number;
  type: string;
  date: string;
}

interface Batch {
  type: string;
  costPerKg: number;
}

export default function WeighingCalculator() {
  const { addToInventory } = useInventory()
  const { toast } = useToast()
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null)
  const [currentItem, setCurrentItem] = useState({
    weight: "",
    salePrice: "",
  })
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [batchSummary, setBatchSummary] = useState({
    totalWeight: 0,
    totalCost: 0,
    totalSalePrice: 0,
    profit: 0,
  })
  const router = useRouter()

  useEffect(() => {
    // Load current batch from Firebase instead of localStorage
    const loadBatch = async () => {
      const batchRef = ref(db, 'currentBatch');
      onValue(batchRef, (snapshot) => {
        if (snapshot.exists()) {
          setCurrentBatch(snapshot.val());
        }
      });
    };
    loadBatch();
  }, []);

  useEffect(() => {
    // Calculate batch summary with type-safe reduce
    const totalWeight = batchItems.reduce((sum, item) => sum + (item.weight || 0), 0)
    const totalCost = batchItems.reduce((sum, item) => sum + (item.costPrice || 0), 0)
    const totalSalePrice = batchItems.reduce((sum, item) => sum + (item.salePrice || 0), 0)
    const profit = totalSalePrice - totalCost

    setBatchSummary({
      totalWeight,
      totalCost,
      totalSalePrice,
      profit,
    })
  }, [batchItems])

  const handleAddItem = async () => {
    if (!currentBatch) {
      toast({
        title: "No active batch",
        description: "Please start a new batch from the Inventory page",
        variant: "destructive",
      })
      return
    }

    if (!currentItem.weight || isNaN(Number(currentItem.weight)) || Number(currentItem.weight) <= 0) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight in kg",
        variant: "destructive",
      })
      return
    }

    if (!currentItem.salePrice || isNaN(Number(currentItem.salePrice)) || Number(currentItem.salePrice) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid sale price",
        variant: "destructive",
      })
      return
    }

    const weight = Number(currentItem.weight)
    const salePrice = Number(currentItem.salePrice)
    const costPrice = weight * currentBatch.costPerKg

    const newItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: currentBatch.type,
      weight,
      costPrice,
      salePrice,
      date: new Date().toISOString(),
      inFarmStall: false,
      sold: false
    }

    // Add to local state for UI updates
    setBatchItems([...batchItems, newItem])

    setCurrentItem({
      weight: "",
      salePrice: "",
    })

    toast({
      title: "Item added",
      description: `Added ${weight.toFixed(2)}kg ${currentBatch.type} to the batch`,
    })
  }

  const handleFinishBatch = async () => {
    console.log("Starting handleFinishBatch")
    console.log("Current batch items:", batchItems)

    if (batchItems.length === 0) {
      console.log("No batch items found, showing toast")
      toast({
        title: "Empty batch",
        description: "Please add at least one item to the batch",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Adding items to inventory...")
      const promises = batchItems.map(item => {
        console.log("Processing item:", item)
        return addToInventory(item).catch(error => {
          console.error("Error adding individual item:", error);
          throw error;
        });
      })

      console.log("Waiting for all promises to resolve...")
      const results = await Promise.all(promises).catch(error => {
        console.error("Error in Promise.all:", error);
        throw error;
      });
      console.log("All items added to inventory:", results)

      console.log("Clearing current batch in Firebase...")
      await set(ref(db, 'currentBatch'), null);
      console.log("Current batch cleared")

      setCurrentBatch(null)
      setBatchItems([])
      setCurrentItem({
        weight: "",
        salePrice: "",
      })

      console.log("Local state reset")

      toast({
        title: "Batch completed",
        description: `Added ${batchItems.length} items to inventory`,
      })

      console.log("Navigating to inventory...")
      router.push('/?tab=inventory')
    } catch (error) {
      console.error("Error in handleFinishBatch:", error)
      toast({
        title: "Error",
        description: "Failed to complete batch. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelBatch = async () => {
    if (batchItems.length > 0) {
      if (!confirm("Are you sure you want to cancel this batch? All items will be lost.")) {
        return
      }
    }

    try {
      // Clear the current batch in Firebase
      await set(ref(db, 'currentBatch'), null);

      setCurrentBatch(null)
      setBatchItems([])
      setCurrentItem({
        weight: "",
        salePrice: "",
      })

      toast({
        title: "Batch cancelled",
        description: "The current batch has been cancelled",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel batch. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!currentBatch) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Weighing Calculator</h2>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>No active batch</AlertTitle>
          <AlertDescription>
            Please start a new batch from the Inventory page to begin weighing vegetables.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Weighing Calculator</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCancelBatch}>
            Cancel Batch
          </Button>
          <Button onClick={handleFinishBatch}>Finish Batch</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Batch: {currentBatch.type}</CardTitle>
          <CardDescription>Cost per kg: R{currentBatch.costPerKg.toFixed(2)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  value={currentItem.weight}
                  onChange={(e) => setCurrentItem({ ...currentItem, weight: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salePrice">Sale Price (R)</Label>
                <Input
                  id="salePrice"
                  value={currentItem.salePrice}
                  onChange={(e) => setCurrentItem({ ...currentItem, salePrice: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </div>
              {currentItem.weight && !isNaN(Number(currentItem.weight)) && (
                <div className="text-sm text-muted-foreground">
                  Cost price: R{(Number(currentItem.weight) * currentBatch.costPerKg).toFixed(2)}
                </div>
              )}
              <Button onClick={handleAddItem} className="w-full">
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Batch Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">Total Items:</div>
                <div className="text-sm font-medium">{batchItems.length}</div>

                <div className="text-sm">Total Weight:</div>
                <div className="text-sm font-medium">{batchSummary.totalWeight.toFixed(2)} kg</div>

                <div className="text-sm">Total Cost:</div>
                <div className="text-sm font-medium">R{batchSummary.totalCost.toFixed(2)}</div>

                <div className="text-sm">Total Sale Price:</div>
                <div className="text-sm font-medium">R{batchSummary.totalSalePrice.toFixed(2)}</div>

                <div className="text-sm">Expected Profit:</div>
                <div className={`text-sm font-medium ${batchSummary.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                  R{batchSummary.profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {batchItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.weight.toFixed(2)} kg</TableCell>
                      <TableCell>R{item.costPrice.toFixed(2)}</TableCell>
                      <TableCell>R{item.salePrice.toFixed(2)}</TableCell>
                      <TableCell className={item.salePrice - item.costPrice > 0 ? "text-green-600" : "text-red-600"}>
                        R{(item.salePrice - item.costPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

