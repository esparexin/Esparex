

import { InfoPage } from "@/components/common/InfoPage";



export default function HowItWorksPage() {
    return (
        <InfoPage title="How Esparex Works">
            <div className="space-y-8">
                <section>
                    <h3>1. For Buyers</h3>
                    <p>
                        Browse thousands of spare parts and services. Use our advanced filters to find parts compatible
                        with your specific device model. Contact sellers directly to negotiate and arrange pickup or delivery.
                    </p>
                </section>

                <section>
                    <h3>2. For Sellers</h3>
                    <p>
                        List your spare parts in minutes. Take clear photos, describe the condition, and set your price.
                        Manage all your listings and offers from your dashboard.
                    </p>
                </section>

                <section>
                    <h3>3. For Service Providers</h3>
                    <p>
                        Register your repair shop to get discovered by local customers. Showcase your expertise and services offered.
                    </p>
                </section>
            </div>
        </InfoPage>
    );
}
