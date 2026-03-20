

import { InfoPage } from "@/components/common/InfoPage";
import { AlertTriangle } from "lucide-react";



export default function SafetyTipsPage() {
    return (
        <InfoPage title="Safety Tips">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 not-prose">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            Esparex is a marketplace. While we verify sellers, always exercise caution when making transactions.
                        </p>
                    </div>
                </div>
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
