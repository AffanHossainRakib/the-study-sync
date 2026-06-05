import ReviewForm from "@/components/ReviewForm";

export default function ReviewsPage() {
    return (
        <div className="min-h-screen pt-24 px-4 max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
                Write a Review
            </h1>
            <p className="text-center text-muted-foreground mb-8 max-w-sm mx-auto">
                We value your feedback! Please let us know what you think about our product.
            </p>
            <ReviewForm />
        </div>
    );
}
