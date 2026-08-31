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
        <address className="not-italic flex flex-col md:flex-row justify-between gap-6 text-caption">
            <div className="flex flex-col gap-1.5">
                <p className="font-bold text-foreground text-body">{LEGAL_GRIEVANCE_OFFICER}</p>
                <p className="text-foreground-secondary">{LEGAL_GRIEVANCE_DESIGNATION}</p>
                <p className="text-foreground-secondary font-medium">{LEGAL_COMPANY_NAME}</p>
                <p className="text-foreground-subtle">{LEGAL_COMPANY_LOCATION}</p>
            </div>
            <div className="flex flex-col gap-2">
                <p className="flex items-center min-h-[32px] sm:min-h-auto">
                    <strong className="mr-1 text-foreground">Grievance Email:</strong>{" "}
                    <a
                        href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`}
                        aria-label={`Send grievance email to ${LEGAL_GRIEVANCE_EMAIL}`}
                        className="text-primary hover:underline font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden rounded-xs"
                    >
                        {LEGAL_GRIEVANCE_EMAIL}
                    </a>
                </p>
                <p className="flex items-center min-h-[32px] sm:min-h-auto">
                    <strong className="mr-1 text-foreground">Support Email:</strong>{" "}
                    <a
                        href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
                        aria-label={`Send support email to ${LEGAL_SUPPORT_EMAIL}`}
                        className="text-primary hover:underline font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden rounded-xs"
                    >
                        {LEGAL_SUPPORT_EMAIL}
                    </a>
                </p>
                <p className="flex items-center min-h-[32px] sm:min-h-auto">
                    <strong className="mr-1 text-foreground">Phone Helpline:</strong>{" "}
                    <a
                        href={`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`}
                        aria-label={`Call customer helpline at ${LEGAL_SUPPORT_PHONE}`}
                        className="text-primary hover:underline font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden rounded-xs"
                    >
                        {LEGAL_SUPPORT_PHONE}
                    </a>
                </p>
                <p className="text-foreground-subtle text-tiny mt-1 leading-normal">
                    ⏱️ <em>Statutory timeline: Acknowledged within 24 hours and resolved within 15 working days.</em>
                </p>
            </div>
        </address>
    );
}
