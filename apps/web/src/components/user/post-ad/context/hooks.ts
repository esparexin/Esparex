"use client";

import { useContext } from "react";
import { PostAdStateContext, PostAdActionContext, PostAdCatalogContext, PostAdLocationContext, PostAdImagesContext, PostAdFlowContext } from "./context";
import type { PostAdContextType, PostAdStateContextType, PostAdActionContextType, PostAdCatalogState, PostAdLocationState, PostAdImagesState, PostAdFlowState } from "./types";

export const usePostAdState = (): PostAdStateContextType => {
    const ctx = useContext(PostAdStateContext);
    if (!ctx) throw new Error("usePostAdState must be used within PostAdProvider");
    return ctx;
};

export const usePostAdAction = (): PostAdActionContextType => {
    const ctx = useContext(PostAdActionContext);
    if (!ctx) throw new Error("usePostAdAction must be used within PostAdProvider");
    return ctx;
};

export const usePostAdCatalog = (): PostAdCatalogState => {
    const ctx = useContext(PostAdCatalogContext);
    if (!ctx) throw new Error("usePostAdCatalog must be used within PostAdProvider");
    return ctx;
};

export const usePostAdLocationState = (): PostAdLocationState => {
    const ctx = useContext(PostAdLocationContext);
    if (!ctx) throw new Error("usePostAdLocationState must be used within PostAdProvider");
    return ctx;
};

export const usePostAdImages = (): PostAdImagesState => {
    const ctx = useContext(PostAdImagesContext);
    if (!ctx) throw new Error("usePostAdImages must be used within PostAdProvider");
    return ctx;
};

export const usePostAdFlow = (): PostAdFlowState => {
    const ctx = useContext(PostAdFlowContext);
    if (!ctx) throw new Error("usePostAdFlow must be used within PostAdProvider");
    return ctx;
};

export const usePostAd = (): PostAdContextType => {
    const state = usePostAdState();
    const actions = usePostAdAction();
    return { ...state, ...actions };
};
