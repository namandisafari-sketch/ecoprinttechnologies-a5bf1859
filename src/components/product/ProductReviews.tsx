import { useState } from "react";
import { Star, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeviceContext } from "@/contexts/DeviceContext";
import { Separator } from "@/components/ui/separator";

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { toast } = useToast();
  const { deviceId } = useDeviceContext();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  // Fetch reviews for this product
  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders containing this product for the current device (verified purchase)
  const { data: eligibleOrders } = useQuery({
    queryKey: ["eligible-review-orders", productId, deviceId],
    enabled: !!deviceId,
    queryFn: async () => {
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(id, order_number, device_id, status)")
        .eq("product_id", productId);
      if (error) throw error;

      // Filter to orders belonging to this device and delivered
      const deviceOrders = (orderItems || []).filter(
        (item: any) =>
          item.orders?.device_id === deviceId &&
          item.orders?.status === "delivered"
      );

      // Check which orders already have reviews
      const { data: existingReviews } = await supabase
        .from("product_reviews")
        .select("order_id")
        .eq("product_id", productId)
        .eq("device_id", deviceId!);

      const reviewedOrderIds = new Set((existingReviews || []).map((r: any) => r.order_id));
      return deviceOrders
        .filter((item: any) => !reviewedOrderIds.has(item.order_id))
        .map((item: any) => ({
          id: item.order_id,
          order_number: item.orders?.order_number,
        }));
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!deviceId || !selectedOrderId || rating === 0) throw new Error("Missing fields");
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        device_id: deviceId,
        order_id: selectedOrderId,
        rating,
        comment: comment.trim() || null,
        is_verified_purchase: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["eligible-review-orders", productId, deviceId] });
      setRating(0);
      setComment("");
      setSelectedOrderId("");
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
    },
  });

  const avgRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Customer Reviews
      </h3>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${Number(avgRating) >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{avgRating}</span>
        <span className="text-xs text-muted-foreground">({reviews?.length || 0} reviews)</span>
      </div>

      {/* Write Review (only if eligible) */}
      {eligibleOrders && eligibleOrders.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">Write a Review</p>

          <select
            className="w-full text-sm border rounded-md px-3 py-2 bg-background"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
          >
            <option value="">Select your order</option>
            {eligibleOrders.map((o: any) => (
              <option key={o.id} value={o.id}>Order #{o.order_number}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    (hoverRating || rating) >= s
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-sm"
            rows={3}
          />

          <Button
            size="sm"
            disabled={!selectedOrderId || rating === 0 || submitReview.isPending}
            onClick={() => submitReview.mutate()}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      )}

      <Separator />

      {/* Reviews List */}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${review.rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                {review.is_verified_purchase && (
                  <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                    <CheckCircle className="h-3 w-3" /> Verified Purchase
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatDate(review.created_at)}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </div>
  );
};

export default ProductReviews;
