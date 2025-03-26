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
import { useToast } from "@/hooks/use-toast"
import { useInventory } from "@/lib/inventory-context"
import { ref, set, onValue, update } from "firebase/database"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import WeighingCalculator from "@/components/weighing-calculator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash, Edit } from "lucide-react"

type BatchType = "external" | "farm" | "flowers"

interface FlowerItem {
  bunches: number
  salePrice: number
}

export default function Inventory() {
  const { inventory, addToInventory, moveToFarmStall, removeFromInventory, markAsSold } = useInventory()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(null)
  const [batchType, setBatchType] = useState<BatchType | null>(null)
  const [newFlowers, setNewFlowers] = useState<FlowerItem>({
    bunches: 1,
    salePrice: 0,
  })
  const [newBatch, setNewBatch] = useState({
    type: "",
    costPerKg: "",
    customType: "",
  })
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    weight: "",
    salePrice: "",
  })

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
    if (!newBatch.type || !newBatch.costPerKg) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const batchRef = ref(db, 'currentBatch')
    await set(batchRef, {
      type: newBatch.customType || newBatch.type,
      costPerKg: parseFloat(newBatch.costPerKg),
      fromExternalBatch: true
    })

    setOpen(false)
    setNewBatch({ type: "", costPerKg: "", customType: "" })
    router.push('/weighing')
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

  const handleSellFlowers = async (id: string) => {
    try {
      await markAsSold(id)
      toast({
        title: "Flowers sold",
        description: "Flowers have been marked as sold",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark flowers as sold",
        variant: "destructive",
      })
    }
  }

  const handleAddFarmProduce = async () => {
    if (!newBatch.type || !newBatch.costPerKg) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const batchRef = ref(db, 'currentBatch')
    await set(batchRef, {
      type: newBatch.customType || newBatch.type,
      costPerKg: parseFloat(newBatch.costPerKg),
      fromExternalBatch: false
    })

    setOpen(false)
    setNewBatch({ type: "", costPerKg: "", customType: "" })
    router.push('/weighing')
  }

  const handleAddFlowers = async () => {
    if (newFlowers.bunches < 1 || newFlowers.salePrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter valid numbers",
        variant: "destructive",
      })
      return
    }

    const id = Date.now().toString()
    await addToInventory({
      id,
      type: "Flowers",
      weight: newFlowers.bunches,
      costPrice: 0,
      salePrice: newFlowers.salePrice,
      fromExternalBatch: false
    })

    setOpen(false)
    setNewFlowers({ bunches: 1, salePrice: 0 })
    toast({
      title: "Success",
      description: "Flowers added to inventory",
    })
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setEditForm({
      weight: item.weight.toString(),
      salePrice: item.salePrice.toString(),
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingItem) return

    const weight = Number(editForm.weight)
    const salePrice = Number(editForm.salePrice)

    if (!weight || weight <= 0) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight",
        variant: "destructive",
      })
      return
    }

    if (!salePrice || salePrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid sale price",
        variant: "destructive",
      })
      return
    }

    try {
      const updates = {}
      updates[`/inventory/${editingItem.id}/weight`] = weight
      updates[`/inventory/${editingItem.id}/salePrice`] = salePrice
      // Recalculate cost price for non-flower items
      if (!editingItem.type.startsWith('Flowers')) {
        const costPerKg = editingItem.costPrice / editingItem.weight
        updates[`/inventory/${editingItem.id}/costPrice`] = weight * costPerKg
      }

      await update(ref(db), updates)

      setEditDialogOpen(false)
      setEditingItem(null)

      toast({
        title: "Item updated",
        description: "Item has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    }
  }

  const groupedActiveInventory = activeInventory.reduce((groups, item) => {
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

  const toggleGroup = (type: string) => {
    setOpenGroups(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  return (
    <div className="space-y-6">
      {/* Inventory Section - Now with simplified header */}
      <Card className="glass-card overflow-hidden border-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Storage Inventory
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Items currently in storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedActiveInventory).map(([type, items]) => {
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
                              <div className="flex space-x-2">
                                {item.type.startsWith('Flowers') ? (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-blue-600/20 hover:bg-blue-500/30 text-blue-400 border border-blue-800/50 transition-colors duration-200"
                                      onClick={() => handleSellFlowers(item.id)}
                                    >
                                      Sell
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-blue-600/20 hover:bg-blue-500/30 text-blue-400 border border-blue-800/50 transition-colors duration-200"
                                      onClick={() => handleMoveToStall(item.id)}
                                    >
                                      To Stall
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-blue-600/20 hover:bg-blue-500/30 text-blue-400 border border-blue-800/50 transition-colors duration-200"
                                    onClick={() => handleMoveToStall(item.id)}
                                  >
                                    To Stall
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleRemoveItem(item.id)}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
            {activeInventory.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
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
            <CardTitle>Add to Inventory</CardTitle>
            <CardDescription>
              Choose how you want to add items to your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25" onClick={() => {
                setBatchType("external")
                setOpen(true)
              }}>
                Start External Batch
              </Button>
              <Button onClick={() => {
                setBatchType("farm")
                setOpen(true)
              }}>
                Add Feel Good Farm Produce
              </Button>
              <Button onClick={() => {
                setBatchType("flowers")
                setOpen(true)
              }}>
                Add Cut Flowers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Batch Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {batchType === "external" && "Start External Batch"}
              {batchType === "farm" && "Add Feel Good Farm Produce"}
              {batchType === "flowers" && "Add Cut Flowers"}
            </DialogTitle>
            <DialogDescription>
              {batchType === "external" && "Create a new batch of vegetables to weigh and price"}
              {batchType === "farm" && "Add produce from Feel Good Farm"}
              {batchType === "flowers" && "Add cut flowers to inventory"}
            </DialogDescription>
          </DialogHeader>

          {(batchType === "external" || batchType === "farm") && (
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

              {batchType === "external" && (
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
              )}
            </div>
          )}

          {batchType === "flowers" && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bunches">Number of Bunches</Label>
                <Input
                  id="bunches"
                  value={newFlowers.bunches}
                  onChange={(e) => setNewFlowers({ ...newFlowers, bunches: parseInt(e.target.value) || 0 })}
                  type="number"
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salePrice">Sale Price per Bunch</Label>
                <Input
                  id="salePrice"
                  value={newFlowers.salePrice}
                  onChange={(e) => setNewFlowers({ ...newFlowers, salePrice: parseFloat(e.target.value) || 0 })}
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (batchType === "external") handleAddBatch()
              else if (batchType === "farm") handleAddFarmProduce()
              else if (batchType === "flowers") handleAddFlowers()
            }}>
              {batchType === "flowers" ? "Add Flowers" : "Start Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-card border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Edit Item
            </DialogTitle>
            <DialogDescription>
              Update the details for {editingItem?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="weight">
                {editingItem?.type.startsWith('Flowers') ? 'Bunches' : 'Weight (kg)'}
              </Label>
              <Input
                id="weight"
                value={editForm.weight}
                onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                type="number"
                step={editingItem?.type.startsWith('Flowers') ? "1" : "0.01"}
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="salePrice">Sale Price</Label>
              <Input
                id="salePrice"
                value={editForm.salePrice}
                onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })}
                type="number"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

