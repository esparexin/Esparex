import { describe, expect, it } from "vitest";
import { loginFormSchema } from "@/schemas/login.schema";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";

describe("Login Form Schema & Step 1 Validation Suite", () => {
  it("successfully validates step 1 default form values with empty name and otp", () => {
    const defaultStep1Values = {
      mobile: "9030787819",
      name: "",
      otp: "",
    };

    const result = loginFormSchema.safeParse(defaultStep1Values);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mobile).toBe("9030787819");
      expect(result.data.name).toBe("");
    }
  });

  it("successfully validates formatted +91 prefix phone number", () => {
    const values = {
      mobile: "+91 9030787819",
      name: "",
      otp: "",
    };

    const result = loginFormSchema.safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mobile).toBe("9030787819");
    }
  });

  it("validates step 2 new user payload with valid name", () => {
    const step2Values = {
      mobile: "9030787819",
      name: "Rahul Sharma",
      otp: "123456",
    };

    const result = loginFormSchema.safeParse(step2Values);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Rahul Sharma");
    }
  });

  it("rejects invalid non-10 digit mobile numbers", () => {
    const invalidValues = {
      mobile: "12345",
      name: "",
      otp: "",
    };

    const result = loginFormSchema.safeParse(invalidValues);
    expect(result.success).toBe(false);
  });
});

describe("Smart Alert Form Schema Default Values Suite", () => {
  it("allows empty string name for auto-generated title derivation", () => {
    const alertWithEmptyName = {
      name: "",
      category: "smartphones",
      brand: "Apple",
      model: "iPhone 14 Pro",
      location: "Bengaluru, Karnataka",
      radiusKm: 25,
      notificationChannels: ["push", "email"],
    };

    const result = smartAlertFormSchema.safeParse(alertWithEmptyName);
    expect(result.success).toBe(true);
  });
});
