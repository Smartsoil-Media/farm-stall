"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useInventory } from "@/lib/inventory-context"
import { ref, set, onValue } from "firebase/database"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import WeighingCalculator from "@/components/weighing-calculator"

export default function Inventory() {
  const { inventory, addToInventory, moveToFarmStall, removeFromInventory } = useInventory()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(null)
  const [newBatch, setNewBatch] = useState({
    type: "",
    costPerKg: "",
    customType: "",
  })
  const router = useRouter()

  useEffect(() => {
    const batchRef = ref(db, 'currentBatch');
    const unsubscribe = onValue(batchRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentBatch(snapshot.val());
      } else {
        setCurrentBatch(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const vegetableTypes = ["Pumpkin", "Melon", "Potato", "Carrot", "Onion", "Tomato", "Cucumber", "Cabbage", "Other"]

  // Filter out sold items from inventory display
  const activeInventory = inventory.filter(item => !item.sold && !item.inFarmStall)

  const handleAddBatch = async () => {
    if (!newBatch.type) {
      toast({
        title: "Error",
        description: "Please select a vegetable type",
        variant: "destructive",
      })
      return
    }

    if (!newBatch.costPerKg || isNaN(Number(newBatch.costPerKg))) {
      toast({
        title: "Error",
        description: "Please enter a valid cost per kg",
        variant: "destructive",
      })
      return
    }

    const finalType = newBatch.type === "Other" ? newBatch.customType : newBatch.type

    try {
      // Save batch to Firebase instead of localStorage
      await set(ref(db, 'currentBatch'), {
        type: finalType,
        costPerKg: Number(newBatch.costPerKg),
      });

      setOpen(false)
      setNewBatch({
        type: "",
        costPerKg: "",
        customType: "",
      })

      // First show the toast
      toast({
        title: "Batch created",
        description: `Created a new batch of ${finalType}. Please proceed to the Weighing Calculator.`,
      })

      // Then navigate (moved after other state updates)
      router.push('/?tab=weighing-calculator')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create batch. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMoveToStall = (id: string) => {
    moveToFarmStall(id)
    toast({
      title: "Item moved",
      description: "Item has been moved to the farm stall",
    })
  }

  const handleRemoveItem = (id: string) => {
    removeFromInventory(id)
    toast({
      title: "Item removed",
      description: "Item has been removed from inventory",
    })
  }

  return (
    <div className="space-y-6">
      {/* Inventory Section - Now with simplified header */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Manage your storage inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeInventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{item.type}</h3>
                      <p className="text-sm text-muted-foreground">{item.weight.toFixed(2)} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${item.salePrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Cost: ${item.costPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handleMoveToStall(item.id)}
                    >
                      Move to Stall
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activeInventory.length === 0 && (
              <div className="col-span-full text-center py-6 text-muted-foreground">
                No items in inventory
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weighing Calculator Section */}
      {currentBatch ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Batch: {currentBatch.type}</CardTitle>
            <CardDescription>
              Add items to your current batch (Cost per kg: ${Number(currentBatch.costPerKg).toFixed(2)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeighingCalculator />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start a Batch</CardTitle>
            <CardDescription>
              Start a new batch to begin weighing and pricing items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button onClick={() => setOpen(true)}>
                Start New Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Batch Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Batch</DialogTitle>
            <DialogDescription>
              Create a new batch of vegetables to weigh and price
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Vegetable Type</Label>
              <Select
                value={newBatch.type}
                onValueChange={(value) => setNewBatch({ ...newBatch, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {vegetableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newBatch.type === "Other" && (
              <div className="grid gap-2">
                <Label htmlFor="customType">Custom Type</Label>
                <Input
                  id="customType"
                  value={newBatch.customType}
                  onChange={(e) => setNewBatch({ ...newBatch, customType: e.target.value })}
                  placeholder="Enter vegetable type"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="costPerKg">Cost per kg</Label>
              <Input
                id="costPerKg"
                value={newBatch.costPerKg}
                onChange={(e) => setNewBatch({ ...newBatch, costPerKg: e.target.value })}
                type="number"
                placeholder="Enter cost per kg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBatch}>Start Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

