import {
    LEGAL_GRIEVANCE_OFFICER,
    LEGAL_GRIEVANCE_DESIGNATION,
    LEGAL_GRIEVANCE_EMAIL,
    LEGAL_SUPPORT_EMAIL,
    LEGAL_SUPPORT_PHONE,
    LEGAL_COMPANY_LOCATION,
    LEGAL_COMPANY_NAME
} from "@/lib/legal";

export function LegalGrievanceCard() {
    return (
        <div className="flex flex-col md:flex-row gap-4 text-caption">
            <div className="flex flex-col gap-1">
                <p className="font-bold text-foreground">{LEGAL_GRIEVANCE_OFFICER}</p>
                <p className="text-foreground-secondary">{LEGAL_GRIEVANCE_DESIGNATION}</p>
                <p className="text-foreground-secondary">{LEGAL_COMPANY_NAME}</p>
                <p className="text-foreground-secondary">{LEGAL_COMPANY_LOCATION}</p>
            </div>
            <div className="flex flex-col gap-1">
                <p><strong>Grievance Email:</strong> <a href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`} className="text-primary hover:underline">{LEGAL_GRIEVANCE_EMAIL}</a></p>
                <p><strong>Support Email:</strong> <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-primary hover:underline">{LEGAL_SUPPORT_EMAIL}</a></p>
                <p><strong>Phone Support:</strong> <a href={`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`} className="text-primary hover:underline">{LEGAL_SUPPORT_PHONE}</a></p>
                <p className="text-foreground-subtle text-tiny mt-2">
                    ⏱️ <em>Grievances are acknowledged within 24 hours and addressed within 15 working days.</em>
                </p>
            </div>
        </div>
    );
}
