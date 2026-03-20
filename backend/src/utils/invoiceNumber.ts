// backend/src/utils/invoiceNumber.ts
import type { ClientSession } from "mongoose";
import Counter from "../models/Counter";

/**
 * 🧾 ATOMIC INVOICE NUMBER GENERATOR
 * Format: ESP-YYYY-000001
 * Safety: Uses findOneAndUpdate for atomic increment to prevent collisions.
 */
export async function generateInvoiceNumber(session?: ClientSession): Promise<string> {
    const counter = await Counter.findOneAndUpdate(
        { key: "invoice" },
        { $inc: { value: 1 } },
        { upsert: true, new: true, session }
    );

    if (!counter) {
        throw new Error("Failed to generate invoice counter");
    }

    const seq = String(counter.value).padStart(6, "0");
    const date = new Date();
    return `ESP-${date.getFullYear()}-${seq}`;
}
