import {
  personalProfileSchema,
  deleteAccountFormSchema,
} from "@esparex/contracts";

describe("User Profile & Settings Contract Parity & Validation Suite", () => {
  describe("UP-02: Name Validation Regex Parity", () => {
    it("should accept valid names containing dots, hyphens, and unicode initials", () => {
      const validNames = [
        "Dr. John Smith",
        "A. K. Rao",
        "Anne-Marie",
        "Mary-Jane O'Connor",
        "Rajesh Kumar",
      ];

      for (const name of validNames) {
        const result = personalProfileSchema.safeParse({
          name,
          mobileVisibility: "show",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject names shorter than 2 characters or with invalid characters", () => {
      const invalidNames = ["A", "John <script>", "Test #123"];

      for (const name of invalidNames) {
        const result = personalProfileSchema.safeParse({
          name,
          mobileVisibility: "show",
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("UP-01: GSTIN Field Validation & Contract Parity", () => {
    it("should validate valid 15-character GSTIN strings in personalProfileSchema", () => {
      const validGstin = "27AAAAA0000A1Z5";
      const result = personalProfileSchema.safeParse({
        name: "Acme Corp",
        gstin: validGstin,
        mobileVisibility: "show",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gstin).toBe(validGstin);
      }
    });

    it("should reject invalid GSTIN format strings", () => {
      const invalidGstin = "INVALID_GSTIN_123";
      const result = personalProfileSchema.safeParse({
        name: "Acme Corp",
        gstin: invalidGstin,
        mobileVisibility: "show",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UP-04: Delete Account Schema Parity", () => {
    it("should export deleteAccountFormSchema from contracts and validate payloads", () => {
      const payload = {
        reason: "no_longer_needed",
        feedback: "Great app!",
        confirmText: "delete",
      };

      const result = deleteAccountFormSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject invalid confirmText when deleting account", () => {
      const payload = {
        reason: "no_longer_needed",
        confirmText: "no",
      };

      const result = deleteAccountFormSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
