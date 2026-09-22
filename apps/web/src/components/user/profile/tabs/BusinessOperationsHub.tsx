"use client";

import { Card, Button } from "@esparex/ui";
import { Wrench, Package, Plus } from "@esparex/ui";
import type { UserPage } from "@/lib/routeUtils";

export interface BusinessOperationsHubProps {
    navigateTo: (page: UserPage) => void;
}

export function BusinessOperationsHub({ navigateTo }: BusinessOperationsHubProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Services Card */}
            <Card className="rounded-2xl border border-border shadow-xs bg-card p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Wrench className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3 className="text-body-lg font-semibold text-foreground">Services</h3>
                            <p className="text-caption text-foreground-secondary mt-0.5">
                                Repair & maintenance
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end mt-4 pt-3 border-t border-border/60">
                    <Button 
                        onClick={() => navigateTo("my-services")} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 rounded-xl border-border text-caption font-semibold flex-1 sm:flex-initial whitespace-nowrap shrink-0 cursor-pointer"
                    >
                        View Services
                    </Button>
                    <Button 
                        onClick={() => navigateTo("post-service")} 
                        size="sm" 
                        className="h-8 px-3 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption gap-1.5 flex-1 sm:flex-initial whitespace-nowrap shrink-0 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Service
                    </Button>
                </div>
            </Card>

            {/* Spare Parts Card */}
            <Card className="rounded-2xl border border-border shadow-xs bg-card p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Package className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3 className="text-body-lg font-semibold text-foreground">Spare Parts</h3>
                            <p className="text-caption text-foreground-secondary mt-0.5">
                                Parts & components
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end mt-4 pt-3 border-t border-border/60">
                    <Button 
                        onClick={() => navigateTo("spare-parts")} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 rounded-xl border-border text-caption font-semibold flex-1 sm:flex-initial whitespace-nowrap shrink-0 cursor-pointer"
                    >
                        View Inventory
                    </Button>
                    <Button 
                        onClick={() => navigateTo("post-spare-part-listing")} 
                        size="sm" 
                        className="h-8 px-3 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption gap-1.5 flex-1 sm:flex-initial whitespace-nowrap shrink-0 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Spare Part
                    </Button>
                </div>
            </Card>
        </div>
    );
}
