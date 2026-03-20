import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { CheckCircle, Eye, PlusCircle } from "lucide-react";
import type { UserPage } from "@/lib/routeUtils";

interface AdSubmissionSuccessProps {
  navigateTo: (page: UserPage) => void;
}

export function AdSubmissionSuccess({ navigateTo }: AdSubmissionSuccessProps) {
  return (
    <div className="bg-gray-50 flex items-center justify-center py-8 px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Ad Submitted Successfully!
            </h2>
            <p className="text-muted-foreground">
              Your ad has been submitted and is now pending admin approval.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-yellow-900 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Your ad is under review by our admin team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>You'll be notified once it's approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>You can view it in "My Ads" under Pending Approval</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Once approved, it will be visible publicly</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => navigateTo("my-ads")}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              <Eye className="h-4 w-4" />
              View My Ads
            </Button>
            <Button
              onClick={() => navigateTo("post-ad")}
              variant="outline"
              className="flex-1 gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Post Another Ad
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
