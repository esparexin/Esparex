/**
 * Spare-part seed — thin caller (P1-8, DECISION-GATE §2/§5).
 * Seed write logic lives in the catalog domain (`CatalogSeedService.seedSpareParts`);
 * this module keeps the seed data and delegates. No direct model imports.
 */
import { CatalogSeedService } from "@esparex/core";

type SparePartSeed = {
    name: string;
    type: "PRIMARY" | "SECONDARY";
    categories: string[];
};

const SPARE_PARTS_SEED: SparePartSeed[] = [
    // MOBILES
    { name: "Battery", type: "PRIMARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Screen / Display", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Motherboard", type: "PRIMARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Charging Port", type: "PRIMARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Rear Camera", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Front Camera", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Speaker", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Microphone", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Power Button", type: "PRIMARY", categories: ["smartphones", "tablets"] },
    { name: "Volume Buttons", type: "PRIMARY", categories: ["smartphones", "tablets"] },

    // TABLETS – SECONDARY
    { name: "SIM Tray", type: "SECONDARY", categories: ["smartphones", "tablets"] },
    { name: "Fingerprint Sensor", type: "SECONDARY", categories: ["smartphones", "tablets"] },
    { name: "Face ID / IR Sensor", type: "SECONDARY", categories: ["smartphones", "tablets"] },
    { name: "Wi-Fi / Network Module", type: "SECONDARY", categories: ["smartphones", "tablets", "laptops"] },
    { name: "Back Glass", type: "SECONDARY", categories: ["smartphones"] },

    // LAPTOPS
    { name: "Keyboard", type: "PRIMARY", categories: ["laptops"] },
    { name: "RAM", type: "PRIMARY", categories: ["laptops"] },
    { name: "Storage (SSD / HDD)", type: "PRIMARY", categories: ["laptops"] },
    { name: "Trackpad", type: "SECONDARY", categories: ["laptops"] },
    { name: "Cooling Fan", type: "SECONDARY", categories: ["laptops"] },
    { name: "Webcam", type: "SECONDARY", categories: ["laptops"] },

    // MONITORS / TV
    { name: "Display Panel", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "Power Board", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "Main Board (Motherboard)", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "Backlight", type: "PRIMARY", categories: ["led-tvs"] },
    { name: "T-Con Board", type: "SECONDARY", categories: ["led-tvs"] }
];

export async function seedSpareParts() {
    return CatalogSeedService.seedSpareParts(SPARE_PARTS_SEED);
}
