"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { ref, onValue, push, update, remove, set } from "firebase/database"
import { db } from "./firebase"

type InventoryItem = {
  id: string
  type: string
  weight: number
  costPrice: number
  salePrice: number
  inFarmStall: boolean
  sold: boolean
  date: string
  soldDate?: string
  fromExternalBatch: boolean
}

type InventoryContextType = {
  inventory: InventoryItem[]
  sales: InventoryItem[]
  addToInventory: (item: Omit<InventoryItem, "inFarmStall" | "sold" | "soldDate">) => void
  moveToFarmStall: (id: string) => void
  moveToInventory: (id: string) => void
  markAsSold: (id: string) => void
  removeFromInventory: (id: string) => void
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  useEffect(() => {
    // Subscribe to inventory changes
    const inventoryRef = ref(db, 'inventory');
    const unsubscribe = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id
        }));
        setInventory(items);
      } else {
        setInventory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addToInventory = async (item) => {
    try {
      console.log("Starting addToInventory with item:", item);

      // Generate a new reference for the inventory item
      const inventoryRef = ref(db, 'inventory');
      console.log("Created inventory reference");

      const newItemRef = push(inventoryRef);
      console.log("Generated new item reference:", newItemRef.key);

      const newItem = {
        ...item,
        id: newItemRef.key, // Use Firebase generated key
        inFarmStall: false,
        sold: false,
      };
      console.log("Prepared new item:", newItem);

      // Set the data at the new reference
      await set(newItemRef, newItem);
      console.log("Successfully set item in database");

      return newItem;
    } catch (error) {
      console.error("Error in addToInventory:", error);
      // Log the full error details
      if (error.code) {
        console.error("Firebase error code:", error.code);
      }
      if (error.message) {
        console.error("Error message:", error.message);
      }
      throw error;
    }
  }

  const moveToFarmStall = async (id) => {
    const updates = {};
    updates[`/inventory/${id}/inFarmStall`] = true;
    await update(ref(db), updates);
  }

  const moveToInventory = async (id) => {
    const updates = {};
    updates[`/inventory/${id}/inFarmStall`] = false;
    await update(ref(db), updates);
  }

  const markAsSold = async (id) => {
    const updates = {};
    updates[`/inventory/${id}/sold`] = true;
    updates[`/inventory/${id}/soldDate`] = new Date().toISOString();
    await update(ref(db), updates);
  }

  const removeFromInventory = async (id) => {
    await remove(ref(db, `inventory/${id}`));
  }

  const sales = inventory.filter((item) => item.sold);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        sales,
        addToInventory,
        moveToFarmStall,
        moveToInventory,
        markAsSold,
        removeFromInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}

