import { apiClient, EsparexRequestConfig } from "@/lib/api/client";
import { User } from "@/types/User";
import { API_ROUTES } from "./routes";
import { getMe } from "./user/users";

export interface AuthPayloadFields {
    user?: User;
    token?: string;
    error?: string;
    message?: string;
    code?: string;
    isNewUser?: boolean;
    otpExpiresIn?: number;
    name?: string;
    attemptsLeft?: number;
    lockUntil?: string;
}

export interface AuthResponse extends AuthPayloadFields {
    success: boolean;
}

type AuthApiRawResponse = Partial<AuthPayloadFields> & {
    success?: boolean;
    data?: Partial<AuthPayloadFields> & {
        success?: boolean;
    };
};

const normalizeAuthResponse = (raw: AuthApiRawResponse): AuthResponse => {
    const nested = raw?.data ?? {};

    return {
        success: Boolean(raw?.success ?? nested?.success),
        user: raw?.user ?? nested?.user,
        token: raw?.token ?? nested?.token,
        error: raw?.error ?? nested?.error ?? raw?.message ?? nested?.message,
        code: raw?.code ?? nested?.code,
        isNewUser: raw?.isNewUser ?? nested?.isNewUser,
        otpExpiresIn: raw?.otpExpiresIn ?? nested?.otpExpiresIn,
        name: raw?.name ?? nested?.name,
        attemptsLeft: raw?.attemptsLeft ?? nested?.attemptsLeft,
        lockUntil: raw?.lockUntil ?? nested?.lockUntil,
    };
};

export const authApi = {
    /**
     * Send Login/Signup OTP
     */
    login: async (mobile: string): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthApiRawResponse>(
            API_ROUTES.USER.SEND_OTP,
            { mobile },
            { silent: true }
        );
        return normalizeAuthResponse(response);
    },

    /**
     * Verify OTP
     */
    verify: async (mobile: string, otp: string, name?: string): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthApiRawResponse>(
            API_ROUTES.USER.VERIFY_OTP,
            { mobile, otp, name },
            { silent: true }
        );
        return normalizeAuthResponse(response);
    },

    /**
     * Cancel current OTP session for mobile
     */
    cancelOtp: async (mobile: string): Promise<{ success: boolean }> => {
        return apiClient.post(API_ROUTES.USER.CANCEL_OTP, { mobile }, { silent: true });
    },

    /**
     * Logout
     */
    logout: async (): Promise<{ success: boolean }> => {
        let fcmToken: string | null = null;
        if (typeof window !== "undefined") {
            fcmToken = localStorage.getItem("esparex_fcm_token");
        }
        return apiClient.post(API_ROUTES.USER.LOGOUT, fcmToken ? { fcmToken } : {});
    },

    /**
     * Get Current User
     */
    me: async (options?: EsparexRequestConfig): Promise<{ success: boolean; user?: User }> => {
        const user = await getMe(options);
        return {
            success: !!user,
            user: user || undefined,
        };
    }
};
