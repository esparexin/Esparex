"use client";

import { createContext, ReactNode } from "react";
import type { PostAdCatalogState, PostAdLocationState, PostAdImagesState, PostAdFlowState, PostAdStateContextType, PostAdActionContextType } from "./types";

export const PostAdStateContext = createContext<PostAdStateContextType | undefined>(undefined);
export const PostAdActionContext = createContext<PostAdActionContextType | undefined>(undefined);
export const PostAdCatalogContext = createContext<PostAdCatalogState | undefined>(undefined);
export const PostAdLocationContext = createContext<PostAdLocationState | undefined>(undefined);
export const PostAdImagesContext = createContext<PostAdImagesState | undefined>(undefined);
export const PostAdFlowContext = createContext<PostAdFlowState | undefined>(undefined);

export function PostAdContextShell({ catalogState, locationState, imagesState, flowState, actionValue, stateValue, children }: {
    catalogState: PostAdCatalogState;
    locationState: PostAdLocationState;
    imagesState: PostAdImagesState;
    flowState: PostAdFlowState;
    actionValue: PostAdActionContextType;
    stateValue: PostAdStateContextType;
    children: ReactNode;
}) {
    return (
        <PostAdCatalogContext.Provider value={catalogState}>
            <PostAdLocationContext.Provider value={locationState}>
                <PostAdImagesContext.Provider value={imagesState}>
                    <PostAdFlowContext.Provider value={flowState}>
                        <PostAdStateContext.Provider value={stateValue}>
                            <PostAdActionContext.Provider value={actionValue}>
                                {children}
                            </PostAdActionContext.Provider>
                        </PostAdStateContext.Provider>
                    </PostAdFlowContext.Provider>
                </PostAdImagesContext.Provider>
            </PostAdLocationContext.Provider>
        </PostAdCatalogContext.Provider>
    );
}
