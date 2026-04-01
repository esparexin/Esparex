

import { InfoPage } from "@/components/common/InfoPage";
import { AlertTriangle } from "lucide-react";



export default function SafetyTipsPage() {
    return (
        <InfoPage title="Safety Tips">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 not-prose">
                <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                    Esparex is a marketplace. While we verify sellers, always exercise caution when making transactions.
                </p>
            </div>

            <h3>Buying Safety</h3>
            <ul>
                <li>**Verify the Product:** Ask for more photos or video proof if you are unsure about the condition.</li>
                <li>**Meet in Public:** If meeting locally, choose a public place like a mall or metro station.</li>
            </ul>

            <h3>Selling Safety</h3>
            <ul>
                <li>**Payment First:** Or Cash on Delivery. Avoid sending items before receiving payment confirmation.</li>
                <li>**Clear Description:** Be honest about defects to avoid disputes later.</li>
            </ul>
        </InfoPage>
    );
}
